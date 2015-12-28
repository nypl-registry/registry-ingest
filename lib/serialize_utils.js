"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")
var request = require('request')
require("string_score")


exports.returnMaxAgentId = function(cb){

	db.returnCollectionRegistry("agents",function(err,agents){
		agents.find({ }, {_id:1} ).sort({ _id: -1}).limit(1).toArray(function(err,records){
			if (records.length==0){
				if (cb) cb(100000000)
			//all temp ids
			}else if (isNaN(++records[0]._id)){
				if (cb) cb(100000000)
			}else{
				if (cb) cb(++records[0]._id)
			}
		})
	})
}

exports.deleteAgentByObjectId = function(ids, cb){

	var objects = []
	if (typeof ids === 'string'){
		objects.push(db.returnObjectId(ids))
	}else{
		ids.forEach(function(id){
			objects.push(db.returnObjectId(id))
		})
	}

	db.returnCollectionRegistry("agents",function(err,agents){

		agents.remove({ _id: { $in: objects  } },function(err,records){

			if (err) console.log(err)
			if (cb) cb()
			
		})
	})
}

exports.returnViafByName = function(name, cb){
	db.returnCollectionRegistry("viaf",function(err,viafCollection){
		viafCollection.find({ normalized: utils.normalizeAndDiacritics(name) }).toArray(function(err,records){
			if (records.length==0){
				 if (cb) cb(false)
			}else{
				if (cb) cb(records)
			}	
		})
	})
}

exports.returnViafByNameLcOnly = function(name, cb){
	db.returnCollectionRegistry("viaf",function(err,viafCollection){
		viafCollection.find({ normalized: utils.normalizeAndDiacritics(name), lcTerm: true }).toArray(function(err,records){
			if (records.length==0){
				 if (cb) cb(false)
			}else{
				if (cb) cb(records)
			}	
		})
	})
}

exports.returnViafByLccn = function(lccn, cb){
	db.returnCollectionRegistry("viaf",function(err,viafCollection){
		viafCollection.find({ lcId: lccn.trim() }).toArray(function(err,records){
			if (records.length==0){
				 if (cb) cb(false)
			}else{
				if (cb) cb(records[0])
			}	
		})
	})
}

exports.returnViafData = function(viafId, cb){


	if (viafId===false){
		if (cb) cb(false)
		return false
	}

	db.returnCollectionRegistry("viaf",function(err,viafCollection){
		viafCollection.find({ _id: parseInt(viafId) }).toArray(function(err,records){

			if (records.length==0){

				//if there was no match it maybe because the ID has drifted, we can try to see if there is an updated ID by gitting VIAF
				var options = {
					url : "http://viaf.org/viaf/" + viafId + "/",
					followRedirect : false
				}
				request(options, function (error, response, body) {				
					if (response.statusCode==301){
						if (response.headers){
							if (response.headers.location){
								var viafId = response.headers.location
								viafId = parseInt(viafId.split('/viaf/')[1])
								if (viafId){
									if (!isNaN(viafId)){
										viafCollection.find({ _id: parseInt(viafId) }).toArray(function(err,records){
											if (records.length==0){
												if (cb) cb(false)
											}else{
												if (cb) cb(records[0])
											}
										})
										return true
									}
								}
							}
						}
					}

					//if it got here then it did not work
					if (cb) cb(false)

				})				




			}else{
				if (cb) cb(records[0])
			}
		})
	})
}

exports.returnAgentByViaf = function(viafId,cb){
	db.returnCollectionRegistry("agents",function(err,agents){
		agents.find({ viafAll: parseInt(viafId) }).toArray(function(err,records){
			if (records.length==0){
				 if (cb) cb(false)
			}else{
				if (cb) cb(records[0])
			}
		})
	})
}


exports.returnAgentByName = function(name,cb){
	db.returnCollectionRegistry("agents",function(err,agents){
		agents.find({ nameNormalized: utils.normalizeAndDiacritics(name) }).toArray(function(err,records){
			if (records.length==0){
				 if (cb) cb(false)
			}else{


				//figure out which to use based on the best controled term name
				var bestScore = -1
				var useName = false
				records.forEach(function(r){
					var s = utils.normalizeAndDiacritics(name).score( utils.normalizeAndDiacritics(r.nameControlled),0.5 )
					if (s>bestScore){
						bestScore = s
						useName = r
					}
				})




				if (cb) cb(useName)
			}
		})
	})
}



exports.addAgentByName = function(agent,cb){
	db.returnCollectionRegistry("agents",function(err,agents){
		agents.update({ nameControlled : agent.nameControlled }, { $set: agent }, { upsert : true}, function(err, result) {
			if (err){
				errorLib.error("Agent Serialization - Catalog - Cannot update/insert record:", JSON.stringify({"agent":agent,"error":err}))
			}
			if (cb) cb()	
		})
	})
}



