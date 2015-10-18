"use strict"

var file = require("../lib/file.js")
var config = require("config")
var mmsUtils = require("../lib/mms_utils.js");
var db = require("../lib/db.js");
var errorLib = require("../lib/error.js");
var exec = require('child_process').exec;
var clc = require('cli-color');

var exports = module.exports = {};



exports.ingest = function(cb){


	//set the stage
	db.prepareIngestMmsCollections(function(){


		var filePath =  __dirname + '/..' + config['Source']['mmsCollections']

		//find out how many lines there are
		exec('wc -l ' + filePath, function (error, results) {

			var totalLines = results.trim().split(" ")[0]
			var totalInserted = 0

			var previousPercent = -1;

			if (isNaN(totalLines)) totalLines = 0
			totalLines = parseInt(totalLines)

			//get a db cursor to insert on
			db.returnCollection("mmsCollections",function(err,collection,database){

				//load the file and stream it
				file.streamJsonFile(filePath, function(record,recordCb){

					if (!record){					
						//done, close our pointer but let anything finish up so it doesn't complain aobut closed connections
						setTimeout(function(){
							database.close()
							if (cb) cb()
						},500)					
						return true;					
					}


					var insert = mmsUtils.extractIds(record)

					insert._id = insert.mmsUuid

					//gather all the infos

					var xml = mmsUtils.returnXmlNode(record.full_xml)
					if (xml){
						insert.agents = mmsUtils.extractAgents(xml)
						insert.subjects = mmsUtils.extractSubjects(xml)
						insert.divisions = mmsUtils.extractDivision(xml)
						insert.notes = mmsUtils.extractNotes(xml)
						insert.titles = mmsUtils.extractTitles(xml)
						insert.languages = mmsUtils.extractLanguage(xml)
						insert.typeOfResource = mmsUtils.extractTypeOfResource(xml)
						insert.dates = mmsUtils.extractDates(xml)
						insert.abstracts = mmsUtils.extractAbstracts(xml)
						insert.genres = mmsUtils.extractGenres(xml)
					}else{
						errorLib.error("MMS collection ingest - no/invalid XML for this collection ",insert._id)
					}
					
					collection.insert(insert, function(err, result) {						
						if (err){
							errorLib.error("MMS collection ingest - error inserting record",err)
						}else{
							totalInserted++
						}					

						var percent = Math.floor(totalInserted/totalLines*100)
						
						if (percent > previousPercent){
							previousPercent = percent
							//process.stdout.clearLine()
							process.stdout.cursorTo(0)
							process.stdout.write(clc.black.bgYellowBright("MMS Collection: " + percent + "%"))
						}
						//okay next one please
						recordCb()
					})

				})

			})

		})

	})

}
