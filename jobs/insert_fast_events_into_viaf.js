"use strict"

var config = require("config")
var fs = require("fs")
var byline = require('byline')
var N3 = require('n3')
var db = require("../lib/db.js")
var utils = require("../lib/utils.js")
var clc = require('cli-color')
var async = require("async")
var request = require('request')


var fastEvent =  __dirname + "/../data/FAST_to_VIAF.json"


var fastLookup = {}
var sameAsLookup = {}
var count = 0


db.returnCollectionRegistry("viaf",function(err,viafCollection){


		var stream = fs.createReadStream(fastEvent, { encoding: 'utf8' });
		stream = byline.createStream(stream);

		stream.on('data', function(line) {

			stream.pause()

			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgYellowBright("insert fast: " + ++count ))

			var fastRecord = JSON.parse(line)

			var viafId = fastRecord.sameAsViaf[0].split('http://viaf.org/viaf/')[1]
			var normalizedTerm = utils.singularize(utils.normalizeAndDiacritics(fastRecord.prefLabel)) 
			
			
			var updateRecord = {}

			updateRecord._id = parseInt(viafId)
			updateRecord.fast = parseInt(fastRecord.fast)

			viafCollection.find({ _id: updateRecord._id }).toArray(function(err,viafRecord){
				if (err) console.log(err)
				if (viafRecord.length>0){

					viafRecord = viafRecord[0]
					var normalized = viafRecord.normalized
					if (normalized.indexOf(normalizedTerm) == -1) normalized.push(normalizedTerm)
					updateRecord.normalized = normalized

					viafCollection.update({ _id : updateRecord._id }, { $set: updateRecord }, function(err, result) {
						if (err) console.log(err)
					 	stream.resume()
					})	

				}else{

					var options = {
						url : "http://viaf.org/viaf/" + viafId + "/",
						followRedirect : false
					}
					request(options, function (error, response, body) {	
						if (response){			
							if (response.statusCode==301){
								if (response.headers){
									if (response.headers.location){
										var viafIdRedirect = response.headers.location
										viafIdRedirect = parseInt(viafIdRedirect.split('/viaf/')[1])
										if (viafIdRedirect){
											if (!isNaN(viafIdRedirect)){
												viafCollection.find({ _id: parseInt(viafIdRedirect) }).toArray(function(err,viafRecord){
													if (viafRecord.length>0){
														viafRecord = viafRecord[0]
														updateRecord._id = viafIdRedirect
														var normalized = viafRecord.normalized
														if (normalized.indexOf(normalizedTerm) == -1) normalized.push(normalizedTerm)
														updateRecord.normalized = normalized

														viafCollection.update({ _id : updateRecord._id }, { $set: updateRecord }, function(err, result) {
															if (err) console.log(err)
														 	stream.resume()
														})	


													}else{												
														stream.resume()
													}
												})
												return true
											}
										}
									}
								}
							}
						}else{
							errorLib.error("Agent Serialization - Catalog - VIAF down?:", options.url )
							stream.resume()
						}
						stream.resume()

					})	



				}




				
			})


			// delete updateRecord.fast

	





		})



		stream.on('end', function () {
			var doneCount = 0
			setInterval(function(){

				if (doneCount === count){
					console.log("Doneeeeee")
					db.databaseClose()
				}else{
					doneCount = count
				}

			},1000)
		})
			



})



