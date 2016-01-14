"use strict"

var cluster = require('cluster');


if (cluster.isMaster) {


	//mssDb 1604 test for a lot of MMS items w/ no component matches


	var mmsSeralize = require("../lib/serialize_mms_resources_utils.js")
	var serializeUtils = require("../lib/serialize_utils.js")
	var clc = require('cli-color')
	var async = require("async")


	var botCount = 10, activeBotCount = 0
	var activeRegistryID = 100000000
	var addToDbWorkQueue = []
	var workingQueue = false
	var objectsCommitedCount = 0, collectionsCompletedCount = 0

	//1000 single item w/ capture no container
	//3301 the fucking maps collections


	mmsSeralize.returnAllCollectionIds(function(collectionIds){


		console.log(collectionIds[0]._id)

		
		mmsSeralize.serializeMmsCollections(collectionIds[0]._id,function(objects){


		})

	})





	// //the data back from the bots gets added to this queue, it enumerates them with a registry ID and then commits them to the object store
	// setInterval(function(){

	// 	process.stdout.cursorTo(0)
	// 	process.stdout.write(clc.black.bgGreenBright("serialize Archives | bots: " + activeBotCount + " queue:" + addToDbWorkQueue.length + " objects: " + objectsCommitedCount + " id: " + activeRegistryID + " cols.: " +  collectionsCompletedCount))

	// 	if (workingQueue){
	// 		return false
	// 	}else{
	// 		workingQueue = true
	// 	}	

	// 	if (addToDbWorkQueue.length===0){
	// 		workingQueue = false
	// 		return false
	// 	}

	// 	var objects = addToDbWorkQueue[0]
	// 	addToDbWorkQueue.shift()


	// 	var enumerated = serializeUtils.enumerateObjects(objects,activeRegistryID)

	// 	activeRegistryID = enumerated.registryId

	// 	async.each(enumerated.objects, function(object, eachCallback) {
	// 		objectsCommitedCount++
	// 		eachCallback()
	// 	}, function(err){
	// 		workingQueue = false
	// 	})


	// },10)

	





	// mmsSeralize.returnAllCollectionIds(function(collectionIds){


	// 	var getWork = function(){
	// 		if (collectionIds.length == 0){
	// 			return "die"
	// 		}
	// 		var record = JSON.parse(JSON.stringify(collectionIds[0]._id))
	// 		//delete this one
	// 		collectionIds.shift()
	// 		return record
	// 	}

	// 	var buildWorker = function(){

	// 		var worker = cluster.fork();
	// 		console.log('Spawing worker:',worker.id)


	// 		worker.on('message', function(msg) {
	// 			//asking for work
	// 			if (msg.request){					
	// 				worker.send({ work: getWork() })
	// 			}
	// 			//returning results
	// 			if (msg.results){
	// 				addToDbWorkQueue.push(msg.results)
	// 				collectionsCompletedCount++

	// 			}
	// 		})


	// 		//send the first one
	// 		worker.send({ work: getWork() })
	// 		activeBotCount++

	// 	}

	// 	for (var i = 1; i <= botCount; i++) {
	// 		setTimeout(function(){
	// 			buildWorker()
	// 		}, Math.floor(Math.random() * (10000 - 0)))
	// 	}

	// })



	// cluster.on('disconnect', function(worker, code, signal) {
	// 	activeBotCount = Object.keys(cluster.workers).length
	// 	if (Object.keys(cluster.workers).length === 1){
	// 		setInterval(function(){
	// 			if (addToDbWorkQueue.length===0){
	// 				process.exit()
	// 			}
	// 		},10000)			
	// 	}
	// })



	

} else {

	// var mmsSeralize = require("../lib/serialize_archives_resources_utils.js")


	// // var mmsMappingStrategies = require("../lib/mms_mapping_strategies.js")



	// var processRecord = function(msg){

	// 	if (msg.work){



	// 		if (msg.work==="die"){
	// 			console.log("No more work, I'm leaving. 😵")
	// 			cluster.worker.disconnect()
	// 			process.exit()
	// 		}

	// 		// mmsMappingStrategies.returnMmsCollectionDetails(record,function(err,data){

	// 		mmsSeralize.serializeArchives(msg.work,function(objects){
	// 			process.send({ results: objects })
	// 			process.send({ request: true })	

	// 		})
	// 	}


	// }



	// process.on('message', processRecord)





}
