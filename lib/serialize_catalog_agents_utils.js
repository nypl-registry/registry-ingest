"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")
var sanitizeHtml = require('sanitize-html')
require("string_score")



exports.prepareAgents = function(cb){
	db.prepareAgents(function(){
		if (cb) cb()
	})
}


//turns on a process to keep the agent queue populated from the database
exports.populateShadowcatAgentsBuildQueue = function(cb){

	exports.shadowCatAgentsQueue = []
	var queueTimer = null
	var resumeOn = false


	console.log("Connecting to shadowcat...")

	db.returnCollectionShadowcat("bib",function(err,shadowcatBib){

		console.log("Starting Cursor...")

		// _id: 16547127
		var cursor = shadowcatBib.find({ }, { 'sc:agents' : 1, 'sc:research' : 1 })

		queueTimer = setInterval(function(){
			if (exports.shadowCatAgentsQueue.length<50000){
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
				exports.shadowCatAgentsQueue.push({bnumber: doc._id, agents: doc['sc:agents']})
			}
		})

		cursor.once('end', function() {		
			setTimeout(function(){

				clearTimeout(queueTimer)
				exports.shadowCatAgentsQueue.push(null)

				//console.log("populateShadowcatAgentsViaf - Done!")
				//cb(++agentId)				
				//agentsDatabase.close()
			},5000)
		})



	})

}



