"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")
var sanitizeHtml = require('sanitize-html')
var serializeUtils = require("../lib/serialize_utils.js")

require("string_score")

exports.buildAgentFromArchiveAgent = function(archiveAgent){


	var newAgent = {
		viaf: false,
		viafAll: [],
		registry: "temp" + Date.now() + Math.floor(Math.random() * (1000000 - 1)) + 1,
		nameControlled: false,
		wikidata: false,
		lcId: false,
		gettyId: false,
		dbpedia: false,
		birth: false,
		death: false,
		type: false,
		source: false,
		useCount: 0,
		nameNormalized: []
	}

	if (archiveAgent.viaf){
		newAgent.viaf = archiveAgent.viaf
		newAgent.viafAll = [archiveAgent.viaf]
	}else{
		newAgent.viaf = "noViaf" + Date.now() + Math.floor(Math.random() * (1000000 - 1)) + 1
	}

	newAgent.nameControlled = archiveAgent.namePart
	newAgent.type = archiveAgent.type
	newAgent.nameNormalized = [utils.normalizeAndDiacritics(archiveAgent.namePart)]


	return newAgent


}



exports.populateArchivesAgentsCollctions = function(cb){

	db.returnCollectionRegistry("archivesCollections",function(err,archivesCollections){



		var cursor = archivesCollections.find({}, { 'agents' : 1 }).stream()

		var totalAgents = 0, totalAgentsWithViaf = 0, totalAgentsNotFoundInRegistry = 0, loadedAgents = 0

		cursor.on('data', function(collection) {

			

			cursor.pause()

			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgGreenBright("populateArchivesAgentsCollctions | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))

			// console.log(collection.agents)

			loadedAgents = loadedAgents + collection.agents.length

			async.eachSeries(collection.agents, function(agent, eachCallback) {
				
				totalAgents++

				var viaf=false

				if (agent.valueURI){
					if (agent.valueURI.search("viaf.org")>-1){
						viaf = parseInt(agent.valueURI.split('/viaf/')[1])
						if (isNaN(viaf)) viaf = false
						agent.viaf = viaf
					}
				}

				//if they have a viaf then use that to look up in the 

				if (viaf){

					//first get the real VIAF data
					serializeUtils.returnViafData(viaf, function(viafLookup){

						totalAgentsWithViaf++

						if (viafLookup) viaf = viafLookup._id

						
						serializeUtils.returnAgentByViaf(viaf,function(existingAgent){
							
							if (!existingAgent){


								var updateAgent = exports.buildAgentFromArchiveAgent(agent)

								updateAgent.useCount++
								updateAgent.source = "archivesCollectionDb" +collection._id 

								serializeUtils.addAgentByViaf(updateAgent,function(){
									eachCallback()
								})	


							}else{
								//already in agents, it is okay
								eachCallback()
							}

						})


					})


				}else{


					serializeUtils.returnAgentByName(agent.namePart, function(existingAgent){
						if (existingAgent){
							eachCallback()
						}else{
							//not yet in the agents table
							totalAgentsNotFoundInRegistry++
							var updateAgent = exports.buildAgentFromArchiveAgent(agent)
							updateAgent.useCount++
							updateAgent.source = "archivesCollectionDb" +collection._id 
							serializeUtils.addAgentByName(updateAgent,function(){
								eachCallback()
							})
						}
					})		

				}

			}, function(err){
				if (err) console.log(err)
				//done
			
				cursor.resume()

			})
		})

		

		cursor.once('end', function() {				
			console.log(cursor.cursorState.documents.length)

			console.log("populateArchivesAgentsCollctions - Done!\n")
			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgGreenBright("populateArchivesAgentsCollctions | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))
			cb()					


		})




	})


}

exports.populateArchivesAgentsComponents = function(cb){

	db.returnCollectionRegistry("archivesComponents",function(err,archivesComponents){



		var cursor = archivesComponents.find({}, { 'agents' : 1 }).stream()

		var totalAgents = 0, totalAgentsWithViaf = 0, totalAgentsNotFoundInRegistry = 0, loadedAgents = 0

		cursor.on('data', function(component) {

			

			cursor.pause()

			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgGreenBright("populateArchivesAgentsComponents | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))

			// console.log(component.agents)

			loadedAgents = loadedAgents + component.agents.length

			async.eachSeries(component.agents, function(agent, eachCallback) {
				
				totalAgents++

				var viaf=false

				if (agent.valueURI){
					if (agent.valueURI.search("viaf.org")>-1){
						viaf = parseInt(agent.valueURI.split('/viaf/')[1])
						if (isNaN(viaf)) viaf = false
						agent.viaf = viaf
					}
				}

				//if they have a viaf then use that to look up in the 

				if (viaf){

					//first get the real VIAF data
					serializeUtils.returnViafData(viaf, function(viafLookup){

						totalAgentsWithViaf++

						if (viafLookup) viaf = viafLookup._id

						
						serializeUtils.returnAgentByViaf(viaf,function(existingAgent){
							
							if (!existingAgent){


								var updateAgent = exports.buildAgentFromArchiveAgent(agent)

								updateAgent.useCount++
								updateAgent.source = "archivesCollectionDb" +component._id 

								serializeUtils.addAgentByViaf(updateAgent,function(){
									eachCallback()
								})	


							}else{
								//already in agents, it is okay
								eachCallback()
							}

						})


					})


				}else{


					serializeUtils.returnAgentByName(agent.namePart, function(existingAgent){
						if (existingAgent){
							eachCallback()
						}else{
							//not yet in the agents table
							totalAgentsNotFoundInRegistry++
							var updateAgent = exports.buildAgentFromArchiveAgent(agent)
							updateAgent.useCount++
							updateAgent.source = "archivesComponentDb" +component._id 
							serializeUtils.addAgentByName(updateAgent,function(){
								eachCallback()
							})
						}
					})		

				}

			}, function(err){
				if (err) console.log(err)
				//done
			
				cursor.resume()

			})
		})

		

		cursor.once('end', function() {				
			console.log(cursor.cursorState.documents.length)

			console.log("populateArchivesAgentsComponents - Done!\n")
			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgGreenBright("populateArchivesAgentsComponents | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))
			cb()					


		})




	})


}


