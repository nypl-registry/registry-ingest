"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")
require("string_score")



exports.prepareTerms = function(cb){
	db.prepareTerms(function(){
		if (cb) cb()
	})
}


//turns on a process to keep the agent queue populated from the database
exports.populateShadowcatTermsBuildQueue = function(cb){

	exports.shadowCatTermsQueue = []
	var queueTimer = null
	var resumeOn = true


	console.log("Connecting to shadowcat...")

	db.returnCollectionShadowcat("bib",function(err,shadowcatBib){

		console.log("Starting Cursor...")

		// _id: 16547127
		var cursor = shadowcatBib.find({ }, { 'sc:terms' : 1, 'sc:research' : 1 })

		queueTimer = setInterval(function(){

			if (exports.shadowCatTermsQueue.length<20000){
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
				exports.shadowCatTermsQueue.push({bnumber: doc._id, terms: doc['sc:terms']})
			}
		})

		cursor.once('end', function() {		
			setTimeout(function(){

				clearTimeout(queueTimer)
				exports.shadowCatTermsQueue.push(null)

				//console.log("populateShadowcatAgentsViaf - Done!")
				//cb(++agentId)				
				//agentsDatabase.close()
			},5000)
		})
	})

}




