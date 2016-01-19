"use strict"

var cluster = require('cluster');
var fs = require("fs")

if (cluster.isMaster) {


	//mssDb 1604 test for a lot of MMS items w/ no component matches

	var tmsSeralize = require("../lib/serialize_tms_resources_utils.js")
	var serializeUtils = require("../lib/serialize_utils.js")
	var clc = require('cli-color')
	var async = require("async")
	var file = require("../lib/file.js")

	var botCount = 11, activeBotCount = 0
	var activeRegistryID = 103740506
	var addToDbWorkQueue = []
	var workingQueue = false
	var objectsCommitedCount = 0, collectionsCompletedCount = 0
	var workLog = {}
	var bulkInsert = []
	var bulkInsertLimit = 998
	//1000 single item w/ capture no container


	
	//the data back from the bots gets added to this queue, it enumerates them with a registry ID and then commits them to the object store
	setInterval(function(){

		process.stdout.cursorTo(0)
		process.stdout.write(clc.black.bgGreenBright("serialize TMS Items | bots: " + activeBotCount + " queue:" + addToDbWorkQueue.length + " objects: " + objectsCommitedCount + " id: " + activeRegistryID + " cols.: " +  collectionsCompletedCount))

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

		//console.log(JSON.stringify(enumerated.objects,null,2))

		enumerated.objects.forEach(function(o){
			bulkInsert.push(o)
		})

		if (bulkInsert.length>bulkInsertLimit){

			tmsSeralize.getBulk(function(bulk){
				bulkInsert.forEach(function(b){						
					bulk.insert(b)
				})
				bulk.execute()
				bulkInsert=[]
				workingQueue = false
			})
		}else{
			workingQueue = false
		}


		



	},10)



	tmsSeralize.returnObjects(function(tmsObjectIds){


		var getWork = function(workId){
			if (tmsObjectIds.length == 0){
				return "die"
			}
			var record = JSON.parse(JSON.stringify(tmsObjectIds[0]._id))
			//delete this one
			tmsObjectIds.shift()

			workLog[workId] = { id: record, start: Math.floor(Date.now() / 1000) }

			return record
		}

		var buildWorker = function(){

			var worker = cluster.fork();
			console.log('Spawing worker:',worker.id)


			worker.on('message', function(msg) {
				//asking for work
				if (msg.request){

					if (addToDbWorkQueue.length>1000){
						//wait a sec to send to let the queue drain
						setTimeout(function(){
							worker.send({ work: getWork(worker.id) })
						},1000)
					}else{
						worker.send({ work: getWork(worker.id) })
					}
					


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

			//TODO FIX First bot is DOA when spawned...

			//send the first one
			worker.send({ work: getWork(worker.id) })
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
			//start inserting everything even if it not in a 1000 batch
			bulkInsertLimit = 0
			setInterval(function(){
				activeBotCount = Object.keys(cluster.workers).length
				if (addToDbWorkQueue.length===0 && bulkInsert.length === 0 && Object.keys(cluster.workers).length == 0){
					process.exit()
				}
			},10000)			
		}
	})



	

} else {
//
	
	var tmsSeralize = require("../lib/serialize_tms_resources_utils.js")

	var workingOn = ""

	setInterval(function(){ 

		if (workingOn===""){
			console.log("No more work, I'm leaving. 😵")
			cluster.worker.disconnect()
			process.exit()			
		}
	},10000)


	var processRecord = function(msg){

		if (msg.work){

			//console.log(cluster.worker.id,msg.work)

			//if (msg.work.toString().trim() == "") msg.work = "die"

			workingOn = JSON.parse(JSON.stringify(msg.work))

			if (msg.work==="die"){
				console.log("No more work, I'm leaving. 😵")
				cluster.worker.disconnect()
				process.exit()
			}


			tmsSeralize.serializeTmsObject(msg.work,function(objects){

				if (objects.length>10000){
					var file = fs.createWriteStream("data/temp/"+msg.work+'.ndjson')
					file.on('error', function(err) { console.log(err) })
					file.on('finish', function () {
						process.send({ results: "data/temp/"+msg.work+'.ndjson' })
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
