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


			var recordAgents = JSON.parse(JSON.stringify(collection.agents))
			var recordSubjects = JSON.parse(JSON.stringify(collection.subjects))
			var updateHost = false

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


							//update the host record
							//we want to go back and update the orginal source record with the VIAF id
							for (var x in recordAgents){
								if (recordAgents[x].namePart===agent.namePart){
									recordAgents[x].viaf = viaf
									updateHost=true
								}
							}

							for (var x in recordSubjects){
								if (recordSubjects[x].text===agent.namePart){
									recordSubjects[x].viaf = viaf
									updateHost=true
								}
							}							

							
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

									if (existingAgent.viaf){

										if (!isNaN(existingAgent.viaf)){

											for (var x in recordAgents){
												if (recordAgents[x].namePart===agent.namePart){
													recordAgents[x].viaf = existingAgent.viaf
													updateHost=true
												}
											}

											for (var x in recordSubjects){
												if (recordSubjects[x].text===agent.namePart){
													recordSubjects[x].viaf = existingAgent.viaf
													updateHost=true
												}
											}	

										}

										
									}




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


							if (existingAgent.viaf){



								if (!isNaN(existingAgent.viaf)){

									for (var x in recordAgents){
										if (recordAgents[x].namePart===agent.namePart){
											recordAgents[x].viaf = existingAgent.viaf
											updateHost=true
										}
									}

									for (var x in recordSubjects){
										if (recordSubjects[x].text===agent.namePart){
											recordSubjects[x].viaf = existingAgent.viaf
											updateHost=true
										}
									}	

								}

								
							}


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
				if (updateHost){


					mmsCollections.update({ _id: collection._id },{ $set: { agents: recordAgents, subjects : recordSubjects}  }, function(err, result) {
						if(err) console.log(err)

						// console.log(collection._id)
						// console.log("~~~~~~~~~~~~~~~")
						// console.log(recordAgents)

						// console.log("===============")
						// console.log(recordSubjects)


						// console.log(result.result)

						cursor.resume()

					})

				}else{

					cursor.resume()

				}
			
 				

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

			var recordAgents = JSON.parse(JSON.stringify(container.agents))
			var recordSubjects = JSON.parse(JSON.stringify(container.subjects))
			var updateHost = false

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
				
							//update the host record
							//we want to go back and update the orginal source record with the VIAF id
							for (var x in recordAgents){
								if (recordAgents[x].namePart===agent.namePart){
									recordAgents[x].viaf = viaf
									updateHost=true
								}
							}

							for (var x in recordSubjects){
								if (recordSubjects[x].text===agent.namePart){
									recordSubjects[x].viaf = viaf
									updateHost=true
								}
							}	


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


									if (existingAgent.viaf){

										if (!isNaN(existingAgent.viaf)){

											for (var x in recordAgents){
												if (recordAgents[x].namePart===agent.namePart){
													recordAgents[x].viaf = existingAgent.viaf
													updateHost=true
												}
											}

											for (var x in recordSubjects){
												if (recordSubjects[x].text===agent.namePart){
													recordSubjects[x].viaf = existingAgent.viaf
													updateHost=true
												}
											}	

										}

										
									}




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


							if (existingAgent.viaf){



								if (!isNaN(existingAgent.viaf)){

									for (var x in recordAgents){
										if (recordAgents[x].namePart===agent.namePart){
											recordAgents[x].viaf = existingAgent.viaf
											updateHost=true
										}
									}

									for (var x in recordSubjects){
										if (recordSubjects[x].text===agent.namePart){
											recordSubjects[x].viaf = existingAgent.viaf
											updateHost=true
										}
									}	

								}

								
							}


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
			
				if (updateHost){


					mmsContainers.update({ _id: container._id },{ $set: { agents: recordAgents, subjects : recordSubjects}  }, function(err, result) {
						if(err) console.log(err)

						// console.log(container._id)
						// console.log("~~~~~~~~~~~~~~~")
						// console.log(recordAgents)

						// console.log("===============")
						// console.log(recordSubjects)


						// console.log(result.result)

						cursor.resume()

					})

				}else{

					cursor.resume()

				}

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

			var recordAgents = JSON.parse(JSON.stringify(item.agents))
			var recordSubjects = JSON.parse(JSON.stringify(item.subjects))
			var updateHost = false

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


							//update the host record
							//we want to go back and update the orginal source record with the VIAF id
							for (var x in recordAgents){
								if (recordAgents[x].namePart===agent.namePart){
									recordAgents[x].viaf = viaf
									updateHost=true
								}
							}

							for (var x in recordSubjects){
								if (recordSubjects[x].text===agent.namePart){
									recordSubjects[x].viaf = viaf
									updateHost=true
								}
							}	

							
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


									if (existingAgent.viaf){



										if (!isNaN(existingAgent.viaf)){

											for (var x in recordAgents){
												if (recordAgents[x].namePart===agent.namePart){
													recordAgents[x].viaf = existingAgent.viaf
													updateHost=true
												}
											}

											for (var x in recordSubjects){
												if (recordSubjects[x].text===agent.namePart){
													recordSubjects[x].viaf = existingAgent.viaf
													updateHost=true
												}
											}	

										}

										
									}


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


							if (existingAgent.viaf){



								if (!isNaN(existingAgent.viaf)){

									for (var x in recordAgents){
										if (recordAgents[x].namePart===agent.namePart){
											recordAgents[x].viaf = existingAgent.viaf
											updateHost=true
										}
									}

									for (var x in recordSubjects){
										if (recordSubjects[x].text===agent.namePart){
											recordSubjects[x].viaf = existingAgent.viaf
											updateHost=true
										}
									}	

								}

								
							}


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
			
				if (updateHost){


					mmsItems.update({ _id: item._id },{ $set: { agents: recordAgents, subjects : recordSubjects}  }, function(err, result) {
						if(err) console.log(err)

						console.log(item._id)
						console.log("~~~~~~~~~~~~~~~")
						console.log(recordAgents)

						console.log("===============")
						console.log(recordSubjects)


						console.log(result.result)

						cursor.resume()

					})

				}else{

					cursor.resume()

				}

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