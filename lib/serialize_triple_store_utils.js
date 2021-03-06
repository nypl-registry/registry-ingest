"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")
var serializeGeneral = require("../lib/serialize_utils.js")



exports.prepareAgents = function(cb){
	db.prepareTripleStoreAgents(function(){

		if (cb) cb()

	})
}
exports.prepareResources = function(cb){
	db.prepareTripleStoreResources(function(){
		if (cb) cb()
	})
}

exports.insertAgents = function(cb){


	var map = {

		"personal" : "foaf:Person",
		false: "foaf:Person",
		"corporate" : 'foaf:Group'

	}


	//load up the agents
	var totalAgents = 0
	db.returnCollectionRegistry("agents",function(err,agents){

		
		var cursor = agents.find({}).stream()
		var batch = []

		cursor.on('data', function(agent) {			

			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgBlueBright("insertAgents | totalAgents: " + totalAgents ))

			var rdfAgent = new serializeGeneral.resourceObject(agent.registry)

			rdfAgent.addTriple( 'rdf:type', 'edm:Agent', null,  null, "data:10000", agent.source)
			agent.viafAll.forEach(function(v){
				rdfAgent.addTriple( 'skos:exactMatch', 'viaf:'+v, null,  null, "data:10000", agent.source)
			})
			rdfAgent.addTriple( 'skos:prefLabel', null, agent.nameControlled,  null, "data:10000", agent.source)

		
			if (agent.type){
				rdfAgent.addTriple( 'rdf:type', map[agent.type], null,  null, "data:10000", agent.source)
			}

			if (agent.wikidata){
				rdfAgent.addTriple( 'skos:exactMatch', "wikidata:"+agent.wikidata, null,  null, "data:10000", agent.source)
			}
			if (agent.lcId){
				rdfAgent.addTriple( 'skos:exactMatch', "lc:"+agent.lcId, null,  null, "data:10000", agent.source)
			}
			if (agent.dbpedia){
				rdfAgent.addTriple( 'skos:exactMatch', "dbr:"+agent.dbpedia, null,  null, "data:10000", agent.source)
			}
			if (agent.birth){
				rdfAgent.addTriple( 'dbo:birthDate', null, agent.birth,  null, "data:10000", agent.source)
			}
			if (agent.death){
				rdfAgent.addTriple( 'dbo:deathDate', null, agent.birth,  null, "data:10000", agent.source)
			}
			if (agent.wikidataSlug){
				rdfAgent.addTriple( 'foaf:isPrimaryTopicOf', null, agent.wikidataSlug,  null, "data:10000", agent.source)
			}
			if (agent.wikidataImage){
				rdfAgent.addTriple( 'foaf:depiction', null, agent.wikidataImage,  null, "data:10000", agent.source)
			}
			if (agent.wikidataDesc){
				rdfAgent.addTriple( 'dcterms:description', null, agent.wikidataDesc,  null, "data:10000", agent.source)
			}

			if (!agent.viafAll){
				rdfAgent.viaf = [agent.viaf]
			}else if (agent.viafAll.length==0){
				rdfAgent.viaf = [agent.viaf]	
			}else{
				rdfAgent.viaf = agent.viafAll
			}

			for (var x in rdfAgent.triples){
				rdfAgent[x] = rdfAgent.triples[x]
			}			

			delete rdfAgent['addTriple']
			delete rdfAgent['allAgents']
			delete rdfAgent['allTerms']	
			delete rdfAgent['triples']			

			// rdfAgent.wikidata = false
			// rdfAgent.lcId = false
			// rdfAgent.dbpedia = false
			// rdfAgent.birth = false
			// rdfAgent.death = false
			// rdfAgent.wikidataSlug = false
			// rdfAgent.wikidataImage = false
			// rdfAgent.wikidataDesc = false

			// if (agent.wikidata) rdfAgent.wikidata = agent.wikidata
			// if (agent.lcId) rdfAgent.lcId = agent.lcId
			// if (agent.dbpedia) rdfAgent.dbpedia = agent.dbpedia
			// if (agent.birth) rdfAgent.birth = agent.birth
			// if (agent.death) rdfAgent.death = agent.death
			// if (agent.wikidataSlug) rdfAgent.wikidataSlug = agent.wikidataSlug
			// if (agent.wikidataImage) rdfAgent.wikidataImage = agent.wikidataImage
			// if (agent.wikidataDesc) rdfAgent.wikidataDesc = agent.wikidataDesc


			batch.push(rdfAgent)
			totalAgents++


			if (batch.length===999){

				cursor.pause()

				var bulk = db.newTripleStoreBulkOp('agents',function(bulk){
					batch.forEach(function(b){						
						bulk.insert(b)
					})
					batch = []
					bulk.execute(function(err, result) {

						if (err){
							console.log(err)
						}

						cursor.resume()

					})					
					

				})
			}

			//cursor.pause()		
			// console.log(agent)
			// console.log(rdfAgent)


		})


		cursor.once('end', function() {	

			var count = 0

			var i = setInterval(function(){

				if (count === totalAgents){

					clearInterval(i)

					//the last batch
					var bulk = db.newTripleStoreBulkOp('agentsStage',function(bulk){
						batch.forEach(function(b){						
							bulk.insert(b)
						})
						batch = []
						bulk.execute()					
						
						if (cb) cb()

					})

				}else{
					count = totalAgents
				}



			},100)
			
			//console.log("populateArchivesAgentsCollctions - Done!\n")
			//process.stdout.cursorTo(0)
			//process.stdout.write(clc.black.bgGreenBright("populateArchivesAgentsCollctions | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))
			if (cb) cb()
		})


	})
}




