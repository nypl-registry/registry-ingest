"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")
var request = require('request')
require("string_score")

var mmsTorMap = config['Thesaurus']['mmsTorMap']
var locationLookupMms = config['Thesaurus']['serializeLocationMms']
var noteMap = config['Thesaurus']['noteMap']


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

			var agentId = parseInt(agentIdAry[0].registry) + 1
			if (isNaN(agentId)){
				agentId = 10000000
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


exports.resourceObject = function(){


	this.triples = { }

	this.uri = "temp" + Date.now() + Math.floor(Math.random() * (1000000 - 1)) + 1


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


	if (viaf){

		//grab their info and check if they are in agents
		agentsCollection.find({ viafAll : viaf }).toArray(function(err, agentsAry) {

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
}


//some helper function to facilitate serilization

exports.markSerialized = function(databaseSerialized,id,cb){
	databaseSerialized.insert({ _id : id  }, function(err, record){
		if (cb) cb()
	})
}





exports.dereferenceTerm = function(termsCollection, fast, term, recordId, cb){


	if (fast){
		//grab their info and check if they are in agents
		termsCollection.find({ $or: [ { fastAll : fast },  { termControlled : term } ] }).toArray(function(err, termsAry) {
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
			errorLib.error("No Term provided for seach for this record! ", JSON.stringify({ foundIn: recordId, fast: fast, term: term }))
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

				if (bestScore<0.02) console.log(term, " ---> ", bestMatch.termControlled,bestScore)

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
						agentsToCheck.push( { name: a.namePart, viaf: false, role: role, subject: false })
					})

				}else{
					agentsToCheck.push( { name: a.namePart, viaf: false, role: false, subject: false })

				}				
			})

			mmsItem.subjects.forEach(function(a){
				if (a.type =='name'){
					agentsToCheck.push( { name: a.text, viaf: false, role: false, subject: true })
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


		//mark this, the bnumber if there is one and the MMS collection as being serialized
		buildCaptures: function(callback){


			//is it public domain is it in DC?
			var publicDomain = false, inDc = false

			if (mmsItem.publicDomain) publicDomain = true
			if (mmsItem.dcFlag) inDc = true


			mmsCaptures.find({ itemMmsDb : parseInt(mmsItem.mmsDb)}).toArray(function(err,captureAry){
				

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


		cb({
			registryAgents: registryAgents,
			registryTerms: registryTerms,
			captures: captures


		})

	})


}


exports.buildMmsTriples = function(mmsItem,defResults,collectionRegistryId){


	// resourceId++

	// var uri = "res:" + resourceId

	// var prov = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: mmsItem.uuid  }

	var registryIdLookup = []

	var mmsItemObj = new exports.resourceObject()


	registryIdLookup.push(mmsItemObj.uri)


	//Title and subtitle

	mmsItem.titles.forEach(function(t){
		if (t.primary){
			//triples.push({  subject: uri,  predicate: "dcterms:title", objectUri: null, objectLiteral :  t.title,  literalDataType: null, prov: prov  })
			mmsItemObj.addTriple( 'dcterms:title', null, t.title,  null, "data:10002", mmsItem.uuid)
		}else{
			//triples.push({  subject: uri,  predicate: "dcterms:alternative", objectUri: null, objectLiteral :  t.title,  literalDataType: null, prov: prov  })
			mmsItemObj.addTriple( 'dcterms:alternative', null, t.title,  null, "data:10002", mmsItem.uuid)
		}
	})


	mmsItem.notes.forEach(function(note){

		if (noteMap[note.type]){
			var noteText = note.text
			noteText = noteMap[note.type] + ":\n" + noteText
			//triples.push({  subject: uri,  predicate: "skos:note", objectUri: null, objectLiteral :  noteText,  literalDataType: null, prov: prov  })
			mmsItemObj.addTriple( 'skos:note', null, noteText,  null, "data:10002", mmsItem.uuid)
		}else{
			errorLib.error("buildMmsTriples Note Type Not Found:", note.type )
		}
	})

	mmsItem.abstracts.forEach(function(abstract){
		//triples.push({  subject: uri,  predicate: "dcterms:description", objectUri: null, objectLiteral :  abstract,  literalDataType: null, prov: prov  })
		mmsItemObj.addTriple( 'dcterms:description', null, abstract,  null, "data:10002", mmsItem.uuid)
	})

	//_id, exhibition, callNumber, catnyp, mmsDb, (see identifier mapping)


	if (mmsItem._id){
		//triples.push({  subject: uri,  predicate: "dcterms:identifier", objectUri: "urn:uuid:" + mmsItem._id, objectLiteral :  null,  literalDataType: null, prov: prov  })
		mmsItemObj.addTriple( 'dcterms:identifier', "urn:uuid:" + mmsItem._id, null,  null, "data:10002", mmsItem.uuid)
	}

	if (mmsItem.bNumber){
		//triples.push({  subject: uri,  predicate: "dcterms:identifier", objectUri: "urn:bnum:" + mmsItem.bNumber, objectLiteral :  null,  literalDataType: null, prov: prov  })
		mmsItemObj.addTriple( 'dcterms:identifier', "urn:bnum:" + mmsItem.bNumber, null,  null, "data:10002", mmsItem.uuid)
	}
	if (mmsItem.catnyp){
		//triples.push({  subject: uri,  predicate: "dcterms:identifier", objectUri: "urn:catnyp:" + mmsItem.catnyp, objectLiteral :  null,  literalDataType: null, prov: prov  })
		mmsItemObj.addTriple( 'dcterms:identifier', "urn:catnyp:" + mmsItem.catnyp, null,  null, "data:10002", mmsItem.uuid)
	}
	if (mmsItem.exhibition){
		//triples.push({  subject: uri,  predicate: "dcterms:identifier", objectUri: "urn:exhibition:" + mmsItem.exhibition, objectLiteral :  null,  literalDataType: null, prov: prov  })
		mmsItemObj.addTriple( 'dcterms:identifier', "urn:exhibition:" + mmsItem.exhibition, null,  null, "data:10002", mmsItem.uuid)
	}
	if (mmsItem.mmsDb){
		//triples.push({  subject: uri,  predicate: "dcterms:identifier", objectUri: "urn:mmsdb:" + mmsItem.mmsDb, objectLiteral :  null,  literalDataType: null, prov: prov  })
		mmsItemObj.addTriple( 'dcterms:identifier', "urn:mmsdb:" + mmsItem.mmsDb, null,  null, "data:10002", mmsItem.uuid)
	}

	if (mmsItem.callNumber){
		//triples.push({  subject: uri,  predicate: "dcterms:identifier", objectUri: "urn:callnum:" + mmsItem.callNumber.replace(/\s/g,''), objectLiteral :  null,  literalDataType: null, prov: prov  })
		mmsItemObj.addTriple( 'dcterms:identifier', "urn:callnum:" + mmsItem.callNumber.replace(/\s/g,''), null,  null, "data:10002", mmsItem.uuid)
	}



	mmsItem.typeOfResource.forEach(function(tor){
		if(mmsTorMap[tor]){
			//triples.push({  subject: uri,  predicate: "dcterms:identifier", objectUri: "resourcetypes:" + mmsTorMap[tor], objectLiteral : null,  literalDataType: null, prov: prov  })
			mmsItemObj.addTriple( 'dcterms:type', "resourcetypes:" + mmsTorMap[tor], null,  null, "data:10002", mmsItem.uuid)
		}
	})


	defResults.registryTerms.forEach(function(a){
		//triples.push({  subject: uri,  predicate: "dcterms:subject", objectUri: "terms:"+a._id, objectLiteral :  null,  literalDataType: null, prov: prov  })
		mmsItemObj.addTriple( 'dcterms:subject', "terms:"+a.registry, null,  null, "data:10002", mmsItem.uuid, a.termControlled)
	})

		
	defResults.registryAgents.forEach(function(a){
		if (a.role){
				//triples.push({  subject: uri,  predicate: "roles:"+a.role, objectUri: "agents:"+a._id, objectLiteral :  null,  literalDataType: null, prov: prov  })
				mmsItemObj.addTriple( "roles:"+a.role, "agents:"+a.registry, null,  null, "data:10002", mmsItem.uuid, a.nameControlled)
		}else{
			if (a.subject){ //a subject
				//triples.push({  subject: uri,  predicate: "dcterms:subject", objectUri: "agents:"+a._id, objectLiteral :  null,  literalDataType: null, prov: prov  })
				mmsItemObj.addTriple( "dcterms:subject", "agents:"+a.registry, null,  null, "data:10002", mmsItem.uuid, a.nameControlled)
			
			}else{	//generic contirbutor
				//triples.push({  subject: uri,  predicate: "dcterms:contributor", objectUri: "agents:"+a._id, objectLiteral :  null,  literalDataType: null, prov: prov  })
				mmsItemObj.addTriple( "dcterms:contributor", "agents:"+a.registry, null,  null, "data:10002", mmsItem.uuid, a.nameControlled)
			}
		}
	})

	mmsItem.languages.forEach(function(language){
		var lang = language.split("/iso639-2/")[1]
		if (lang){
			//triples.push({  subject: uri,  predicate: "dcterms:language", objectUri: "language:" + lang, objectLiteral : null,  literalDataType: null, prov: prov  })
			mmsItemObj.addTriple( "dcterms:language", "language:" + lang, null,  null, "data:10002", mmsItem.uuid)
		}
	})

	//Todo fix me
	//Pick the greates start and smallest end dates for start and end
	//select all date created 
	//if point == start || point == false use as date created

	mmsItem.dates.forEach(function(d){
		if (d.point=='start'){
			//triples.push({  subject: uri,  predicate: "db:dateStart", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: prov  })
			mmsItemObj.addTriple( "db:dateStart", null, d.value,  "xsd:date", "data:10002", mmsItem.uuid)
		}
		if (d.point=='end'){
			//triples.push({  subject: uri,  predicate: "db:dateEnd", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: prov  })
			mmsItemObj.addTriple( "db:dateEnd", null, d.value,  "xsd:date", "data:10002", mmsItem.uuid)
		}
		if (d.point==false){
			//triples.push({  subject: uri,  predicate: "dcterms:created", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: prov  })
			mmsItemObj.addTriple( "dcterms:created", null, d.value,  "xsd:date", "data:10002", mmsItem.uuid)
		}
	})

	mmsItem.divisions.forEach(function(l){
		if (locationLookupMms[l.toUpperCase()]){
			//triples.push({  subject: uri,  predicate: "nypl:owner", objectUri: "orgs:"+locationLookupMms[l.toUpperCase()], objectLiteral :  null,  literalDataType: null, prov: prov  })
			mmsItemObj.addTriple( "nypl:owner", "orgs:"+locationLookupMms[l.toUpperCase()], null,  null, "data:10002", mmsItem.uuid)
		}else{
			//triples.push({  subject: uri,  predicate: "nypl:owner", objectUri: "orgs:"+1000, objectLiteral :  null,  literalDataType: null, prov: prov  })
			mmsItemObj.addTriple( "nypl:owner", "orgs:"+1000, null,  null, "data:10002", mmsItem.uuid)
		}
	})

	var captures = []


	

	defResults.captures.forEach(function(c){

		// var captureProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: c.uuid  }

		// //make a new thing, a nypl:capture
		// resourceId++
		// var captureUri = "res:" + resourceId

		var captureObj = new exports.resourceObject()

		registryIdLookup[captureObj.uri] = null

		captureObj.addTriple( "rdf:type", "nypl:Capture", null,  null, "data:10002", c.uuid)
		captureObj.addTriple( "dcterms:identifier", "urn:superparent:" + collectionRegistryId, null,  null, "data:10002", c.uuid)

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
	

	return { mmsItemObj: mmsItemObj, registryIdLookup: registryIdLookup, captures: captures }

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


	}
	
	return { objects: objects, registryId: startRegistryId}

}




