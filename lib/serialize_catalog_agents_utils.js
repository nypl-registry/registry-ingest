"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")
var sanitizeHtml = require('sanitize-html')
require("string_score")



//turns on a process to keep the agent queue populated from the database
exports.populateShadowcatAgentsBuildQueue = function(cb){

	exports.shadowCatAgentsQueue = []
	var queueTimer = null
	var resumeOn = false

	//db.prepareAgents(function(){

		console.log("Connecting to shadowcat...")

		db.returnCollectionShadowcat("bib",function(err,shadowcatBib){

			console.log("Starting Cursor...")

			// _id: 16547127
			var cursor = shadowcatBib.find({ }, { 'sc:agents' : 1, 'sc:research' : 1 })

			queueTimer = setInterval(function(){
				if (exports.shadowCatAgentsQueue.length<5000){
					if (!resumeOn){
						cursor.resume()
						resumeOn = true
					}					
				}else{
					if (resumeOn){
						cursor.pause()
						resumeOn = false
					}					
					//the first run?
					if (cb){
						cb()
						cb = null
					}
				}
			},500)


			cursor.on('data', function(doc) {
				if (doc['sc:research']){
					exports.shadowCatAgentsQueue.push({bnumber: doc._id, agents: doc['sc:agents']})
				}
			})

			cursor.once('end', function() {		
				setTimeout(function(){

					clearTimeout(queueTimer)
					exports.shadowCatAgentsQueue.push(null)

					//console.log("populateShadowcatAgentsViaf - Done!")
					//cb(++agentId)				
					//agentsDatabase.close()
				},5000)
			})



		})

	//})


}

