"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")
var fs = require('fs')
var serializeUtils = require("../lib/serialize_utils.js")

require("string_score")



exports.returnObjects = function(cb){
	db.returnCollectionRegistry('tmsObjects',function(err,tmsObjects){
		tmsObjects.find( { $or : [ { matchedMms :{$exists: false} }, { matchedMms : false }]  }, { _id: 1 } ).toArray(function(err, objects){
			cb(objects)
		})
	})
}


exports.getBulk = function(cb){	
	db.newTripleStoreBulkOp('resources',function(bulk){
		cb(bulk)
	})
}

exports.serializeTmsObject = function(tmsId, cb){

	serializeUtils.buildTmsTriples(tmsId,function(tmsObj){

		if (tmsObj) cb([tmsObj])

	})



}
