"use strict"

var fs = require("fs")
var mmsSeralize = require("../lib/serialize_mms_resources_utils.js")
var serializeUtils = require("../lib/serialize_utils.js")
var clc = require('cli-color')
var async = require("async")


function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


	// //the data back from the bots gets added to this queue, it enumerates them with a registry ID and then commits them to the object store
	// setInterval(function(){

	// 	process.stdout.cursorTo(0)
	// 	process.stdout.write(clc.black.bgGreenBright("serialize MMS Collections | bots: " + activeBotCount + " queue:" + addToDbWorkQueue.length + " objects: " + objectsCommitedCount + " id: " + activeRegistryID + " cols.: " +  collectionsCompletedCount))

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

	// 	for (var x = 0; x < (enumerated.objects.length/1000) + 1; x++){

	// 		process.nextTick(function( ){
	// 			var batch = enumerated.objects.splice(0,999)
	// 			if (batch.length>0){
	// 				mmsSeralize.getBulk(function(bulk){
	// 					batch.forEach(function(b){						
	// 						bulk.insert(b)
	// 					})
	// 					bulk.execute()
	// 				})
	// 			}
	// 		})
	// 	}


	// 	workingQueue = false
	


	// },10)

	// setInterval(function(){
	// 	for (var x in workLog){
	// 		workLog[x].workTime = Math.floor((Math.floor(Date.now() / 1000) - workLog[x].start) / 60) + " min."
	// 	}
	// 	console.log(JSON.stringify(workLog,null,2))
	// },60000)



console.log("Loading all Collection UUIDs")

serializeUtils.returnNextResourceUri(function(resourceUri){

	mmsSeralize.returnAllCollectionIds(function(collectionIds){

		collectionIds = shuffle(collectionIds)
		// var workIds = []

		// collectionIds.forEach(collectionUuid => {
		// 	collectionUuid = collectionUuid._id		
		// 	mmsSeralize.countItemsInMmsCollection(collectionUuid,function(count){	
		// 		if (count>30000){
		// 			workIds.push(collectionUuid)		
					
		// 			// mmsSeralize.serializeMmsCollections(collectionUuid,function(objects){
		// 			// 	if (objects.length>10000){
		// 			// 		var file = fs.createWriteStream("data/temp/"+collectionUuid+'.ndjson')
		// 			// 		file.on('error', function(err) { console.log(err) })
		// 			// 		file.on('finish', function () {
		// 			// 			process.send({ results: "data/temp/"+collectionUuid+'.ndjson' })
		// 			// 			process.send({ request: true })							
		// 			// 		})
		// 			// 		var c = 0
		// 			// 		objects.forEach(function(o) { file.write( JSON.stringify(o) + '\n') })
		// 			// 		file.end()	
		// 			// 	}else{
		// 			// 		process.send({ results: objects })
		// 			// 		process.send({ request: true })	
		// 			// 	}
		// 			// })				
		// 		}
		// 	})
		// })

		collectionIds = [{_id: '51894d20-c52f-012f-657d-58d385a7bc34'}]
		collectionIds = [{_id: '79d4a650-c52e-012f-67ad-58d385a7bc34'}]

		
		async.eachSeries(collectionIds,function(collectionUuid,callback){
			collectionUuid = collectionUuid._id
			mmsSeralize.countItemsInMmsCollection(collectionUuid,function(count){	
				if (count>10000){
					console.log("DO!",collectionUuid)
					mmsSeralize.serializeMmsCollections(collectionUuid,function(objects,newResourceUri){

						console.log("Done")

						var file = fs.createWriteStream('test.jsonnd')
						file.on('finish', function () {
							callback()
						})
						objects.forEach(function(o) { file.write( JSON.stringify(o) + '\n') })						
						resourceUri = newResourceUri
						
					},resourceUri)					
				}else{
					callback()
				}
			})	

		}, function(err, results){


			console.log("DONE!")
			process.exit()

		})

	})

})