//we creating an agent it needs to merge the source information (scAgent) with any VIAF data we have on had and a existing registry agent if it exists
exports.mergeScAgentViafRegistryAgent = function(scAgent, viaf, registryAgent){

	//if it has no registryAgent yet that means we are creating a new one
	if (scAgent && !registryAgent){

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

		//if it has a VIAF then we need to incorporate that info
		if (viaf){

			newAgent.viaf = viaf._id
			newAgent.viafAll = [viaf._id]

			//we have the VIAF data lets fill that in
			if (viaf.lcTerm){
				newAgent.nameControlled = viaf.lcTerm
			}else if (viaf.viafTerm){
				newAgent.nameControlled = viaf.viafTerm
			}else{
				newAgent.nameControlled = scAgent.nameLocal
			}

			if (viaf.type) newAgent.type = viaf.type.toLowerCase()

			if (viaf.wikidataId) newAgent.wikidata = viaf.wikidataId
			if (viaf.lcId) newAgent.lcId = viaf.lcId
			if (viaf.gettyId) newAgent.gettyId = parseInt(viaf.gettyId)
			if (viaf.dbpedia) newAgent.dbpedia = viaf.dbpedia
			if (viaf.birth) newAgent.birth = viaf.birth
			if (viaf.death) newAgent.death = viaf.death

			if (viaf.lcTerm){
				var normal = utils.normalizeAndDiacritics(viaf.lcTerm)
				if (newAgent.nameNormalized.indexOf(normal) == -1) newAgent.nameNormalized.push(normal)
			}
			if (viaf.viafTerm){
				var normal = utils.normalizeAndDiacritics(viaf.viafTerm)
				if (newAgent.nameNormalized.indexOf(normal) == -1) newAgent.nameNormalized.push(normal)
			}
			if (scAgent.nameLocal){
				var normal = utils.normalizeAndDiacritics(scAgent.nameLocal)
				if (newAgent.nameNormalized.indexOf(normal) == -1) newAgent.nameNormalized.push(normal)
			}

			return newAgent

		}else if (!viaf && scAgent.viaf){

			//this is a potential problem, there is a VIAF id, but we did not find it in our lookup table, record an error
			errorLib.error("Agent Serialization - Catalog - No VIAF found in lookup table", JSON.stringify(scAgent))

			//we have no VIAF info and no existing registry agent, populate the registry agent based on what we have from the scagent
			if (scAgent.nameLc){
				newAgent.nameControlled = scAgent.nameLc
			}else if (scAgent.nameViaf){
				newAgent.nameControlled = scAgent.nameViaf
			}else{
				newAgent.nameControlled = scAgent.nameLocal
			}

			if (scAgent.type) newAgent.type = scAgent.type.toLowerCase()
			//we do not trust the VIAF number
			//newAgent.viaf = scAgent.viaf

			if (scAgent.nameLc){
				var normal = utils.normalizeAndDiacritics(scAgent.nameLc)
				if (newAgent.nameNormalized.indexOf(normal) == -1) newAgent.nameNormalized.push(normal)
			}
			if (scAgent.nameViaf){
				var normal = utils.normalizeAndDiacritics(scAgent.nameViaf)
				if (newAgent.nameNormalized.indexOf(normal) == -1) newAgent.nameNormalized.push(normal)
			}
			if (scAgent.nameLocal){
				var normal = utils.normalizeAndDiacritics(scAgent.nameLocal)
				if (newAgent.nameNormalized.indexOf(normal) == -1) newAgent.nameNormalized.push(normal)
			}

			return newAgent

		}else{

			//there is no agent and also we don't have any VIAF info, so populate what we can

			if (scAgent.nameLc){
				newAgent.nameControlled = scAgent.nameLc
			}else if (scAgent.nameViaf){
				newAgent.nameControlled = scAgent.nameViaf
			}else{
				newAgent.nameControlled = scAgent.nameLocal
			}
			newAgent.type = scAgent.type.toLowerCase()

			if (scAgent.nameLc){
				var normal = utils.normalizeAndDiacritics(scAgent.nameLc)
				if (newAgent.nameNormalized.indexOf(normal) == -1) newAgent.nameNormalized.push(normal)
			}
			if (scAgent.nameViaf){
				var normal = utils.normalizeAndDiacritics(scAgent.nameViaf)
				if (newAgent.nameNormalized.indexOf(normal) == -1) newAgent.nameNormalized.push(normal)
			}
			if (scAgent.nameLocal){
				var normal = utils.normalizeAndDiacritics(scAgent.nameLocal)
				if (newAgent.nameNormalized.indexOf(normal) == -1) newAgent.nameNormalized.push(normal)
			}

			return newAgent


		}

	}else if (scAgent && registryAgent){


		//we have the registry agent if it already has a VIAF id then that means it was properly setup eariler so we just need to populate possibly new normalized values


		if (!registryAgent.viaf && viaf){

			//the existing registry agent does not have VIAF data yet, we can populate what we know
			if (viaf.type) registryAgent.type = viaf.type.toLowerCase()
			registryAgent.viaf = viaf._id

			newAgent.viafAll = [viaf._id]

			if (viaf.wikidataId) registryAgent.wikidata = viaf.wikidataId
			if (viaf.lcId) registryAgent.lcId = viaf.lcId
			if (viaf.gettyId) registryAgent.gettyId = parseInt(viaf.gettyId)
			if (viaf.dbpedia) registryAgent.dbpedia = viaf.dbpedia
			if (viaf.birth) registryAgent.birth = viaf.birth
			if (viaf.death) registryAgent.death = viaf.death

			if (viaf.lcTerm){
				var normal = utils.normalizeAndDiacritics(viaf.lcTerm)
				if (registryAgent.nameNormalized.indexOf(normal) == -1) registryAgent.nameNormalized.push(normal)
			}
			if (viaf.viafTerm){
				var normal = utils.normalizeAndDiacritics(viaf.viafTerm)
				if (registryAgent.nameNormalized.indexOf(normal) == -1) registryAgent.nameNormalized.push(normal)
			}
			if (scAgent.nameLocal){
				var normal = utils.normalizeAndDiacritics(scAgent.nameLocal)
				if (registryAgent.nameNormalized.indexOf(normal) == -1) registryAgent.nameNormalized.push(normal)
			}

			return registryAgent

		}else if (registryAgent.viaf){

			//it already has VIAF information just populate any new normalized names
			if (scAgent.nameLocal){
				var normal = utils.normalizeAndDiacritics(scAgent.nameLocal)
				if (registryAgent.nameNormalized.indexOf(normal) == -1) registryAgent.nameNormalized.push(normal)
			}

			return registryAgent

		}else if (!registryAgent.viaf && !viaf){

			//This is jsut a locally matched name, add in any new local normalized names
			//it already has VIAF information just populate any new normalized names
			if (scAgent.nameLocal){
				var normal = utils.normalizeAndDiacritics(scAgent.nameLocal)
				if (registryAgent.nameNormalized.indexOf(normal) == -1) registryAgent.nameNormalized.push(normal)
			}

			return registryAgent



		}


		
	}


	//if it got here we have problems
	errorLib.error("Agent Serialization - Catalog - Could not serialize this agent!", JSON.stringify({"scAgent" : scAgent, "viaf" : viaf, "registryAgent" : registryAgent }))

	return false

}


