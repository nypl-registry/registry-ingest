"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")
var sanitizeHtml = require('sanitize-html')
var serializeGeneral = require("../lib/serialize_utils.js")

require("string_score")



exports.getBulk = function(cb){	
	db.newTripleStoreBulkOp('resources',function(bulk){
		cb(bulk)
	})
}


//turns on a process to keep the agent queue populated from the database
exports.populateShadowcatResourceBuildQueue = function(cb){

	exports.shadowCatResourceQueue = []
	var queueTimer = null
	var resumeOn = false


	console.log("Connecting to shadowcat...")

	db.returnCollectionShadowcat("bib",function(err,shadowcatBib){

		console.log("Starting Cursor...")

		// _id: 16547127
		var cursor = shadowcatBib.find({ 'sc:research' : true }, { _id: 1 })

		queueTimer = setInterval(function(){
			if (exports.shadowCatResourceQueue.length<2000){
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
			//if (doc['sc:research']){
			exports.shadowCatResourceQueue.push({bnumber: doc._id, agents: doc['sc:agents']})
			//}
		})

		cursor.once('end', function() {		
			setTimeout(function(){

				clearTimeout(queueTimer)
				exports.shadowCatResourceQueue.push(null)

				//console.log("populateShadowcatAgentsViaf - Done!")
				//cb(++agentId)				
				//agentsDatabase.close()
			},5000)
		})



	})

}


exports.processResource = function(bNumber, cb){


	db.returnCollectionRegistry('serialized',function(err,databaseSerialized){

		serializeGeneral.checkSerialized(databaseSerialized,'catalog'+bNumber,function(isSerialized){

			if (isSerialized){				
				cb(false)
				return
			}else{
				serializeGeneral.buildShadowcatTriples(bNumber,function(results){
					//serializeGeneral.markSerialized(databaseSerialized,'catalog'+bNumber)
					var allObjects = [results.bibObj]
					results.itemsObj.forEach(function(i){ allObjects.push(i) })
					cb(allObjects)
				})


			}


		})



	})



}







