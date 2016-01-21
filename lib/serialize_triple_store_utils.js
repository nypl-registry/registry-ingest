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

			var rdfAgent = new serializeGeneral.resourceObject('agent:' + agent.registry)

			rdfAgent.addTriple( 'rdf:type', 'edm:Agent', null,  null, "data:10000", agent.source)
			agent.viafAll.forEach(function(v){
				rdfAgent.addTriple( 'skos:exactMatch', 'http://viaf.org/viaf/'+v, null,  null, "data:10000", agent.source)
			})
			rdfAgent.addTriple( 'skos:prefLabel', null, agent.nameControlled,  null, "data:10000", agent.source)

		
			if (agent.type){
				rdfAgent.addTriple( 'rdf:type', map[agent.type], null,  null, "data:10000", agent.source)
			}
			rdfAgent.viaf = agent.viafAll

			delete rdfAgent['addTriple']
			delete rdfAgent['allAgents']
			delete rdfAgent['allTerms']

			rdfAgent.wikidata = agent.wikidata
			rdfAgent.lcId = agent.lcId
			rdfAgent.dbpedia = agent.dbpedia
			rdfAgent.birth = agent.birth
			rdfAgent.death = agent.death
			rdfAgent.wikidataSlug = agent.wikidataSlug
			rdfAgent.wikidataImage = agent.wikidataImage
			rdfAgent.wikidataDesc = agent.wikidataDesc
			

			batch.push(rdfAgent)
			totalAgents++


			if (batch.length===1000){

				cursor.pause()

				var bulk = db.newTripleStoreBulkOp('agents',function(bulk){
					batch.forEach(function(b){						
						bulk.insert(b)
					})
					batch = []
					bulk.execute()					
					setTimeout(function(){ cursor.resume() },50)

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
					var bulk = db.newTripleStoreBulkOp('agents',function(bulk){
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