//cursors thorugh all the agents and assigns a new 
exports.numeriate = function(){








}



// exports.populateShadowcatAgentsViaf = function(cb){

// 	var counter = 0, mintedNames = 0, matchedNames = 0

// 	db.prepareAgents(function(){


// 		console.log("DONE")

// 		return false

// 		db.returnCollectionShadowcat("bib",function(err,shadowcatBib,shadowcatDatabase){

// 			db.returnCollection("agents",function(err,agents,agentsDatabase){

// 				var agentId = 100000000

// 				var cursor = shadowcatBib.find({}, { 'sc:agents' : 1, 'sc:research' : 1 })
				
// 				cursor.on('data', function(doc) {

// 					if (doc['sc:research']){

// 						counter++

// 						process.stdout.cursorTo(0)
// 						process.stdout.write(clc.black.bgYellowBright("populateShadowcatAgentsViaf: " + counter + " | mintedNames: " + mintedNames + " matchedNames: " + matchedNames))

// 						cursor.pause()

// 						var newAgentsWithRegistryIds = []

// 						async.eachSeries(doc['sc:agents'], function(agent, eachCallback) {

// 							var aAgent = JSON.parse(JSON.stringify(agent))

// 							if (aAgent.viaf){

// 								if (aAgent.nameLocal===null) aAgent.nameLocal = false
// 								if (aAgent.nameViaf===null) aAgent.nameViaf = false
// 								if (aAgent.nameLc===null) aAgent.nameLc = false

// 								//we have the a name to maybe seralize look it up if it is already in the database
// 								agents.find({ viaf : aAgent.viaf}).toArray(function(err, agentsAry) {

// 									if (agentsAry.length>0){

// 										//there is a match
// 										var matchedAgent = agentsAry[0]



// 										matchedNames++



// 										if (matchedAgent.nameControlled){
// 											//is this new one better than the current one?
// 											//if (aAgent.nameLocal) if (matchedAgent.nameControlled.length < aAgent.nameViaf.length) matchedAgent.nameControlled = aAgent.nameLocal
// 											//if (aAgent.nameViaf) if (matchedAgent.nameControlled.length < aAgent.nameViaf.length) matchedAgent.nameControlled = aAgent.nameViaf
// 											if (aAgent.nameLc) if (matchedAgent.nameControlled.length < aAgent.nameLc.length) matchedAgent.nameControlled = aAgent.nameLc
// 										}else{
// 											//not yet set, so start off with the local name and hopefully it gets better
// 											if (aAgent.nameLocal) matchedAgent.nameControlled = aAgent.nameLocal
// 											if (aAgent.nameViaf) matchedAgent.nameControlled = aAgent.nameViaf
// 											if (aAgent.nameLc) matchedAgent.nameControlled = aAgent.nameLc
// 										}

