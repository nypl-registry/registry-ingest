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
	db.prepareIngestMmsContainers(function(){


		var filePath =  __dirname + '/..' + config['Source']['mmsContainers']

		//find out how many lines there are
		exec('wc -l ' + filePath, function (error, results) {

			var totalLines = results.trim().split(" ")[0]
			var totalInserted = 0

			var previousPercent = -1;

			if (isNaN(totalLines)) totalLines = 0
			totalLines = parseInt(totalLines)

			//get a db cursor to insert on
			db.returnCollection("mmsContainers",function(err,collection,database){

				//load the file and stream it
				file.streamJsonFile(filePath, function(record,recordCb){

					if (!record){					
						//done, close our pointer but let anything finish up so it doesn't complain aobut closed connections
						setTimeout(function(){
							database.close()
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
						insert.dates = mmsUtils.extractDates(xml)
						insert.abstracts = mmsUtils.extractAbstracts(xml)
						insert.genres = mmsUtils.extractGenres(xml)

						//get some hieararchy about it
						var h = mmsUtils.extractCollectionAndContainer(xml)

						insert.collectionUuid = h.collection
						insert.containerUuid = h.container
						insert.parents = h.parents

					}else{
						errorLib.error("MMS container ingest - no/invalid XML for this container ",insert._id)						
					}
					

					if (!insert.collectionUuid){

						errorLib.error("MMS container ingest - no collection uuid found for this container ",insert._id)

						console.log(record.full_xml)
						recordCb()

					}else{

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
								process.stdout.cursorTo(20)
								process.stdout.write(clc.black.bgMagentaBright("Container: " + percent + "%" ))
							}
						})

						//okay next one please
						recordCb()


						
					}					

				})

			})

		})

	})

}
