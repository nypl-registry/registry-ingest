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

	var filePath =  __dirname + '/..' + config['Source']['mmsItems']

	var rights= {}

	//set the stage
	db.prepareIngestMmsItems(function(){


		//find out how many lines there are
		exec('wc -l ' + filePath, function (error, results) {

			var totalLines = results.trim().split(" ")[0]
			var totalInserted = 0

			if (isNaN(totalLines)) var totalLines = 0
			totalLines = parseInt(totalLines)
			var previousPercent = -1;


			//get a db cursor to insert on
			db.returnCollection("mmsItems",function(err,collection,database){

				//load the file and stream it
				file.streamJsonFile(filePath, function(record,recordCb){

					if (!record){					
						//done, close our pointer but let anything finish up so it doesn't complain aobut closed connections
						setTimeout(function(){

							console.log(rights)

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
						insert.dates = mmsUtils.extractDates(xml)
						insert.abstracts = mmsUtils.extractAbstracts(xml)
						insert.genres = mmsUtils.extractGenres(xml)

						//get some hieararchy about it
						var h = mmsUtils.extractCollectionAndContainer(xml)

						insert.collectionUuid = h.collection
						insert.containerUuid = h.container
						insert.parents = h.parents


						//rights
						var xmlRights = mmsUtils.returnXmlNode(record.rights)
						insert.rights = mmsUtils.extractRights(xmlRights)


						insert.publicDomain = false

						if (insert.rights.join(" ").search("We believe that this item has no known US copyright restrictions") > -1) insert.publicDomain = true
						if (insert.rights.join(" ").search("Creative Commons CC0") > -1) insert.publicDomain = true

						//if (!insert.publicDomain) console.log(insert.rights)

						insert.rights.map(function(r){
							if (!rights[r]) rights[r] = 0
							rights[r]++
						})



						//fire off the insert
						collection.insert(insert, function(err, result) {	

							if (err){
								errorLib.error("MMS items ingest - error inserting record",err)
							}else{
								totalInserted++
							}					

							var percent = Math.floor(totalInserted/totalLines*100)
							
							if (percent > previousPercent){
								previousPercent = percent
								//process.stdout.clearLine()
								process.stdout.cursorTo(35)
								process.stdout.write(clc.black.bgCyanBright("Items: " + percent + "% " ))
							}

							insert = null, result = null							
							
							return true
						})






					}else{
						errorLib.error("MMS items ingest - no/invalid XML for this item ",insert._id)						
					}
					

					//okay next one please
					recordCb()

					record = null;
					return true
					

				})

			})

		})

	})

}
