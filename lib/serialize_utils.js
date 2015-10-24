"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")
var sanitizeHtml = require('sanitize-html')
require("string_score")

var mmsTermsLookup = config['Thesaurus']['mmsTermTypes']
var archivesTermLookup = config['Thesaurus']['archivesTermTypes']

var locationLookupMms = config['Thesaurus']['serializeLocationMms']
var locationLookupNonMms = config['Thesaurus']['serializeCatalog']



exports.populateShadowcatAgentsViaf = function(cb){

	var counter = 0, mintedNames = 0, matchedNames = 0

	db.prepareAgents(function(){

		console.log(">>>>>")

		db.returnCollectionShadowcat("bib",function(err,shadowcatBib,shadowcatDatabase){

			db.returnCollection("agents2",function(err,agents,agentsDatabase){

				var agentId = 100000000

				var cursor = shadowcatBib.find({}, { 'sc:agents' : 1, 'sc:research' : 1 })
				
				cursor.on('data', function(doc) {

					if (doc['sc:research']){

						counter++

						process.stdout.cursorTo(0)
						process.stdout.write(clc.black.bgYellowBright("populateShadowcatAgentsViaf: " + counter + " | mintedNames: " + mintedNames + " matchedNames: " + matchedNames))

						cursor.pause()

						var newAgentsWithRegistryIds = []

						async.eachSeries(doc['sc:agents'], function(agent, eachCallback) {

							var aAgent = JSON.parse(JSON.stringify(agent))

							if (aAgent.viaf){

								if (aAgent.nameLocal===null) aAgent.nameLocal = false
								if (aAgent.nameViaf===null) aAgent.nameViaf = false
								if (aAgent.nameLc===null) aAgent.nameLc = false

								//we have the a name to maybe seralize look it up if it is already in the database
								agents.find({ viaf : aAgent.viaf}).toArray(function(err, agentsAry) {

									if (agentsAry.length>0){

										//there is a match
										var matchedAgent = agentsAry[0]



										matchedNames++



										if (matchedAgent.nameControlled){
											//is this new one better than the current one?
											//if (aAgent.nameLocal) if (matchedAgent.nameControlled.length < aAgent.nameViaf.length) matchedAgent.nameControlled = aAgent.nameLocal
											//if (aAgent.nameViaf) if (matchedAgent.nameControlled.length < aAgent.nameViaf.length) matchedAgent.nameControlled = aAgent.nameViaf
											if (aAgent.nameLc) if (matchedAgent.nameControlled.length < aAgent.nameLc.length) matchedAgent.nameControlled = aAgent.nameLc
										}else{
											//not yet set, so start off with the local name and hopefully it gets better
											if (aAgent.nameLocal) matchedAgent.nameControlled = aAgent.nameLocal
											if (aAgent.nameViaf) matchedAgent.nameControlled = aAgent.nameViaf
											if (aAgent.nameLc) matchedAgent.nameControlled = aAgent.nameLc
										}

										//the viaf stays the same

										//check if all the normalized version are in there
										if (aAgent.nameLocal){
											var normal = utils.normalizeAndDiacritics(aAgent.nameLocal)
											if (matchedAgent.nameNormalized.indexOf(normal) == -1){

												//only add if the names are remotely similar
												if (aAgent.nameLocal.score(matchedAgent.nameControlled,0.5) > 0.2){
													matchedAgent.nameNormalized.push(normal)													
												}

											}
										}
										if (aAgent.nameViaf){
											var normal = utils.normalizeAndDiacritics(aAgent.nameViaf)
											if (matchedAgent.nameNormalized.indexOf(normal) == -1){
											
												if (aAgent.nameViaf.score(matchedAgent.nameControlled,0.5) > 0.2){
													matchedAgent.nameNormalized.push(normal)
												}
											}
										}
										if (aAgent.nameLc){
											var normal = utils.normalizeAndDiacritics(aAgent.nameLc)

											if (matchedAgent.nameNormalized.indexOf(normal) == -1){												
												if (aAgent.nameLc.score(matchedAgent.nameControlled,0.5) > 0.2){
													matchedAgent.nameNormalized.push(normal)
												}
											}
										}
										aAgent.registryId = matchedAgent._id

										//store the agent with new registry ID for updating shadowcat
										newAgentsWithRegistryIds.push(aAgent)


										//console.log("AFTER",matchedAgent)

										agents.update({ _id : matchedAgent._id }, { $set: matchedAgent }, { upsert : true}, function(err, result) {
											if (err) console.log(err)
											eachCallback()
										})



									}else{

										//there is no match, we need to make it
										mintedNames++

										var newAgent = {
											_id: agentId++,
											nameControlled : false,
											viaf: aAgent.viaf,
											nameNormalized : []
										}

										if (aAgent.nameLocal) newAgent.nameControlled = aAgent.nameLocal
										if (aAgent.nameViaf) newAgent.nameControlled = aAgent.nameViaf
										if (aAgent.nameLc) newAgent.nameControlled = aAgent.nameLc



										if (aAgent.nameLocal){
											var normal = utils.normalizeAndDiacritics(aAgent.nameLocal)
											if (newAgent.nameNormalized.indexOf(normal) == -1) newAgent.nameNormalized.push(normal)
										}
										if (aAgent.nameViaf){
											var normal = utils.normalizeAndDiacritics(aAgent.nameViaf)
											if (newAgent.nameNormalized.indexOf(normal) == -1) newAgent.nameNormalized.push(normal)
										}
										if (aAgent.nameLc){
											var normal = utils.normalizeAndDiacritics(aAgent.nameLc)
											if (newAgent.nameNormalized.indexOf(normal) == -1) newAgent.nameNormalized.push(normal)
										}

										aAgent.registryId = agentId

										//store the agent with new registry ID for updating shadowcat
										newAgentsWithRegistryIds.push(aAgent)


										//insert the new agent
										agents.update({ _id : newAgent._id }, { $set: newAgent }, { upsert : true}, function(err, result) {
											if (err) console.log(err)
											eachCallback()
										})						

									}									

								})
							}else{
								eachCallback()
							}					


						}, function(err){
						   	if (err) console.log(err)


						   	// console.log(doc._id)
						   	// console.log(newAgentsWithRegistryIds)


						   	//done
							cursor.resume()

						})


						
						
					}else{

						//this is not a research item
						cursor.resume()

					}


				});



				cursor.once('end', function() {
						
					setTimeout(function(){
						console.log("populateShadowcatAgentsViaf - Done!")
						cb(++agentId)
						shadowcatDatabase.close()
						agentsDatabase.close()

					},5000)

				})


			})

		})

	})


}

exports.populateShadowcatAgentsNonViaf = function(agentId,cb){

	var counter = 0
	var totalNames = 0, matchedNames = 0, mintedNames = 0


	db.returnCollectionShadowcat("bib",function(err,shadowcatBib,shadowcatDatabase){

		db.returnCollection("agents2",function(err,agents,agentsDatabase){

			var cursor = shadowcatBib.find({}, { 'sc:agents' : 1, 'sc:research' : 1 })
			
			cursor.on('data', function(doc) {

				if (doc['sc:research']){

					counter++

					process.stdout.cursorTo(0)
					process.stdout.write(clc.black.bgYellowBright("" + counter + " | totalNames: " + totalNames + " matchedNames:" + matchedNames + " mintedNames: " + mintedNames ))

					cursor.pause()

					async.eachSeries(doc['sc:agents'], function(agent, eachCallback) {

						var aAgent = JSON.parse(JSON.stringify(agent))

						if (!aAgent.viaf){

							totalNames++

							if (aAgent.nameLocal===null) aAgent.nameLocal = false
							if (aAgent.nameViaf===null) aAgent.nameViaf = false
							if (aAgent.nameLc===null) aAgent.nameLc = false

							if (aAgent.nameLocal){
								
								var normal = utils.normalizeAndDiacritics(aAgent.nameLocal)

								//we have the a name check if we have it in the agents already under a normalize matche
								agents.find({ nameNormalized : normal }).toArray(function(err, agentsAry) {

									if (agentsAry.length>0){

										//there is a match
										var matchedAgent = agentsAry[0]
										//if it already has a controle name
										
										//there is a match, we don't need to do anything
										matchedNames++

										eachCallback()





									}else{

										mintedNames++


										//there is no match, we need to make it

										var newAgent = {
											_id: agentId++,
											nameControlled : aAgent.nameLocal,
											viaf: false,
											nameNormalized : []
										}


										if (aAgent.nameLocal){
											var normal = utils.normalizeAndDiacritics(aAgent.nameLocal)
											if (newAgent.nameNormalized.indexOf(normal) == -1) newAgent.nameNormalized.push(normal)
										}

		


										//insert the new agent
										agents.update({ _id : newAgent._id }, { $set: newAgent }, { upsert : true}, function(err, result) {
											if (err) console.log(err)

											eachCallback()


										})

										


									}

									

								})



							}else{
								console.log("No local name for:",doc._id)
								eachCallback()	
							}
							
							
							
						}else{
							eachCallback()
						}					


					}, function(err){
					   	if (err) console.log(err)
					   	//done
						cursor.resume()

					})


					
					
				}else{

					cursor.resume()

				}


			});



			cursor.once('end', function() {
					
				setTimeout(function(){

					cb()
					shadowcatDatabase.close()
					agentsDatabase.close()

				},5000)

			})


		})

	})

}

