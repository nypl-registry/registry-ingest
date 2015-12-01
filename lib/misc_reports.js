"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")
var fs = require('fs');

require("string_score")


exports.agentsNonViaf = function(cb){


	db.returnDb(function(err,databaseConnection){
		if (err) console.log(err)

		var databaseAgents = databaseConnection.collection("agents")


		var cursor = databaseAgents.find().sort({ nameControlled: 1})

		cursor.on('data', function(agent) {

			console.log(agent._id, (agent.viaf) ? "tru": "fal",agent.nameControlled )

		})

		cursor.on('finish', function() {
			
			databaseConnection.close()

		})


	})


}










