"use strict"

//This script will need like 20GB of ram, because it stores all the data internally for the final output.

var config = require("config")
var fs = require("fs")
var byline = require('byline')
var N3 = require('n3')
var db = require("../lib/db.js")
var utils = require("../lib/utils.js")
var viafParse = require("../lib/viaf_parse.js")

var clc = require('cli-color')

var parser = N3.Parser()
var N3Util = N3.Util

var ucodeEscape = /\\u([\d\w]{4})/gi;
var spaceEscape = /\s{2,}/g
var agentEscape = /\/#Agent.*?>\s/g


var viafExtract =  __dirname + '/..' + config['Source']['viafExtractLc']
var viafExtractInsert =  __dirname + '/..' + config['Source']['viafExtractInsertLc']

var count = 0

var stream = fs.createReadStream(viafExtract, { encoding: 'utf8' });
stream = byline.createStream(stream);

var output = fs.createWriteStream(viafExtractInsert, {'flags': 'w'}).end("")
var output = fs.createWriteStream(viafExtractInsert, {'flags': 'a'})

var lcData = {}




stream.on('data', function(line) {





	process.stdout.cursorTo(0)
	process.stdout.write(clc.black.bgYellowBright("Build VIAF | Line count: " + ++count ))


	stream.pause()

	line = line.replace(spaceEscape,'')

	line = line.replace(ucodeEscape, function (match, grp) {
	    return String.fromCharCode(parseInt(grp, 16)); } )

	line = unescape(line)

	line = line.replace(agentEscape,'> ')

	line = line.replace('LC|','LC%7C')

	//line = line.replace(/"/g,'%22')



	parser.parse(line, function (error, triple, prefixes) {

		if (error){			
			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgRedBright(error))
			console.log("\n")
			console.log(line)
			console.log("\n")
			stream.resume()
		}

		//this is an iterator, but since we are only processing one triple, it will one fire once
		if (triple){

			if (triple.subject.toString().search("sourceID/LC")>-1){

				// var key = parseInt(triple.subject.toString().match(/[0-9]{2,}/)[0])

				var key = triple.subject.toString().replace("http://viaf.org/viaf/sourceID/LC%7C","").replace(/\++/,'').replace("#skos:Concept","")
				
				if (!lcData[key]){
					lcData[key] = Object.create(null) 
					lcData[key]._id = key
					lcData[key].normalized = []
					lcData[key].lcAlt = []
				}

			}

			if (triple.predicate == 'http://www.w3.org/2004/02/skos/core#altLabel'){
				var literal = N3Util.getLiteralValue(triple.object)
				lcData[key].lcAlt.push( literal)
				lcData[key].normalized.push(utils.normalizeAndDiacritics(literal))
			}

			// if (triple.predicate == 'http://www.w3.org/2004/02/skos/core#prefLabel'){
			// 	var literal = N3Util.getLiteralValue(triple.object)
			// 	lcData[key].prefLabel = literal
			// 	lcData[key].normalized.push(utils.normalizeAndDiacritics(literal))
			// }else if (triple.predicate == 'http://www.w3.org/2004/02/skos/core#altLabel'){
			// 	var literal = N3Util.getLiteralValue(triple.object)
			// 	lcData[key].altLabel.push( literal)
			// 	lcData[key].normalized.push(utils.normalizeAndDiacritics(literal))
			// }else if (triple.predicate == 'http://xmlns.com/foaf/0.1/focus'){
			// 	lcData[key].viaf = parseInt(triple.object.toString().split('/viaf/')[1])
			// }else if (triple.predicate == 'http://schema.org/name'){
			// 	var literal = N3Util.getLiteralValue(triple.object)
			// 	viafData[key].viafName = literal
			// }else if (triple.predicate == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' && viafData[key]){	
			// 	viafData[key].type = triple.object.toString().split('schema.org/')[1]
			// }else if (triple.predicate == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' && !viafData[key]){	
			// 	//this is just the LC data saying it is a concept, don't care

			// }else if (triple.predicate == 'http://schema.org/birthDate'){
			// 	var literal = N3Util.getLiteralValue(triple.object)
			// 	viafData[key].birthDate = literal
			// }else if (triple.predicate == 'http://schema.org/givenName'){
			// 	var literal = N3Util.getLiteralValue(triple.object)
			// 	viafData[key].givenName = literal
			// }else if (triple.predicate == 'http://schema.org/familyName'){
			// 	var literal = N3Util.getLiteralValue(triple.object)
			// 	viafData[key].familyName = literal
			// }else if (triple.predicate == 'http://schema.org/description'){
			// 	var literal = N3Util.getLiteralValue(triple.object)
			// 	viafData[key].description = literal
			// }else if (triple.predicate == 'http://schema.org/deathDate'){
			// 	var literal = N3Util.getLiteralValue(triple.object)
			// 	viafData[key].deathDate = literal
			// }else if (triple.predicate == 'http://schema.org/gender'){
			// 	viafData[key].gender = triple.object.toString()
			// 	if (viafData[key].gender === 'http://www.wikidata.org/entity/m') viafData[key].gender = 'm'
			// 	if (viafData[key].gender === 'http://www.wikidata.org/entity/Q6581097') viafData[key].gender = 'm'
			// 	if (viafData[key].gender === 'http://www.wikidata.org/entity/Q6581072') viafData[key].gender = 'f'
			// 	if (viafData[key].gender === 'http://www.wikidata.org/entity/f') viafData[key].gender = 'f'
			// 	if (viafData[key].gender.length>1) console.log(viafData[key].gender)
			// }else if (triple.predicate == 'http://schema.org/sameAs'){

			// 	if (triple.object.toString().search(/dbpedia/)>-1){
			// 		viafData[key].dbpedia = triple.object.toString().replace('http://dbpedia.org/resource/','')
			// 	}else{
			// 		viafData[key].wikidata = triple.object.toString().replace('http://www.wikidata.org/entity/','')
			// 	}

			// }else if (triple.predicate == 'http://www.w3.org/2004/02/skos/core#inScheme'){		
			// 	//we don't care about this predicate
			// }else{
			// 	console.log(triple.predicate.toString())
			// }

			process.nextTick(function(){
				stream.resume()
			})
		
		}else{
			process.nextTick(function(){
				stream.resume()
			})
		}

	})	
})



stream.on('end', function () {
	console.log("Doneeeeee")


	var file = fs.createWriteStream(viafExtractInsert);
	file.on('error', function(err) { console.log(err) })

	var writeCounter = 0
	for (var x in lcData){
		file.write(JSON.stringify(lcData[x]) + "\n")
		process.stdout.cursorTo(50)
		process.stdout.write(clc.black.bgBlueBright("write viaf: " + ++writeCounter ))

	}


})
