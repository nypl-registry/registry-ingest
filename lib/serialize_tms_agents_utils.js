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

	var local = utils.normalizeAndDiacritics(tmsAgent.namePartLocal)

	if (newAgent.nameNormalized.indexOf(local)===-1 && local != '') newAgent.nameNormalized.push(local)

	return newAgent

}


exports.populateTmsAgents = function(cb){

	db.returnCollectionRegistry("tmsObjects",function(err,tmsObjects){



		var cursor = tmsObjects.find({ _id: 287377 }, { 'agents' : 1 }).stream()

		var totalAgents = 0, matchedAgentToRegistry = 0, tmsMint = 0, loadedAgents = 0, matchedAgentToViaf = 0

		cursor.on('data', function(object) {

			

			cursor.pause()

			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgGreenBright("populateTMSAgents | totalAgents: " + totalAgents + " matchedAgentToViaf: " + matchedAgentToViaf + " matchedAgentToRegistry:" + matchedAgentToRegistry + " tmsMint: " + tmsMint ))

			// console.log(object.agents)

			loadedAgents = loadedAgents + object.agents.length

			async.eachSeries(object.agents, function(agent, eachCallback) {
				
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

					async.eachSeries(checkNames, function(checkName, eachSubCallback) {


						if (!foundSomething){
							serializeUtils.returnAgentByName(checkName, function(existingAgent){
								if (existingAgent){
									foundSomething = { nameTms : checkName, nameAgents: existingAgent.nameControlled, viaf: existingAgent.viaf }
								}
								eachSubCallback()
							})	
						}else{
							eachSubCallback()
						}
						

					}, function(err){
					   	if (err) console.log(err)


					   	if (foundSomething){

					   		if (foundSomething.viaf){
					   			matchedAgentToViaf++
					   		}else{
					   			matchedAgentToRegistry++
					   		}

					   		//we don't need to do anything here since the name matched something.
					   		eachCallback()


					   	}else{
					   		tmsMint++

					   		//we need to make a new registry agent
					   		var useName = (agent.nameAlpha.trim() != "") ? agent.nameAlpha.trim() : agent.nameDisplay.trim()

					   		agent.namePart = useName

							var updateAgent = exports.buildAgentFromTmsAgent(agent)

							updateAgent.useCount++
							updateAgent.source = "tms" +object._id 

							//console.log(updateAgent)

							if (useName !== 'Unknown' && useName !== 'None' && useName !== '[Illegible logo]'){
								serializeUtils.addAgentByViaf(updateAgent,function(){
									eachCallback()
								})	
							}else{
								eachCallback()
							}




					   	}

						
					})
				





				}else{


					//first get the real VIAF data
					serializeUtils.returnViafData(agent.viaf, function(viafLookup){

						matchedAgentToViaf++

						if (viafLookup) var viaf = viafLookup._id

						agent.viaf = viaf

						agent.namePart = (agent.nameAlpha.trim() != "") ? agent.nameAlpha.trim() : agent.nameDisplay.trim()
						agent.namePartLocal = (agent.nameAlpha.trim() != "") ? agent.nameAlpha.trim() : agent.nameDisplay.trim()
						if (viafLookup.viafTerm) agent.namePart = viafLookup.viafTerm
						if (viafLookup.lcTerm) agent.namePart = viafLookup.lcTerm
						
						serializeUtils.returnAgentByViaf(viaf,function(existingAgent){
							
							if (!existingAgent){




								var updateAgent = exports.buildAgentFromTmsAgent(agent)

								updateAgent.useCount++
								updateAgent.source = "tms" +object._id 

								//console.log(updateAgent)

								serializeUtils.addAgentByViaf(updateAgent,function(){
									eachCallback()
								})	


							}else{
								//already in agents, it is okay
								eachCallback()
							}

						})


					})	

				}

			}, function(err){
				if (err) console.log(err)
				//done
			
				cursor.resume()

			})
		})

		

		cursor.once('end', function() {				
			console.log("populateTMSAgents - Done!\n")
			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgGreenBright("populateTMSAgents | totalAgents: " + totalAgents + " matchedAgentToViaf: " + matchedAgentToViaf + " matchedAgentToRegistry:" + matchedAgentToRegistry + " tmsMint: " + tmsMint ))
			cb()
		})




	})


}