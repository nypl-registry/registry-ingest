"use strict"

var config = require("config")
var fs = require("fs")
var byline = require('byline')
var N3 = require('n3')
var db = require("../lib/db.js")
var utils = require("../lib/utils.js")
var clc = require('cli-color')

var parser = N3.Parser()
var N3Util = N3.Util


var viafExtract =  __dirname + '/..' + config['Source']['viafExtract']

var allLookup = {}
var count = 0

//db.prepareViafLookup(function(){

	// db.returnCollection("viafLookup",function(err,viafLookup,database){

		var stream = fs.createReadStream(viafExtract, { encoding: 'utf8' });
		stream = byline.createStream(stream);

		stream.on('data', function(line) {



			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgYellowBright("build viaf: " + ++count ))

			stream.pause()

			parser.parse(line, function (error, triple, prefixes) {

				//this is an iterator, but since we are only processing one triple, it will one fire once
				if (triple){

					if (triple.predicate == 'http://www.w3.org/2004/02/skos/core#prefLabel' || triple.predicate == 'http://www.w3.org/2004/02/skos/core#altLabel' || triple.predicate == 'http://xmlns.com/foaf/0.1/focus'){
						
						// //see if we have this one yet
						// viafLookup.find({ _id: triple.object.toString() }).toArray(function(err, existingRecord) {

						// 	if (existingRecord.length==0){
						// 		var updateRecord = {
						// 			_id: triple.subject.toString(),
						// 			prefLabel : "",
						// 			altLabel : [],
						// 			viaf: 0,
						// 			normalized: []
						// 		}
						// 	}else{
						// 		var updateRecord = existingRecord[0]
						// 		console.log("ALready exist!")
						// 		console.log(updateRecord)
						// 	}



							// if (triple.predicate == 'http://www.w3.org/2004/02/skos/core#prefLabel'){
							// 	updateRecord.prefLabel = N3Util.getLiteralValue(triple.object)

							// 	updateRecord.normalized.push(utils.normalizeAndDiacritics(N3Util.getLiteralValue(triple.object)))


							// }else if (triple.predicate == 'http://www.w3.org/2004/02/skos/core#altLabel'){
							// 	updateRecord.altLabel.push( N3Util.getLiteralValue(triple.object))

							// 	updateRecord.normalized.push(utils.normalizeAndDiacritics(N3Util.getLiteralValue(triple.object)))

							// }else if (triple.predicate == 'http://xmlns.com/foaf/0.1/focus'){
							// 	updateRecord.viaf = parseInt(triple.object.toString().split('/viaf/')[1])
							// }

							// //we need to update
							// viafLookup.update({ _id : updateRecord._id }, { $set: updateRecord }, { upsert: true} , function(err, result) {
							// 	if (err) console.log(err)		
							// 	stream.resume()

							// 	return true

							// })


						// 	return true
						// })			
							
							var key = triple.subject.toString().split('http://viaf.org/viaf/sourceID/LC%7C')[1].replace("#skos:Concept",'')


							if (!allLookup[key]){


								allLookup[key] = {
									prefLabel : "",
									altLabel : [],
									viaf: 0,
									normalized: []
								}
								
							}

							if (triple.predicate == 'http://www.w3.org/2004/02/skos/core#prefLabel'){
								var literal = N3Util.getLiteralValue(triple.object)
								allLookup[key].prefLabel = literal

								allLookup[key].normalized.push(utils.normalizeAndDiacritics(literal))


							}else if (triple.predicate == 'http://www.w3.org/2004/02/skos/core#altLabel'){
								var literal = N3Util.getLiteralValue(triple.object)
								allLookup[key].altLabel.push( literal)

								allLookup[key].normalized.push(utils.normalizeAndDiacritics(literal))

							}else if (triple.predicate == 'http://xmlns.com/foaf/0.1/focus'){
								allLookup[key].viaf = parseInt(triple.object.toString().split('/viaf/')[1])
							}
							
						

							

							stream.resume()
							return true

					}else{
						stream.resume()
						return true
					}				
				
				}	

			})	
		})



		stream.on('end', function () {
			console.log("Doneeeeee")


			var file = fs.createWriteStream('viafLookupData.txt');
			file.on('error', function(err) { console.lof(err) })
			var writeCounter = 0

			for (var x in allLookup){
				file.write(JSON.stringify(allLookup[x]) + "\n")
				process.stdout.cursorTo(50)
				process.stdout.write(clc.black.bgBlueBright("write viaf: " + ++writeCounter ))

			}
			file.end();	

			
			//database.close()
		})

	//})

//})