exports.addAgentByViaf = function(agent,cb){
	db.returnCollectionRegistry("agents",function(err,agents){
		agents.update({ viaf : agent.viaf }, { $set: agent }, { upsert : true}, function(err, result) {
			if (err){
				errorLib.error("Agent Serialization - Catalog - Cannot update/insert record:", JSON.stringify({"agent":agent,"error":err}))

				//when this happens we are going to try to resolve the name into the most populated record between the two in question.
				if (err.toString().search('nameControlled_1 dup key')>-1){

					//store the current allViaf
					var viafAll = agent.viafAll

					//find who has the name currently
					agents.find({ nameControlled: agent.nameControlled }).toArray(function(err,results){

						if (results[0]){

							//we have the viaf ID... probably
							if (results[0].viaf){

								//grab the VIAFs
								db.returnCollectionRegistry("viaf",function(err,viafCollection){
									viafCollection.find( { _id: { $in: [results[0].viaf, agent.viaf] } } ).toArray(function(err,records){

										//find the source record with the largeest sources
										var useSource = false
										var largestCount = -1										

										records.forEach(function(r){
											if (viafAll.indexOf(r._id) == -1) viafAll.push(r._id)

											if (r.sourceCount>largestCount){
												useSource = r._id
												largestCount=r.sourceCount
											}
										})

										if (useSource){											
											//update the agent with the new VIAF id
											agents.update({ nameControlled: agent.nameControlled }, { $set: { viaf: useSource, viafAll: viafAll } }, function(err, result) {
												if (cb) cb()
											})
											errorLib.error("Agent Serialization - Catalog - Cannot update/insert record:", "^^ Used the VIAF:" + useSource + " All viaf:" + viafAll)

										}else{
											if (cb) cb()
										}

										return true
									})
									return true
								})

							}else{
								if (cb) cb()
							}

						}else{
							if (cb) cb()
						}
					})

				}else{
					if (cb) cb()
				}




			}else{
				if (cb) cb()	
			}
			
		})
	})
}

exports.adddTermByFast = function(term,cb){
	db.returnCollectionRegistry("terms",function(err,terms){
		terms.update({ fastAll : term.fast }, { $set: term }, { upsert : true}, function(err, result) {
			if (err){
				//errorLib.error("Agent Serialization - Catalog - Cannot update/insert record:", JSON.stringify({"term":term,"error":err}))

				//when this happens we are going to try to resolve the FAST ID into one record
				if (err.toString().search('termControlled_1 dup key')>-1){

					exports.returnTermByTerm(term.termControlled,function(termRecord){

						if (termRecord){

							//add in the new FAST ID
							if (termRecord.fastAll.indexOf(term.fast)===-1) termRecord.fastAll.push( term.fast)		

							terms.update({ fast: termRecord.fast }, { $set: { fastAll: termRecord.fastAll } }, function(err, result) {
								if (cb) cb()
							})

						}else{

							console.log("Could not find",term.termControlled," In the TERMS table ")
							console.log(term)

							if (cb) cb()

						}
					})
				}else{
					if (cb) cb()
				}
			}else{
				if (cb) cb()
			}			
		})

	})
}


exports.addTermByTerm = function(term,cb){
	db.returnCollectionRegistry("terms",function(err,terms){
		terms.insertOne( term , function(err, result) {
			//console.log(result.result)
			if (err){
				errorLib.error("Agent Serialization - Catalog - Cannot update/insert record:", JSON.stringify({"term":term,"error":err}))

				// //when this happens we are going to try to resolve the FAST ID into one record
				// if (err.toString().search('termControlled_1 dup key')>-1){

				// 	exports.returnTermByTerm(term.termControlled,function(termRecord){
				// 		//add in the new FAST ID
				// 		if (termRecord.fastAll.indexOf(term.fast)===-1) termRecord.fastAll.push( term.fast)		

				// 		terms.update({ fast: termRecord.fast }, { $set: { fastAll: termRecord.fastAll } }, function(err, result) {
				// 			if (cb) cb()
				// 		})
				// 	})
				// }else{
				// 	if (cb) cb()
				// }

				if (cb) cb()
			}else{
				if (cb) cb()
			}			
		})

	})
}


