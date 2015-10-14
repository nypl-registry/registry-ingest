"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js");
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")

exports.populateShadowcatAgentsViaf = function(cb){

	var counter = 0

	db.prepareAgents(function(){

		db.returnCollectionShadowcat("bib",function(err,shadowcatBib,shadowcatDatabase){

			db.returnCollection("agents",function(err,agents,agentsDatabase){

				var agentId = 100000000

				var cursor = shadowcatBib.find({}, { 'sc:agents' : 1, 'sc:research' : 1 })
				
				cursor.on('data', function(doc) {

					if (doc['sc:research']){

						counter++

						process.stdout.cursorTo(0)
						process.stdout.write(clc.black.bgYellowBright("populateShadowcatAgentsViaf: " + counter))



						cursor.pause()

						async.eachSeries(doc['sc:agents'], function(agent, eachCallback) {

							if (agent.viaf){

								if (agent.nameLocal===null) agent.nameLocal = false
								if (agent.nameViaf===null) agent.nameViaf = false
								if (agent.nameLc===null) agent.nameLc = false

								//we have the a name to maybe seralize look it up if it is already in the database
								agents.find({ viaf : agent.viaf}).toArray(function(err, agentsAry) {

									if (agentsAry.length==1){

										//there is a match
										var matchedAgent = agentsAry[0]
										//if it already has a controle name

										//console.log("BEGORE",matchedAgent)



										if (matchedAgent.nameControled){
											//is this new one better than the current one?
											if (agent.nameLocal) if (matchedAgent.nameControled.length < agent.nameViaf.length) matchedAgent.nameControled = agent.nameLocal
											if (agent.nameViaf) if (matchedAgent.nameControled.length < agent.nameViaf.length) matchedAgent.nameControled = agent.nameViaf
											if (agent.nameLc) if (matchedAgent.nameControled.length < agent.nameLc.length) matchedAgent.nameControled = agent.nameLc
										}else{
											//not yet set, so start off with the local name and hopefully it gets better
											if (agent.nameLocal) matchedAgent.nameControled = agent.nameLocal
											if (agent.nameViaf) matchedAgent.nameControled = agent.nameViaf
											if (agent.nameLc) matchedAgent.nameControled = agent.nameLc
										}

										//the viaf stays the same

										//check if all the normalized version are in there
										if (agent.nameLocal){
											var normal = utils.normalizeAndDiacritics(agent.nameLocal)
											if (matchedAgent.nameNormalized.indexOf(normal) == -1) matchedAgent.nameNormalized.push(normal)
										}
										if (agent.nameViaf){
											var normal = utils.normalizeAndDiacritics(agent.nameViaf)
											if (matchedAgent.nameNormalized.indexOf(normal) == -1) matchedAgent.nameNormalized.push(normal)
										}
										if (agent.nameLc){
											var normal = utils.normalizeAndDiacritics(agent.nameLc)
											if (matchedAgent.nameNormalized.indexOf(normal) == -1) matchedAgent.nameNormalized.push(normal)
										}
										
										//console.log("AFTER",matchedAgent)

										agents.update({ _id : matchedAgent._id }, { $set: matchedAgent }, { upsert : true}, function(err, result) {
											if (err) console.log(err)

											eachCallback()


										})



									}else{

										//there is no match, we need to make it

										var newAgent = {
											_id: agentId++,
											nameControled : false,
											viaf: agent.viaf,
											nameNormalized : []
										}

										if (agent.nameLocal) newAgent.nameControled = agent.nameLocal
										if (agent.nameViaf) newAgent.nameControled = agent.nameViaf
										if (agent.nameLc) newAgent.nameControled = agent.nameLc



										if (agent.nameLocal){
											var normal = utils.normalizeAndDiacritics(agent.nameLocal)
											if (newAgent.nameNormalized.indexOf(normal) == -1) newAgent.nameNormalized.push(normal)
										}
										if (agent.nameViaf){
											var normal = utils.normalizeAndDiacritics(agent.nameViaf)
											if (newAgent.nameNormalized.indexOf(normal) == -1) newAgent.nameNormalized.push(normal)
										}
										if (agent.nameLc){
											var normal = utils.normalizeAndDiacritics(agent.nameLc)
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

	db.prepareAgents(function(){

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

							if (!agent.viaf){

								totalNames++

								if (agent.nameLocal===null) agent.nameLocal = false
								if (agent.nameViaf===null) agent.nameViaf = false
								if (agent.nameLc===null) agent.nameLc = false

								if (agent.nameLocal){
									
									var normal = utils.normalizeAndDiacritics(agent.nameLocal)

									//we have the a name check if we have it in the agents already under a normalize matche
									agents.find({ nameNormalized : normal }).toArray(function(err, agentsAry) {

										if (agentsAry.length==1){

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
												nameControled : agent.nameLocal,
												viaf: false,
												nameNormalized : []
											}


											if (agent.nameLocal){
												var normal = utils.normalizeAndDiacritics(agent.nameLocal)
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

	})


}
