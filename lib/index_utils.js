"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")
var elasticsearch = require('elasticsearch')


exports.indexAgents = function(cb){


	var totalAgents = 0, totalDeleted = 0


	var client = new elasticsearch.Client({
		host: config['Elasticsearch'].host
	});


	var body = {
	    agent:{
	        properties:{
	            birth         : {"type" : "string", "index" : "not_analyzed"},
	            death        : {"type" : "string", "index" : "not_analyzed"}
	        }
	    }
	}



	client.indices.delete({
    	index: 'agents'

	}, function(err, res) {

		client.indices.create({
	    	index: 'agents'
	    	
		}, function(err, res) {

			client.indices.putMapping({index:"agents", type:"agent", body:body});

			db.returnCollectionRegistry("agents",function(err,agents){

				
				var cursor = agents.find({ }).stream()

				cursor.on('data', function(agent) {
					process.stdout.cursorTo(0)
					process.stdout.write(clc.black.bgBlueBright("indexAgents | totalAgents: " + ++totalAgents  ))

					cursor.pause()

					client.create({
					  index: 'agents',
					  type: 'agent',
					  //id: '1',
					  body: {
					    registry: agent.registry,
					    name: agent.nameControlled,
					    wikidata: agent.wikidata,
					    lcId: agent.lcId,
					    wikipedia: (agent.wikidataSlug) ? agent.wikidataSlug : agent.dbpedia,
					    birth: agent.birth,
					    death: agent.death,
					    type: agent.type,
					    desc: (agent.wikidataDesc) ? agent.wikidataDesc : false,
					    image: (agent.wikidataImage) ? agent.wikidataImage : false
					  }
					}, function (error, response) {
						if (error) console.log(error)
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
		})
	})

}