exports.clusterByName = function(cb){


	var totalAgents = 0, totalDeleted = 0

	db.returnCollectionRegistry("agents",function(err,agents){

		
		var cursor = agents.find({}).stream()

		cursor.on('data', function(agent) {			

			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgBlueBright("clusterByName | totalAgents: " + ++totalAgents + " totalDeleted: " + totalDeleted ))
			cursor.pause()			

			var agentNameControlledNormalized = utils.normalizeAndDiacritics(agent.nameControlled)

			//look for overlapping agents
			agents.find({ nameNormalized: agentNameControlledNormalized }).toArray(function(err,matchedAgents){

				if (matchedAgents.length>1){

					// console.log("\n")
					// console.log(agent.nameControlled)					
					// console.log("---------")
					var toMerge = [agent]


					matchedAgents.forEach(function(a){
						if (agent.nameControlled!=a.nameControlled){

							//console.log(agent.nameControlled + " | " + a.nameControlled + " = " + agentNameControlledNormalized.score(utils.normalizeAndDiacritics(a.nameControlled),0.5) )

							var shouldMerge = true
							//is the name pretty similar
							if (agentNameControlledNormalized.score(utils.normalizeAndDiacritics(a.nameControlled),0.5)  < 0.1) shouldMerge = false
							//Are the marked as being differnt by LC?
							if (agent.lcId && a.lcId) if (agent.lcId != a.lcId) shouldMerge = false

							if (shouldMerge) toMerge.push(a)
							
						}
					})


					if (toMerge.length>1){

						

						var scoreCard = {}
						var allViafs = [], allNormalized = [], wikidataCode = false

						toMerge.forEach(function(r){

							//judge the best record
							if (!scoreCard[r._id]) scoreCard[r._id] = { score: 0, record : JSON.parse(JSON.stringify(r))  }

							scoreCard[r._id].score = scoreCard[r._id].score + r.viafAll.length
							if (r.wikidata) scoreCard[r._id].score++
							if (r.lcId) scoreCard[r._id].score = scoreCard[r._id].score + 5
							if (r.gettyId) scoreCard[r._id].score++
							if (r.dbpedia) scoreCard[r._id].score++
							if (r.birth) scoreCard[r._id].score++
							if (r.death) scoreCard[r._id].score++
							scoreCard[r._id].score = scoreCard[r._id].score + r.nameNormalized.length
							scoreCard[r._id].score = scoreCard[r._id].score + (r.useCount/100)

							r.viafAll.forEach(function(v){
								if (allViafs.indexOf(v) == -1) allViafs.push(v)
							})
							r.nameNormalized.forEach(function(v){
								if (allNormalized.indexOf(v) == -1) allNormalized.push(v)
							})

							if (r.wikidata) wikidataCode = r.wikidata


						})

						var winnerScore = -1, winner = false, losers = []

						for (var x in scoreCard){
							if (scoreCard[x].score > winnerScore){
								winnerScore = scoreCard[x].score
								winner = scoreCard[x].record
							}
						}

						for (var x in scoreCard){
							if (x != winner._id) losers.push(x)
						}

						if (winner){

							if (!winner.wikidata && wikidataCode) winner.wikidata = wikidataCode
							winner.viafAll = allViafs
							winner.nameNormalized = allNormalized

							// console.log(scoreCard)
							// console.log(allViafs,allNormalized)
							// console.log("Wiiner")
							// console.log(winner)
							// console.log(losers)

							totalDeleted = totalDeleted + losers.length

							winner._id = db.returnObjectId(winner._id)

							//update the winner
							agents.update({ _id : db.returnObjectId(winner._id) }, { $set: winner }, function(err, result) {
								
								if (err) console.log(err)	

								exports.deleteAgentByObjectId(losers,function(){
									cursor.resume()
								})
							})						

						}else{
							cursor.resume()
						}


					}else{
						// console.log("######################WILL NOT MERGE#####################")
						// console.log(matchedAgents)
						// console.log("######################WILL NOT MERGE#####################")
						cursor.resume()
					}
				}else{
					cursor.resume()
				}	

			})		


		})		

		cursor.once('end', function() {				
			
			//console.log("populateArchivesAgentsCollctions - Done!\n")
			//process.stdout.cursorTo(0)
			//process.stdout.write(clc.black.bgGreenBright("populateArchivesAgentsCollctions | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))
			if (cb) cb()
		})
	})
}





