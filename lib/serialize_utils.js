"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")
var request = require('request')
var sanitizeHtml = require('sanitize-html')
require("string_score")

var mmsTorMap = config['Thesaurus']['mmsTorMap']
var locationLookupMms = config['Thesaurus']['serializeLocationMms']
var noteMap = config['Thesaurus']['noteMap']
var locationLookupCatalog = config['Thesaurus']['serializeCatalog']
var roleLookupCatalog = config['Thesaurus']['shadowcatRoleMap']
var noteLookupCatalog = config['Thesaurus']['shadowcatNoteMap']
var materialLookupCatalog = config['Thesaurus']['shadowcatMaterialTypeMap']
var materialLookupTms = config['Thesaurus']['tmsMaterialType']

noteMap[false] = "Note"

var roleLookupTms = config['Thesaurus']['tmsRoleMap']
var tmsLocations = config['Thesaurus']['tmsLocations']

exports.removeHtml = function(hmtl){
	return sanitizeHtml(hmtl, { allowedTags: [], allowedAttributes: [] })
}


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

					if (response){			
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
					}else{
						errorLib.error("Agent Serialization - Catalog - VIAF down?:", options.url )
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
							terms.update({ fastAll: termRecord.fast }, { $set: { fastAll: termRecord.fastAll } }, function(err, result) {
								if (cb) cb()
							})

						}else{

							console.log("Could not find",term.termControlled," In the TERMS table ")
							console.log(term)

							if (cb) cb()

						}
					})
				}else{
					errorLib.error("TERMS Serialization - Catalog - Cannot update/insert record:", JSON.stringify({"term":term,"error":err}))
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
				errorLib.error("TERMS Serialization - Catalog - Cannot update/insert record:", JSON.stringify({"term":term,"error":err}))

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

exports.updateNormalizedTerms = function(registry,termNormalized,cb){
	db.returnCollectionRegistry("terms",function(err,terms){
		terms.update({ registry: registry }, { $set: { termNormalized: termNormalized } }, function(err, result) {
			if (cb) cb()
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
exports.returnFastByTerm = function(term,cb){

	db.returnCollectionRegistry("fastLookup",function(err,viafCollection){
		viafCollection.find({ normalized: utils.singularize(utils.normalizeAndDiacritics(term)) }).toArray(function(err,records){
			if (records.length==0){
				 if (cb) cb(false)
			}else{
				if (cb) cb(records[0])
			}	
		})
	})

}
exports.returnFastByLc = function(LcTerm,cb){

	db.returnCollectionRegistry("fastLookup",function(err,viafCollection){
		viafCollection.find({ sameAsLc: LcTerm }).toArray(function(err,records){
			if (err) console.log(err)
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

		if (systemTerm.termLocal) newTerm.termControlled = systemTerm.termLocal


	}

	return newTerm

}



exports.returnTermByFast = function(fastId,cb){
	db.returnCollectionRegistry("terms",function(err,terms){
		terms.find({ fastAll: parseInt(fastId) }).toArray(function(err,records){
			if (records.length==0){
				 if (cb) cb(false)
			}else{
				if (cb) cb(records[0])
			}
		})
	})
}

exports.returnTermByTerm = function(term,cb){
	db.returnCollectionRegistry("terms",function(err,terms){
		terms.find({ termNormalized: utils.singularize(utils.normalizeAndDiacritics(term)) }).toArray(function(err,records){
			if (records.length==0){
				 if (cb) cb(false)
			}else{
				if (cb) cb(records[0])
			}
		})
	})
}



//exchanges the temp ID in the agents table for seq. numbers
exports.enumerateAgents = function(cb){	

	var countForward = 0, countBackward = 0, countForwardSkip = 0, countBackwardSkip = 0

	
	db.returnCollectionRegistry("agents",function(err,agents){

		//find the int. type records
		agents.find({registry: {$type: 16}}).sort({ registry: -1}).limit(1).toArray(function(err, agentIdAry) {

			if (agentIdAry.length==0){
				var agentId = 10000000
			}else{
				var agentId = parseInt(agentIdAry[0].registry) + 1
				if (isNaN(agentId)){
					agentId = 10000000
				}
			}

			console.log("Using Starting ID: ",agentId)

			//loop through all the agents and give them a new number
			var cursorForward = agents.find({}, { registry: 1 }).sort({$natural:1}).stream()
			cursorForward.on('data', function(agent) {
				cursorForward.pause()
				countForward++
				process.stdout.cursorTo(0)
				process.stdout.write(clc.black.bgYellowBright("enumerateAgents Forward | totalTerms: " + countForward  + " countForwardSkip: ",countForwardSkip))
	
				if (isNaN(agent.registry)){
					agents.update({ registry : agent.registry }, { $set: { registry: agentId } }, function(err, result) {
						if (err){
							errorLib.error("Agent Serialization - enumerateAgents ", JSON.stringify({"agent":agent,"error":err}))
							agents.update({ registry : agent.registry }, { $set: { registry: ++agentId } }, function(err, result) { })
						}
						agentId++
						cursorForward.resume()
					})
				}else{
					countForwardSkip++
					cursorForward.resume()
				}


			})
			cursorForward.on('end', function() {
					console.log("enumerateAgents - Done!\n")
					process.stdout.cursorTo(0)
					process.stdout.write(clc.black.bgYellowBright("enumerateAgents Forward | totalTerms: " + countForward ))
			})



			//start a cursor at the end as well
			var cursorBackward = agents.find({}, { registry: 1 }).sort({$natural:-1}).stream()

			cursorBackward.on('data', function(agent) {
				cursorBackward.pause()
				countBackward++
				process.stdout.cursorTo(50)
				process.stdout.write(clc.black.bgCyanBright("enumerateAgents Backward | totalTerms: " + countBackward + " countBackwardSkip: ",countBackwardSkip))

				if (isNaN(agent.registry)){
					agents.update({ registry : agent.registry }, { $set: { registry: agentId } }, function(err, result) {
						if (err){
							errorLib.error("Agent Serialization - enumerateAgents ", JSON.stringify({"agent":agent,"error":err}))

							//try to update it again,
							agents.update({ registry : agent.registry }, { $set: { registry: ++agentId } }, function(err, result) { })


						}
						agentId++
						cursorBackward.resume()
					})
				}else{
					countBackwardSkip++
					cursorBackward.resume()
				}


			})
			cursorBackward.on('end', function() {
					console.log("enumerateAgents - Done!\n")
					process.stdout.cursorTo(50)
					process.stdout.write(clc.black.bgCyanBright("enumerateAgents Backward | totalTerms: " + countBackward ))
					if (cb) cb()
			})			



		})
	})
}


//exchanges the temp ID in the agents table for seq. numbers
exports.enumerateTerms = function(cb){	

	var count = 0

	db.returnCollectionRegistry("terms",function(err,terms){

		//find the int. type records
		terms.find({registry: {$type: 16}}).sort({ registry: -1}).limit(1).toArray(function(err, termIdAry) {


			if (termIdAry.length==1){
				var termId = parseInt(termIdAry[0].registry) + 1
			}else{
				var termId = "NAN"
			}

			if (isNaN(termId)){
				termId = 10000000
			}
			
			console.log("Using Starting ID: ",termId)

			//loop through all the terms and give them a new number
			var cursor = terms.find({}, { registry: 1 }).stream()

			cursor.on('data', function(agent) {

				cursor.pause()

				count++
				process.stdout.cursorTo(0)
				process.stdout.write(clc.black.bgYellowBright("enumerateTerms | totalTerms: " + count ))

				if (isNaN(agent.registry)){
					terms.update({ registry : agent.registry }, { $set: { registry: termId } }, function(err, result) {
						if (err){
							errorLib.error("Term Serialization - enumerateTerms ", JSON.stringify({"agent":agent,"error":err}))
						}
						termId++
						cursor.resume()
					})
				}else{
					cursor.resume()
				}


			})

			cursor.on('end', function() {

					console.log("enumerateTerms - Done!\n")
					process.stdout.cursorTo(0)
					process.stdout.write(clc.black.bgYellowBright("enumerateTerms | totalTerms: " + count ))
					cb()
			})
		})
	})
}


exports.resourceObject = function(useUri){



	this.triples = { }

	if (useUri){
		this.uri = useUri
	}else{
		this.uri = "temp" + Date.now() + Math.floor(Math.random() * (1000000 - 1)) + 1	
	}
	

	this.allAgents = []
	this.allTerms = []
	

	this.addTriple = function(predicate, objectUri, objectLiteral, objectLiteralType, source, recordIdentifier, label){
		//does this predicate already exist?
		if (!this.triples[predicate]) this.triples[predicate] = []

		this.triples[predicate].push({

			objectUri: objectUri,
			objectLiteral: objectLiteral,
			objectLiteralType: objectLiteralType,			
			provo: {
				creator: 'RI',
				created: new Date,
				source: source,
				recordIdentifier: recordIdentifier
			}

		})

		if (label){
			this.triples[predicate][this.triples[predicate].length-1].label = label
		}


	}


}



exports.dereferenceAgent = function(agentsCollection, viaf, name, recordId, cb){

	async.parallel({

		viafCheck: function(callback){

			//if a viaf is supplied give it a go
			if (viaf){
				//grab their info and check if they are in agents
				agentsCollection.find({ viafAll : viaf }).toArray(function(err, agentsAry) {
					if (agentsAry.length>0){
						if (!agentsAry[0].useCount) agentsAry[0].useCount = 0
						agentsAry[0].useCount++
						agentsCollection.update({ _id: agentsAry[0]._id }, { $set : { useCount : agentsAry[0].useCount  } })
						callback(null,agentsAry[0])
					}else{
						callback(null,false)
					}
				})	
			}else{
				callback(null,false)
			}

		}

	},
	function(err, results){

		if (results.viafCheck){

			cb(results.viafCheck)

		}else{

			//the viaf did not work
			//try by name

			if (!name){
				errorLib.error("dereferenceAgent - No name supplied for seaching! ", JSON.stringify({ foundIn: recordId, viaf: viaf, name: name }))
				cb(false)
				return false
			}

			agentsCollection.find({ nameNormalized : utils.normalizeAndDiacritics(name) }).toArray(function(err, agentsAry) {
				if (agentsAry.length>0){


					//if there are more than one try to find the very best match
					var bestScore = -100, bestMatch = false
					for (var x in agentsAry){
						if (!agentsAry[x].nameControlled){
							errorLib.error("No nameControlled found for this record! ", JSON.stringify(agentsAry[x]))
							agentsAry[x].nameControlled = name
						}

						var score = agentsAry[x].nameControlled.score(name,0.5)
						if (score > bestScore){
							bestScore = score
							bestMatch = agentsAry[x]
						}
					}

					//if (bestScore<0.02) console.log(name, " ---> ", bestMatch.nameControlled,bestScore)

					//we want to flip the switch on the agent to say it has been used 
					//if (!bestMatch.useCount) bestMatch.useCount = 0
					//bestMatch.useCount++
					//agentsCollection.update({ _id: bestMatch._id }, { $set : { useCount : bestMatch.useCount  } })
					cb(bestMatch)
				}else{
					errorLib.error("No Agent found for this record! ", JSON.stringify({ foundIn: recordId, viaf: viaf, name: name }))
					cb(false)
				}
			})


		}


	})





}


//some helper function to facilitate serilization

exports.markSerialized = function(databaseSerialized,id,cb){
	databaseSerialized.insert({ _id : id  }, function(err, record){
		if (cb) cb()
	})
}
exports.checkSerialized = function(databaseSerialized,id,cb){
	databaseSerialized.find({ _id : id  }).toArray(function(err, record){
		if (record.length>0){
			cb(true)
		}else{
			cb(false)
		}
	})
}

exports.dereferenceTerm = function(termsCollection, fast, term, recordId, cb){


	async.parallel({

		fastCheck: function(callback){

			if (fast){

				termsCollection.find({ $or: [ { fastAll : fast },  { termControlled : term } ] }).toArray(function(err, termsAry) {
					if (termsAry.length>0){
						if (!termsAry[0].useCount) termsAry[0].useCount = 0
						termsAry[0].useCount++
						termsCollection.update({ _id: termsAry[0]._id }, { $set : { useCount : termsAry[0].useCount  } })
						callback(null,termsAry[0])
					}else{
						callback(null,false)
					}
				})
			}else{
				callback(null,false)				
			}

		}

	},
	function(err, results){
		if (results.fastCheck){
			cb(results.fastCheck)
		}else{
			//the viaf did not work
			//try by name
			if (!term){
				errorLib.error("dereferenceTerm - No term supplied for seaching! ", JSON.stringify({ foundIn: recordId, fast: fast, term: term }))
				cb(false)
				return false
			}
			termsCollection.find({ $or: [ {termNormalized :  utils.singularize(utils.normalizeAndDiacritics(term))}, { termControlled : term } ]  }).toArray(function(err, termsAry) {

				if (termsAry.length>0){

					//if there are more than one try to find the very best match
					var bestScore = -100, bestMatch = false
					for (var x in termsAry){
						var score = termsAry[x].termControlled.score(term,0.5)
						if (score > bestScore){
							bestScore = score
							bestMatch = termsAry[x]
						}
					}

					//if (bestScore<0.02) console.log(term, " ---> ", bestMatch.termControlled,bestScore)

					if (bestScore==-100){
						cb(false)
						errorLib.error("Terms table problem for this recordrecord! ", JSON.stringify({ foundIn: recordId, fast: fast, term: term }))
						return false
					}

					//we want to flip the switch on the agent to say it has been used 
					// if (!bestMatch.useCount) bestMatch.useCount = 0
					// bestMatch.useCount++
					// termsCollection.update({ _id: bestMatch._id }, { $set : { useCount : bestMatch.useCount  } })

					cb(bestMatch)
				}else{
					errorLib.error("No Term found for this record! ", JSON.stringify({ foundIn: recordId, fast: fast, term: term, normalizeAndDiacritics: utils.singularize(utils.normalizeAndDiacritics(term))  }))
					cb(false)
				}
			})
		}
	})

}




exports.dereferenceMmsItem = function(agentsCollection, termsCollection, databaseSerialized, mmsCaptures,  mmsItem, cb){

	var registryAgents = [], registryTerms = [], captures = []


	async.parallel({

		processAgents: function(callback){

			//build a simple ary of agents with possible viaf
			var addedAgents = []

			var agentsToCheck = []
			mmsItem.agents.forEach(function(a){				
				if (a.role){
					a.role.forEach(function(r){
						var role = r.split('/relators/')[1]
						if (!role) role = 'unk'
						agentsToCheck.push( { name: a.namePart, viaf: ( a.viaf ) ? a.viaf : false , role: role, subject: false })
					})

				}else{
					agentsToCheck.push( { name: a.namePart, viaf: ( a.viaf ) ? a.viaf : false, role: false, subject: false })

				}				
			})

			mmsItem.subjects.forEach(function(a){
				if (a.type =='name'){
					agentsToCheck.push( { name: a.text, viaf: ( a.viaf ) ? a.viaf : false, role: false, subject: true })
				}				
			})



			//send each one off to be dererfernced							
			async.eachSeries(agentsToCheck, function(agent, eachCallback) {
				exports.dereferenceAgent(agentsCollection, agent.viaf, agent.name, "mmsItem:"+mmsItem.mmsDb,function(registryAgent){
					if (registryAgent){
						registryAgent.subject = agent.subject
						registryAgent.role = agent.role


						if (addedAgents.indexOf(registryAgent._id)==-1){
							registryAgents.push(registryAgent)
							addedAgents.push(registryAgent._id)
						}
					}
					eachCallback()
				})										

			}, function(err){
				if (err) console.log(err)		
				callback()
			})				
		},

		processSubjects: function(callback){


			var termsToCheck = [], addedSubjects = []


			//split up our complex headings
			var archiveTerms = []
			mmsItem.subjects.forEach(function(t){
				if (t.type != 'name'){
					t.text.split("--").forEach(function(s){
						archiveTerms.push(s.trim())
					})
				}
			})

			// if (mmsItem.typeOfResource){
			// 	mmsItem.typeOfResource.forEach(function(tor){
			// 		archiveTerms.push(tor.trim())					
			// 	})
			// }

			archiveTerms.forEach(function(a){				
				termsToCheck.push( { term: a, fast: false })
			})

			//send each one off to be dererfernced							
			async.eachSeries(termsToCheck, function(term, eachCallback) {
				exports.dereferenceTerm(termsCollection, term.fast, term.term, "mmsItem:"+mmsItem.mmsDb,function(registryTerm){
					if (registryTerm){
						registryTerms.push(registryTerm)
					}else{
						//console.log(mmsItem.subjects)
						//TODO FIX ingest is taking type 'name' into subjects!

					}
					eachCallback()
				})										

			}, function(err){
				if (err) console.log(err)				
				
				//all the agents have been ran though and sorted out
				registryTerms.forEach(function(a){
					if (addedSubjects.indexOf(a._id) == -1){
						addedSubjects.push(a._id)
					}
				})
				callback()
			})
		},


		//mark this, the bnumber if there is one and the MMS collection as being serialized
		markAsSerialized: function(callback){
			exports.markSerialized(databaseSerialized, "mmsItem" +mmsItem.mmsDb,function(){
				callback()
			})
		},


		buildCaptures: function(callback){


			//is it public domain is it in DC?
			var publicDomain = false, inDc = false

			if (mmsItem.publicDomain) publicDomain = true
			if (mmsItem.dcFlag) inDc = true


			mmsCaptures.find({ itemMmsDb : parseInt(mmsItem.mmsDb)}).toArray(function(err,captureAry){
				if (err) console.log(err)

				captureAry.forEach(function(c){

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


		if (mmsItem.tmsId){
			exports.buildTmsTriples(mmsItem.tmsId, function(results){
				exports.markSerialized(databaseSerialized, "tms" + mmsItem.tmsId,function(){})

				cb({
					registryAgents: registryAgents,
					registryTerms: registryTerms,
					captures: captures,
					tmsObj: results
				})
			})	

		}else{
			cb({
				registryAgents: registryAgents,
				registryTerms: registryTerms,
				captures: captures,
				tmsObj: false
			})
		}
	})


}


exports.buildMmsTriples = function(mmsItem,defResults,collectionRegistryId){


	// resourceId++

	// var uri = "res:" + resourceId

	// var prov = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: mmsItem.uuid  }

	
	var dupeCheck = {}

	var mmsItemObj = new exports.resourceObject()

	//Title and subtitle

	mmsItem.titles.forEach(function(t){
		if (t.primary){
			//triples.push({  subject: uri,  predicate: "dcterms:title", objectUri: null, objectLiteral :  t.title,  literalDataType: null, prov: prov  })
			mmsItemObj.addTriple( 'dcterms:title', null, t.title,  null, "data:10002", mmsItem._id)
		}else{
			//triples.push({  subject: uri,  predicate: "dcterms:alternative", objectUri: null, objectLiteral :  t.title,  literalDataType: null, prov: prov  })
			mmsItemObj.addTriple( 'dcterms:alternative', null, t.title,  null, "data:10002", mmsItem._id)
		}
	})


	mmsItem.notes.forEach(function(note){

		if (noteMap[note.type]){
			var noteText = note.text
			noteText = noteMap[note.type] + ":\n" + noteText
			noteText = exports.removeHtml(noteText)
			//triples.push({  subject: uri,  predicate: "skos:note", objectUri: null, objectLiteral :  noteText,  literalDataType: null, prov: prov  })
			mmsItemObj.addTriple( 'skos:note', null, noteText,  null, "data:10002", mmsItem._id)
			
		}else{
			errorLib.error("buildMmsTriples Note Type Not Found:", note.type )
		}
	})

	mmsItem.abstracts.forEach(function(abstract){
		//triples.push({  subject: uri,  predicate: "dcterms:description", objectUri: null, objectLiteral :  abstract,  literalDataType: null, prov: prov  })
		mmsItemObj.addTriple( 'dcterms:description', null, exports.removeHtml(abstract),  null, "data:10002", mmsItem._id)
	})

	//_id, exhibition, callNumber, catnyp, mmsDb, (see identifier mapping)


	if (mmsItem._id){
		//triples.push({  subject: uri,  predicate: "dcterms:identifier", objectUri: "urn:uuid:" + mmsItem._id, objectLiteral :  null,  literalDataType: null, prov: prov  })
		mmsItemObj.addTriple( 'dcterms:identifier', "urn:uuid:" + mmsItem._id, null,  null, "data:10002", mmsItem._id)
	}

	if (mmsItem.bNumber){
		//triples.push({  subject: uri,  predicate: "dcterms:identifier", objectUri: "urn:bnum:" + mmsItem.bNumber, objectLiteral :  null,  literalDataType: null, prov: prov  })
		mmsItemObj.addTriple( 'dcterms:identifier', "urn:bnum:" + mmsItem.bNumber, null,  null, "data:10002", mmsItem._id)
	}
	if (mmsItem.catnyp){
		//triples.push({  subject: uri,  predicate: "dcterms:identifier", objectUri: "urn:catnyp:" + mmsItem.catnyp, objectLiteral :  null,  literalDataType: null, prov: prov  })
		mmsItemObj.addTriple( 'dcterms:identifier', "urn:catnyp:" + mmsItem.catnyp, null,  null, "data:10002", mmsItem._id)
	}
	if (mmsItem.exhibition){
		//triples.push({  subject: uri,  predicate: "dcterms:identifier", objectUri: "urn:exhibition:" + mmsItem.exhibition, objectLiteral :  null,  literalDataType: null, prov: prov  })
		mmsItemObj.addTriple( 'dcterms:identifier', "urn:exhibition:" + mmsItem.exhibition, null,  null, "data:10002", mmsItem._id)
	}
	if (mmsItem.mmsDb){
		//triples.push({  subject: uri,  predicate: "dcterms:identifier", objectUri: "urn:mmsdb:" + mmsItem.mmsDb, objectLiteral :  null,  literalDataType: null, prov: prov  })
		mmsItemObj.addTriple( 'dcterms:identifier', "urn:mmsdb:" + mmsItem.mmsDb, null,  null, "data:10002", mmsItem._id)
	}

	if (mmsItem.callNumber){
		//triples.push({  subject: uri,  predicate: "dcterms:identifier", objectUri: "urn:callnum:" + mmsItem.callNumber.replace(/\s/g,''), objectLiteral :  null,  literalDataType: null, prov: prov  })
		mmsItemObj.addTriple( 'dcterms:identifier', "urn:callnum:" + mmsItem.callNumber.replace(/\s/g,''), null,  null, "data:10002", mmsItem._id)
	}



	mmsItem.typeOfResource.forEach(function(tor){
		if(mmsTorMap[tor]){
			//triples.push({  subject: uri,  predicate: "dcterms:identifier", objectUri: "resourcetypes:" + mmsTorMap[tor], objectLiteral : null,  literalDataType: null, prov: prov  })
			mmsItemObj.addTriple( 'dcterms:type', "resourcetypes:" + mmsTorMap[tor], null,  null, "data:10002", mmsItem._id)
		}
	})


	defResults.registryTerms.forEach(function(a){
		if (!dupeCheck['dcterms:subject' + "terms:"+a.registry]){
			//triples.push({  subject: uri,  predicate: "dcterms:subject", objectUri: "terms:"+a._id, objectLiteral :  null,  literalDataType: null, prov: prov  })
			mmsItemObj.addTriple( 'dcterms:subject', "terms:"+a.registry, null,  null, "data:10002", mmsItem._id, a.termControlled)
			mmsItemObj.allTerms.push(a.registry)
			dupeCheck['dcterms:subject' + "terms:"+a.registry]=true
		}
	})

	

	defResults.registryAgents.forEach(function(a){
		if (a.role){
				if (!dupeCheck["roles:"+a.role+"agents:"+a.registry]){
				//triples.push({  subject: uri,  predicate: "roles:"+a.role, objectUri: "agents:"+a._id, objectLiteral :  null,  literalDataType: null, prov: prov  })
					mmsItemObj.addTriple( "roles:"+a.role, "agents:"+a.registry, null,  null, "data:10002", mmsItem._id, a.nameControlled)
					mmsItemObj.allAgents.push(a.registry)
					dupeCheck["roles:"+a.role+"agents:"+a.registry] = true
				}
		}else{
			if (a.subject){ //a subject
				if (!dupeCheck["dcterms:subject"+ "agents:" +a.registry]){
					//triples.push({  subject: uri,  predicate: "dcterms:subject", objectUri: "agents:"+a._id, objectLiteral :  null,  literalDataType: null, prov: prov  })
					mmsItemObj.addTriple( "dcterms:subject", "agents:"+a.registry, null,  null, "data:10002", mmsItem._id, a.nameControlled)
					mmsItemObj.allAgents.push(a.registry)
					dupeCheck["dcterms:subject"+ "agents:" +a.registry]=true
				}
			
			}else{	//generic contirbutor
				//triples.push({  subject: uri,  predicate: "dcterms:contributor", objectUri: "agents:"+a._id, objectLiteral :  null,  literalDataType: null, prov: prov  })
				if (!dupeCheck["dcterms:contributor"+ "agents:" +a.registry]){
					mmsItemObj.addTriple( "dcterms:contributor", "agents:"+a.registry, null,  null, "data:10002", mmsItem._id, a.nameControlled)
					mmsItemObj.allAgents.push(a.registry)
					dupeCheck["dcterms:contributor"+ "agents:" +a.registry]=true
				}
			}
		}
	})

	mmsItem.languages.forEach(function(language){
		var lang = language.split("/iso639-2/")[1]
		if (lang){
			//triples.push({  subject: uri,  predicate: "dcterms:language", objectUri: "language:" + lang, objectLiteral : null,  literalDataType: null, prov: prov  })
			mmsItemObj.addTriple( "dcterms:language", "language:" + lang, null,  null, "data:10002", mmsItem._id)
		}
	})

	//Todo fix me
	//Pick the greates start and smallest end dates for start and end
	//select all date created 
	//if point == start || point == false use as date created

	mmsItem.dates.forEach(function(d){
		if (d.point=='start'){
			//triples.push({  subject: uri,  predicate: "db:dateStart", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: prov  })
			mmsItemObj.addTriple( "db:dateStart", null, d.value,  "xsd:date", "data:10002", mmsItem._id)
		}
		if (d.point=='end'){
			//triples.push({  subject: uri,  predicate: "db:dateEnd", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: prov  })
			mmsItemObj.addTriple( "db:dateEnd", null, d.value,  "xsd:date", "data:10002", mmsItem._id)
		}
		if (d.point==false){
			//triples.push({  subject: uri,  predicate: "dcterms:created", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: prov  })
			mmsItemObj.addTriple( "dcterms:created", null, d.value,  "xsd:date", "data:10002", mmsItem._id)
		}
	})

	mmsItem.divisions.forEach(function(l){
		if (locationLookupMms[l.toUpperCase()]){
			//triples.push({  subject: uri,  predicate: "nypl:owner", objectUri: "orgs:"+locationLookupMms[l.toUpperCase()], objectLiteral :  null,  literalDataType: null, prov: prov  })
			mmsItemObj.addTriple( "nypl:owner", "orgs:"+locationLookupMms[l.toUpperCase()], null,  null, "data:10002", mmsItem._id)
		}else{
			//triples.push({  subject: uri,  predicate: "nypl:owner", objectUri: "orgs:"+1000, objectLiteral :  null,  literalDataType: null, prov: prov  })
			mmsItemObj.addTriple( "nypl:owner", "orgs:"+1000, null,  null, "data:10002", mmsItem._id)
		}
	})

	var captures = []


	

	defResults.captures.forEach(function(c){

		// var captureProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: c.uuid  }

		// //make a new thing, a nypl:capture
		// resourceId++
		// var captureUri = "res:" + resourceId

		var captureObj = new exports.resourceObject()

		

		captureObj.addTriple( "rdf:type", "nypl:Capture", null,  null, "data:10002", c.uuid)
		if (collectionRegistryId) captureObj.addTriple( "dcterms:identifier", "urn:superparent:" + collectionRegistryId, null,  null, "data:10002", c.uuid)

		mmsItemObj.addTriple( "pcdm:hasMember", "res:" + captureObj.uri, null,  null, "data:10002", c.uuid)
		captureObj.addTriple( "pcdm:memberOf", "res:" + mmsItemObj.uri, null,  null, "data:10002", c.uuid)

		captureObj.addTriple( "nypl:dcflag", null, c['nypl:dcflag'],  'xsd:boolean', "data:10002", c.uuid)
		captureObj.addTriple( "nypl:publicDomain", null, c['nypl:publicDomain'],  'xsd:boolean', "data:10002", c.uuid)
		captureObj.addTriple( "dcterms:identifier", "urn:uuid:" + c.uuid, null,  null, "data:10002", c.uuid)

		if (c.imageId){
			if (c.imageId!=""){
				//triples.push({  subject: captureUri,  predicate: "nypl:filename", objectUri: null, objectLiteral :  c.imageId,  literalDataType: null, prov: captureProv  })
				captureObj.addTriple( "nypl:filename", null, c.imageId,  null, "data:10002", c.uuid)
			}
		}

		captures.push(captureObj)




	})


	//check if there was a matching record in TMS that we might want to incorporate some data
	if (defResults.tmsObj){
		//see if we need to add any agents or terms

		for (var x in defResults.tmsObj.triples){
			defResults.tmsObj.triples[x].forEach(function(t){
				if (t.objectUri){																			
					var agentId = parseInt(t.objectUri.split('agents:')[1])
					if (agentId){
						if (mmsItemObj.allAgents.indexOf(agentId)==-1){
							if (!mmsItemObj.triples[x]) mmsItemObj.triples[x] = []
							mmsItemObj.triples[x].push(t)
							mmsItemObj.allAgents.push(agentId)
						}																				
					}
				}
			})
		}

		for (var x in defResults.tmsObj.triples){
			defResults.tmsObj.triples[x].forEach(function(t){
				if (t.objectUri){																			
					var termId = parseInt(t.objectUri.split('terms:')[1])
					if (termId){
						if (mmsItemObj.allTerms.indexOf(termId)==-1){
							if (!mmsItemObj.triples[x]) mmsItemObj.triples[x] = []
							mmsItemObj.triples[x].push(t)
							mmsItemObj.allTerms.push(termId)
						}																				
					}
				}
			})
		}

		//overwrite the title
		if (defResults.tmsObj.triples['dcterms:title']){
			mmsItemObj.triples['dcterms:title'] = defResults.tmsObj.triples['dcterms:title']
		}
		//the owner
		if (defResults.tmsObj.triples['nypl:owner']){
			mmsItemObj.triples['nypl:owner'] = defResults.tmsObj.triples['nypl:owner']
		}		
		//the type
		if (defResults.tmsObj.triples['dcterms:type']){
			mmsItemObj.triples['dcterms:type'] = defResults.tmsObj.triples['dcterms:type']
		}
		//compare notes
		if (mmsItemObj.triples['skos:note'] && defResults.tmsObj.triples['skos:note']){			
			var allNotes = []
			mmsItemObj.triples['skos:note'].forEach(function(n){
				allNotes.push(n.objectLiteral)
			})
			defResults.tmsObj.triples['skos:note'].forEach(function(n){																		
				if (allNotes.indexOf(n.objectLiteral) == -1){
					mmsItemObj.triples['skos:note'].push(n)
				}
			})
		}else if (defResults.tmsObj.triples['skos:note'] && !mmsItemObj.triples['skos:note']){
			//add all the mss notes in 
			mmsItemObj.triples['skos:note'] = JSON.parse(JSON.stringify(defResults.tmsObj.triples['skos:note']))
		}


	}





	

	return { mmsItemObj: mmsItemObj,  captures: captures }
	

}


//Two helper functions to work with the MARC
var extract852H = function(varfields){

	if (!varfields) return {  callNumber : false, volume : false   }

	var callNumber = false, volume = false
	
	varfields.forEach(function(vf){
		if (vf.marcTag){
			if (vf.marcTag === '852'){
				if (vf.subfields){
					for (var x in vf.subfields){
						if (vf.subfields[x].tag === 'h')  if (!callNumber) callNumber = vf.subfields[x].content
					}
				}
			}
		}
		if (vf.marcTag){
			if (vf.marcTag === 'v'){
				if (vf.content){

					if (!volume) volume = vf.subfields[x].content
				}			
			}
		}
	})

	return {  callNumber : callNumber, volume : volume   }
}


var extractMarcValue = function(marcRecord,marcTag,subfield){

	marcTag = marcTag.toString()

	var results = []

	if (marcRecord.varFields){
		marcRecord.varFields.forEach(function(obj){
			if (obj.marcTag){
				if (obj.marcTag === marcTag){
					if (obj.subfields){
						for (var x in obj.subfields){
							if (obj.subfields[x].tag){

								if (subfield === '*'){
									if (obj.subfields[x].content) results.push(obj.subfields[x].content)
								}else{
									if (obj.subfields[x].tag.trim().toLowerCase() === subfield){
										if (obj.subfields[x].content) results.push(obj.subfields[x].content)
									}
								}
							}
						}
					}
				}
			}
		})
	}
	return results
}




exports.buildShadowcatTriples = function(bNumberSupplied, cb){

	var registryAgents = [], registryTerms = [], databaseAgents = null, databaseTerms = null

	async.parallel({
		collectData: function(callback){
			db.returnCollectionsRegistry(['agents','terms'],function(err,collections){
				databaseAgents = collections["agents"]
				databaseTerms = collections["terms"]
				db.returnCollectionShadowcat("bib",function(err,shadowcatBib){
					db.returnCollectionShadowcat("item",function(err,shadowcatItem){
						var bNumber = -9999999999
						try{
							bNumber = parseInt(utils.normalizeBnumber(bNumberSupplied).replace("b",''))
						}catch (e) {
							bNumber = -9999999999
						}
						if (isNaN(bNumber)) bNumber = -9999999999
						shadowcatBib.find({ _id : bNumber}).toArray(function(err, bib) {	
							//console.log(bNumber)
							//console.log(bib)			
							shadowcatItem.find({bibIds:bNumber}).toArray(function(err,items){
								if (bib.length>0){ bib = bib[0] }else{ bib = false }
								if (items.length==0){ items = [] }
								callback(null, { bib: bib, items: items}  )
							})
						})
					})
				})
			})
		}
	},
	function(err, results) {

		var bib = results.collectData.bib
		var items = results.collectData.items

		if (!bib){
			cb(false)
			return false
		}
		

		//this is the main bib record
		var bibObj = new exports.resourceObject()
		var allObjects = []
		var dupeCheck = {}

		async.parallel({

			processAgents: function(callback){


				//build a simple ary of agents with possible viaf

				var agentsToCheck = []

				//use the catalog agents, it is just as good and maybe a little more structured
				if (bib['sc:agents']){
					bib['sc:agents'].forEach(function(a){
						if (a.relator){
							if (roleLookupCatalog[a.relator]){
								a.relator = roleLookupCatalog[a.relator]
							}
						}
						var useName = a.nameLocal
						if (a.nameLc) useName = a.nameLc
						if (!useName && a.nameViaf)  useName = a.nameViaf
						agentsToCheck.push( { name: useName, viaf: (a.viaf) ? a.viaf : false, role: a.relator, subject : (!a.contributor) ? true : false })								
					})
				}

				//dcterms:contributor
				var registryAgents = []

				//send each one off to be dererfernced							
				async.eachSeries(agentsToCheck, function(agent, eachCallback) {
					exports.dereferenceAgent(databaseAgents, agent.viaf, agent.name, "catalog:"+bib._id,function(registryAgent){
						if (registryAgent){
							registryAgent.subject = agent.subject
							registryAgent.role = agent.role
							registryAgents.push(registryAgent)
						}
						eachCallback()
					})
				}, function(err){
					if (err) console.log(err)								
					// var addedContriubtors = [], addedSubjects = []
					//all the agents have been ran though and sorted out
					//console.log(registryAgents)
					registryAgents.forEach(function(a){
						if (a.role){
							//triples.push({  subject: collectionUri,  predicate: "roles:"+a.role, objectUri: "agents:"+a.registry, objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
							if (!dupeCheck["roles:"+a.role+"agents:"+a.registry]){
								bibObj.addTriple( "roles:"+a.role, "agents:"+a.registry, null,  null, "data:10000", bib._id, a.nameControlled)
								bibObj.allAgents.push(a.registry)
								dupeCheck["roles:"+a.role+"agents:"+a.registry] = true
							}
						}else{
							if (a.subject){
								if (!dupeCheck['dcterms:subject'+'agents:'+a.registry]){
									bibObj.addTriple( 'dcterms:subject', 'agents:'+a.registry, null,  null, "data:10000", bib._id, a.nameControlled)
									bibObj.allAgents.push(a.registry)
									dupeCheck['dcterms:subject'+'agents:'+a.registry] = true
								}
							}else{
								if (!dupeCheck['dcterms:contributor'+'agents:'+a.registry]){
									bibObj.addTriple( 'dcterms:contributor', 'agents:'+a.registry, null,  null, "data:10000", bib._id, a.nameControlled)
									bibObj.allAgents.push(a.registry)
									dupeCheck['dcterms:contributor'+'agents:'+a.registry] = true
								}
							}
						}
					})
					// console.log(JSON.stringify(bibObj,null,2))	
					callback()
				})
			},

			processSubjects: function(callback){


				var termsToCheck = []

				//use the catalog terms, it is just as good and maybe a little more structured
				if (bib['sc:terms']){
					bib['sc:terms'].forEach(function(a){
						var useTerm = false
						if (a.nameLocal) useTerm = a.nameLocal
						if (a.nameFast) useTerm = a.nameFast
						termsToCheck.push( { term: useTerm, fast: (a.fast) ? a.fast : false })								
					})
				}


				var registryTerms = []
				//send each one off to be dererfernced							
				async.eachSeries(termsToCheck, function(term, eachCallback) {
					exports.dereferenceTerm(databaseTerms, term.fast, term.term, "catalog:"+bib._id,function(registryTerm){
						if (registryTerm){
							registryTerms.push(registryTerm)
						}
						eachCallback()
					})				
				}, function(err){
					if (err) console.log(err)				
					// var addedSubjects = []
					//console.log(registryTerms)
					//all the agents have been ran though and sorted out
					registryTerms.forEach(function(a){						
						if (!dupeCheck['dcterms:subject'+'terms:'+a.registry]){
							bibObj.addTriple( 'dcterms:subject', 'terms:'+a.registry, null,  null, "data:10000", bib.registry, a.termControlled)
							bibObj.allTerms.push(a.registry)
							dupeCheck['dcterms:subject'+'terms:'+a.registry] = true
						}
					})
					callback()
				})	

			}





		},
		function(err, results) {

			//all records

			var location = '1000'
			items.forEach(function(item){
				if (item.location){
					if( item.location.code){
						if (locationLookupCatalog[item.location.code.trim()]){
							location = locationLookupCatalog[item.location.code.trim()]
						}
					}
				}
			})
			bibObj.addTriple( "nypl:owner", "orgs:"+location, null,  null, "data:10000", bib._id)



			//we always want to take the first call number and store it in this record object
			var callNumberResults = extract852H(bib.varFields)
			if (callNumberResults.callNumber){
				bibObj.addTriple( 'dcterms:identifier', "urn:callnum:" + callNumberResults.callNumber.replace(/\s/g,''), null,  null, "data:10000", bib._id)
			}

			bibObj.addTriple( 'nypl:suppressed', null, bib.suppressed,  'xsd:boolean', "data:10000", bib._id)
					
			//do we have to worry about multiple items?
			if (items.length==0){

				//there are no items
				bibObj.addTriple( 'rdf:type', 'nypl:Item', null,  null, "data:10000", bib._id)

			}else if (items.length==1){

				//there is exactly one item record, use it's call number and merge it (barcode) into the bib record
				//do we have the callnumber alreaday?
				if (!callNumberResults.callNumber){
					callNumberResults = extract852H(items[0].varFields)
					if (callNumberResults.callNumber){
						bibObj.addTriple( 'dcterms:identifier', "urn:callnum:" + callNumberResults.callNumber.replace(/\s/g,''), null,  null, "data:10000", bib._id)
					}
				}
				if (items[0].barcode){
					bibObj.addTriple( 'dcterms:identifier', "urn:barcode:" + items[0].barcode, null,  null, "data:10000", bib._id)
				}

				bibObj.addTriple( 'rdf:type', 'nypl:Item', null,  null, "data:10000", bib._id)

			}else if (items.length>1){

				var isSerial = false
				if (bib.bibLevel) if (bib.bibLevel.code) if (bib.bibLevel.code == 'm') isSerial = true 

				if (isSerial){
					bibObj.addTriple( 'rdf:type', 'nypl:Collection', null,  null, "data:10000", bib._id)
				}else{
					bibObj.addTriple( 'rdf:type', 'nypl:Item', null,  null, "data:10000", bib._id)
				}

				//we take the make new nypl:items with bf:hasEquivalent or we need to make it a collection with children items if it is a serial record
				items.forEach(function(item){


					var itemObj = new exports.resourceObject()

					//we need to make a new item and add call number/barcode/location and point it back to the bib w/ bf:hasEquivalent
					callNumberResults = extract852H(item.varFields)
					if (callNumberResults.callNumber){
						itemObj.addTriple( 'dcterms:identifier', "urn:callnum:" + callNumberResults.callNumber.replace(/\s/g,''), null,  null, "data:10000", bib._id)
					}

					if (item.barcode){
						itemObj.addTriple( 'dcterms:identifier', "urn:barcode:" + item.barcode, null,  null, "data:10000", bib._id)
					}	

					if (isSerial){
						itemObj.addTriple( 'pcdm:memberOf', 'res:' + bibObj.uri, null,  null, "data:10000", bib._id)
						bibObj.addTriple( 'pcdm:hasMember', 'res:' + itemObj.uri, null,  null, "data:10000", bib._id)

						if (callNumberResults.volume){
							itemObj.addTriple( 'dcterms:title', null, callNumberResults.volume, null, "data:10000", bib._id)
						}

					}else{
						itemObj.addTriple( 'bf:hasEquivalent', 'res:' + bibObj.uri, null,  null, "data:10000", bib._id)
					}

					itemObj.isEquivalent = true

					var location = '1000'
					
					if (item.location){
						if( item.location.code){
							if (locationLookupCatalog[item.location.code.trim()]){
								location = locationLookupCatalog[item.location.code.trim()]
							}
						}
					}
				
					itemObj.addTriple( "nypl:owner", "orgs:"+location, null,  null, "data:10000", bib._id)


					allObjects.push(itemObj)

				})
			}




			bibObj.addTriple( 'dcterms:identifier', "urn:bnum:" + bib._id, null,  null, "data:10000", bib._id)

			if (bib.title){
				bibObj.addTriple( 'dcterms:title', null, bib.title,  null, "data:10000", bib._id)
			}

			//Alt Title

			extractMarcValue(bib,'246','a').forEach(function(altTitle){				
				bibObj.addTriple( 'dcterms:alternative', null, altTitle,  null, "data:10000", bib._id)
			})
			extractMarcValue(bib,'246','b').forEach(function(altTitle){
				bibObj.addTriple( 'dcterms:alternative', null, altTitle,  null, "data:10000", bib._id)
			})
			extractMarcValue(bib,'246','f').forEach(function(altTitle){
				bibObj.addTriple( 'dcterms:alternative', null, altTitle,  null, "data:10000", bib._id)
			})
			extractMarcValue(bib,'246','n').forEach(function(altTitle){
				bibObj.addTriple( 'dcterms:alternative', null, altTitle,  null, "data:10000", bib._id)
			})									
			extractMarcValue(bib,'246','p').forEach(function(altTitle){
				bibObj.addTriple( 'dcterms:alternative', null, altTitle,  null, "data:10000", bib._id)
			})


			
			for (var x in noteLookupCatalog){
				var field = x
				var label = noteLookupCatalog[x]
				extractMarcValue(bib,field,'*').forEach(function(note){
					var noteText = label + ":\n"+note
					bibObj.addTriple( 'skos:note', null, noteText,  null, "data:10000", bib._id)
				})
			}


			extractMarcValue(bib,'520','a').forEach(function(abstract){				
				bibObj.addTriple( 'dcterms:description', null, abstract,  null, "data:10000", bib._id)
			})

			//_id, exhibition, callNumber, catnyp, mmsDb, (see identifier mapping)

			if (bib['sc:oclc']){
				bib['sc:oclc'].forEach(function(i){
					bibObj.addTriple( 'dcterms:identifier', "urn:oclc:" + i, null,  null, "data:10000", bib._id)
				})
			}

			if (bib['classify:oclc']){
				if (!bib['sc:oclc']) bib['sc:oclc'] = []

				if (bib['sc:oclc'].length==0&&bib['classify:oclc'].length>0){
					bib['sc:oclc'].forEach(function(i){
						bibObj.addTriple( 'dcterms:identifier', "urn:oclc:" + i, null,  null, "data:10000", bib._id)
					})
				}
			}	

			if (bib['sc:isbn']){
				bib['sc:isbn'].forEach(function(i){
					bibObj.addTriple( 'dcterms:identifier', "urn:isbn:" + i, null,  null, "data:10000", bib._id)
				})
			}

			if (bib['sc:issn']){
				bib['sc:issn'].forEach(function(i){					
					bibObj.addTriple( 'dcterms:identifier', "urn:issn:" + i, null,  null, "data:10000", bib._id)
				})
			}
			if (bib['sc:hathi']){
				bib['sc:hathi'].forEach(function(i){					
					bibObj.addTriple( 'dcterms:identifier', "urn:hathi:" + i, null,  null, "data:10000", bib._id)
				})
			}


			if (bib['sc:classmark']){
				bib['sc:classmark'].forEach(function(i){
					if (typeof i === 'string')
						bibObj.addTriple( 'dcterms:identifier', "urn:classmark:" + i.replace(/\s/g,''), null,  null, "data:10000", bib._id)
				})
			}

			if (bib['sc:lccCoarse']){				
				bibObj.addTriple( 'dcterms:identifier',  "urn:lccc:" + bib['sc:lccCoarse'], null,  null, "data:10000", bib._id)			
			}
			if (bib['classify:owi']){
				bibObj.addTriple( 'dcterms:identifier',  "urn:owi:" + bib['classify:owi'], null,  null, "data:10000", bib._id)
			}
			if (bib['classify:dcc']){
				bibObj.addTriple( 'dcterms:identifier',  "urn:dcc:" + bib['classify:dcc'], null,  null, "data:10000", bib._id)			
			}
			if (bib['classify:lcc']){
				bibObj.addTriple( 'dcterms:identifier',   "urn:lcc:" + bib['classify:lcc'], null,  null, "data:10000", bib._id)
			}

			if (bib['classify:holdings']){
				bibObj.addTriple( 'classify:holdings', null, bib['classify:holdings'],  null, "data:10000", bib._id)			
			}

			var resourceType = 'txt'
			if (bib.materialType){
				if(bib.materialType.code){
					if (materialLookupCatalog[bib.materialType.code.trim()]){
						resourceType = materialLookupCatalog[bib.materialType.code.trim()]
					}
				}
			}

			bibObj.addTriple( 'dcterms:type',   "resourcetypes:" + resourceType, null,  null, "data:10000", bib._id)

			if (bib.fixedFields){
				if(bib.fixedFields['24']){
					if(bib.fixedFields['24'].value){						
						bibObj.addTriple( 'dcterms:language', "language:" + bib.fixedFields['24'].value.trim(), null,  null, "data:10000", bib._id)
					}
				}
			}


			bib.varFields.forEach(function(v){

				if (v.marcTag=='008'){

					if (v.content){
						var d1 = v.content.substring(7,11).trim()
						var d2 = v.content.substring(12,16).trim()
						if (d1){
							bibObj.addTriple( 'db:dateStart',   null, d1,  "xsd:date", "data:10000", bib._id)
							bibObj.addTriple( 'dcterms:created',  null, d1,  "xsd:date", "data:10000", bib._id)
						}
						if(d2){
							//FIX ME TODO
							//console.log("d2=",d2)
						}

					}


				}
			})

			cb({
				bibObj: bibObj,
				itemsObj: allObjects
			})

		})


	})




}




exports.buildTmsTriples = function(tmsObjectId, cb){

	var registryAgents = [], registryTerms = [], databaseAgents = null, databaseTerms = null, databaseTmsObjects = null, databaseSerialized = null
	async.parallel({
		collectData: function(callback){
			db.returnCollectionsRegistry(['agents','terms','tmsObjects','serialized'],function(err,collections){
				databaseAgents = collections["agents"]
				databaseTerms = collections["terms"]
				databaseTmsObjects = collections["tmsObjects"]
				databaseSerialized = collections["serialized"]

				databaseTmsObjects.find({ _id : parseInt(tmsObjectId)}).toArray(function(err, tmsObject) {	
					//console.log(bNumber)
					//console.log(bib)			
					if (tmsObject.length>0){ tmsObject = tmsObject[0] }else{ tmsObject = false }
					callback(null, tmsObject)
				})
			})
		}
	},
	function(err, results) {

		var tmsObject = results.collectData

		if (!tmsObject){
			cb(false)
			return false
		}
		

		//this is the main bib record
		var tmsObj = new exports.resourceObject()
		var allObjects = []
		var dupeCheck = {}
		var shadowCatTriples = false

		async.series({


			checkCatalog: function(callback){

				if (tmsObject.bNumber){

					exports.buildShadowcatTriples(tmsObject.bNumber,function(results){

						if (results){
							shadowCatTriples = results.bibObj
						}

						callback(null,results)

					})

				}else{
					callback(null,false)
				}




			},

			processAgents: function(callback){

				//build a simple ary of agents with possible viaf
				var agentsToCheck = []
				if (tmsObject.agents){
					tmsObject.agents.forEach(function(a){

						if (a.role){
							if (roleLookupTms[a.role]){
								a.role = roleLookupTms[a.role]
							}else{
								if (a.role=='subject'){
									a.subject = true
								}else{
									a.role = false
								}
							}

							
						}

						var checkNames = []

						if (a.dateStart && a.dateEnd){
							if (a.nameAlpha.trim() != ""){
								checkNames.push(a.nameAlpha.trim() + ', ' + a.dateStart  + "-" + a.dateEnd)
							}
						}
						if (a.dateStart){
							if (a.nameAlpha.trim() != ""){									
								checkNames.push(a.nameAlpha.trim() + ', ' + a.dateStart  + "-")
							}
						}

						if (a.nameAlpha.trim() != ""){	
							if (checkNames.indexOf(a.nameAlpha.trim())==-1)
								checkNames.push(a.nameAlpha.trim())
						}

						if (a.nameDisplay.trim() != ""){	
							if (checkNames.indexOf(a.nameDisplay.trim())==-1)
								checkNames.push(a.nameDisplay.trim())
						}


						//in the agent serializing if it was not found and had to create a TMS local term the name followed this rule:
						a.namePart = (a.nameAlpha.trim() != "") ? a.nameAlpha.trim() : a.nameDisplay.trim()						

						agentsToCheck.push( {checkNames:checkNames, name: a.namePart, viaf: (a.viaf) ? a.viaf : false, role: a.role, subject : (a.subject) ? true : false })								

					})

				}


				//dcterms:contributor
				var registryAgents = []

				//send each one off to be dererfernced							
				async.eachSeries(agentsToCheck, function(agent, eachCallback) {
					var useName = false
					//and each name variant
					async.eachSeries(agent.checkNames, function(checkName, eachSubCallback) {
						exports.returnAgentByName(checkName,function(nameResults){
							if (nameResults) useName = checkName
							eachSubCallback()
						})				
					}, function(err){

						if (useName) agent.name = useName
						exports.dereferenceAgent(databaseAgents, agent.viaf, agent.name, "tms:"+tmsObject._id,function(registryAgent){
							if (registryAgent){
								registryAgent.subject = agent.subject
								registryAgent.role = agent.role
								registryAgents.push(registryAgent)
							}
							eachCallback()
						})
					})


				}, function(err){
					if (err) console.log(err)	

											
					// var addedContriubtors = [], addedSubjects = []
					//all the agents have been ran though and sorted out
					//console.log(registryAgents)
					registryAgents.forEach(function(a){
						if (a.role){
							if (!dupeCheck["roles:"+a.role+"agents:"+a.registry]){
								tmsObj.addTriple( "roles:"+a.role, "agents:"+a.registry, null,  null, "data:10003", tmsObject._id, a.nameControlled)
								tmsObj.allAgents.push(a.registry)
								dupeCheck["roles:"+a.role+"agents:"+a.registry] = true
							}
						}else{
							if (a.subject){
								if (!dupeCheck['dcterms:subject'+'agents:'+a.registry]){
									tmsObj.addTriple( 'dcterms:subject', 'agents:'+a.registry, null,  null, "data:10003", tmsObject._id, a.nameControlled)
									tmsObj.allAgents.push(a.registry)
									dupeCheck['dcterms:subject'+'agents:'+a.registry] = true
								}
							}else{
								if (!dupeCheck['dcterms:contributor'+'agents:'+a.registry]){
									tmsObj.addTriple( 'dcterms:contributor', 'agents:'+a.registry, null,  null, "data:10003", tmsObject._id, a.nameControlled)
									tmsObj.allAgents.push(a.registry)
									dupeCheck['dcterms:contributor'+'agents:'+a.registry] = true
								}
							}
						}
					})

					callback()
				})
			}

		},
		function(err, results) {

			//lets see if the catalog had some more info about this thang than TMS had such as agents and terms

			if (shadowCatTriples){

				exports.markSerialized(databaseSerialized, "catalog" +tmsObject.bNumber,function(){})


				//check the agents
				for (var x in shadowCatTriples.triples){
					shadowCatTriples.triples[x].forEach(function(t){
						if (t.objectUri){
						//if (typeof t.objectUri == 'string'){			
							var agentId = parseInt(t.objectUri.split('agents:')[1])
							if (agentId){
								if (tmsObj.allAgents.indexOf(agentId)==-1){
									if (!tmsObj.triples[x]) tmsObj.triples[x] = []
									tmsObj.triples[x].push(t)
									tmsObj.allAgents.push(agentId)
								}																				
							}
						}
					})
				}

				for (var x in shadowCatTriples.triples){
					shadowCatTriples.triples[x].forEach(function(t){
						if (t.objectUri){
						//if (typeof t.objectUri == 'string'){																			
							var termId = parseInt(t.objectUri.split('terms:')[1])
							if (termId){
								if (tmsObj.allTerms.indexOf(termId)==-1){
									if (!tmsObj.triples[x]) tmsObj.triples[x] = []
									tmsObj.triples[x].push(t)
									tmsObj.allTerms.push(termId)
								}																				
							}
						}
					})
				}

			}

			var location = ['1000']

			if (tmsObject.division){
				if (tmsLocations[tmsObject.division]){
					location = tmsLocations[tmsObject.division]					
				}
			}

			location.forEach(function(l){
				tmsObj.addTriple( "nypl:owner", "orgs:"+l, null,  null, "data:10003", tmsObject._id)				
			})


			

			//we always want to take the first call number and store it in this record object

			if (tmsObject.callNumber){
				tmsObj.addTriple( 'dcterms:identifier', "urn:callnum:" + tmsObject.callNumber.replace(/\s/g,''), null,  null, "data:10003", tmsObject._id)
			}

			tmsObj.addTriple( 'rdf:type', 'nypl:Item', null,  null, "data:10003", tmsObject._id)

			if (tmsObject.acquisitionNumber){
				tmsObj.addTriple( 'dcterms:identifier', "urn:acqnum:" + tmsObject.acquisitionNumber, null,  null, "data:10003", tmsObject._id)
			}
			if (tmsObject.bNumber){
				tmsObj.addTriple( 'dcterms:identifier', "urn:acqnum:" + tmsObject.bNumber, null,  null, "data:10003", tmsObject._id)
			}

			if (tmsObject.title){
				tmsObj.addTriple( 'dcterms:title', null, tmsObject.title,  null, "data:10003", tmsObject._id)
			}
			if (tmsObject.titleAlt){
				tmsObject.titleAlt.forEach(function(t){
					tmsObj.addTriple( 'dcterms:alternative', null, t,  null, "data:10003", tmsObject._id)
				})
			}
			

			if (tmsObject.notes){
				tmsObject.notes.forEach(function(n){
					if (noteMap[n.type]){
						var noteText = noteMap[n.type] + ":\n"+n.value
						tmsObj.addTriple( 'skos:note', null, noteText,  null, "data:10003", tmsObject._id)
					}else{
						errorLib.error("Note type not in note map:", n.type )
					}
				})
			}


			var resourceType = 'img'
			if (tmsObject.materialTypeId){
				if (materialLookupTms[tmsObject.materialTypeId.toString()]){
					resourceType = materialLookupTms[tmsObject.materialTypeId.toString()]
				}
			}

			tmsObj.addTriple( 'dcterms:type',   "resourcetypes:" + resourceType, null,  null, "data:10003", tmsObject._id)
	

			tmsObject.dates.forEach(function(d){
				if (d.point=='start'){
					//triples.push({  subject: uri,  predicate: "db:dateStart", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: prov  })
					tmsObj.addTriple( "db:dateStart", null, d.value,  "xsd:date", "data:10003", tmsObject._id)
				}
				if (d.point=='end'){
					//triples.push({  subject: uri,  predicate: "db:dateEnd", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: prov  })
					tmsObj.addTriple( "db:dateEnd", null, d.value,  "xsd:date", "data:10003", tmsObject._id)
				}
				if (d.point==false){
					//triples.push({  subject: uri,  predicate: "dcterms:created", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: prov  })
					tmsObj.addTriple( "dcterms:created", null, d.value,  "xsd:date", "data:10003", tmsObject._id)
				}
			})


			//console.log(JSON.stringify(tmsObj,null,2))
			cb(tmsObj)

		})


	})


}




exports.enumerateObjects = function(objects,startRegistryId){

	var lookup = {}
	var predicates = ['pcdm:hasMember', 'pcdm:memberOf','dcterms:identifier']

	//create the lookuptable for all the temporary uris used
	objects.forEach(function(obj){
		if (!lookup[obj.uri]) lookup[obj.uri] = startRegistryId++
	})

	for (var x in objects){

		objects[x].uri = lookup[objects[x].uri]

		//remove the helper function for the database insert
		delete objects[x]['addTriple']

		predicates.forEach(function(predicate){


			if (objects[x].triples[predicate]){

				for (var xx in objects[x].triples[predicate] ){
					
					if (objects[x].triples[predicate][xx].objectUri.search(/res:temp/) > -1){
						var temp = objects[x].triples[predicate][xx].objectUri.split('res:')[1]
						objects[x].triples[predicate][xx].objectUri = objects[x].triples[predicate][xx].objectUri.replace(temp, lookup[temp])
					}else if (objects[x].triples[predicate][xx].objectUri.search(/urn:superparent:/) > -1){
						var temp = objects[x].triples[predicate][xx].objectUri.split('urn:superparent:')[1]
						objects[x].triples[predicate][xx].objectUri = objects[x].triples[predicate][xx].objectUri.replace(temp, lookup[temp])
					}
				}
			}
		})

		//copy over the triples to the root
		for (var y in objects[x].triples){
			objects[x][y] = objects[x].triples[y]
		}

		delete objects[x].triples

	}
	
	return { objects: objects, registryId: startRegistryId}

}




