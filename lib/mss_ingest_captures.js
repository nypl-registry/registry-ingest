"use strict"

var file = require("../lib/file.js")
var config = require("config")
var mmsUtils = require("../lib/mms_utils.js")
var db = require("../lib/db.js")
var errorLib = require("../lib/error.js")
var exec = require('child_process').exec
var clc = require('cli-color')

var exports = module.exports = {}


exports.ingest = function(cb){

	var filePath =  __dirname + '/..' + config['Source']['mmsCaptures']



	//set the stage
	db.prepareIngestMmsCaptures(function(){


		//find out how many lines there are
		exec('wc -l ' + filePath, function (error, results) {

			var totalLines = results.trim().split(" ")[0]
			var totalInserted = 0

			if (isNaN(totalLines)) var totalLines = 0
			totalLines = parseInt(totalLines)
			var previousPercent = -1;

			//get a db cursor to insert on
			db.returnCollection("mmsCaptures",function(err,collection,database){

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

						var insert = mmsUtils.extractCapture(record)


						//fire off the insert
						collection.insert(insert, function(err, result) {	

							if (err){
								errorLib.error("MMS captures ingest - error inserting record",err)
							}else{
								totalInserted++
							}					

							var percent = Math.floor(totalInserted/totalLines*100)
							
							if (percent > previousPercent){
								previousPercent = percent
								//process.stdout.clearLine()
								process.stdout.cursorTo(45)
								process.stdout.write(clc.black.bgGreenBright("Captures: " + percent + "%" ))
							}


							insert = null, result = null							
							
							return true
						})

						//okay next one please
						if (totalInserted % 10000 == 0){
							setTimeout(function(){recordCb();},5000)
						}else{
							recordCb()
						}



					record = null;
					return true
					

				})

			})

		})

	})

}
