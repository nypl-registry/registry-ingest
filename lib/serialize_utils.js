"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js");
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")

exports.populateShadowcatAgentsViaf = function(cb){

	var counter = 0, mintedNames = 0, matchedNames = 0

	db.prepareAgents(function(){

		console.log(">>>>>")

		db.returnCollectionShadowcat("bib",function(err,shadowcatBib,shadowcatDatabase){

			db.returnCollection("agents",function(err,agents,agentsDatabase){

				var agentId = 100000000

				var cursor = shadowcatBib.find({}, { 'sc:agents' : 1, 'sc:research' : 1 })
				
				cursor.on('data', function(doc) {

					if (doc['sc:research']){

						counter++

						process.stdout.cursorTo(0)
						process.stdout.write(clc.black.bgYellowBright("populateShadowcatAgentsViaf: " + counter + " | mintedNames: " + mintedNames + " matchedNames: " + matchedNames))

						cursor.pause()

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
										//if it already has a controle name

										//console.log("BEGORE",matchedAgent)
										matchedNames++



										if (matchedAgent.nameControled){
											//is this new one better than the current one?
											if (aAgent.nameLocal) if (matchedAgent.nameControled.length < aAgent.nameViaf.length) matchedAgent.nameControled = aAgent.nameLocal
											//if (aAgent.nameViaf) if (matchedAgent.nameControled.length < aAgent.nameViaf.length) matchedAgent.nameControled = aAgent.nameViaf
											if (aAgent.nameLc) if (matchedAgent.nameControled.length < aAgent.nameLc.length) matchedAgent.nameControled = aAgent.nameLc
										}else{
											//not yet set, so start off with the local name and hopefully it gets better
											if (aAgent.nameLocal) matchedAgent.nameControled = aAgent.nameLocal
											if (aAgent.nameViaf) matchedAgent.nameControled = aAgent.nameViaf
											if (aAgent.nameLc) matchedAgent.nameControled = aAgent.nameLc
										}

										//the viaf stays the same

										//check if all the normalized version are in there
										if (aAgent.nameLocal){
											var normal = utils.normalizeAndDiacritics(aAgent.nameLocal)
											if (matchedAgent.nameNormalized.indexOf(normal) == -1) matchedAgent.nameNormalized.push(normal)
										}
										if (aAgent.nameViaf){
											var normal = utils.normalizeAndDiacritics(aAgent.nameViaf)
											if (matchedAgent.nameNormalized.indexOf(normal) == -1) matchedAgent.nameNormalized.push(normal)
										}
										if (aAgent.nameLc){
											var normal = utils.normalizeAndDiacritics(aAgent.nameLc)
											if (matchedAgent.nameNormalized.indexOf(normal) == -1) matchedAgent.nameNormalized.push(normal)
										}
										
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
											nameControled : false,
											viaf: aAgent.viaf,
											nameNormalized : []
										}

										if (aAgent.nameLocal) newAgent.nameControled = aAgent.nameLocal
										if (aAgent.nameViaf) newAgent.nameControled = aAgent.nameViaf
										if (aAgent.nameLc) newAgent.nameControled = aAgent.nameLc



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
						   	//done
							cursor.resume()

						})


						
						
					}else{

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

		db.returnCollection("agents",function(err,agents,agentsDatabase){

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
											nameControled : aAgent.nameLocal,
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
											foundSomething = { nameTms : checkName, nameAgents: agentsAry[0].nameControled, viaf: agentsAry[0].viaf }
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
										nameControled : useName,
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
										nameControled : useName,
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

	db.returnCollection("mmsCollections",function(err,mmsCollections,tmsDatabase){

		db.returnCollection("agents",function(err,agentsCollection,agentsDatabase){

			db.returnCollection("viafLookup",function(err,viafLookup,viafDatabase){

				//we need to find the last ID we are going to use
				agentsCollection.find({}).sort({ _id: -1}).limit(1).toArray(function(err, agentIdAry) {

					var agentId = parseInt(agentIdAry[0]._id) + 1

					var totalAgents = 0, totalAgentsWithoutViaf = 0, matchedAgentToViaf = 0, matchedAgentToRegistry = 0, tmsMint= 0
					var cursor = mmsCollections.find({}, { 'agents' : 1, 'subjects' : 1 })
					
					cursor.on('data', function(collection) {

						totalAgents++

						cursor.pause()

						//process.stdout.cursorTo(0)
						//process.stdout.write(clc.black.bgYellowBright(" totalAgents: " + totalAgents + " totalAgentsWithoutViaf:" + totalAgentsWithoutViaf + " matchedAgentToViaf: " + matchedAgentToViaf + " matchedAgentToRegistry: " + matchedAgentToRegistry + " tmsMint:" + tmsMint ))

						//build all the agents we want to look up
						var agents = []

						collection.agents.map(function(a){
							agents.push(a.namePart)
						})
						
						collection.subjects.map(function(a){
							if (a.type === 'name') agents.push(a.text)
						})



						async.eachSeries(agents, function(agent, eachCallback) {

							var aAgent = JSON.parse(JSON.stringify(agent))



							//check viaf for the authorized term
							viafLookup.find({ normalized : utils.normalizeAndDiacritics(agent) }).toArray(function(err, viafAry) {
								//console.log(utils.normalizeAndDiacritics(checkName), viafAry)
								if (viafAry.length>0){


									//grab their info and check if they are in agents
									agentsCollection.find({ viaf : viafAry[0]._id }).toArray(function(err, agentsAry) {

										if (agentsAry.length>0){


										}else{

											//they are not in agents

											console.log(aAgent, viafAry[0]._id)

										}



									})



									

								}else{

									//console.log(agent, " !!!--> ", utils.normalizeAndDiacritics(agent))

								}
								eachCallback()


							})



							





						}, function(err){
							if (err) console.log(err)
							//done
							cursor.resume()

						})




						// 	if (!aAgent.viaf){

						// 		totalAgentsWithoutViaf++

						// 		if (aAgent.dateStart) aAgent.dateStart = (!isNaN(parseInt(aAgent.dateStart))) ? parseInt(aAgent.dateStart) : false
						// 		if (aAgent.dateEnd) aAgent.dateEnd = (!isNaN(parseInt(aAgent.dateEnd))) ? parseInt(aAgent.dateEnd) : false

						// 		if (aAgent.dateStart===0) aAgent.dateStart = false
						// 		if (aAgent.dateEnd===0 || aAgent.dateStart + 100 === aAgent.dateEnd) aAgent.dateEnd = false


						// 		var checkNames = []

						// 		if (aAgent.dateStart && aAgent.dateEnd){
						// 			if (aAgent.nameAlpha.trim() != ""){
						// 				checkNames.push(aAgent.nameAlpha.trim() + ', ' + aAgent.dateStart  + "-" + aAgent.dateEnd)
						// 			}
						// 		}
						// 		if (aAgent.dateStart){
						// 			if (aAgent.nameAlpha.trim() != ""){									
						// 				checkNames.push(aAgent.nameAlpha.trim() + ', ' + aAgent.dateStart  + "-")
						// 			}
						// 		}

						// 		if (aAgent.nameAlpha.trim() != ""){	
						// 			if (checkNames.indexOf(aAgent.nameAlpha.trim())==-1)
						// 				checkNames.push(aAgent.nameAlpha.trim())
						// 		}

						// 		if (aAgent.nameDisplay.trim() != ""){	
						// 			if (checkNames.indexOf(aAgent.nameDisplay.trim())==-1)
						// 				checkNames.push(aAgent.nameDisplay.trim())
						// 		}




						// 		var foundSomething = false

						// 		async.eachSeries(checkNames, function(checkName, eachSubCallback) {


						// 			if (!foundSomething){
						// 				agents.find({ nameNormalized : utils.normalizeAndDiacritics(checkName) }).toArray(function(err, agentsAry) {
						// 					//console.log(utils.normalizeAndDiacritics(checkName), agentsAry)
						// 					if (agentsAry.length>0){
						// 						foundSomething = { nameTms : checkName, nameAgents: agentsAry[0].nameControled, viaf: agentsAry[0].viaf }
						// 					}
						// 					eachSubCallback()
						// 				})
						// 			}else{
						// 				eachSubCallback()
						// 			}
									

						// 		}, function(err){
						// 		   	if (err) console.log(err)

						// 		   	if (foundSomething){

						// 		   		if (foundSomething.viaf){
						// 		   			matchedAgentToViaf++
						// 		   		}else{
						// 		   			matchedAgentToRegistry++
						// 		   		}

						// 		   		//we don't need to do anything here since the name matched something.
						// 		   		eachCallback()


						// 		   	}else{
						// 		   		tmsMint++

						// 		   		//we need to make a new registry agent


						// 		   		var useName = (aAgent.nameAlpha.trim() != "") ? aAgent.nameAlpha.trim() : aAgent.nameDisplay.trim()

						// 				var newAgent = {
						// 					_id: agentId++,
						// 					nameControled : useName,
						// 					viaf: false,
						// 					nameNormalized : [utils.normalizeAndDiacritics(useName)]
						// 				}

										

						// 				//insert the new agent
						// 				// agents.update({ _id : newAgent._id }, { $set: newAgent }, { upsert : true}, function(err, result) {
						// 				// 	if (err) console.log(err)

						// 				// 	eachCallback()


						// 				// })


						// 				eachCallback()



						// 		   	}

						// 		   	//done
									
						// 		})



								
								
								
						// 	}else{



						// 		//there was a VIAF, but make sure it exists inside the registry already
						// 		//it likely won't because it is from ULAN

						// 		agents.find({ viaf : aAgent.viaf }).toArray(function(err, agentsAry) {
						// 			//console.log(utils.normalizeAndDiacritics(checkName), agentsAry)
						// 			if (agentsAry.length==0){

						// 				console.log("MINTIMINT")
						// 				console.log(aAgent)
						// 		   		var useName = (aAgent.nameAlpha.trim() != "") ? aAgent.nameAlpha.trim() : aAgent.nameDisplay.trim()

						// 				var newAgent = {
						// 					_id: agentId++,
						// 					nameControled : useName,
						// 					viaf: aAgent.viaf,
						// 					nameNormalized : [utils.normalizeAndDiacritics(useName)]
						// 				}

						// 				console.log(newAgent)

						// 				//insert the new agent
						// 				// agents.update({ _id : newAgent._id }, { $set: newAgent }, { upsert : true}, function(err, result) {
						// 				// 	if (err) console.log(err)

						// 				// 	eachCallback()


						// 				// })







						// 			}	
						// 			eachCallback()							
						// 		})



								
						// 	}			




						// }, function(err){
						//    	if (err) console.log(err)
						//    	//done
						// 	cursor.resume()

						// })




					})

					cursor.once('end', function() {
							
						setTimeout(function(){
							console.log("populateMmsAgentsCollections - Done!\n")
							process.stdout.cursorTo(0)
							process.stdout.write(clc.black.bgYellowBright(" totalAgents: " + totalAgents + " totalAgentsWithoutViaf:" + totalAgentsWithoutViaf + " matchedAgentToViaf: " + matchedAgentToViaf + " matchedAgentToRegistry: " + matchedAgentToRegistry + " tmsMint:" + tmsMint   ))

							cb()
							tmsDatabase.close()
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
											nameControled : (aTerm.nameFast) ? aTerm.nameFast : aTerm.nameLocal,
											fast: aTerm.fast,
											type: aTerm.type,
											nameNormalized : []
										}


										var normal = utils.singularize(utils.normalizeAndDiacritics(newTerm.nameControled))

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
											nameControled : aTerm.nameLocal,
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






















