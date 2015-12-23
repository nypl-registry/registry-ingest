"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")
var request = require('request')



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





exports.clusterByName = function(cb){


	var totalAgents = 0

	db.returnCollectionRegistry("agents",function(err,agents){

		
		var cursor = agents.find({}).stream()

		cursor.on('data', function(agent) {			

			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgBlueBright("clusterByName | totalAgents: " + ++totalAgents ))
			cursor.pause()			

			//look for overlapping agents
			agents.find({ nameNormalized: utils.normalizeAndDiacritics(agent.nameControlled) }).toArray(function(err,matchedAgents){

				if (matchedAgents.length>1){
					console.log(agent)
					console.log(matchedAgents)
					console.log("---------")
				}

				cursor.resume()

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

		
		var cursor = agents.find().stream()

		cursor.on('data', function(agent) {			

			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgBlueBright("clusterByName | totalAgents: " + ++totalAgents ))
			cursor.pause()			

			var newNormal = []
			agent.nameNormalized.forEach(function(n){
				if (n.trim() != '') newNormal.push(n)
			})

			if (newNormal.length==0){

				if (!isNaN(agent.viaf)){

					exports.returnViafData(agent.viaf,function(viafRecord){
						if (viafRecord){

							newNormal = []
							viafRecord.normalized.forEach(function(n){
								if (n.trim() != '') newNormal.push(n)
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

				agent.nameNormalized = newNormal

				//update the record
				agents.update({ _id : agent._id }, { $set: agent }, function(err, result) {
					cursor.resume()
				})
			}
		})		

		cursor.once('end', function() {				
			
			console.log("cleanUpEmptyNormalizedNames - Done!\n")
			//process.stdout.cursorTo(0)
			//process.stdout.write(clc.black.bgGreenBright("populateArchivesAgentsCollctions | totalAgents: " + totalAgents + " totalAgentsWithViaf:" + totalAgentsWithViaf + " totalAgentsNotFoundInRegistry: " + totalAgentsNotFoundInRegistry ))
			if (cb) cb()					


		})


	})
}

