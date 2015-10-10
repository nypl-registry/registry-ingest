"use strict"

var file = require("../lib/file.js")
var config = require("config")
var db = require("../lib/db.js");
var errorLib = require("../lib/error.js");
var exec = require('child_process').exec;
var clc = require('cli-color');
var archivesUtils = require("../lib/archives_utils.js");


var exports = module.exports = {};


exports.ingest = function(cb){

	archivesUtils.loadTermLookup(function(termLookup){

		//set the stage
		db.prepareIngestArchivesCollections(function(){


			var filePath =  __dirname + '/..' + config['Source']['archivesCollections']

			//find out how many lines there are
			exec('wc -l ' + filePath, function (error, results) {

				var totalLines = results.trim().split(" ")[0]
				var totalInserted = 0

				var previousPercent = -1;

				if (isNaN(totalLines)) totalLines = 0
				totalLines = parseInt(totalLines)

				//get a db cursor to insert on
				db.returnCollection("archivesCollections",function(err,collection,database){

					//load the file and stream it
					file.streamCsvFile(filePath, function(record,recordCb){

						if (!record){					
							//done, close our pointer but let anything finish up so it doesn't complain aobut closed connections
							
							console.log("Verifiying insert count")
							setTimeout(function(){						
								collection.find().count(function(err, result) {
									if (totalLines != result){
										errorLib.error("Archives collection ingest - file line count " + totalLines + " does not match database count: " + result,"")
									}else{
										console.log("Inserted",result,"Lines")
									}
									database.close()
									if (cb) cb()
								})							
							},1000)					
							return true;					
						}

						var archivesJson = JSON.parse(record[2])
						

						var insert = archivesUtils.extractIds(archivesJson)

						insert._id = insert.mssDb

						insert.agents = archivesUtils.extractAgents(archivesJson,termLookup)
						insert.subjects = archivesUtils.extractSubjects(archivesJson)
						insert.notes = archivesUtils.extractNotes(archivesJson)
						insert.languages = archivesUtils.extractLanguage(archivesJson)
						insert.dates = archivesUtils.extractDates(archivesJson)
						insert.abstracts = archivesUtils.extractAbstracts(archivesJson)

						insert.type = "Collection"


						
						collection.insert(insert, function(err, result) {						
							if (err){
								errorLib.error("Archives collection ingest - error inserting record",err)
							}else{
								totalInserted++
							}					

							var percent = Math.floor(totalInserted/totalLines*100)
							
							if (percent > previousPercent){
								previousPercent = percent
								process.stdout.cursorTo(0)
								process.stdout.write(clc.black.bgWhiteBright("Archives Collection: " + percent + "%"))
							}		
						})

						//okay next one please
						recordCb()



					})

				})

			})

		})

	})

}
