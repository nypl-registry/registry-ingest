"use strict"

var cluster = require('cluster');


if (cluster.isMaster) {


	//mssDb 1604 test for a lot of MMS items w/ no component matches


	var archivesSeralize = require("../lib/serialize_archives_resources_utils.js")
	var serializeUtils = require("../lib/serialize_utils.js")
	var clc = require('cli-color')
	var async = require("async")


	var botCount = 10, activeBotCount = 0
	var activeRegistryID = 100000000
	var addToDbWorkQueue = []
	var workingQueue = false
	var objectsCommitedCount = 0, collectionsCompletedCount = 0



	//the data back from the bots gets added to this queue, it enumerates them with a registry ID and then commits them to the object store
	setInterval(function(){

		process.stdout.cursorTo(0)
		process.stdout.write(clc.black.bgGreenBright("serialize Archives | bots: " + activeBotCount + " queue:" + addToDbWorkQueue.length + " objects: " + objectsCommitedCount + " id: " + activeRegistryID + " cols.: " +  collectionsCompletedCount))

		if (workingQueue){
			return false
		}else{
			workingQueue = true
		}	

		if (addToDbWorkQueue.length===0){
			workingQueue = false
			return false
		}

		var objects = addToDbWorkQueue[0]
		addToDbWorkQueue.shift()


		var enumerated = serializeUtils.enumerateObjects(objects,activeRegistryID)

		activeRegistryID = enumerated.registryId



		for (var x = 0; x < (enumerated.objects.length/1000) + 1; x++){

			process.nextTick(function( ){
				var batch = enumerated.objects.splice(0,1000)
				if (batch.length>0){
					archivesSeralize.getBulk(function(bulk){
						batch.forEach(function(b){						
							bulk.insert(b)
						})
						bulk.execute()
					})
				}
			})
		}
		

		workingQueue = false



	},10)

	





	archivesSeralize.returnAllCollectionIds(function(collectionIds){


		var getWork = function(){
			if (collectionIds.length == 0){
				return "die"
			}
			var record = JSON.parse(JSON.stringify(collectionIds[0]._id))
			//delete this one
			collectionIds.shift()
			return record
		}

		var buildWorker = function(){

			var worker = cluster.fork();
			console.log('Spawing worker:',worker.id)


			worker.on('message', function(msg) {
				//asking for work
				if (msg.request){					
					worker.send({ work: getWork() })
				}
				//returning results
				if (msg.results){


					if (typeof msg.results == 'string'){		
						var c = 0, allObjects = []
						file.streamJsonFile(msg.results, function(record,recordCb){
							if (record){
								//console.log("Reading large file",c++)
								allObjects.push(record)
								recordCb()
							}else{
								addToDbWorkQueue.push( allObjects )
							}							
						})

					}else{
						addToDbWorkQueue.push( msg.results )
					}

					
					collectionsCompletedCount++


				}
			})


			//send the first one
			worker.send({ work: getWork() })
			activeBotCount++

		}

		for (var i = 1; i <= botCount; i++) {
			setTimeout(function(){
				buildWorker()
			}, Math.floor(Math.random() * (10000 - 0)))
		}

	})



	cluster.on('disconnect', function(worker, code, signal) {
		activeBotCount = Object.keys(cluster.workers).length
		if (Object.keys(cluster.workers).length < 3){
			setInterval(function(){
				if (addToDbWorkQueue.length===0 && Object.keys(cluster.workers).length == 1){
					process.exit()
				}
			},10000)			
		}
	})


	

} else {

	var archivesSeralize = require("../lib/serialize_archives_resources_utils.js")


	// var mmsMappingStrategies = require("../lib/mms_mapping_strategies.js")



	var processRecord = function(msg){

		if (msg.work){



			if (msg.work==="die"){
				console.log("No more work, I'm leaving. 😵")
				cluster.worker.disconnect()
				process.exit()
			}

			// mmsMappingStrategies.returnMmsCollectionDetails(record,function(err,data){

			archivesSeralize.serializeArchives(msg.work,function(objects){


				if (objects.length>10000){


					var file = fs.createWriteStream("data/temp/archives"+msg.work+'.ndjson')
					file.on('error', function(err) { console.log(err) })
					file.on('finish', function () {
						process.send({ results: "data/temp/archives"+msg.work+'.ndjson' })
						process.send({ request: true })							
					})
					var c = 0
					objects.forEach(function(o) { file.write( JSON.stringify(o) + '\n') })
					file.end()


				}else{

					process.send({ results: objects })
					process.send({ request: true })	

				}




			})
		}


	}



	process.on('message', processRecord)





}
