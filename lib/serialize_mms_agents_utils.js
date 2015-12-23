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


//builds the default object for agents based on existing mms agent data
exports.buildAgentFromMmsAgent = function(mmsAgent){


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

	if (mmsAgent.viaf){
		newAgent.viaf = mmsAgent.viaf
		newAgent.viafAll = [mmsAgent.viaf]
	}else{
		newAgent.viaf = "noViaf" + Date.now() + Math.floor(Math.random() * (1000000 - 1)) + 1
	}

	newAgent.nameControlled = mmsAgent.namePart
	newAgent.type = mmsAgent.type
	newAgent.nameNormalized = [utils.normalizeAndDiacritics(mmsAgent.namePart)]


	return newAgent

}


exports.populateMmsAgentsCollections = function(cb){

	db.returnCollectionRegistry("mmsCollections",function(err,mmsCollections){

		var cursor = mmsCollections.find({}, { 'agents' : 1, 'subjects' : 1 }).stream()

		var totalAgents = 0, totalAgentsWithViaf = 0, totalAgentsNotFoundInRegistry = 0, loadedAgents = 0

		cursor.on('data', function(collection) {
			
			cursor.pause()

			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgGreenBright("populateMMSAgentsCollctions | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))

			loadedAgents = loadedAgents + collection.agents.length


			//move the name subjects into the agents for processing
			collection.subjects.forEach(function(s){
				if (s.type==='name'){
					if (s.text!=='None'||s.text!=='Unknown'||s.text.trim()!==''){							
						collection.agents.push({
							namePart : s.text,
							type: s.nameType,
							authority: s.authority,
							valueURI: s.valueURI
						})
						
						
					}
				}
			})


			async.each(collection.agents, function(agent, eachCallback) {
				
				totalAgents++

				var loc=false

				if (agent.valueURI){
					if (agent.valueURI.search("loc.gov")>-1){
						loc = agent.valueURI.split('/names/')[1]
						agent.loc = loc
					}
				}

				//if they have a loc then use that to look up in the 
				if (loc){					

					//first get the real loc data
					serializeUtils.returnViafByLccn(loc, function(locLookup){

						totalAgentsWithViaf++
						if (locLookup){

							var viaf = locLookup._id


							agent.viaf = viaf
							
							serializeUtils.returnAgentByViaf(viaf,function(existingAgent){
								
								if (!existingAgent){

									var updateAgent = exports.buildAgentFromMmsAgent(agent)
									updateAgent.useCount++
									updateAgent.source = "mmsCollection" +collection._id 
									
									serializeUtils.addAgentByViaf(updateAgent,function(){
									 	eachCallback()
									})

								}else{
									//already in agents, it is okay
									eachCallback()
								}
							})
						}else{
							//we could not find that viaf ID, just add it by name
							serializeUtils.returnAgentByName(agent.namePart, function(existingAgent){
								if (existingAgent){
									eachCallback()
								}else{
									//not yet in the agents table
									totalAgentsNotFoundInRegistry++
									var updateAgent = exports.buildAgentFromMmsAgent(agent)
									updateAgent.useCount++
									//console.log("!",updateAgent)
									updateAgent.source = "mmsCollection" +collection._id 
									serializeUtils.addAgentByName(updateAgent,function(){
										eachCallback()
									})
								}
							})
						}


					})


				}else{

					//add it by name
					serializeUtils.returnAgentByName(agent.namePart, function(existingAgent){
						if (existingAgent){
							eachCallback()
						}else{
							//not yet in the agents table
							totalAgentsNotFoundInRegistry++
							var updateAgent = exports.buildAgentFromMmsAgent(agent)
							updateAgent.useCount++
							//console.log("2",updateAgent)
							updateAgent.source = "mmsCollection" +collection._id 
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

			console.log("populateMMSAgentsCollctions - Done!\n")
			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgGreenBright("populateMMSAgentsCollctions | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))
			cb()					


		})




	})


}

exports.populateMmsAgentsContainers = function(cb){

	db.returnCollectionRegistry("mmsContainers",function(err,mmsContainers){

		var cursor = mmsContainers.find({}, { 'agents' : 1, 'subjects' : 1 }).stream()

		var totalAgents = 0, totalAgentsWithViaf = 0, totalAgentsNotFoundInRegistry = 0, loadedAgents = 0

		cursor.on('data', function(container) {
			
			cursor.pause()

			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgGreenBright("populateMMSAgentsContainers | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))

			loadedAgents = loadedAgents + container.agents.length


			//move the name subjects into the agents for processing
			container.subjects.forEach(function(s){
				if (s.type==='name'){
					if (s.text!=='None'||s.text!=='Unknown'||s.text.trim()!==''){							
						container.agents.push({
							namePart : s.text,
							type: s.nameType,
							authority: s.authority,
							valueURI: s.valueURI
						})
						
						
					}
				}
			})

			async.each(container.agents, function(agent, eachCallback) {
				
				totalAgents++

				var loc=false

				if (agent.valueURI){
					if (agent.valueURI.search("loc.gov")>-1){
						loc = agent.valueURI.split('/names/')[1]
						agent.loc = loc
					}
				}

				//if they have a loc then use that to look up in the 
				if (loc){					

					//first get the real loc data
					serializeUtils.returnViafByLccn(loc, function(locLookup){

						totalAgentsWithViaf++
						if (locLookup){

							var viaf = locLookup._id


							agent.viaf = viaf
							
							serializeUtils.returnAgentByViaf(viaf,function(existingAgent){
								
								if (!existingAgent){

									var updateAgent = exports.buildAgentFromMmsAgent(agent)
									updateAgent.useCount++
									updateAgent.source = "mmsContainer" +container._id 

									serializeUtils.addAgentByViaf(updateAgent,function(){
									 	eachCallback()
									})

								}else{
									//already in agents, it is okay
									eachCallback()
								}
							})
						}else{
							//we could not find that viaf ID, just add it by name
							serializeUtils.returnAgentByName(agent.namePart, function(existingAgent){
								if (existingAgent){
									eachCallback()
								}else{
									//not yet in the agents table
									totalAgentsNotFoundInRegistry++
									var updateAgent = exports.buildAgentFromMmsAgent(agent)
									updateAgent.useCount++
									//console.log("!",updateAgent)
									updateAgent.source = "mmsContainer" +container._id 
									serializeUtils.addAgentByName(updateAgent,function(){
										eachCallback()
									})
								}
							})
						}


					})


				}else{

					//add it by name
					serializeUtils.returnAgentByName(agent.namePart, function(existingAgent){
						if (existingAgent){
							eachCallback()
						}else{
							//not yet in the agents table
							totalAgentsNotFoundInRegistry++
							var updateAgent = exports.buildAgentFromMmsAgent(agent)
							updateAgent.useCount++
							//console.log("2",updateAgent)
							updateAgent.source = "mmsContainer" +container._id 
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

			console.log("populateMMSAgentsContainers - Done!\n")
			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgGreenBright("populateMMSAgentsContainers | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))
			cb()					


		})




	})


}

exports.populateMmsAgentsItems = function(cb){

	db.returnCollectionRegistry("mmsItems",function(err,mmsItems){

		var cursor = mmsItems.find({}, { 'agents' : 1, 'subjects' : 1 }).stream()

		var totalAgents = 0, totalAgentsWithViaf = 0, totalAgentsNotFoundInRegistry = 0, loadedAgents = 0

		cursor.on('data', function(item) {
			
			cursor.pause()

			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgGreenBright("populateMMSAgentsItems | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))

			loadedAgents = loadedAgents + item.agents.length

			//move the name subjects into the agents for processing
			item.subjects.forEach(function(s){
				if (s.type==='name'){
					if (s.text!=='None'||s.text!=='Unknown'||s.text.trim()!==''){							
						item.agents.push({
							namePart : s.text,
							type: s.nameType,
							authority: s.authority,
							valueURI: s.valueURI
						})
						
						
					}
				}
			})

			async.each(item.agents, function(agent, eachCallback) {
				
				totalAgents++

				var loc=false

				if (agent.valueURI){
					if (agent.valueURI.search("loc.gov")>-1){
						loc = agent.valueURI.split('/names/')[1]
						agent.loc = loc
					}
				}

				//if they have a loc then use that to look up in the 
				if (loc){					

					//first get the real loc data
					serializeUtils.returnViafByLccn(loc, function(locLookup){

						totalAgentsWithViaf++
						if (locLookup){

							var viaf = locLookup._id


							agent.viaf = viaf
							
							serializeUtils.returnAgentByViaf(viaf,function(existingAgent){
								
								if (!existingAgent){

									var updateAgent = exports.buildAgentFromMmsAgent(agent)
									updateAgent.useCount++
									updateAgent.source = "mmsItem" +item._id 

									serializeUtils.addAgentByViaf(updateAgent,function(){
									 	eachCallback()
									})

								}else{
									//already in agents, it is okay
									eachCallback()
								}
							})
						}else{
							//we could not find that viaf ID, just add it by name
							serializeUtils.returnAgentByName(agent.namePart, function(existingAgent){
								if (existingAgent){
									eachCallback()
								}else{
									//not yet in the agents table
									totalAgentsNotFoundInRegistry++
									var updateAgent = exports.buildAgentFromMmsAgent(agent)
									updateAgent.useCount++
									//console.log("!",updateAgent)
									updateAgent.source = "mmsItem" +item._id 
									serializeUtils.addAgentByName(updateAgent,function(){
										eachCallback()
									})
								}
							})
						}


					})


				}else{

					//add it by name
					serializeUtils.returnAgentByName(agent.namePart, function(existingAgent){
						if (existingAgent){
							eachCallback()
						}else{
							//not yet in the agents table
							totalAgentsNotFoundInRegistry++
							var updateAgent = exports.buildAgentFromMmsAgent(agent)
							updateAgent.useCount++
							
							updateAgent.source = "mmsItem" +item._id 
							//console.log("2",updateAgent)
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

			console.log("populateMMSAgentsItems - Done!\n")
			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgGreenBright("populateMMSAgentsItems | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))
			cb()					


		})




	})


}