//we creating an agent it needs to merge the source information (scAgent) with any VIAF data we have on had and a existing registry agent if it exists
exports.mergeScAgentViafRegistryAgent = function(scAgent, viaf, registryAgent,source){

	//if it has no registryAgent yet that means we are creating a new one
	if (scAgent && !registryAgent){

		var newAgent = {
			viaf: false,
			viafAll: [],
			registry: "temp" + Date.now() + Math.floor(Math.random() * (1000000 - 1)) + 1,
			nameControlled: false,
			wikidata: false,
			lcId: false,
			gettyId: false,
			dbpedia: false,
			birth: false,
			death: false,
			type: false,
			source: false,
			useCount: 0,
			altForms: [],
			nameNormalized: []
		}

		//if it has a VIAF then we need to incorporate that info
		if (viaf){

			newAgent.viaf = viaf._id
			newAgent.viafAll = [viaf._id]

			//we have the VIAF data lets fill that in
			if (viaf.lcTerm){
				newAgent.nameControlled = viaf.lcTerm
			}else if (viaf.viafTerm){
				newAgent.nameControlled = viaf.viafTerm
			}else{
				newAgent.nameControlled = scAgent.nameLocal
			}
			//lets collapse these too
			newAgent.nameControlled = newAgent.nameControlled.replace(/\s\(Spirit\)/gi,'')

			if (viaf.type) newAgent.type = viaf.type.toLowerCase()

			if (viaf.wikidataId) newAgent.wikidata = viaf.wikidataId
			if (viaf.lcId) newAgent.lcId = viaf.lcId
			if (viaf.gettyId) newAgent.gettyId = parseInt(viaf.gettyId)
			if (viaf.dbpedia) newAgent.dbpedia = viaf.dbpedia
			if (viaf.birth) newAgent.birth = viaf.birth
			if (viaf.death) newAgent.death = viaf.death

			if (viaf.lcTerm){
				var normal = utils.normalizeAndDiacritics(viaf.lcTerm).trim()
				if (newAgent.nameNormalized.indexOf(normal) === -1 && normal !== ''){
					newAgent.nameNormalized.push(normal)
					newAgent.altForms.push({name: viaf.lcTerm, type: "viaf.lcTerm", source: "catalog", id: source})
				}
			}
			if (viaf.viafTerm){
				var normal = utils.normalizeAndDiacritics(viaf.viafTerm).trim()
				if (newAgent.nameNormalized.indexOf(normal) === -1 && normal !== ''){
					newAgent.nameNormalized.push(normal)
					newAgent.altForms.push({name: viaf.viafTerm, type: "viaf.viafTerm", source: "catalog", id: source})

				}
			}
			if (scAgent.nameLocal){
				var normal = utils.normalizeAndDiacritics(scAgent.nameLocal).trim()
				if (newAgent.nameNormalized.indexOf(normal) === -1 && normal !== ''){
					newAgent.nameNormalized.push(normal)
					newAgent.altForms.push({name: viaf.nameLocal, type: "viaf.nameLocal", source: "catalog", id: source})
				}
			}

			return newAgent

		}else if (!viaf && scAgent.viaf){

			//this is a potential problem, there is a VIAF id, but we did not find it in our lookup table, record an error
			errorLib.error("Agent Serialization - Catalog - No VIAF found in lookup table", JSON.stringify(scAgent))

			//we have no VIAF info and no existing registry agent, populate the registry agent based on what we have from the scagent
			if (scAgent.nameLc){
				newAgent.nameControlled = scAgent.nameLc
			}else if (scAgent.nameViaf){
				newAgent.nameControlled = scAgent.nameViaf
			}else{
				newAgent.nameControlled = scAgent.nameLocal
			}

			if (scAgent.type) newAgent.type = scAgent.type.toLowerCase()
			//we do not trust the VIAF number
			//newAgent.viaf = scAgent.viaf

			if (scAgent.nameLc){
				var normal = utils.normalizeAndDiacritics(scAgent.nameLc).trim()
				if (newAgent.nameNormalized.indexOf(normal) === -1 && normal !== '') {
					newAgent.nameNormalized.push(normal)
					newAgent.altForms.push({name: scAgent.nameLc, type: "scAgent.nameLc", source: "catalog", id: source})
				}
			}
			if (scAgent.nameViaf){
				var normal = utils.normalizeAndDiacritics(scAgent.nameViaf).trim()
				if (newAgent.nameNormalized.indexOf(normal) === -1 && normal !== '') {
					newAgent.nameNormalized.push(normal)
					newAgent.altForms.push({name: scAgent.nameViaf, type: "scAgent.nameViaf",source: "catalog", id: source})
				}
			}
			if (scAgent.nameLocal){
				var normal = utils.normalizeAndDiacritics(scAgent.nameLocal).trim()
				if (newAgent.nameNormalized.indexOf(normal) === -1 && normal !== '') {
					newAgent.nameNormalized.push(normal)
					newAgent.altForms.push({name: scAgent.nameLocal, type: "scAgent.nameLocal",source: "catalog", id: source})
				}
			}

			return newAgent

		}else{

			//there is no agent and also we don't have any VIAF info, so populate what we can

			if (scAgent.nameLc){
				newAgent.nameControlled = scAgent.nameLc
			}else if (scAgent.nameViaf){
				newAgent.nameControlled = scAgent.nameViaf
			}else{
				newAgent.nameControlled = scAgent.nameLocal
			}
			newAgent.type = scAgent.type.toLowerCase()

			if (scAgent.nameLc){
				var normal = utils.normalizeAndDiacritics(scAgent.nameLc).trim()
				if (newAgent.nameNormalized.indexOf(normal) === -1 && normal !== ''){
					newAgent.nameNormalized.push(normal)
					newAgent.altForms.push({name: scAgent.nameLc, type: "scAgent.nameLc", source: "catalog", id: source})
				}
			}
			if (scAgent.nameViaf){
				var normal = utils.normalizeAndDiacritics(scAgent.nameViaf).trim()
				if (newAgent.nameNormalized.indexOf(normal) === -1 && normal !== ''){
					newAgent.nameNormalized.push(normal)
					newAgent.altForms.push({name: scAgent.nameViaf, type: "scAgent.nameViaf",source: "catalog", id: source})
				}
			}
			if (scAgent.nameLocal){
				var normal = utils.normalizeAndDiacritics(scAgent.nameLocal).trim()
				if (newAgent.nameNormalized.indexOf(normal) === -1 && normal !== ''){
					newAgent.nameNormalized.push(normal)
					newAgent.altForms.push({name: scAgent.nameLocal, type: "scAgent.nameLocal",source: "catalog", id: source})
				}
			}

			return newAgent


		}

	}else if (scAgent && registryAgent){


		//we have the registry agent if it already has a VIAF id then that means it was properly setup eariler so we just need to populate possibly new normalized values


		if (!registryAgent.viaf && viaf){

			//the existing registry agent does not have VIAF data yet, we can populate what we know
			if (viaf.type) registryAgent.type = viaf.type.toLowerCase()
			registryAgent.viaf = viaf._id

			newAgent.viafAll = [viaf._id]

			if (viaf.wikidataId) registryAgent.wikidata = viaf.wikidataId
			if (viaf.lcId) registryAgent.lcId = viaf.lcId
			if (viaf.gettyId) registryAgent.gettyId = parseInt(viaf.gettyId)
			if (viaf.dbpedia) registryAgent.dbpedia = viaf.dbpedia
			if (viaf.birth) registryAgent.birth = viaf.birth
			if (viaf.death) registryAgent.death = viaf.death

			if (viaf.lcTerm){
				var normal = utils.normalizeAndDiacritics(viaf.lcTerm).trim()
				if (registryAgent.nameNormalized.indexOf(normal) === -1 && normal !== '') {
					registryAgent.nameNormalized.push(normal)
					registryAgent.altForms.push({name: viaf.lcTerm, type: "viaf.lcTerm",source: "catalog", id: source})
				}
			}
			if (viaf.viafTerm){
				var normal = utils.normalizeAndDiacritics(viaf.viafTerm).trim()
				if (registryAgent.nameNormalized.indexOf(normal) === -1 && normal !== '') {
					registryAgent.nameNormalized.push(normal)
					registryAgent.altForms.push({name: viaf.viafTerm, type: "viaf.viafTerm",source: "catalog", id: source})
				}
			}
			if (scAgent.nameLocal){
				var normal = utils.normalizeAndDiacritics(scAgent.nameLocal).trim()
				if (registryAgent.nameNormalized.indexOf(normal) === -1 && normal !== '') {
					registryAgent.nameNormalized.push(normal)
					registryAgent.altForms.push({name: viaf.nameLocal, type: "viaf.nameLocal",source: "catalog", id: source})
				}
			}

			return registryAgent

		}else if (registryAgent.viaf){

			//it already has VIAF information just populate any new normalized names
			if (scAgent.nameLocal){
				var normal = utils.normalizeAndDiacritics(scAgent.nameLocal).trim()
				if (registryAgent.nameNormalized.indexOf(normal) === -1 && normal !== '') {
					registryAgent.nameNormalized.push(normal)
					registryAgent.altForms.push({name: scAgent.nameLocal, type: "scAgent.nameLocal",source: "catalog", id: source})
				}
			}

			return registryAgent

		}else if (!registryAgent.viaf && !viaf){

			//This is jsut a locally matched name, add in any new local normalized names
			//it already has VIAF information just populate any new normalized names
			if (scAgent.nameLocal){
				var normal = utils.normalizeAndDiacritics(scAgent.nameLocal).trim()
				if (registryAgent.nameNormalized.indexOf(normal) === -1 && normal !== '') {
					registryAgent.nameNormalized.push(normal)
					registryAgent.altForms.push({name: scAgent.nameLocal, type: "scAgent.nameLocal",source: "catalog", id: source})

				}
			}

			return registryAgent



		}


		
	}


	//if it got here we have problems
	errorLib.error("Agent Serialization - Catalog - Could not serialize this agent!", JSON.stringify({"scAgent" : scAgent, "viaf" : viaf, "registryAgent" : registryAgent }))

	return false

}