exports.cleanUpEmptyNormalizedNames = function(cb){

	var totalAgents = 0
	db.returnCollectionRegistry("agents",function(err,agents){		
		var cursor = agents.find( ).stream()
		cursor.on('data', function(agent) {			

			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgBlueBright("Cleanup Empty normalized  | totalAgents: " + ++totalAgents ))
			cursor.pause()			

			var newNormal = []
			agent.nameNormalized.forEach(function(n){
				if (n.trim() != ''){
					//is it just a year?
					if (isNaN(n.trim())){
						newNormal.push(n)
					}
					
				}
			})

			if (newNormal.length==0){

				if (!isNaN(agent.viaf)){

					exports.returnViafData(agent.viaf,function(viafRecord){
						if (viafRecord){

							newNormal = []
							viafRecord.normalized.forEach(function(n){
								if (n.trim() != ''){
									//is it just a year?
									if (isNaN(n.trim())){
										newNormal.push(n)
									}
									
								}
							})

							if (viafRecord.viafTerm) agent.nameControlled = viafRecord.viafTerm
							if (viafRecord.dnbTerm) agent.nameControlled = viafRecord.dnbTerm
							if (viafRecord.lcTerm) agent.nameControlled = viafRecord.lcTerm

							agent.nameNormalized = newNormal
							agents.update({ _id : agent._id }, { $set: agent }, function(err, result) {
								cursor.resume()
							})						

						}else{
							cursor.resume()
						}

					})					

				}else{
					cursor.resume()
				}

			}else{
				//update the record if something is differnt 
				if (agent.nameNormalized.length != newNormal.length){
					agent.nameNormalized = newNormal					
					agents.update({ _id : agent._id }, { $set: agent }, function(err, result) {
						cursor.resume()
					})
				}else{
					cursor.resume()
				}
			}
		})		

		cursor.once('end', function() {				
			
			console.log("Cleanup Empty normalized  - Done!\n")
			//process.stdout.cursorTo(0)
			//process.stdout.write(clc.black.bgGreenBright("populateArchivesAgentsCollctions | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))
			if (cb) cb()					


		})


	})
}

exports.returnFastByFast = function(fastId,cb){

	db.returnCollectionRegistry("fastLookup",function(err,viafCollection){
		viafCollection.find({ _id: fastId }).toArray(function(err,records){
			if (records.length==0){
				 if (cb) cb(false)
			}else{
				if (cb) cb(records[0])
			}	
		})
	})


}


exports.buildTerm = function(systemTerm){

	var newTerm = {

		fast: false,
		fastAll: [],
		registry: "temp" + Date.now() + Math.floor(Math.random() * (1000000 - 1)) + 1,
		termControlled: false,
		source: false,
		useCount: 0,		
		type: false,
		termNormalized: []

	}

	if (systemTerm.fast){
		newTerm.fast = systemTerm.fast
		newTerm.fastAll.push(systemTerm.fast)

	}else{
		newTerm.fast = "noFast" + Date.now() + Math.floor(Math.random() * (1000000 - 1)) + 1
		newTerm.fastAll.push(newTerm.fast)
	}




	if (systemTerm.type){
		newTerm.type = systemTerm.type
	}

	if (systemTerm.termLocal){
		newTerm.termLocal = systemTerm.termLocal
		var termLocalNormal = utils.singularize(utils.normalizeAndDiacritics(systemTerm.termLocal))
		if (termLocalNormal!= '' && newTerm.termNormalized.indexOf(termLocalNormal) == -1) newTerm.termNormalized.push(termLocalNormal)
	}



	if (systemTerm.termControlled){
		newTerm.termControlled = systemTerm.termControlled
		var termControlledNormal = utils.singularize(utils.normalizeAndDiacritics(systemTerm.termControlled))
		if (termControlledNormal!= '' && newTerm.termNormalized.indexOf(termControlledNormal) == -1) newTerm.termNormalized.push(termControlledNormal)
	
	}
	
	if (systemTerm.termAlt){
		systemTerm.termAlt.forEach(function(t){
			var tNormal = utils.singularize(utils.normalizeAndDiacritics(t))
			if (tNormal!= '' && newTerm.termNormalized.indexOf(tNormal) == -1) newTerm.termNormalized.push(tNormal)
		})
	}


	if (!newTerm.termControlled){

		console.log("NO CONTROLLED TERM!!!!")
		console.log(systemTerm)


	}

	return newTerm

}



exports.returnTermByFast = function(fastId,cb){
	db.returnCollectionRegistry("terms",function(err,agents){
		agents.find({ fast: parseInt(fastId) }).toArray(function(err,records){
			if (records.length==0){
				 if (cb) cb(false)
			}else{
				if (cb) cb(records[0])
			}
		})
	})
}

exports.returnTermByTerm = function(term,cb){
	db.returnCollectionRegistry("terms",function(err,agents){
		agents.find({ termNormalized: utils.singularize(utils.normalizeAndDiacritics(term)) }).toArray(function(err,records){
			if (records.length==0){
				 if (cb) cb(false)
			}else{
				if (cb) cb(records[0])
			}
		})
	})
}