// 										//the viaf stays the same

// 										//check if all the normalized version are in there
// 										if (aAgent.nameLocal){
// 											var normal = utils.normalizeAndDiacritics(aAgent.nameLocal)
// 											if (matchedAgent.nameNormalized.indexOf(normal) == -1){

// 												//only add if the names are remotely similar
// 												if (aAgent.nameLocal.score(matchedAgent.nameControlled,0.5) > 0.25){
// 													matchedAgent.nameNormalized.push(normal)													
// 												}

// 											}
// 										}
// 										if (aAgent.nameViaf){
// 											var normal = utils.normalizeAndDiacritics(aAgent.nameViaf)
// 											if (matchedAgent.nameNormalized.indexOf(normal) == -1){
											
// 												if (aAgent.nameViaf.score(matchedAgent.nameControlled,0.5) > 0.25){
// 													matchedAgent.nameNormalized.push(normal)
// 												}
// 											}
// 										}
// 										if (aAgent.nameLc){
// 											var normal = utils.normalizeAndDiacritics(aAgent.nameLc)

// 											if (matchedAgent.nameNormalized.indexOf(normal) == -1){												
// 												if (aAgent.nameLc.score(matchedAgent.nameControlled,0.5) > 0.25){
// 													matchedAgent.nameNormalized.push(normal)
// 												}
// 											}
// 										}
// 										aAgent.registryId = matchedAgent._id

// 										//store the agent with new registry ID for updating shadowcat
// 										newAgentsWithRegistryIds.push(aAgent)


// 										//console.log("AFTER",matchedAgent)

// 										agents.update({ _id : matchedAgent._id }, { $set: matchedAgent }, { upsert : true}, function(err, result) {
// 											if (err) console.log(err)
// 											eachCallback()
// 										})



// 									}else{

// 										//there is no match, we need to make it
// 										mintedNames++

// 										var newAgent = {
// 											_id: agentId++,
// 											nameControlled : false,
// 											viaf: aAgent.viaf,
// 											source: "catalog" + doc._id,
// 											nameNormalized : []
// 										}

// 										if (aAgent.nameLocal) newAgent.nameControlled = aAgent.nameLocal
// 										if (aAgent.nameViaf) newAgent.nameControlled = aAgent.nameViaf
// 										if (aAgent.nameLc) newAgent.nameControlled = aAgent.nameLc



// 										if (aAgent.nameLocal){
// 											var normal = utils.normalizeAndDiacritics(aAgent.nameLocal)
// 											if (newAgent.nameNormalized.indexOf(normal) == -1) newAgent.nameNormalized.push(normal)
// 										}
// 										if (aAgent.nameViaf){
// 											var normal = utils.normalizeAndDiacritics(aAgent.nameViaf)
// 											if (newAgent.nameNormalized.indexOf(normal) == -1) newAgent.nameNormalized.push(normal)
// 										}
// 										if (aAgent.nameLc){
// 											var normal = utils.normalizeAndDiacritics(aAgent.nameLc)
// 											if (newAgent.nameNormalized.indexOf(normal) == -1) newAgent.nameNormalized.push(normal)
// 										}

// 										aAgent.registryId = agentId

// 										//store the agent with new registry ID for updating shadowcat
// 										newAgentsWithRegistryIds.push(aAgent)


// 										//insert the new agent
// 										agents.update({ _id : newAgent._id }, { $set: newAgent }, { upsert : true}, function(err, result) {
// 											if (err) console.log(err)
// 											eachCallback()
// 										})						

// 									}									

// 								})
// 							}else{
// 								eachCallback()
// 							}					


// 						}, function(err){
// 						   	if (err) console.log(err)


