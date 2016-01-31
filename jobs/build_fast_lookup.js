"use strict"

//This script will need like 20GB of ram, because it stores all the data internally for the final output.

var config = require("config")
var fs = require("fs")
var byline = require('byline')
var N3 = require('n3')
var db = require("../lib/db.js")
var utils = require("../lib/utils.js")
var clc = require('cli-color')
var async = require("async")


var parser = N3.Parser()
var N3Util = N3.Util


var fastChronological =  __dirname + '/..' + config['Source']['fastChronological']
var fastEvent =  __dirname + '/..' + config['Source']['fastEvent']
var fastFormGenre =  __dirname + '/..' + config['Source']['fastFormGenre']
var fastGeographic =  __dirname + '/..' + config['Source']['fastGeographic']
var fastTitle =  __dirname + '/..' + config['Source']['fastTitle']
var fastTopical =  __dirname + '/..' + config['Source']['fastTopical']


var files = [fastChronological,fastEvent,fastFormGenre,fastGeographic,fastTitle,fastTopical]

var fastLookup = {}
var sameAsLookup = {}
var viafLookup = {}
var count = 0


async.eachSeries(files, function(file, eachCallback) {



	var stream = fs.createReadStream(file, { encoding: 'utf8' });
	stream = byline.createStream(stream);

	stream.on('data', function(line) {

		process.stdout.cursorTo(0)
		process.stdout.write(clc.black.bgYellowBright("build file: " + ++count ))

		stream.pause()

		parser.parse(line, function (error, triple, prefixes) {

			//this is an iterator, but since we are only processing one triple, it will one fire once
			if (triple){

				if (triple.subject.search('/fast/') > -1){

					var fastId = parseInt(triple.subject.split('/fast/')[1])

					if (!fastLookup[fastId]) fastLookup[fastId] = { fast: fastId, prefLabel : false, altLabel: [], sameAsLc : [], sameAsViaf: [], normalized: [] }

					if (triple.predicate == 'http://schema.org/sameAs'){
						if (triple.object.search('id.loc.gov') > -1) fastLookup[fastId].sameAsLc.push( triple.object )
						if (triple.object.search('viaf.org') > -1) fastLookup[fastId].sameAsViaf.push( triple.object )
					}

					
					if (triple.predicate == 'http://www.w3.org/2004/02/skos/core#prefLabel' || triple.predicate == 'http://www.w3.org/2004/02/skos/core#altLabel' || triple.predicate == 'http://www.w3.org/2000/01/rdf-schema#label' ){
						var o = N3Util.getLiteralValue(triple.object)
						if (o.length>3){
							if (triple.predicate == 'http://www.w3.org/2004/02/skos/core#prefLabel') fastLookup[fastId].prefLabel = o
							if (triple.predicate == 'http://www.w3.org/2004/02/skos/core#altLabel') fastLookup[fastId].altLabel.push(o)
							if (triple.predicate == 'http://www.w3.org/2000/01/rdf-schema#label') if (!fastLookup[fastId].prefLabel) fastLookup[fastId].prefLabel = o
							
							var normalO = utils.singularize(utils.normalizeAndDiacritics(o))

							if (fastLookup[fastId].normalized.indexOf(normalO) ==-1 ) fastLookup[fastId].normalized.push(normalO)	
						}
					}



				}else{

					if (!sameAsLookup[triple.subject]) sameAsLookup[triple.subject] = {}
					if (triple.predicate == 'http://www.w3.org/2000/01/rdf-schema#label'){
						sameAsLookup[triple.subject].label = N3Util.getLiteralValue(triple.object)
					}


				}
			
			
				stream.resume()
				return true

			}	

		})	
	})



	stream.on('end', function () {


		//now we need to add in all the same as terms


		for (var x in fastLookup){		



			for (var y in fastLookup[x].sameAsLc){
				if (sameAsLookup[fastLookup[x].sameAsLc[y]]){
					var normalO = utils.singularize(utils.normalizeAndDiacritics(sameAsLookup[fastLookup[x].sameAsLc[y]].label))
					if (fastLookup[x].normalized.indexOf(normalO) ==-1 ) {
						fastLookup[x].normalized.push(normalO)	
					}				
				}		
			}

			for (var y in fastLookup[x].sameAsViaf){
				if (sameAsLookup[fastLookup[x].sameAsViaf[y]]){					
					var normalO = utils.singularize(utils.normalizeAndDiacritics(sameAsLookup[fastLookup[x].sameAsViaf[y]].label))
					if (fastLookup[x].normalized.indexOf(normalO) ==-1 ) {
						fastLookup[x].normalized.push(normalO)	
					}				
				}		
			}

			//delete from there because we don't want VIAF things in our FAST lookup			
			if (file.search("FASTEvent")>-1){
				if (fastLookup[x].sameAsViaf.length>0){
					viafLookup[x] = JSON.parse(JSON.stringify(fastLookup[x]))
					delete fastLookup[x]
				}
			}
			
		}

		var fileOut = fs.createWriteStream(file + ".json");

		fileOut.on('error', function(err) { console.lof(err) })
		fileOut.on('finish', function() {

			console.log("Doneeeeee")
			count=0
			fastLookup = {}
			sameAsLookup = {}

			eachCallback()

		})

		var writeCounter = 0

		for (var x in fastLookup){
			if (fastLookup[x].fast){
				fileOut.write(JSON.stringify(fastLookup[x]) + "\n")
				process.stdout.cursorTo(50)
				process.stdout.write(clc.black.bgBlueBright("write file: " + ++writeCounter ))
			}
		}
		fileOut.end();	


	})
		


}, function(err){

	console.log("Writing Out FAST TO VIAF")

	//writeout the VIAF one
	var fileOut = fs.createWriteStream("FAST_to_VIAF" + ".json");

	fileOut.on('error', function(err) { console.lof(err) })
	fileOut.on('finish', function() {

		console.log("Completed All Files")

	})

	var writeCounter = 0
	for (var x in viafLookup){
		if (viafLookup[x].fast){
			fileOut.write(JSON.stringify(viafLookup[x]) + "\n")
			process.stdout.cursorTo(50)
			process.stdout.write(clc.black.bgBlueBright("write file: " + ++writeCounter ))
		}
	}
	fileOut.end();	

})