exports.buildAgentExternalDataCatchOneTime = function(cb){

	//load up the agents
	var totalAgents = 0
	db.returnCollectionRegistry("agents",function(err,agents){
		
		var cursor = agents.find({}).stream()
		var batch = []

		cursor.on('data', function(agent) {			

			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgBlueBright("buildAgentExternalDataCatchOneTime | totalAgents: " + totalAgents ))


			var agentData = {}

			agentData.wikidata = (agent.wikidata) ? agent.wikidata : null
			agentData.lcId = (agent.lcId) ? agent.lcId : null
			agentData.dbpedia = (agent.dbpedia) ? agent.dbpedia : null
			agentData.birth = (agent.birth) ? agent.birth : null
			agentData.death = (agent.death) ? agent.death : null
			agentData.wikidataSlug = (agent.wikidataSlug) ? agent.wikidataSlug : null
			agentData.wikidataImage = (agent.wikidataImage) ? agent.wikidataImage : null
			agentData.wikidataDesc = (agent.wikidataDesc) ? agent.wikidataDesc : null


			if (!agent.viafAll){
				agentData.viaf = [agent.viaf]
			}else if (agent.viafAll.length==0){
				agentData.viaf = [agent.viaf]	
			}else{
				agentData.viaf = agent.viafAll
			}



			batch.push(agentData)
			totalAgents++


			if (batch.length===999){

				cursor.pause()

				var bulk = db.newTripleStoreBulkOp('externalDataCacheAgents',function(bulk){
					batch.forEach(function(b){						
						bulk.insert(b)
					})
					batch = []
					bulk.execute(function(err, result) {

						if (err){
							console.log(err)
						}

						cursor.resume()

					})					
					

				})
			}

			//cursor.pause()		
			// console.log(agent)
			// console.log(rdfAgent)


		})


		cursor.once('end', function() {	

			var count = 0

			var i = setInterval(function(){

				if (count === totalAgents){
					clearInterval(i)
					//the last batch
					var bulk = db.newTripleStoreBulkOp('externalDataCacheAgents',function(bulk){
						batch.forEach(function(b){						
							bulk.insert(b)
						})
						batch = []
						bulk.execute()					
						if (cb) cb()
					})

				}else{
					count = totalAgents
				}



			},100)
			
			if (cb) cb()
		})


	})
}