// 						   	// console.log(doc._id)
// 						   	// console.log(newAgentsWithRegistryIds)


// 						   	//done
// 							cursor.resume()

// 						})


						
						
// 					}else{

// 						//this is not a research item
// 						cursor.resume()

// 					}


// 				});



// 				cursor.once('end', function() {						
// 					setTimeout(function(){
// 						console.log("populateShadowcatAgentsViaf - Done!")
// 						cb(++agentId)
// 						shadowcatDatabase.close()
// 						agentsDatabase.close()
// 					},5000)
// 				})


// 			})

// 		})

// 	})


// }

// exports.populateShadowcatAgentsNonViaf = function(agentId,cb){

// 	var counter = 0
// 	var totalNames = 0, matchedNames = 0, mintedNames = 0


// 	db.returnCollectionShadowcat("bib",function(err,shadowcatBib,shadowcatDatabase){

// 		db.returnCollection("agents",function(err,agents,agentsDatabase){

// 			var cursor = shadowcatBib.find({}, { 'sc:agents' : 1, 'sc:research' : 1 })
			
// 			cursor.on('data', function(doc) {

// 				if (doc['sc:research']){

// 					counter++

// 					process.stdout.cursorTo(0)
// 					process.stdout.write(clc.black.bgYellowBright("" + counter + " | totalNames: " + totalNames + " matchedNames:" + matchedNames + " mintedNames: " + mintedNames ))

// 					cursor.pause()

// 					async.eachSeries(doc['sc:agents'], function(agent, eachCallback) {

// 						var aAgent = JSON.parse(JSON.stringify(agent))

// 						if (!aAgent.viaf){

// 							totalNames++

// 							if (aAgent.nameLocal===null) aAgent.nameLocal = false
// 							if (aAgent.nameViaf===null) aAgent.nameViaf = false
// 							if (aAgent.nameLc===null) aAgent.nameLc = false

// 							if (aAgent.nameLocal){
								
// 								var normal = utils.normalizeAndDiacritics(aAgent.nameLocal)

// 								//we have the a name check if we have it in the agents already under a normalize matche
// 								agents.find({ nameNormalized : normal }).toArray(function(err, agentsAry) {

// 									if (agentsAry.length>0){

// 										//there is a match
// 										var matchedAgent = agentsAry[0]
// 										//if it already has a controle name
										
// 										//there is a match, we don't need to do anything
// 										matchedNames++

// 										eachCallback()





// 									}else{

// 										mintedNames++


// 										//there is no match, we need to make it

// 										var newAgent = {
// 											_id: agentId++,
// 											nameControlled : aAgent.nameLocal,
// 											viaf: false,
// 											source: "catalog" + doc._id,
// 											nameNormalized : []
// 										}


// 										if (aAgent.nameLocal){
// 											var normal = utils.normalizeAndDiacritics(aAgent.nameLocal)
// 											if (newAgent.nameNormalized.indexOf(normal) == -1) newAgent.nameNormalized.push(normal)
// 										}

		


// 										//insert the new agent
// 										agents.update({ _id : newAgent._id }, { $set: newAgent }, { upsert : true}, function(err, result) {
// 											if (err) console.log(err)

// 											eachCallback()


// 										})

										


// 									}

									

// 								})



// 							}else{
// 								console.log("No local name for:",doc._id)
// 								eachCallback()	
// 							}
							
							
							
// 						}else{
// 							eachCallback()
// 						}					


// 					}, function(err){
// 					   	if (err) console.log(err)
// 					   	//done
// 						cursor.resume()

// 					})


					
					
// 				}else{

// 					cursor.resume()

// 				}


// 			});



// 			cursor.once('end', function() {
					
// 				setTimeout(function(){

// 					cb()
// 					shadowcatDatabase.close()
// 					agentsDatabase.close()

// 				},5000)

// 			})


// 		})

// 	})

// }
