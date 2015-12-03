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


var viafExtract =  __dirname + '/..' + config['Source']['viafExtract']
var viafExtractInsert =  __dirname + '/..' + config['Source']['viafExtractInsert']



var count = 0

var stream = fs.createReadStream(viafExtract, { encoding: 'utf8' });
stream = byline.createStream(stream);

var output = fs.createWriteStream(viafExtractInsert, {'flags': 'w'}).end("")
var output = fs.createWriteStream(viafExtractInsert, {'flags': 'a'})

console.log("Writing to:",viafExtractInsert)

stream.on('data', function(line) {



	stream.pause()

	process.stdout.cursorTo(0)
	process.stdout.write(clc.black.bgYellowBright("Build VIAF | Line count: " + ++count ))

	var viafId = parseInt(line.substring(0,line.search("<VIAFCluster")).trim())
	var xml = line.substring(line.search("<VIAFCluster")).trim()

	var xmlDoc = viafParse.parseXml(xml)

	var agent = Object.create(null)
	agent._id =  viafId
	agent.sourceCount =  viafParse.extractSourceCount(xmlDoc)
	agent.type =  viafParse.extractType(xmlDoc)
	agent.hasLc =  viafParse.hasLc(xmlDoc)
	agent.hasDbn =  viafParse.hasLc(xmlDoc)
	agent.lcId =  viafParse.extractLcId(xmlDoc)
	agent.gettyId =  viafParse.extractGettyId(xmlDoc)
	agent.wikidataId =  viafParse.extractWikidataId(xmlDoc)
	agent.lcTerm =  viafParse.extractLcTerm(xmlDoc)
	agent.dnbTerm =  viafParse.extractDnbTerm(xmlDoc)
	agent.viafTerm =  viafParse.extractViafTerm(xmlDoc)
	agent.birth =  viafParse.extractBirth(xmlDoc)
	agent.death =  viafParse.extractDeath(xmlDoc)
	agent.dbpediaId =  viafParse.extractDbpediaId(xmlDoc)
	agent.normalized =  []


	if (agent.birth == "0") agent.birth = false
	if (agent.death == "0") agent.death = false


	if (agent.lcTerm){
		var n = utils.normalizeAndDiacritics(agent.lcTerm)
		if (agent.normalized.indexOf(n)===-1) agent.normalized.push(n)
	}
	if (agent.dnbTerm){
		var n = utils.normalizeAndDiacritics(agent.dnbTerm)
		if (agent.normalized.indexOf(n)===-1) agent.normalized.push(n)
	}
	if (agent.viafTerm){
		var n = utils.normalizeAndDiacritics(agent.viafTerm)
		if (agent.normalized.indexOf(n)===-1) agent.normalized.push(n)
	}

	var r = output.write(JSON.stringify(agent)+"\n", "utf8")

	

	if (!r){

		output.once('drain', function(){

			agent = null
			line = null
			xml = null
			xmlDoc = null

			process.nextTick(function(){				
				stream.resume()	
			})

		})

	}else{

		agent = null
		line = null
		xml = null
		xmlDoc = null

		process.nextTick(function(){
			stream.resume()	
		})


	}


	// process.nextTick(function(){
				
	// })




	//console.log(viafParse.parseXml(xml))


	// stream.pause()

	// line = line.replace(spaceEscape,'')

	// line = line.replace(ucodeEscape, function (match, grp) {
	//     return String.fromCharCode(parseInt(grp, 16)); } )

	// line = unescape(line)

	// line = line.replace(agentEscape,'> ')

	// line = line.replace('LC|','LC%7C')

	// line = line.replace(/"/g,'%22')


	// parser.parse(line, function (error, triple, prefixes) {

	// 	if (error){			
	// 		process.stdout.cursorTo(0)
	// 		process.stdout.write(clc.black.bgRedBright(error))
	// 		console.log("\n")
	// 		console.log(line)
	// 		console.log("\n")
	// 		stream.resume()
	// 	}

	// 	//this is an iterator, but since we are only processing one triple, it will one fire once
	// 	if (triple){

	// 		if (triple.subject.toString().search("sourceID/LC")>-1){

	// 			var key = parseInt(triple.subject.toString().match(/[0-9]{2,}/)[0])
				
	// 			if (!lcData[key]){


	// 				lcData[key] = Object.create(null) 
	// 				lcData[key].prefLabel = ""
	// 				lcData[key].altLabel = []
	// 				lcData[key].viaf = false
	// 				lcData[key].normalized = []

	// 				countLc++
	// 				// lcData[key] = {
	// 				// 	prefLabel : "",
	// 				// 	altLabel : [],
	// 				// 	viaf: false,
	// 				// 	normalized: []
	// 				// }
	// 			}

	// 		}else{

	// 			var key = parseInt(triple.subject.toString().split("/viaf/")[1].split("/")[0])

	// 			if (!viafData[key]){
	// 				countViaf++


	// 				viafData[key] = Object.create(null) 

	// 				viafData[key].viafName = null
	// 				viafData[key].type = null
	// 				viafData[key].birthDate = null
	// 				viafData[key].deathDate = null
	// 				viafData[key].givenName = null
	// 				viafData[key].familyName = null
	// 				viafData[key].description = null
	// 				viafData[key].gender = null
	// 				viafData[key].dbpedia = null
	// 				viafData[key].wikidata = null
	// 				viafData[key].isLc = false

	// 			}

	// 		}

	// 		if (triple.predicate == 'http://www.w3.org/2004/02/skos/core#prefLabel'){
	// 			var literal = N3Util.getLiteralValue(triple.object)
	// 			lcData[key].prefLabel = literal
	// 			lcData[key].normalized.push(utils.normalizeAndDiacritics(literal))
	// 		}else if (triple.predicate == 'http://www.w3.org/2004/02/skos/core#altLabel'){
	// 			var literal = N3Util.getLiteralValue(triple.object)
	// 			lcData[key].altLabel.push( literal)
	// 			lcData[key].normalized.push(utils.normalizeAndDiacritics(literal))
	// 		}else if (triple.predicate == 'http://xmlns.com/foaf/0.1/focus'){
	// 			lcData[key].viaf = parseInt(triple.object.toString().split('/viaf/')[1])
	// 		}else if (triple.predicate == 'http://schema.org/name'){
	// 			var literal = N3Util.getLiteralValue(triple.object)
	// 			viafData[key].viafName = literal
	// 		}else if (triple.predicate == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' && viafData[key]){	
	// 			viafData[key].type = triple.object.toString().split('schema.org/')[1]
	// 		}else if (triple.predicate == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' && !viafData[key]){	
	// 			//this is just the LC data saying it is a concept, don't care

	// 		}else if (triple.predicate == 'http://schema.org/birthDate'){
	// 			var literal = N3Util.getLiteralValue(triple.object)
	// 			viafData[key].birthDate = literal
	// 		}else if (triple.predicate == 'http://schema.org/givenName'){
	// 			var literal = N3Util.getLiteralValue(triple.object)
	// 			viafData[key].givenName = literal
	// 		}else if (triple.predicate == 'http://schema.org/familyName'){
	// 			var literal = N3Util.getLiteralValue(triple.object)
	// 			viafData[key].familyName = literal
	// 		}else if (triple.predicate == 'http://schema.org/description'){
	// 			var literal = N3Util.getLiteralValue(triple.object)
	// 			viafData[key].description = literal
	// 		}else if (triple.predicate == 'http://schema.org/deathDate'){
	// 			var literal = N3Util.getLiteralValue(triple.object)
	// 			viafData[key].deathDate = literal
	// 		}else if (triple.predicate == 'http://schema.org/gender'){
	// 			viafData[key].gender = triple.object.toString()
	// 			if (viafData[key].gender === 'http://www.wikidata.org/entity/m') viafData[key].gender = 'm'
	// 			if (viafData[key].gender === 'http://www.wikidata.org/entity/Q6581097') viafData[key].gender = 'm'
	// 			if (viafData[key].gender === 'http://www.wikidata.org/entity/Q6581072') viafData[key].gender = 'f'
	// 			if (viafData[key].gender === 'http://www.wikidata.org/entity/f') viafData[key].gender = 'f'
	// 			if (viafData[key].gender.length>1) console.log(viafData[key].gender)
	// 		}else if (triple.predicate == 'http://schema.org/sameAs'){

	// 			if (triple.object.toString().search(/dbpedia/)>-1){
	// 				viafData[key].dbpedia = triple.object.toString().replace('http://dbpedia.org/resource/','')
	// 			}else{
	// 				viafData[key].wikidata = triple.object.toString().replace('http://www.wikidata.org/entity/','')
	// 			}

	// 		}else if (triple.predicate == 'http://www.w3.org/2004/02/skos/core#inScheme'){		
	// 			//we don't care about this predicate
	// 		}else{
	// 			console.log(triple.predicate.toString())
	// 		}

	// 		process.nextTick(function(){
	// 			stream.resume()
	// 		})
		
	// 	}	

	// })	
})



stream.on('end', function () {
	console.log("Doneeeeee")


	// output.write(null)


	// var file = fs.createWriteStream(viafExtractInsert);
	// file.on('error', function(err) { console.lof(err) })

	// var writeCounter = 0

	// //loop through the LC data and add it to the big VIAF data
	// for (var x in lcData){
	// 	if (lcData[x].viaf){
	// 		if (viafData[lcData[x].viaf]){
	// 			viafData[lcData[x].viaf].isLc = true
	// 			viafData[lcData[x].viaf].prefLabel = lcData[x].prefLabel
	// 			viafData[lcData[x].viaf].altLabel = lcData[x].altLabel
	// 			viafData[lcData[x].viaf].lcId = x
	// 			viafData[lcData[x].viaf].normalized = lcData[x].normalized
	// 		}
	// 	}
	// }

	// for (var x in viafData){
	// 	file.write(JSON.stringify(viafData[x]) + "\n")
	// 	process.stdout.cursorTo(50)
	// 	process.stdout.write(clc.black.bgBlueBright("write viaf: " + ++writeCounter ))

	// }

	// output.once('drain', function(){
	// 	output.end()
	// })

})
