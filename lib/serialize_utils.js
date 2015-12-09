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
			}else{
				if (cb) cb(++records[0]._id)
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
		agents.find({ viaf: parseInt(viafId) }).toArray(function(err,records){
			if (records.length==0){
				 if (cb) cb(false)
			}else{
				if (cb) cb(records[0])
			}
		})
	})
}
exports.addAgentByViaf = function(agent,cb){
	db.returnCollectionRegistry("agents",function(err,agents){
		agents.update({ viaf : agent.viaf }, { $set: agent }, { upsert : true}, function(err, result) {
			if (err){
				errorLib.error("Agent Serialization - Catalog - Cannot update/insert record:", JSON.stringify({"agent":agent,"error":err}))

				//when this happens we are going to try to resolve the name into the most populated record between the two in question.
				if (err.toString().search('nameControled_1 dup key')>-1){

					//find who has the name currently
					agents.find({ nameControled: agent.nameControled }).toArray(function(err,results){

						if (results[0]){

							//we have the viaf ID... probably
							if (results[0].viaf){

								//grab the VIAFs
								db.returnCollectionRegistry("viaf",function(err,viafCollection){
									viafCollection.find( { _id: { $in: [results[0].viaf, agent.viaf] } } ).toArray(function(err,records){

										if (records.length===2){

											//if one is larger source count
											var useSource = false
											if (records[0].sourceCount > records[1].sourceCount) useSource = records[0]._id
											if (records[1].sourceCount > records[0].sourceCount) useSource = records[1]._id	

											//add in both to the normalized TODO

											if (useSource){
												
												//update the agent with the new VIAF id
												agents.update({ nameControled: agent.nameControled }, { $set: { viaf: useSource } }, function(err, result) {
													if (cb) cb()
												})



											}else{
												if (cb) cb()
											}



										}else{
											if (cb) cb()
										}

									})
								})

							}else{
								if (cb) cb()
							}



						}else{
							if (cb) cb()
						}



					})

				}




			}else{
				if (cb) cb()	
			}
			
		})
	})
}

