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

exports.buildAgentFromTmsAgent = function(tmsAgent){


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

	if (tmsAgent.viaf){
		newAgent.viaf = tmsAgent.viaf
		newAgent.viafAll = [tmsAgent.viaf]
	}else{
		newAgent.viaf = "noViaf" + Date.now() + Math.floor(Math.random() * (1000000 - 1)) + 1
	}

	newAgent.nameControlled = tmsAgent.namePart
	newAgent.type = tmsAgent.type
	newAgent.nameNormalized = [utils.normalizeAndDiacritics(tmsAgent.namePart)]


	return newAgent

}

exports.populateTmsAgents = function(cb){

	db.returnCollectionRegistry("tmsObjects",function(err,tmsObjects){



		var cursor = tmsObjects.find({}, { 'agents' : 1 }).stream()

		var totalAgents = 0, totalAgentsWithViaf = 0, totalAgentsNotFoundInRegistry = 0, loadedAgents = 0

		cursor.on('data', function(collection) {

			

			cursor.pause()

			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgGreenBright("populateTMSAgents | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))

			// console.log(collection.agents)

			loadedAgents = loadedAgents + collection.agents.length

			async.eachSeries(collection.agents, function(agent, eachCallback) {
				
				totalAgents++

				//if they have a viaf then use that to look up in the 

				if (!agent.viaf){


					if (agent.dateStart) agent.dateStart = (!isNaN(parseInt(agent.dateStart))) ? parseInt(agent.dateStart) : false
					if (agent.dateEnd) agent.dateEnd = (!isNaN(parseInt(agent.dateEnd))) ? parseInt(agent.dateEnd) : false

					if (agent.dateStart===0) agent.dateStart = false
					if (agent.dateEnd===0 || agent.dateStart + 100 === agent.dateEnd) agent.dateEnd = false


					var checkNames = []

					if (agent.dateStart && agent.dateEnd){
						if (agent.nameAlpha.trim() != ""){
							checkNames.push(agent.nameAlpha.trim() + ', ' + agent.dateStart  + "-" + agent.dateEnd)
						}
					}
					if (agent.dateStart){
						if (agent.nameAlpha.trim() != ""){									
							checkNames.push(agent.nameAlpha.trim() + ', ' + agent.dateStart  + "-")
						}
					}

					if (agent.nameAlpha.trim() != ""){	
						if (checkNames.indexOf(agent.nameAlpha.trim())==-1)
							checkNames.push(agent.nameAlpha.trim())
					}

					if (agent.nameDisplay.trim() != ""){	
						if (checkNames.indexOf(agent.nameDisplay.trim())==-1)
							checkNames.push(agent.nameDisplay.trim())
					}



					var foundSomething = false

					console.log(checkNames)


					async.eachSeries(checkNames, function(checkName, eachSubCallback) {


						if (!foundSomething){
							console.log(checkName)
							serializeUtils.returnAgentByName(checkName, function(existingAgent){

								if (existingAgent){

									console.log(existingAgent)
									foundSomething = true
								}

								eachSubCallback()

							})

							// agents.find({ nameNormalized : utils.normalizeAndDiacritics(checkName) }).toArray(function(err, agentsAry) {
							// 	if (err) console.log(err)

							// 	if (agentsAry.length>0){
							// 		foundSomething = { nameTms : checkName, nameAgents: agentsAry[0].nameControlled, viaf: agentsAry[0].viaf }
							// 	}
							// 	eachSubCallback()
							// })

						}else{
							eachSubCallback()
						}
						

					}, function(err){
					   	if (err) console.log(err)

					  //  	if (foundSomething){

					  //  		if (foundSomething.viaf){
					  //  			matchedAgentToViaf++
					  //  		}else{
					  //  			matchedAgentToRegistry++
					  //  		}

					  //  		//we don't need to do anything here since the name matched something.
					  //  		eachCallback()


					  //  	}else{
					  //  		tmsMint++

					  //  		//we need to make a new registry agent
					  //  		var useName = (aAgent.nameAlpha.trim() != "") ? aAgent.nameAlpha.trim() : aAgent.nameDisplay.trim()

							// var newAgent = {
							// 	_id: agentId++,
							// 	nameControlled : useName,
							// 	viaf: false,
							// 	nameNormalized : [utils.normalizeAndDiacritics(useName)]
							// }							

							// //insert the new agent
							// agents.update({ _id : newAgent._id }, { $set: newAgent }, { upsert : true}, function(err, result) {
							// 	if (err) console.log(err)
							 	eachCallback()
							// })
					  //  	}

					   	//done
						
					})
				


					// //first get the real VIAF data
					// serializeUtils.returnViafData(viaf, function(viafLookup){

					// 	totalAgentsWithViaf++

					// 	if (viafLookup) viaf = viafLookup._id

						
					// 	serializeUtils.returnAgentByViaf(viaf,function(existingAgent){
							
					// 		if (!existingAgent){


					// 			var updateAgent = exports.buildAgentFromArchiveAgent(agent)

					// 			updateAgent.useCount++
					// 			updateAgent.source = "archivesCollectionDb" +collection._id 

					// 			serializeUtils.addAgentByViaf(updateAgent,function(){
					// 				eachCallback()
					// 			})	


					// 		}else{
					// 			//already in agents, it is okay
					// 			eachCallback()
					// 		}

					// 	})


					// })


				}else{


					// serializeUtils.returnAgentByName(agent.namePart, function(existingAgent){
					// 	if (existingAgent){
					// 		eachCallback()
					// 	}else{
					// 		//not yet in the agents table
					// 		totalAgentsNotFoundInRegistry++
					// 		var updateAgent = exports.buildAgentFromArchiveAgent(agent)
					// 		updateAgent.useCount++
					// 		updateAgent.source = "archivesCollectionDb" +collection._id 
					// 		serializeUtils.addAgentByName(updateAgent,function(){
					 			eachCallback()
					// 		})
					// 	}
					// })		

				}

			}, function(err){
				if (err) console.log(err)
				//done
			
				cursor.resume()

			})
		})

		

		cursor.once('end', function() {				
			console.log(cursor.cursorState.documents.length)

			console.log("populateTMSAgents - Done!\n")
			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgGreenBright("populateTMSAgents | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))
			cb()					


		})




	})


}