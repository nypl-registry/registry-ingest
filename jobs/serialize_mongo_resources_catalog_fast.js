"use strict"

var cluster = require('cluster')
var serialize = require("../lib/serialize_catalog_resources_utils.js")
var serializeGeneral = require("../lib/serialize_utils.js")


if (cluster.isMaster) {
	var clc = require('cli-color')
	var async = require('async')

	

	var countBibRecords = 0, countTotal = 0, activeBotCount = 0

	var activeRegistryID = 104026257	
	var addToDbWorkQueue = []
	//var workingQueue = false
	//var objectsCommitedCount = 0
	// var bulkInsert = []
	// var bulkInsertLimit = 998


	// setInterval(function(){

	// 	process.stdout.cursorTo(0)
	// 	process.stdout.write(clc.black.bgGreenBright("serialize Catalog Items | bots: " + activeBotCount + " queue:" + addToDbWorkQueue.length + " objects: " + objectsCommitedCount + " id: " + activeRegistryID + " bibs.: " +  countBibRecords))



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

	// 	var enumerated = serializeGeneral.enumerateObjects(objects,activeRegistryID)

	// 	activeRegistryID = enumerated.registryId


	// 	async.each(enumerated.objects, function(object, eachCallback) {
	// 		objectsCommitedCount++
	// 		bulkInsert.push(object)
	// 		eachCallback()
	// 	}, function(err){


	// 		if (bulkInsert.length>bulkInsertLimit){
	// 			console.log("BULK")

	// 			serialize.getBulk(function(bulk){
	// 				bulkInsert.forEach(function(b){						
	// 					bulk.insert(b)
	// 				})
	// 				bulk.execute(function(err, result) {
	// 					if (err){
	// 						console.log(err)
	// 					}

	// 				})


	// 				bulkInsert=[]
	// 				workingQueue = false
	// 			})


	// 		}else{
	// 			workingQueue = false
	// 		}

			
	// 	})


	// },10)



	console.log("Initializing shadowcat Resource Queue")
	

		serialize.populateShadowcatResourceBuildQueue(function(){

			console.log("Finding Starting Agent Id")
			//serializeGeneral.returnMaxAgentId(function(agentId){

				//console.log("Using",agentId)
				//console.log(serialize.shadowCatResourceQueue[0])

				var spawnTimer = setInterval(function(){
					if (Object.keys(cluster.workers).length==1){
						clearInterval(spawnTimer)
					}else{

						var worker = cluster.fork()
						activeBotCount = Object.keys(cluster.workers).length
						console.log("Building Worker")
						worker.on('message', function(msg) {

							if (serialize.shadowCatResourceQueue[0]===null){
								//drain the rest of the queue
								bulkInsertLimit = 0

								console.log("Sendiing QUIT msg",Object.keys(cluster.workers).length)
								
								//that is it, we've reached the end
								worker.send({ quit: true })


								setInterval(function(){
									if (Object.keys(cluster.workers).length<2){
										console.log("Finished Working records.")
										console.log("Catalog Resources | countBibRecords: " + countBibRecords + " countTotal: " + countTotal)
										console.log("Catalog Resources | countBibRecords: " + countBibRecords + " countTotal: " + countTotal)
										process.exit()
									}
								},1000)
								return false
							}



							if (msg.req) {
								//console.log("serialize.shadowCatResourceQueue.length:",serialize.shadowCatResourceQueue.length)
								//they are asking for new work							
								if (serialize.shadowCatResourceQueue.length>0){


									
									

									if (addToDbWorkQueue.length>1000){

										setTimeout(function(){
											var workItem = serialize.shadowCatResourceQueue.splice(0,1)
											worker.send({ req: workItem })
										},1000)

									}else{
										var workItem = serialize.shadowCatResourceQueue.splice(0,1)
										worker.send({ req: workItem })
									}

									
								}else{
									console.log("Nothing left to work in the queue!")
									worker.send({ sleep: true })
								}
							}
							if (msg.results) {
								addToDbWorkQueue.push( msg.results )
							}


							if (msg.countBibRecords) {
								countBibRecords++
							}


					
							msg = null
							workItem = null


							return true



						})

					}
				},1000)



				//setup request





			//})
		})



}else{


	var async = require("async")
	var workedInLastMin = false
	var activeData = null
	var activeRegistryID = (7000000*cluster.worker.id)+100000000
	var bulkInsert = []


	setInterval(function(){
		if (!workedInLastMin){
			console.log('Worker #',cluster.worker.id, " I havent worked in the last min: ",activeData)
		}else{
			workedInLastMin = false
		}
	},60000)

	
	console.log("Im using--->",  activeRegistryID)

	var processResource = function(msg) {

		workedInLastMin = true

		if (msg.sleep){
			console.log('Worker #',cluster.worker.id," No work! Going to sleep for 300 sec ")
			setTimeout(function(){process.send({ req: true });},30000)
			return true
		}

		if (msg.quit){
			console.log('Worker #',cluster.worker.id," Done, quiting ")
			process.exit()
			return true
		}


		process.send({ countBibRecords: true })

		serialize.processResource(msg.req[0].bnumber,function(results){



			if (results){

				var enumerated = serializeGeneral.enumerateObjects(results,activeRegistryID)
				activeRegistryID = enumerated.registryId


				enumerated.objects.forEach(function(o){
					bulkInsert.push(o)
				})

				if (bulkInsert.length>100){

					var insertData = JSON.parse(JSON.stringify(bulkInsert))
					bulkInsert = []
					console.log(insertData.length)




				}



				// async.each(enumerated.objects, function(object, eachCallback) {					
				// 	bulkInsert.push(object)
				// 	eachCallback()
				// }, function(err){
					
				// 	if (bulkInsert)

				// 	serialize.getBulk(function(bulk){
				// 		bulkInsert.forEach(function(b){						
				// 			bulk.insert(b)
				// 		})
				// 		bulk.execute(function(err, result) {
				// 			if (err){
				// 				console.log(err)
				// 			}

				// 		})


				// 		bulkInsert=[]
				// 		workingQueue = false





				// })





				process.send({ req: true })

			}else{


				process.send({ req: true })




			}


		})



		// serialize.processResource(msg.req[0].bnumber,function(results){
			
		// 	if (results){
		// 		process.send({ results: results })
		// 		process.send({ req: true })
		// 	}else{
		// 		process.send({ req: true })
		// 	}
		// })



	} 


	process.on('message', processResource)
	process.send({ req: true });

}

