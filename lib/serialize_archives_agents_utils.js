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

		var totalAgents = 0, totalAgentsWithViaf = 0, totalAgentsNotFoundInRegistry = 0

		cursor.on('data', function(collection) {

			

			cursor.pause()

			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgGreenBright("populateArchivesAgentsCollctions | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))

			// console.log(collection.agents)



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

		cursor.once('close', function() {				
			console.log("populateArchivesAgentsCollctions - Done!\n")
			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgGreenBright("populateArchivesAgentsCollctions | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))
			cb()
		})




	})


}





exports.populateArchivesAgentsCollctionsOld = function(cb){

	db.returnCollection("archivesCollections",function(err,archivesCollections,mmsDatabase){

		db.returnCollection("agents",function(err,agentsCollection,agentsDatabase){

			db.returnCollection("viafLookup",function(err,viafLookup,viafDatabase){

				//we need to find the last ID we are going to use
				agentsCollection.find({}).sort({ _id: -1}).limit(1).toArray(function(err, agentIdAry) {

					var agentId = parseInt(agentIdAry[0]._id) + 1

					var totalAgents = 0, totalAgentsWithViaf = 0, totalAgentsNotFoundInRegistry = 0
					var cursor = archivesCollections.find({}, { 'agents' : 1 })
					
					cursor.on('data', function(collection) {

						totalAgents++

						cursor.pause()

						process.stdout.cursorTo(0)
						process.stdout.write(clc.black.bgGreenBright("populateArchivesAgentsCollctions | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))

						async.eachSeries(collection.agents, function(agent, eachCallback) {


							

							var viaf=false
							if (agent.valueURI){
								if (agent.valueURI.search("viaf.org")>-1){
									viaf = parseInt(agent.valueURI.split('/viaf/')[1])
									if (isNaN(viaf)) viaf = false
								}
							}

							//if they have a viaf then use that to look up in the 

							if (viaf){

								totalAgentsWithViaf++

								agentsCollection.find({ viaf : viaf }).toArray(function(err, agentsAry) {


										if (agentsAry.length>0){

											//they are in agents don't need to do anything

											eachCallback()

										}else{


											totalAgentsNotFoundInRegistry++
											//they are not in agents, add them
											var newAgent = {
												_id: agentId++,
												nameControlled : agent.namePart,
												viaf: viaf,
												nameNormalized : [utils.normalizeAndDiacritics(agent.namePart)]
											}

											
											//insert the new agent
											agentsCollection.update({ _id : newAgent._id }, { $set: newAgent }, { upsert : true}, function(err, result) {
												if (err) console.log(err)
												eachCallback()
												return true
											})
										}

								})						




							}else{




									agentsCollection.find({ nameNormalized : utils.normalizeAndDiacritics(agent.namePart) }).toArray(function(err, agentsAry) {

										if (agentsAry.length>0){
											
											//no problem already in agents
											if (agentsAry[0].viaf) totalAgentsWithViaf++
											eachCallback()

										}else{

											//not in agents, need to add it

											totalAgentsNotFoundInRegistry++
											var newAgent = {
												_id: agentId++,
												nameControlled : agent.namePart,
												viaf: false,
												nameNormalized : [utils.normalizeAndDiacritics(agent.namePart)]
											}



											//insert the new agent
											agentsCollection.update({ _id : newAgent._id }, { $set: newAgent }, { upsert : true}, function(err, result) {
												if (err) console.log(err)
												eachCallback()
												return true
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
							
						setTimeout(function(){
							console.log("populateArchivesAgentsCollctions - Done!\n")
							process.stdout.cursorTo(0)
							process.stdout.write(clc.black.bgGreenBright("populateArchivesAgentsCollctions | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))

							cb()
							mmsDatabase.close()
							agentsDatabase.close()
							viafDatabase.close()


						},5000)

					})



				})

			})
		})
	})
}


exports.populateArchivesAgentsComponents = function(cb){

	db.returnCollection("archivesComponents",function(err,archivesComponents,mmsDatabase){

		db.returnCollection("agents",function(err,agentsCollection,agentsDatabase){

			db.returnCollection("viafLookup",function(err,viafLookup,viafDatabase){

				//we need to find the last ID we are going to use
				agentsCollection.find({}).sort({ _id: -1}).limit(1).toArray(function(err, agentIdAry) {

					var agentId = parseInt(agentIdAry[0]._id) + 1

					var totalAgents = 0, totalAgentsWithViaf = 0, totalAgentsNotFoundInRegistry = 0
					var cursor = archivesComponents.find({}, { 'agents' : 1 })
					
					cursor.on('data', function(component) {

						totalAgents++

						cursor.pause()

						process.stdout.cursorTo(0)
						process.stdout.write(clc.black.bgWhiteBright("populateArchivesAgentsComponents | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))

						async.eachSeries(component.agents, function(agent, eachCallback) {
						

							var viaf=false
							if (agent.valueURI){
								if (agent.valueURI.search("viaf.org")>-1){
									viaf = parseInt(agent.valueURI.split('/viaf/')[1])
									if (isNaN(viaf)) viaf = false
								}
							}


							//if they have a viaf then use that to look up in the 

							if (viaf){

								totalAgentsWithViaf++

								agentsCollection.find({ viaf : viaf }).toArray(function(err, agentsAry) {

										if (agentsAry.length>0){
											//they are in agents don't need to do anything
											eachCallback()
										}else{
											totalAgentsNotFoundInRegistry++
											//they are not in agents, add them
											var newAgent = {
												_id: agentId++,
												nameControlled : agent.namePart,
												viaf: viaf,
												nameNormalized : [utils.normalizeAndDiacritics(agent.namePart)]
											}											
											//insert the new agent
											agentsCollection.update({ _id : newAgent._id }, { $set: newAgent }, { upsert : true}, function(err, result) {
												if (err) console.log(err)
												eachCallback()
												return true
											})
										}
								})

							}else{

									agentsCollection.find({ nameNormalized : utils.normalizeAndDiacritics(agent.namePart) }).toArray(function(err, agentsAry) {

										if (agentsAry.length>0){
											
											//no problem already in agents
											if (agentsAry[0].viaf) totalAgentsWithViaf++
											eachCallback()

										}else{

											//not in agents, need to add it

											totalAgentsNotFoundInRegistry++
											var newAgent = {
												_id: agentId++,
												nameControlled : agent.namePart,
												viaf: false,
												nameNormalized : [utils.normalizeAndDiacritics(agent.namePart)]
											}



											//insert the new agent
											agentsCollection.update({ _id : newAgent._id }, { $set: newAgent }, { upsert : true}, function(err, result) {
												if (err) console.log(err)
												eachCallback()
												return true
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
							
						setTimeout(function(){
							console.log("populateArchivesAgentsComponents - Done!\n")
							process.stdout.cursorTo(0)
							process.stdout.write(clc.black.bgWhiteBright("populateArchivesAgentsComponents | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))

							cb()
							mmsDatabase.close()
							agentsDatabase.close()
							viafDatabase.close()


						},5000)

					})



				})

			})
		})
	})
}