exports.populateTmsAgents = function(cb){

	db.returnCollection("tmsObjects",function(err,tmsObjects,tmsDatabase){

		db.returnCollection("agents",function(err,agents,agentsDatabase){

			//we need to find the last ID we are going to use
			agents.find({}).sort({ _id: -1}).limit(1).toArray(function(err, agentIdAry) {

				var agentId = parseInt(agentIdAry[0]._id) + 1

				var totalAgents = 0, totalAgentsWithoutViaf = 0, matchedAgentToViaf = 0, matchedAgentToRegistry = 0, tmsMint= 0


				var cursor = tmsObjects.find({}, { 'agents' : 1 })
				
				cursor.on('data', function(object) {

					totalAgents++

					process.stdout.cursorTo(0)
					process.stdout.write(clc.black.bgYellowBright(" totalAgents: " + totalAgents + " totalAgentsWithoutViaf:" + totalAgentsWithoutViaf + " matchedAgentToViaf: " + matchedAgentToViaf + " matchedAgentToRegistry: " + matchedAgentToRegistry + " tmsMint:" + tmsMint ))

					cursor.pause()

					async.eachSeries(object['agents'], function(agent, eachCallback) {

						var aAgent = JSON.parse(JSON.stringify(agent))


						if (!aAgent.viaf){

							totalAgentsWithoutViaf++

							if (aAgent.dateStart) aAgent.dateStart = (!isNaN(parseInt(aAgent.dateStart))) ? parseInt(aAgent.dateStart) : false
							if (aAgent.dateEnd) aAgent.dateEnd = (!isNaN(parseInt(aAgent.dateEnd))) ? parseInt(aAgent.dateEnd) : false

							if (aAgent.dateStart===0) aAgent.dateStart = false
							if (aAgent.dateEnd===0 || aAgent.dateStart + 100 === aAgent.dateEnd) aAgent.dateEnd = false


							var checkNames = []

							if (aAgent.dateStart && aAgent.dateEnd){
								if (aAgent.nameAlpha.trim() != ""){
									checkNames.push(aAgent.nameAlpha.trim() + ', ' + aAgent.dateStart  + "-" + aAgent.dateEnd)
								}
							}
							if (aAgent.dateStart){
								if (aAgent.nameAlpha.trim() != ""){									
									checkNames.push(aAgent.nameAlpha.trim() + ', ' + aAgent.dateStart  + "-")
								}
							}

							if (aAgent.nameAlpha.trim() != ""){	
								if (checkNames.indexOf(aAgent.nameAlpha.trim())==-1)
									checkNames.push(aAgent.nameAlpha.trim())
							}

							if (aAgent.nameDisplay.trim() != ""){	
								if (checkNames.indexOf(aAgent.nameDisplay.trim())==-1)
									checkNames.push(aAgent.nameDisplay.trim())
							}




							var foundSomething = false

							async.eachSeries(checkNames, function(checkName, eachSubCallback) {


								if (!foundSomething){
									agents.find({ nameNormalized : utils.normalizeAndDiacritics(checkName) }).toArray(function(err, agentsAry) {
										if (err) console.log(err)

										if (agentsAry.length>0){
											foundSomething = { nameTms : checkName, nameAgents: agentsAry[0].nameControlled, viaf: agentsAry[0].viaf }
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
							   		var useName = (aAgent.nameAlpha.trim() != "") ? aAgent.nameAlpha.trim() : aAgent.nameDisplay.trim()

									var newAgent = {
										_id: agentId++,
										nameControlled : useName,
										viaf: false,
										nameNormalized : [utils.normalizeAndDiacritics(useName)]
									}							

									//insert the new agent
									agents.update({ _id : newAgent._id }, { $set: newAgent }, { upsert : true}, function(err, result) {
										if (err) console.log(err)
										eachCallback()
									})
							   	}

							   	//done
								
							})
						
							
							
						}else{


							if (typeof aAgent.viaf == 'string'){
								aAgent.viaf = aAgent.viaf.replace('https://','http://')
								if (aAgent.viaf.search("http://viaf.org/viaf/")>-1){
									aAgent.viaf = aAgent.viaf.split('/viaf/')[1]
									aAgent.viaf = parseInt(aAgent.viaf.replace(/\\/g,''))
								}
							}


							//there was a VIAF, but make sure it exists inside the registry already
							//it likely won't because it is from ULAN

							agents.find({ viaf : parseInt(aAgent.viaf) }).toArray(function(err, agentsViafAry) {

								//console.log(parseInt(aAgent.viaf) , agentsViafAry.length)

								if (isNaN(parseInt(aAgent.viaf))){
									console.log(aAgent)
									process.exit()
								}

								if (err) console.log(err)

								//console.log(utils.normalizeAndDiacritics(checkName), agentsViafAry)
								if (agentsViafAry.length == 0){

							   		var useName = (aAgent.nameAlpha.trim() != "") ? aAgent.nameAlpha.trim() : aAgent.nameDisplay.trim()

									var newAgent = {
										_id: agentId++,
										nameControlled : useName,
										viaf: parseInt(aAgent.viaf),
										nameNormalized : [utils.normalizeAndDiacritics(useName)]
									}


									//insert the new agent
									agents.update({ _id : newAgent._id }, { $set: newAgent }, { upsert : true}, function(err, result) {
										if (err) console.log(err)

										eachCallback()
										return true
									})

								}else{
									eachCallback()
									return true
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
						console.log("populateTmsAgents - Done!\n")
						process.stdout.cursorTo(0)
						process.stdout.write(clc.black.bgYellowBright(" totalAgents: " + totalAgents + " totalAgentsWithoutViaf:" + totalAgentsWithoutViaf + " matchedAgentToViaf: " + matchedAgentToViaf + " matchedAgentToRegistry: " + matchedAgentToRegistry + " tmsMint:" + tmsMint   ))

						cb()
						tmsDatabase.close()
						agentsDatabase.close()

					},5000)

				})



			})

		})


	})



}



exports.populateMmsAgentsCollections = function(cb){

	db.returnCollection("mmsCollections",function(err,mmsCollections,mmsDatabase){

		db.returnCollection("agents",function(err,agentsCollection,agentsDatabase){

			db.returnCollection("viafLookup",function(err,viafLookup,viafDatabase){

				//we need to find the last ID we are going to use
				agentsCollection.find({}).sort({ _id: -1}).limit(1).toArray(function(err, agentIdAry) {

					var agentId = parseInt(agentIdAry[0]._id) + 1

					var totalAgents = 0, totalAgentsWithViaf = 0, totalAgentsNotFoundInRegistry = 0
					var cursor = mmsCollections.find({}, { 'agents' : 1, 'subjects' : 1 })
					
					cursor.on('data', function(collection) {

						totalAgents++

						cursor.pause()

						process.stdout.cursorTo(0)
						process.stdout.write(clc.black.bgYellowBright("populateMmsAgentsCollections | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))

						//build all the agents we want to look up
						var agents = []

						collection.agents.map(function(a){
							agents.push(a.namePart)
						})
						
						collection.subjects.map(function(a){
							if (a.type === 'name') agents.push(a.text)
						})

						async.eachSeries(agents, function(agent, eachCallback) {

							//check viaf for the authorized term
							viafLookup.find({ normalized : utils.normalizeAndDiacritics(agent) }).toArray(function(err, viafAry) {
								//console.log(utils.normalizeAndDiacritics(checkName), viafAry)
								if (viafAry.length>0){

									totalAgentsWithViaf++

									//grab their info and check if they are in agents
									agentsCollection.find({ viaf : viafAry[0]._id }).toArray(function(err, agentsAry) {

										if (agentsAry.length>0){

											//they are in agents don't need to do anything

											eachCallback()

										}else{

											totalAgentsNotFoundInRegistry++
											//they are not in agents, add them
											var newAgent = {
												_id: agentId++,
												nameControlled : viafAry[0].prefLabel,
												nameLocal : agent,
												viaf: viafAry[0]._id,
												nameNormalized : [utils.normalizeAndDiacritics(viafAry[0].prefLabel)]
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
									
									//they are not in VIAF, see if they are in agents already
									agentsCollection.find({ nameNormalized : utils.normalizeAndDiacritics(agent) }).toArray(function(err, agentsAry) {

										if (agentsAry.length>0){
											
											//no problem already in agents
											if (agentsAry[0].viaf) totalAgentsWithViaf++
											eachCallback()

										}else{

											//not in agents, need to add it

											totalAgentsNotFoundInRegistry++
											var newAgent = {
												_id: agentId++,
												nameControlled : agent,
												nameLocal : agent,
												viaf: false,
												nameNormalized : [utils.normalizeAndDiacritics(agent)]
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
								


							})				


						}, function(err){
							if (err) console.log(err)
							//done
							cursor.resume()

						})




					})

					cursor.once('end', function() {
							
						setTimeout(function(){
							console.log("populateMmsAgentsCollections - Done!\n")
							process.stdout.cursorTo(0)
							process.stdout.write(clc.black.bgYellowBright("populateMmsAgentsCollections | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))

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

exports.populateMmsAgentsContainers = function(cb){

	db.returnCollection("mmsContainers",function(err,mmsContainers,mmsDatabase){

		db.returnCollection("agents",function(err,agentsCollection,agentsDatabase){

			db.returnCollection("viafLookup",function(err,viafLookup,viafDatabase){

				//we need to find the last ID we are going to use
				agentsCollection.find({}).sort({ _id: -1}).limit(1).toArray(function(err, agentIdAry) {

					var agentId = parseInt(agentIdAry[0]._id) + 1

					var totalAgents = 0, totalAgentsWithViaf = 0, totalAgentsNotFoundInRegistry = 0
					var cursor = mmsContainers.find({}, { 'agents' : 1, 'subjects' : 1 })
					
					cursor.on('data', function(container) {

						totalAgents++

						cursor.pause()

						process.stdout.cursorTo(0)
						process.stdout.write(clc.black.bgGreenBright("populateMmsAgentsContainers | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))

						//build all the agents we want to look up
						var agents = []

						container.agents.map(function(a){
							agents.push(a.namePart)
						})
						
						container.subjects.map(function(a){
							if (a.type === 'name') agents.push(a.text)
						})

						async.eachSeries(agents, function(agent, eachCallback) {

							//check viaf for the authorized term
							viafLookup.find({ normalized : utils.normalizeAndDiacritics(agent) }).toArray(function(err, viafAry) {
								//console.log(utils.normalizeAndDiacritics(checkName), viafAry)
								if (viafAry.length>0){

									totalAgentsWithViaf++

									//grab their info and check if they are in agents
									agentsCollection.find({ viaf : viafAry[0]._id }).toArray(function(err, agentsAry) {

										if (agentsAry.length>0){

											//they are in agents don't need to do anything

											eachCallback()

										}else{

											totalAgentsNotFoundInRegistry++
											//they are not in agents, add them
											var newAgent = {
												_id: agentId++,
												nameControlled : viafAry[0].prefLabel,
												nameLocal : agent,
												viaf: viafAry[0]._id,
												nameNormalized : [utils.normalizeAndDiacritics(viafAry[0].prefLabel)]
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
									
									//they are not in VIAF, see if they are in agents already
									agentsCollection.find({ nameNormalized : utils.normalizeAndDiacritics(agent) }).toArray(function(err, agentsAry) {

										if (agentsAry.length>0){
											
											//no problem already in agents
											if (agentsAry[0].viaf) totalAgentsWithViaf++
											eachCallback()

										}else{

											//not in agents, need to add it

											totalAgentsNotFoundInRegistry++
											var newAgent = {
												_id: agentId++,
												nameControlled : agent,
												nameLocal : agent,
												viaf: false,
												nameNormalized : [utils.normalizeAndDiacritics(agent)]
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
								


							})				


						}, function(err){
							if (err) console.log(err)
							//done
							cursor.resume()

						})




					})

					cursor.once('end', function() {
							
						setTimeout(function(){
							console.log("populateMmsAgentsContainers - Done!\n")
							process.stdout.cursorTo(0)
							process.stdout.write(clc.black.bgGreenBright("populateMmsAgentsContainers | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))

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


exports.populateMmsAgentsItems = function(cb){

	db.returnCollection("mmsItems",function(err,mmsItems,mmsDatabase){

		db.returnCollection("agents",function(err,agentsCollection,agentsDatabase){

			db.returnCollection("viafLookup",function(err,viafLookup,viafDatabase){

				//we need to find the last ID we are going to use
				agentsCollection.find({}).sort({ _id: -1}).limit(1).toArray(function(err, agentIdAry) {

					var agentId = parseInt(agentIdAry[0]._id) + 1

					var totalAgents = 0, totalAgentsWithViaf = 0, totalAgentsNotFoundInRegistry = 0
					var cursor = mmsItems.find({}, { 'agents' : 1, 'subjects' : 1 })
					
					cursor.on('data', function(item) {

						totalAgents++

						cursor.pause()

						process.stdout.cursorTo(0)
						process.stdout.write(clc.black.bgWhiteBright("populateMmsAgentsItems | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))

						//build all the agents we want to look up
						var agents = []

						item.agents.map(function(a){
							agents.push(a.namePart)
						})
						
						item.subjects.map(function(a){
							if (a.type === 'name') agents.push(a.text)
						})

						async.eachSeries(agents, function(agent, eachCallback) {

							if (agent){

								//check viaf for the authorized term
								viafLookup.find({ normalized : utils.normalizeAndDiacritics(agent) }).toArray(function(err, viafAry) {
									//console.log(utils.normalizeAndDiacritics(checkName), viafAry)
									if (viafAry.length>0){

										totalAgentsWithViaf++

										//grab their info and check if they are in agents
										agentsCollection.find({ viaf : viafAry[0]._id }).toArray(function(err, agentsAry) {

											if (agentsAry.length>0){

												//they are in agents don't need to do anything

												eachCallback()

											}else{

												totalAgentsNotFoundInRegistry++
												//they are not in agents, add them
												var newAgent = {
													_id: agentId++,
													nameControlled : viafAry[0].prefLabel,
													nameLocal : agent,
													viaf: viafAry[0]._id,
													nameNormalized : [utils.normalizeAndDiacritics(viafAry[0].prefLabel)]
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
										
										//they are not in VIAF, see if they are in agents already
										agentsCollection.find({ nameNormalized : utils.normalizeAndDiacritics(agent) }).toArray(function(err, agentsAry) {

											if (agentsAry.length>0){
												
												//no problem already in agents
												if (agentsAry[0].viaf) totalAgentsWithViaf++
												eachCallback()

											}else{

												//not in agents, need to add it

												totalAgentsNotFoundInRegistry++
												var newAgent = {
													_id: agentId++,
													nameControlled : agent,
													nameLocal : agent,
													viaf: false,
													nameNormalized : [utils.normalizeAndDiacritics(agent)]
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
									


								})
							}else{
								eachCallback()
							}		


						}, function(err){
							if (err) console.log(err)
							//done
							cursor.resume()

						})




					})

					cursor.once('end', function() {
							
						setTimeout(function(){
							console.log("populateMmsAgentsItems - Done!\n")
							process.stdout.cursorTo(0)
							process.stdout.write(clc.black.bgWhiteBright("populateMmsAgentsItems | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))

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

exports.populateArchivesAgentsCollctions = function(cb){

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


exports.populateShadowcatTerms = function(cb){

	var counter = 0, mintedTerms = 0, mintedLocalTerms = 0

	db.prepareTerms(function(){

		console.log(">>>>>Terms")

		db.returnCollectionShadowcat("bib",function(err,shadowcatBib,shadowcatDatabase){

			db.returnCollection("terms",function(err,terms,termsDatabase){

				var termId = 100000000

				var cursor = shadowcatBib.find({}, { 'sc:terms' : 1, 'sc:research' : 1 })
				
				cursor.on('data', function(doc) {

					if (doc['sc:research']){

						counter++

						process.stdout.cursorTo(0)
						process.stdout.write(clc.black.bgYellowBright("populateShadowcatTermsFast: " + counter + " | mintedFastTerms: " + mintedTerms + " mintedLocalTerms: " + mintedLocalTerms))

						cursor.pause()

						async.eachSeries(doc['sc:terms'], function(term, eachCallback) {

							var aTerm = JSON.parse(JSON.stringify(term))

							if (aTerm.fast){

								//we have the a name to maybe seralize look it up if it is already in the database
								terms.find({ fast : aTerm.fast}).toArray(function(err, termsAry) {

									if (termsAry.length>0){

										//there is a match
										//var matchedAgent = termsAry[0]
										//if it already has a controle name

										//console.log("BEGORE",matchedAgent)										
										
										eachCallback()

									}else{

										//there is no match, we need to make it
										mintedTerms++

										var newTerm = {
											_id: termId++,
											nameControlled : (aTerm.nameFast) ? aTerm.nameFast : aTerm.nameLocal,
											fast: aTerm.fast,
											type: aTerm.type,
											nameNormalized : []
										}


										var normal = utils.singularize(utils.normalizeAndDiacritics(newTerm.nameControlled))

										newTerm.nameNormalized.push(normal)

										terms.update({ _id : newTerm._id }, { $set: newTerm }, { upsert : true}, function(err, result) {
											if (err) console.log(err)
											eachCallback()
										})						

									}									

								})

							}else{


								//check if this local normalized one is in there yet
								var normal = utils.singularize(utils.normalizeAndDiacritics(aTerm.nameLocal))

								//we have the a name to maybe seralize look it up if it is already in the database
								terms.find({ nameNormalized : normal}).toArray(function(err, termsAry) {

									if (termsAry.length>0){

										
										eachCallback()

									}else{

										//there is no match, we need to make it
										mintedLocalTerms++

										var newTerm = {
											_id: termId++,
											nameControlled : aTerm.nameLocal,
											fast: false,
											type: aTerm.type,
											nameNormalized : [normal]
										}										

										terms.update({ _id : newTerm._id }, { $set: newTerm }, { upsert : true}, function(err, result) {
											if (err) console.log(err)
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


						
						
					}else{

						cursor.resume()

					}


				});



				cursor.once('end', function() {
						
					setTimeout(function(){
						console.log("populateShadowcatTerms - Done!")
						cb(++termId)
						shadowcatDatabase.close()
						termsDatabase.close()

					},5000)

				})


			})

		})

	})


}




exports.populateMmsTermsCollections = function(cb){

	db.returnCollection("mmsCollections",function(err,mmsCollections,mmsDatabase){

		db.returnCollection("terms",function(err,termsCollection,agentsDatabase){

			db.returnCollection("fastLookup",function(err,fastLookup,viafDatabase){

				//we need to find the last ID we are going to use
				termsCollection.find({}).sort({ _id: -1}).limit(1).toArray(function(err, termsIdAry) {

					var termId = parseInt(termsIdAry[0]._id) + 1

					var totalTerms = 0, totalTermsWithFast = 0, totalTermsNotFoundInRegistry = 0
					var cursor = mmsCollections.find({}, { 'subjects' : 1 })
					var types={}

					cursor.on('data', function(collection) {

						totalTerms++

						cursor.pause()

						process.stdout.cursorTo(0)
						process.stdout.write(clc.black.bgYellowBright("populateMmsTermsCollections | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))

						if (collection.typeOfResource){
							collection.typeOfResource.map(function(tor){
								collection.subjects.push(
							        {
							            "authority": false,
							            "nameType": 'genre',
							            "text": tor,
							            "type": "genre",
							            "valueURI": false
							        }
								)
							})
						}


						async.eachSeries(collection.subjects, function(term, eachCallback) {


							if (term.type != 'genre' && term.type != 'topical' && term.type != 'geographic' && term.type != 'temporal' && term.type != 'titleInfo' ){
								eachCallback()
								return false
							}

							if (!types[term.type]) types[term.type] = 0
							types[term.type]++


							//we can look it up by lcsh
							if (term.valueURI){

								fastLookup.find({ sameAsLc : term.valueURI }).toArray(function(err, fastAry) {

									if (fastAry.length>0){

										totalTermsWithFast++

										//see if that FAST ID is in our terms
										termsCollection.find({ fast : fastAry[0]._id }).toArray(function(err, termsAry) {

											if (termsAry.length>0){

												//it is in there, do nothing
												eachCallback()


											}else{

												//it is not in the terms table, we need to add it
												var newTerm = { 
													_id : termId++, 
													nameControled : fastAry[0].prefLabel, 
													fast : 1210274, 
													type : fastAry[0].type, 
													nameNormalized : fastAry[0].normalized
												}

												termsCollection.update({ _id : newTerm._id }, { $set: newTerm }, { upsert : true}, function(err, result) {
													if (err) console.log(err)
													eachCallback()
													return true
												})
											}
										})

										

									}else{




										if (term.text){


												var allTerms = term.text.split("--")

												var type = mmsTermsLookup[term.type]
												if (!type) type = "terms:Topical"

												async.eachSeries(allTerms, function(subTerm, eachSubCallback) {


													//there was no FAST hit for that LCSH uri, check to see if it is in the agents normalized, if not add it
													termsCollection.find({ nameNormalized : utils.singularize(utils.normalizeAndDiacritics(subTerm)) }).toArray(function(err, termsAry) {

														if (termsAry.length>0){

															//it is in the terms data already don't need to do anything
															if (termsAry[0].fast) totalTermsWithFast++
															eachSubCallback()


														}else{

															//need to add it in
															totalTermsNotFoundInRegistry++

															var newTerm = { 
																_id : termId++, 
																nameControled : subTerm, 
																fast : false, 
																type : type, 
																nameNormalized : [utils.singularize(utils.normalizeAndDiacritics(subTerm))]
															}

															termsCollection.update({ _id : newTerm._id }, { $set: newTerm }, { upsert : true}, function(err, result) {
																if (err) console.log(err)
																eachSubCallback()
																return true
															})

														}
													})

												}, function(err){
													if (err) console.log(err)
													//done
													eachCallback()
												})

										}else{
											eachCallback()
											return true
										}


									}

								})



							}else{



								if (term.text){

										var allTerms = term.text.split("--")

										var type = mmsTermsLookup[term.type]
										if (!type) type = "terms:Topical"

										async.eachSeries(allTerms, function(subTerm, eachSubCallback) {


											//there was no FAST hit for that LCSH uri, check to see if it is in the agents normalized, if not add it
											termsCollection.find({ nameNormalized : utils.singularize(utils.normalizeAndDiacritics(subTerm)) }).toArray(function(err, termsAry) {

												if (termsAry.length>0){

													//it is in the terms data already don't need to do anything
													if (termsAry[0].fast) totalTermsWithFast++
													eachSubCallback()


												}else{

													//need to add it in
													totalTermsNotFoundInRegistry++

													var newTerm = { 
														_id : termId++, 
														nameControled : subTerm, 
														fast : false, 
														type : type, 
														nameNormalized : [utils.singularize(utils.normalizeAndDiacritics(subTerm))]
													}

													termsCollection.update({ _id : newTerm._id }, { $set: newTerm }, { upsert : true}, function(err, result) {
														if (err) console.log(err)
														eachSubCallback()
														return true
													})

												}
											})

										}, function(err){
											if (err) console.log(err)
											//done
											eachCallback()
										})

								}else{
									eachCallback()
									return true
								}



							}
				

						}, function(err){
							if (err) console.log(err)
							//done
							cursor.resume()

						})




					})

					cursor.once('end', function() {
							
						setTimeout(function(){
							console.log("populateMmsTermsCollections - Done!\n")
							process.stdout.cursorTo(0)
							process.stdout.write(clc.black.bgYellowBright("populateMmsTermsCollections | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))

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




exports.populateMmsTermsContainers = function(cb){

	db.returnCollection("mmsContainers",function(err,mmsContainers,mmsDatabase){

		db.returnCollection("terms",function(err,termsCollection,agentsDatabase){

			db.returnCollection("fastLookup",function(err,fastLookup,viafDatabase){

				//we need to find the last ID we are going to use
				termsCollection.find({}).sort({ _id: -1}).limit(1).toArray(function(err, termsIdAry) {

					var termId = parseInt(termsIdAry[0]._id) + 1

					var totalTerms = 0, totalTermsWithFast = 0, totalTermsNotFoundInRegistry = 0
					var cursor = mmsContainers.find({}, { 'subjects' : 1 })
					var types={}

					cursor.on('data', function(container) {

						totalTerms++

						cursor.pause()

						process.stdout.cursorTo(0)
						process.stdout.write(clc.black.bgGreenBright("populateMmsTermsContainers | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))

						if (container.typeOfResource){
							container.typeOfResource.map(function(tor){
								container.subjects.push(
							        {
							            "authority": false,
							            "nameType": 'genre',
							            "text": tor,
							            "type": "genre",
							            "valueURI": false
							        }
								)
							})
						}


						async.eachSeries(container.subjects, function(term, eachCallback) {


							if (term.type != 'genre' && term.type != 'topical' && term.type != 'geographic' && term.type != 'temporal' && term.type != 'titleInfo' ){
								eachCallback()
								return false
							}

							if (!types[term.type]) types[term.type] = 0
							types[term.type]++


							//we can look it up by lcsh
							if (term.valueURI){

								fastLookup.find({ sameAsLc : term.valueURI }).toArray(function(err, fastAry) {

									if (fastAry.length>0){

										totalTermsWithFast++

										//see if that FAST ID is in our terms
										termsCollection.find({ fast : fastAry[0]._id }).toArray(function(err, termsAry) {

											if (termsAry.length>0){

												//it is in there, do nothing
												eachCallback()


											}else{

												//it is not in the terms table, we need to add it
												var newTerm = { 
													_id : termId++, 
													nameControled : fastAry[0].prefLabel, 
													fast : 1210274, 
													type : fastAry[0].type, 
													nameNormalized : fastAry[0].normalized
												}

												termsCollection.update({ _id : newTerm._id }, { $set: newTerm }, { upsert : true}, function(err, result) {
													if (err) console.log(err)
													eachCallback()
													return true
												})
											}
										})

										

									}else{




										if (term.text){


												var allTerms = term.text.split("--")

												var type = mmsTermsLookup[term.type]
												if (!type) type = "terms:Topical"

												async.eachSeries(allTerms, function(subTerm, eachSubCallback) {


													//there was no FAST hit for that LCSH uri, check to see if it is in the agents normalized, if not add it
													termsCollection.find({ nameNormalized : utils.singularize(utils.normalizeAndDiacritics(subTerm)) }).toArray(function(err, termsAry) {

														if (termsAry.length>0){

															//it is in the terms data already don't need to do anything
															if (termsAry[0].fast) totalTermsWithFast++
															eachSubCallback()


														}else{

															//need to add it in
															totalTermsNotFoundInRegistry++

															var newTerm = { 
																_id : termId++, 
																nameControled : subTerm, 
																fast : false, 
																type : type, 
																nameNormalized : [utils.singularize(utils.normalizeAndDiacritics(subTerm))]
															}

															termsCollection.update({ _id : newTerm._id }, { $set: newTerm }, { upsert : true}, function(err, result) {
																if (err) console.log(err)
																eachSubCallback()
																return true
															})

														}
													})

												}, function(err){
													if (err) console.log(err)
													//done
													eachCallback()
												})

										}else{
											eachCallback()
											return true
										}


									}

								})



							}else{




								if (term.text){

										var allTerms = term.text.split("--")

										var type = mmsTermsLookup[term.type]
										if (!type) type = "terms:Topical"

										async.eachSeries(allTerms, function(subTerm, eachSubCallback) {


											//there was no FAST hit for that LCSH uri, check to see if it is in the agents normalized, if not add it
											termsCollection.find({ nameNormalized : utils.singularize(utils.normalizeAndDiacritics(subTerm)) }).toArray(function(err, termsAry) {

												if (termsAry.length>0){

													//it is in the terms data already don't need to do anything
													if (termsAry[0].fast) totalTermsWithFast++
													eachSubCallback()


												}else{

													//need to add it in
													totalTermsNotFoundInRegistry++

													var newTerm = { 
														_id : termId++, 
														nameControled : subTerm, 
														fast : false, 
														type : type, 
														nameNormalized : [utils.singularize(utils.normalizeAndDiacritics(subTerm))]
													}

													termsCollection.update({ _id : newTerm._id }, { $set: newTerm }, { upsert : true}, function(err, result) {
														if (err) console.log(err)
														eachSubCallback()
														return true
													})

												}
											})

										}, function(err){
											if (err) console.log(err)
											//done
											eachCallback()
										})

								}else{
									eachCallback()
									return true
								}


							}
				

						}, function(err){
							if (err) console.log(err)
							//done
							cursor.resume()

						})




					})

					cursor.once('end', function() {
							
						setTimeout(function(){
							console.log("populateMmsTermsCollections - Done!\n")
							process.stdout.cursorTo(0)
							process.stdout.write(clc.black.bgGreenBright("populateMmsTermsContainers | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))

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



exports.populateMmsTermsItems = function(cb){

	db.returnCollection("mmsItems",function(err,mmsItems,mmsDatabase){

		db.returnCollection("terms",function(err,termsCollection,agentsDatabase){

			db.returnCollection("fastLookup",function(err,fastLookup,viafDatabase){

				//we need to find the last ID we are going to use
				termsCollection.find({}).sort({ _id: -1}).limit(1).toArray(function(err, termsIdAry) {

					var termId = parseInt(termsIdAry[0]._id) + 1

					var totalTerms = 0, totalTermsWithFast = 0, totalTermsNotFoundInRegistry = 0
					var cursor = mmsItems.find({}, { 'subjects' : 1 })
					var types={}

					cursor.on('data', function(item) {

						totalTerms++

						cursor.pause()

						process.stdout.cursorTo(0)
						process.stdout.write(clc.black.bgWhiteBright("populateMmsTermsItems | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))

						if (item.typeOfResource){

							item.typeOfResource.map(function(tor){
								item.subjects.push(
							        {
							            "authority": false,
							            "nameType": 'genre',
							            "text": tor,
							            "type": "genre",
							            "valueURI": false
							        }
								)
							})
						}

						async.eachSeries(item.subjects, function(term, eachCallback) {


							if (term.type != 'genre' && term.type != 'topical' && term.type != 'geographic' && term.type != 'temporal' && term.type != 'titleInfo' ){
								eachCallback()
								return false
							}

							if (!types[term.type]) types[term.type] = 0
							types[term.type]++


							//we can look it up by lcsh
							if (term.valueURI){

								fastLookup.find({ sameAsLc : term.valueURI }).toArray(function(err, fastAry) {

									if (fastAry.length>0){

										totalTermsWithFast++

										//see if that FAST ID is in our terms
										termsCollection.find({ fast : fastAry[0]._id }).toArray(function(err, termsAry) {

											if (termsAry.length>0){

												//it is in there, do nothing
												eachCallback()


											}else{

												//it is not in the terms table, we need to add it
												var newTerm = { 
													_id : termId++, 
													nameControled : fastAry[0].prefLabel, 
													fast : 1210274, 
													type : fastAry[0].type, 
													nameNormalized : fastAry[0].normalized
												}

												termsCollection.update({ _id : newTerm._id }, { $set: newTerm }, { upsert : true}, function(err, result) {
													if (err) console.log(err)
													eachCallback()
													return true
												})
											}
										})

										

									}else{




										if (term.text){

												var allTerms = term.text.split("--")

												var type = mmsTermsLookup[term.type]
												if (!type) type = "terms:Topical"

												async.eachSeries(allTerms, function(subTerm, eachSubCallback) {


													//there was no FAST hit for that LCSH uri, check to see if it is in the agents normalized, if not add it
													termsCollection.find({ nameNormalized : utils.singularize(utils.normalizeAndDiacritics(subTerm)) }).toArray(function(err, termsAry) {

														if (termsAry.length>0){

															//it is in the terms data already don't need to do anything
															if (termsAry[0].fast) totalTermsWithFast++
															eachSubCallback()


														}else{

															//need to add it in
															totalTermsNotFoundInRegistry++

															var newTerm = { 
																_id : termId++, 
																nameControled : subTerm, 
																fast : false, 
																type : type, 
																nameNormalized : [utils.singularize(utils.normalizeAndDiacritics(subTerm))]
															}

															termsCollection.update({ _id : newTerm._id }, { $set: newTerm }, { upsert : true}, function(err, result) {
																if (err) console.log(err)
																eachSubCallback()
																return true
															})

														}
													})

												}, function(err){
													if (err) console.log(err)
													//done
													eachCallback()
												})

										}else{
											eachCallback()
											return true
										}


									}

								})



							}else{

								//no LCSH, just try to look it up

								if (term.text){

										var allTerms = term.text.split("--")

										var type = mmsTermsLookup[term.type]
										if (!type) type = "terms:Topical"

										async.eachSeries(allTerms, function(subTerm, eachSubCallback) {


											//there was no FAST hit for that LCSH uri, check to see if it is in the agents normalized, if not add it
											termsCollection.find({ nameNormalized : utils.singularize(utils.normalizeAndDiacritics(subTerm)) }).toArray(function(err, termsAry) {

												if (termsAry.length>0){

													//it is in the terms data already don't need to do anything
													if (termsAry[0].fast) totalTermsWithFast++
													eachSubCallback()


												}else{

													//need to add it in
													totalTermsNotFoundInRegistry++

													var newTerm = { 
														_id : termId++, 
														nameControled : subTerm, 
														fast : false, 
														type : type, 
														nameNormalized : [utils.singularize(utils.normalizeAndDiacritics(subTerm))]
													}

													termsCollection.update({ _id : newTerm._id }, { $set: newTerm }, { upsert : true}, function(err, result) {
														if (err) console.log(err)
														eachSubCallback()
														return true
													})

												}
											})

										}, function(err){
											if (err) console.log(err)
											//done
											eachCallback()
										})

								}else{
									eachCallback()
									return true
								}

							}
				

						}, function(err){
							if (err) console.log(err)
							//done
							cursor.resume()

						})




					})

					cursor.once('end', function() {
							
						setTimeout(function(){
							console.log("populateMmsTermsItems - Done!\n")
							process.stdout.cursorTo(0)
							process.stdout.write(clc.black.bgGreenBright("populateMmsTermsItems | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))

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




exports.populateArchivesTermsCollections = function(cb){

	db.returnCollection("archivesCollections",function(err,archivesCollections,mmsDatabase){

		db.returnCollection("terms",function(err,termsCollection,agentsDatabase){

			db.returnCollection("fastLookup",function(err,fastLookup,viafDatabase){

				//we need to find the last ID we are going to use
				termsCollection.find({}).sort({ _id: -1}).limit(1).toArray(function(err, termsIdAry) {

					var termId = parseInt(termsIdAry[0]._id) + 1

					var totalTerms = 0, totalTermsWithFast = 0, totalTermsNotFoundInRegistry = 0
					var cursor = archivesCollections.find({}, { 'subjects' : 1 })
					var types={}

					cursor.on('data', function(collection) {

						totalTerms++

						cursor.pause()

						process.stdout.cursorTo(0)
						process.stdout.write(clc.black.bgYellowBright("populateArchivesTermsCollections | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))



						async.eachSeries(collection.subjects, function(term, eachCallback) {

		
							if (!types[term.type]) types[term.type] = 0
							types[term.type]++

							if (term.text){


									var allTerms = term.text.split("--")

									var type = archivesTermLookup[term.type]
									if (!type) type = "terms:Topical"

									async.eachSeries(allTerms, function(subTerm, eachSubCallback) {

										subTerm= subTerm.trim()

										//there was no FAST hit for that LCSH uri, check to see if it is in the agents normalized, if not add it
										termsCollection.find({ nameNormalized : utils.singularize(utils.normalizeAndDiacritics(subTerm)) }).toArray(function(err, termsAry) {

											if (termsAry.length>0){

												//it is in the terms data already don't need to do anything
												if (termsAry[0].fast) totalTermsWithFast++

																eachSubCallback()


											}else{

												//need to add it in
												totalTermsNotFoundInRegistry++

												var newTerm = { 
													_id : termId++, 
													nameControled : subTerm, 
													fast : false, 
													type : type, 
													nameNormalized : [utils.singularize(utils.normalizeAndDiacritics(subTerm))]
												}


												termsCollection.update({ _id : newTerm._id }, { $set: newTerm }, { upsert : true}, function(err, result) {
													if (err) console.log(err)
													eachSubCallback()
													return true
												})

											}
										})

									}, function(err){
										if (err) console.log(err)
										//done
										eachCallback()
									})

							}else{
								eachCallback()
								return true
							}

		

						}, function(err){
							if (err) console.log(err)
							//done
							cursor.resume()

						})




					})

					cursor.once('end', function() {
							
						setTimeout(function(){
							console.log("populateMmsTermsCollections - Done!\n")
							process.stdout.cursorTo(0)
							process.stdout.write(clc.black.bgYellowBright("populateArchivesTermsCollections | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))

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


exports.populateArchivesTermsComponents = function(cb){

	db.returnCollection("archivesComponents",function(err,archivesComponents,mmsDatabase){

		db.returnCollection("terms",function(err,termsCollection,agentsDatabase){

			db.returnCollection("fastLookup",function(err,fastLookup,viafDatabase){

				//we need to find the last ID we are going to use
				termsCollection.find({}).sort({ _id: -1}).limit(1).toArray(function(err, termsIdAry) {

					var termId = parseInt(termsIdAry[0]._id) + 1

					var totalTerms = 0, totalTermsWithFast = 0, totalTermsNotFoundInRegistry = 0
					var cursor = archivesComponents.find({}, { 'subjects' : 1 })
					var types={}

					cursor.on('data', function(component) {

						

						cursor.pause()

						process.stdout.cursorTo(0)
						process.stdout.write(clc.black.bgGreenBright("populateArchivesTermsComponents | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))


						async.eachSeries(component.subjects, function(term, eachCallback) {

		
							if (!types[term.type]) types[term.type] = 0
							types[term.type]++

							if (term.text){

									totalTerms++


									var allTerms = term.text.split("--")

									var type = archivesTermLookup[term.type]
									if (!type) type = "terms:Topical"

									async.eachSeries(allTerms, function(subTerm, eachSubCallback) {

										subTerm= subTerm.trim()

										//there was no FAST hit for that LCSH uri, check to see if it is in the agents normalized, if not add it
										termsCollection.find({ nameNormalized : utils.singularize(utils.normalizeAndDiacritics(subTerm)) }).toArray(function(err, termsAry) {

											if (termsAry.length>0){

												//it is in the terms data already don't need to do anything
												if (termsAry[0].fast) totalTermsWithFast++
												eachSubCallback()


											}else{

												//need to add it in
												totalTermsNotFoundInRegistry++

												var newTerm = { 
													_id : termId++, 
													nameControled : subTerm, 
													fast : false, 
													type : type, 
													nameNormalized : [utils.singularize(utils.normalizeAndDiacritics(subTerm))]
												}


												termsCollection.update({ _id : newTerm._id }, { $set: newTerm }, { upsert : true}, function(err, result) {
													if (err) console.log(err)
													eachSubCallback()
													return true
												})

											}
										})

									}, function(err){
										if (err) console.log(err)
										//done
										eachCallback()
									})

							}else{

								eachCallback()
								return true
							}

		

						}, function(err){
							if (err) console.log(err)
							//done
							cursor.resume()

						})




					})

					cursor.once('end', function() {
							
						setTimeout(function(){
							console.log("populateArchivesTermsComponents - Done!\n")
							process.stdout.cursorTo(0)
							process.stdout.write(clc.black.bgGreenBright("populateArchivesTermsComponents | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))

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




//


































//some helper function to facilitate serilization

var markSerialized = function(databaseSerialized,id,cb){
	databaseSerialized.insert({ _id : id  }, function(err, record){
		if (cb) cb()
	})
}




var dereferenceAgent = function(agentsCollection, viaf, name, recordId, cb){


	if (viaf){

		//grab their info and check if they are in agents
		agentsCollection.find({ viaf : viaf }).toArray(function(err, agentsAry) {

			if (agentsAry.length>0){
				if (!agentsAry[0].useCount) agentsAry[0].useCount = 0
				agentsAry[0].useCount++
				agentsCollection.update({ _id: agentsAry[0]._id }, { $set : { useCount : agentsAry[0].useCount  } })
				cb(agentsAry[0])
			}else{
				errorLib.error("No Agent found for this record! ", JSON.stringify({ foundIn: recordId, viaf: viaf, name: name }))
				cb(false)
			}
		})	

	}else{

		if (!name){
			errorLib.error("No Agent found for this record! ", JSON.stringify({ foundIn: recordId, viaf: viaf, name: name }))
			cb(false)
			return false
		}

		agentsCollection.find({ nameNormalized : utils.normalizeAndDiacritics(name) }).toArray(function(err, agentsAry) {
			if (agentsAry.length>0){


				//if there are more than one try to find the very best match
				var bestScore = -100, bestMatch = false
				for (var x in agentsAry){
					var score = agentsAry[x].nameControlled.score(name,0.5)
					if (score > bestScore){
						bestScore = score
						bestMatch = agentsAry[x]
					}
				}

				//if (bestScore<0.02) console.log(name, " ---> ", bestMatch.nameControlled,bestScore)

				//we want to flip the switch on the agent to say it has been used 
				if (!bestMatch.useCount) bestMatch.useCount = 0
				bestMatch.useCount++
				agentsCollection.update({ _id: bestMatch._id }, { $set : { useCount : bestMatch.useCount  } })
				cb(bestMatch)
			}else{
				errorLib.error("No Agent found for this record! ", JSON.stringify({ foundIn: recordId, viaf: viaf, name: name }))
				cb(false)
			}
		})	



	}


	

}


var dereferenceTerm = function(termsCollection, fast, term, recordId, cb){


	if (fast){

		//grab their info and check if they are in agents
		termsCollection.find({ fast : fast }).toArray(function(err, termsAry) {

			if (termsAry.length>0){
				if (!termsAry[0].useCount) termsAry[0].useCount = 0
				termsAry[0].useCount++
				termsCollection.update({ _id: termsAry[0]._id }, { $set : { useCount : termsAry[0].useCount  } })
				cb(termsAry[0])
			}else{
				errorLib.error("No Term found for this record! ", JSON.stringify({ foundIn: recordId, fast: fast, term: term }))
				cb(false)
			}
		})	

	}else{

		if (!term){
			errorLib.error("No Term found for this record! ", JSON.stringify({ foundIn: recordId, fast: fast, term: term }))
			cb(false)
			return false
		}

		termsCollection.find({ nameNormalized :  utils.singularize(utils.normalizeAndDiacritics(term))  }).toArray(function(err, termsAry) {
			if (termsAry.length>0){

				//if there are more than one try to find the very best match
				var bestScore = -100, bestMatch = false
				for (var x in termsAry){
					var score = termsAry[x].nameControled.score(term,0.5)
					if (score > bestScore){
						bestScore = score
						bestMatch = termsAry[x]
					}
				}

				if (bestScore<0.02) console.log(term, " ---> ", bestMatch.nameControlled,bestScore)

				//we want to flip the switch on the agent to say it has been used 
				if (!bestMatch.useCount) bestMatch.useCount = 0
				bestMatch.useCount++
				termsCollection.update({ _id: bestMatch._id }, { $set : { useCount : bestMatch.useCount  } })

				cb(bestMatch)
			}else{
				errorLib.error("No Term found for this record! ", JSON.stringify({ foundIn: recordId, fast: fast, term: term }))
				cb(false)
			}
		})	



	}


	

}


var dereferenceMmsItem = function(agentsCollection, termsCollection, databaseSerialized, mmsCaptures,  mmsItem, cb){

	var registryAgents = [], registryTerms = [], captures = []

	async.parallel({

		processAgents: function(callback){

			//build a simple ary of agents with possible viaf

			var agentsToCheck = []
			mmsItem.agents.map(function(a){
				agentsToCheck.push( { name: a.namePart, viaf: false, role: false, subject: false })
			})
			

			//send each one off to be dererfernced							
			async.eachSeries(agentsToCheck, function(agent, eachCallback) {
				dereferenceAgent(agentsCollection, agent.viaf, agent.name, "mmsItem:"+mmsItem.mmsDb,function(registryAgent){
					if (registryAgent){
						registryAgent.subject = agent.subject
						registryAgents.push(registryAgent)
					}
					eachCallback()
				})										

			}, function(err){
				if (err) console.log(err)		
				callback()
			})				
		},

		processSubjects: function(callback){


			var termsToCheck = []

			//split up our complex headings
			var archiveTerms = []
			mmsItem.subjects.map(function(t){
				t.text.split("--").map(function(s){
					archiveTerms.push(s.trim())
				})
			})


			if (mmsItem.typeOfResource){
				mmsItem.typeOfResource.map(function(tor){
					archiveTerms.push(tor.trim())					
				})
			}


			archiveTerms.map(function(a){
				termsToCheck.push( { term: a, fast: false })
			})

			//send each one off to be dererfernced							
			async.eachSeries(termsToCheck, function(term, eachCallback) {
				dereferenceTerm(termsCollection, term.fast, term.term, "mmsItem:"+mmsItem.mmsDb,function(registryTerm){
					if (registryTerm){
						registryTerms.push(registryTerm)
					}
					eachCallback()
				})										

			}, function(err){
				if (err) console.log(err)				
				
				//all the agents have been ran though and sorted out
				registryTerms.map(function(a){
					if (addedSubjects.indexOf(a._id) == -1){
						addedSubjects.push(a._id)
					}
				})
				callback()
			})
		},


		//mark this, the bnumber if there is one and the MMS collection as being serialized
		markAsSerialized: function(callback){
			markSerialized(databaseSerialized, "mmsItem" +mmsItem.mmsDb,function(){
				callback()
			})
		},


		//mark this, the bnumber if there is one and the MMS collection as being serialized
		buildCaptures: function(callback){


			//is it public domain is it in DC?
			var publicDomain = false, inDc = false

			if (mmsItem.publicDomain) publicDomain = true
			mmsItem.rights.map(function(r){
				if (r=='Can be used on NYPL website') inDc = true
			})


			mmsCaptures.find({ itemMmsDb : parseInt(mmsItem.mmsDb)}).toArray(function(err,captureAry){
				

				captureAry.map(function(c){

					captures.push({
						'nypl:dcflag' : inDc,
						'nypl:publicDomain' : publicDomain,
						'uuid' : c._id,
						mmsDb: c.itemMmsDb,
						imageId:  c.imageId
					})


				})


				callback()

			})



		}


	},
	function(err, results) {


		cb({
			registryAgents: registryAgents,
			registryTerms: registryTerms,
			captures: captures


		})

	})


}






//Serialize Archives

exports.serializeArchives = function(cb){


	var noteMap = {
		"bioghist" : "Biographical/historical information",
		"scopecontent" : "Scope and content",
		"custodhist" : "Custodial history",
		"acqinfo" : "Acquisition information",
		"relatedmaterial" : "Related material"
	}

	var removeHtml = function(hmtl){
		return sanitizeHtml(hmtl, { allowedTags: [], allowedAttributes: [] })
	}


	db.returnCollectionShadowcat("bib",function(err,shadowcatBib,shadowcatDatabase){

		db.returnDb(function(err,databaseConnection){
			if (err) console.log(err)
			var resourceId = 100000000


			var databaseAgents = databaseConnection.collection("agents")
			var databaseTerms = databaseConnection.collection("terms")
			var databaseSerialized = databaseConnection.collection("serialized")
			var databaseArchivesCollections = databaseConnection.collection("archivesCollections")
			var databaseArchivesComponents = databaseConnection.collection("archivesComponents")
			var databaseMmsItems = databaseConnection.collection("mmsItems")
			var databaseMmsCaptures = databaseConnection.collection("mmsCaptures")


			//loop through all the archives collections
			var cursor = databaseArchivesCollections.find({})

			cursor.on('data', function(collection) {



				// if (collection.mssDb != 1509){

				// 	return false
				// }



				cursor.pause()

				var bNumber = -9999999999

				if (collection.bNumber){
					try{
						bNumber = parseInt(utils.normalizeBnumber(collection.bNumber).replace("b",''))
					}catch (e) {
						bNumber = -9999999999
					}
					if (isNaN(bNumber)) bNumber = -9999999999
				}



				shadowcatBib.find({ _id : bNumber}).toArray(function(err, bibs) {


					//a dummy bib
					var bib = { agents : [], terms : [] }

					if (bibs[0]){

						bib.agents = bibs[0]['sc:agents']
						bib.terms = bibs[0]['sc:terms']

					}



					var triples = []

					//Collection Level Data
					//bump the regsitery id
					resourceId++			

					//this is the collection level URI
					var collectionUri = "res:" + resourceId
					var collectionRegistryId = resourceId


					//this is collection level prov
					var collectionProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10001", recordIdentifier: collection.mss  }
					if (collection.matchedMms){
						var collectionMmsProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: collection.mmsUuid  }
					}


					//LOD stuff
					triples.push({  subject: collectionUri,  predicate: "rdf:type", objectUri: "nypl:Collection", objectLiteral :  null,  literalDataType: null, prov: collectionProv  })

					


					var title = collection.title
					triples.push({  subject: collectionUri,  predicate: "dcterms:title", objectUri: null, objectLiteral :  title,  literalDataType: null, prov: collectionProv  })

					//No alt-title


					//Notes
					collection.notes.map(function(note){
						if (noteMap[note.type]){
							var noteText = removeHtml(note.text)
							noteText = noteMap[note.type] + ":\n" + noteText
							triples.push({  subject: collectionUri,  predicate: "skos:note", objectUri: null, objectLiteral :  note,  literalDataType: null, prov: collectionProv  })
						}
					})


					var abstractText = ""
					collection.abstracts.map(function(abstract){
						abstractText = abstractText + " " + abstract
					})

					abstractText = abstractText.trim()

					if (abstractText != ""){
						triples.push({  subject: collectionUri,  predicate: "dcterms:description", objectUri: null, objectLiteral :  abstractText,  literalDataType: null, prov: collectionProv  })
					}

					//Identifiers
					if (collection.mss){
						//this is the collection level mss ID
						triples.push({  subject: collectionUri,  predicate: "dcterms:identifier", objectUri: "urn:msscoll:" + collection.mss, objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
					}
					if (collection.bNumber){
						triples.push({  subject: collectionUri,  predicate: "dcterms:identifier", objectUri: "urn:bnum:" + collection.bNumber, objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
					}
					if (collection.callNumber){
						triples.push({  subject: collectionUri,  predicate: "dcterms:identifier", objectUri: "urn:callnum:" + collection.callNumber.replace(/\s/g,''), objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
					}
					if (collection.matchedMms){
						triples.push({  subject: collectionUri,  predicate: "dcterms:identifier", objectUri: "urn:uuid:" + collection.mmsUuid, objectLiteral :  null,  literalDataType: null, prov: collectionMmsProv  })
					}

					//Material type
					triples.push({  subject: collectionUri,  predicate: "dcterms:type", objectUri: "resourcetypes:col", objectLiteral :  null,  literalDataType: null, prov: collectionProv  })


					//there doesn't appear to be any Langauge at the collection level TODO/FIX


					//Dates
					collection.dates.map(function(d){
						if (d.point=='start'){
							triples.push({  subject: collectionUri,  predicate: "db:dateStart", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: collectionProv  })
						}
						if (d.point=='end'){
							triples.push({  subject: collectionUri,  predicate: "db:dateEnd", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: collectionProv  })
						}
						if (d.point=='exact'){
							triples.push({  subject: collectionUri,  predicate: "dcterms:created", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: collectionProv  })
						}
					})

					//Location Owners
					if (locationLookupMms[collection.divisions.toUpperCase()]){
						triples.push({  subject: collectionUri,  predicate: "nypl:owner", objectUri: "orgs:"+locationLookupMms[collection.divisions.toUpperCase()], objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
					}else{
						triples.push({  subject: collectionUri,  predicate: "nypl:owner", objectUri: "orgs:"+1000, objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
					}





					//Collection level agents and subjects
					async.parallel({

						processAgents: function(callback){

							//build a simple ary of agents with possible viaf

							var agentsToCheck = []

							if (bib.agents.length > collection.agents.length){
								//use the catalog agents, it is just as good and maybe a little more structured
								bib.agents.map(function(a){
									var useName = a.nameLocal
									if (a.nameLc) useName = a.nameLc
									if (!useName && a.nameViaf)  useName = a.nameViaf
									agentsToCheck.push( { name: useName, viaf: (a.viaf) ? a.viaf : false, role: false, subject : (!a.contributor) ? true : false })								
								})
							}else{
								collection.agents.map(function(a){
									var viaf=false
									if (a.valueURI){
										if (a.valueURI.search("viaf.org")>-1){
											viaf = parseInt(a.valueURI.split('/viaf/')[1])
											if (isNaN(viaf)) viaf = false
										}
									}
									agentsToCheck.push( { name: a.namePart, viaf: viaf, role: false, subject: false })
								})
							}


							//dcterms:contributor
							var registryAgents = []

							//send each one off to be dererfernced							
							async.eachSeries(agentsToCheck, function(agent, eachCallback) {


								dereferenceAgent(databaseAgents, agent.viaf, agent.name, "archivesCollectionMSS:"+collection.mss,function(registryAgent){

									if (registryAgent){

										registryAgent.subject = agent.subject
										registryAgents.push(registryAgent)

									}



									eachCallback()

								})



								

							}, function(err){
								if (err) console.log(err)								
								var addedContriubtors = [], addedSubjects = []
								//all the agents have been ran though and sorted out
								registryAgents.map(function(a){
									if (a.subject){
										if (addedSubjects.indexOf(a._id) == -1){
											triples.push({  subject: collectionUri,  predicate: "dcterms:subject", objectUri: "agents:"+a._id, objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
											addedSubjects.push(a._id)
										}
									}else{
										if (addedContriubtors.indexOf(a._id) == -1){
											triples.push({  subject: collectionUri,  predicate: "dcterms:contributor", objectUri: "agents:"+a._id, objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
											addedContriubtors.push(a._id)
										}
									}
								})
								callback()
							})				
						},




						processSubjects: function(callback){


							var termsToCheck = []

							//split up our complex headings
							var archiveTerms = []
							collection.subjects.map(function(t){
								t.text.split("--").map(function(s){
									archiveTerms.push(s.trim())
								})
							})

							if (bib.terms.length >= archiveTerms.length){
								//use the catalog terms, it is just as good and maybe a little more structured
								bib.terms.map(function(a){
									var useTerm = false
									if (a.nameLocal) useTerm = a.nameLocal
									if (a.nameFast) useTerm = a.nameFast

									termsToCheck.push( { term: useTerm, fast: (a.fast) ? a.fast : false })								
								})
							}else{
								archiveTerms.map(function(a){
									termsToCheck.push( { term: a, fast: false })
								})
							}



							var registryTerms = []
							//send each one off to be dererfernced							
							async.eachSeries(termsToCheck, function(term, eachCallback) {


								dereferenceTerm(databaseTerms, term.fast, term.term, "archivesCollectionMSS:"+collection.mss,function(registryTerm){

									if (registryTerm){
										registryTerms.push(registryTerm)
									}

									eachCallback()

								})



								

							}, function(err){
								if (err) console.log(err)				
								var addedSubjects = []
								//all the agents have been ran though and sorted out
								registryTerms.map(function(a){
									if (addedSubjects.indexOf(a._id) == -1){
										triples.push({  subject: collectionUri,  predicate: "dcterms:subject", objectUri: "terms:"+a._id, objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
										addedSubjects.push(a._id)
									}				

								})
								callback()
							})	

						},


						//mark this, the bnumber if there is one and the MMS collection as being serialized
						markAsSerialized: function(callback){
							markSerialized(databaseSerialized, "archivesCol" + collection.mss,function(){
								if (bNumber>0){
									markSerialized(databaseSerialized, "catalog" + bNumber)
								}

								if (collection.matchedMms){
									markSerialized(databaseSerialized, "mms" + collection.mmsUuid)
								}
								callback()
							})
						}


					},
					function(err, results) {
							
						console.log("Loading Collection Components:",collection.title)



						//next step is to gather all of the children
						var componentCursor = databaseArchivesComponents.find({ collectionDb : collection.mssDb }).sort( { orderSequence : 1})


						var parentLookup = {}
						var relationships = []


						parentLookup[collection.mssDb] = collectionUri


				
						componentCursor.on('data', function(component) {

							componentCursor.pause()

							resourceId++			

							//this is the collection level URI
							var componentUri = "res:" + resourceId

							if (!component.parentDb){
								component.parentDb = component.collectionDb
							}

							parentLookup[component.mssDb] = componentUri

							//this is component level prov
							var componentProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10001", recordIdentifier: component.mss  }
							

							//shity error, fix later TODO FIXME
							if (component.matchedMms){
								if (!component.mmsUuid && component.archivesCollectionDb) component.mmsUuid = component.archivesCollectionDb
							}



							//LOD stuff
							triples.push({  subject: componentUri,  predicate: "rdf:type", objectUri: "nypl:Component", objectLiteral :  null,  literalDataType: null, prov: componentProv  })
							triples.push({  subject: componentUri,  predicate: "dcterms:identifier", objectUri: "urn:superparent:" + collectionRegistryId, objectLiteral :  null,  literalDataType: null, prov: componentProv  })


							relationships.push(
								JSON.parse(JSON.stringify(
								{
									s: component.parentDb,
									p: 'pcdm:hasMember',
									o: component.mssDb,
									g: componentProv
								}))
							)

							relationships.push(
								JSON.parse(JSON.stringify(
								{
									s: component.mssDb,
									p: 'pcdm:memberOf',
									o: component.parentDb,
									g: componentProv
								}))
							)


							//Component level agents and subjects
							var addedContriubtors = [], addedSubjects = [], addedDates = []


							//build all the same data as what was in the colelction level

							var title = (component.title) ? component.title : component.dateStatement
							title = removeHtml(title)

							triples.push({  subject: componentUri,  predicate: "dcterms:title", objectUri: null, objectLiteral :  title,  literalDataType: null, prov: componentProv  })

							//No alt-title


							//Notes
							component.notes.map(function(note){
								if (noteMap[note.type]){
									var noteText = removeHtml(note.text)
									noteText = noteMap[note.type] + ":\n" + noteText
									triples.push({  subject: componentUri,  predicate: "skos:note", objectUri: null, objectLiteral :  note,  literalDataType: null, prov: componentProv  })
								}
							})


							var abstractText = ""
							component.abstracts.map(function(abstract){
								abstractText = abstractText + " " + abstract
							})

							abstractText = abstractText.trim()

							if (abstractText != ""){
								triples.push({  subject: componentUri,  predicate: "dcterms:description", objectUri: null, objectLiteral :  abstractText,  literalDataType: null, prov: componentProv  })
							}

							//Identifiers
							if (component.mss){
								//this is the component level mss ID
								triples.push({  subject: componentUri,  predicate: "dcterms:identifier", objectUri: "urn:msscoll:" + component.mss, objectLiteral :  null,  literalDataType: null, prov: componentProv  })
							}

							// if (component.matchedMms){
							// 	triples.push({  subject: componentUri,  predicate: "dcterms:identifier", objectUri: "urn:uuid:" + component.mmsUuid, objectLiteral :  null,  literalDataType: null, prov: collectionMmsProv  })
							// }

							//Material type
							triples.push({  subject: componentUri,  predicate: "dcterms:type", objectUri: "resourcetypes:col", objectLiteral :  null,  literalDataType: null, prov: componentProv  })


							//there doesn't appear to be any Langauge at the collection level TODO/FIX


							//Dates
							component.dates.map(function(d){
								if (d.point=='start'){
									addedDates.push(d.value)
									triples.push({  subject: componentUri,  predicate: "db:dateStart", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: componentProv  })
								}
								if (d.point=='end'){
									addedDates.push(d.value)
									triples.push({  subject: componentUri,  predicate: "db:dateEnd", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: componentProv  })
								}
								if (d.point=='exact'){
									addedDates.push(d.value)
									triples.push({  subject: componentUri,  predicate: "dcterms:created", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: componentProv  })
								}
							})

							//Location Owners
							if (!component.divisions) component.divisions = collection.divisions
							if (locationLookupMms[component.divisions.toUpperCase()]){
								triples.push({  subject: componentUri,  predicate: "nypl:owner", objectUri: "orgs:"+locationLookupMms[component.divisions.toUpperCase()], objectLiteral :  null,  literalDataType: null, prov: componentProv  })
							}else{
								triples.push({  subject: componentUri,  predicate: "nypl:owner", objectUri: "orgs:"+1000, objectLiteral :  null,  literalDataType: null, prov: componentProv  })
							}

							


							async.parallel({

								processAgents: function(callback){

									//build a simple ary of agents with possible viaf

									var agentsToCheck = []

									component.agents.map(function(a){
										var viaf=false
										if (a.valueURI){
											if (a.valueURI.search("viaf.org")>-1){
												viaf = parseInt(a.valueURI.split('/viaf/')[1])
												if (isNaN(viaf)) viaf = false
											}
										}
										agentsToCheck.push( { name: a.namePart, viaf: viaf, role: false, subject: false })
									})
				

									//dcterms:contributor
									var registryAgents = []

									//send each one off to be dererfernced							
									async.eachSeries(agentsToCheck, function(agent, eachCallback) {
										dereferenceAgent(databaseAgents, agent.viaf, agent.name, "archivesComponentMSS:"+component.mss,function(registryAgent){
											if (registryAgent){
												registryAgent.subject = agent.subject
												registryAgents.push(registryAgent)
											}
											eachCallback()
										})										

									}, function(err){
										if (err) console.log(err)							
										
										//all the agents have been ran though and sorted out
										registryAgents.map(function(a){
											if (a.subject){
												if (addedSubjects.indexOf(a._id) == -1){
													triples.push({  subject: componentUri,  predicate: "dcterms:subject", objectUri: "agents:"+a._id, objectLiteral :  null,  literalDataType: null, prov: componentProv  })
													addedSubjects.push(a._id)
												}
											}else{
												if (addedContriubtors.indexOf(a._id) == -1){
													triples.push({  subject: componentUri,  predicate: "dcterms:contributor", objectUri: "agents:"+a._id, objectLiteral :  null,  literalDataType: null, prov: componentProv  })
													addedContriubtors.push(a._id)
												}
											}
										})
										callback()
									})				
								},




								processSubjects: function(callback){


									var termsToCheck = []

									//split up our complex headings
									var archiveTerms = []
									component.subjects.map(function(t){
										t.text.split("--").map(function(s){
											archiveTerms.push(s.trim())
										})
									})


									archiveTerms.map(function(a){
										termsToCheck.push( { term: a, fast: false })
									})


									var registryTerms = []
									//send each one off to be dererfernced							
									async.eachSeries(termsToCheck, function(term, eachCallback) {
										dereferenceTerm(databaseTerms, term.fast, term.term, "archivesComponentMSS:"+component.mss,function(registryTerm){
											if (registryTerm){
												registryTerms.push(registryTerm)
											}
											eachCallback()
										})										

									}, function(err){
										if (err) console.log(err)				
										
										//all the agents have been ran though and sorted out
										registryTerms.map(function(a){
											if (addedSubjects.indexOf(a._id) == -1){
												triples.push({  subject: componentUri,  predicate: "dcterms:subject", objectUri: "terms:"+a._id, objectLiteral :  null,  literalDataType: null, prov: componentProv  })
												addedSubjects.push(a._id)
											}		

										})
										callback()
									})	

								},


								//mark this, the bnumber if there is one and the MMS collection as being serialized
								markAsSerialized: function(callback){
									markSerialized(databaseSerialized, "archivesCom" + component.mss,function(){
										callback()
									})
								},


								//mark this, the bnumber if there is one and the MMS collection as being serialized
								buildCaptures: function(callback){
									markSerialized(databaseSerialized, "archivesCom" + component.mss,function(){
										callback()
									})
								}


							},
							function(err, results) {



								if (component.matchedMms){

									//it matched something

									if (component.matchedMmsType == 'containerMerge'){



										//this means it needs to merg all the child components 

										//console.log(component)
										componentCursor.resume()

									}else{

										//grab the data from this item
										//databaseMmsItems
										//console.log(component)
										databaseMmsItems.find({ $or : [ { archivesComponentDb: component.mssDb }, { _id: component.mmsUuid}] }).toArray(function(err, mssItem){

											if (mssItem.length==1){

												//if there is only one we need to gather the agent/terms for them and compare to the archives component
												//we need to compare agents/terms/dates/genre to merge the two records to gether

												console.log("checking: ",component.mss, component.mssDb)
												console.log(component.title, component.matchedMmsType, component.mmsUuid, mssItem.length)

												dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,mssItem[0],function(defResults){

													//console.log(defResults)


													//TODO FIX Dates from items comparision

													console.log(defResults.registryAgents)
													console.log(addedContriubtors)






												})
												//process all the agents and stuff and grab the capture info



												//var dereferenceMmsItem = function(agentsCollection, termsCollection, mmsItem, cb){














											}else{





											}
											

											componentCursor.resume()

										})


									}


								}else{

									componentCursor.resume()

								}




							})















						})



						componentCursor.once('end', function() {


							//build the relationships

							//triples.push({  subject: collectionUri,  predicate: "pcdm:hasMember", objectUri: componentUri, objectLiteral :  null,  literalDataType: null, prov: componentProv  })
							//triples.push({  subject: collectionUri,  predicate: "pcdm:memberOf", objectUri: componentUri, objectLiteral :  null,  literalDataType: null, prov: componentProv  })
							relationships.map(function(r){
								if (!parentLookup[r.s] || !parentLookup[r.o]){
									console.log(component)
								}
							})









								
							setTimeout(function(){

								
								cursor.resume()

							},100)

						})










					})






					//Subjects
					// if (collection.matchedMms){
					// 	console.log(collection)
					// }





					//MMS_DB Id


					

				})




				



			})



			cursor.once('end', function() {
					
				setTimeout(function(){
					console.log("serializeArchives - Done!\n")
					cb(resourceId)
					databaseConnection.close()
					shadowcatDatabase.close()
				},5000)

			})




		})


	})

}













































