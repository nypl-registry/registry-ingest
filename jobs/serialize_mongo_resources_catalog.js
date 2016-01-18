"use strict"

var cluster = require('cluster')
var serialize = require("../lib/serialize_catalog_resources_utils.js")
var serializeGeneral = require("../lib/serialize_utils.js")


if (cluster.isMaster) {
	var clc = require('cli-color')
	var async = require('async')

	

	var countBibRecords = 0, countTotal = 0, activeBotCount = 0

	var activeRegistryID = 100000000
	var addToDbWorkQueue = []
	var workingQueue = false
	var objectsCommitedCount = 0
	setInterval(function(){

		process.stdout.cursorTo(0)
		process.stdout.write(clc.black.bgGreenBright("serialize TMS Items | bots: " + activeBotCount + " queue:" + addToDbWorkQueue.length + " objects: " + objectsCommitedCount + " id: " + activeRegistryID + " bibs.: " +  countBibRecords))



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

		var enumerated = serializeGeneral.enumerateObjects(objects,activeRegistryID)

		activeRegistryID = enumerated.registryId

		//console.log(JSON.stringify(enumerated.objects,null,2))


		async.each(enumerated.objects, function(object, eachCallback) {
			objectsCommitedCount++
			eachCallback()
		}, function(err){
			workingQueue = false
		})


	},10)








	console.log("Initializing shadowcat Resource Queue")
	

		serialize.populateShadowcatResourceBuildQueue(function(){

			console.log("Finding Starting Agent Id")
			//serializeGeneral.returnMaxAgentId(function(agentId){

				//console.log("Using",agentId)
				//console.log(serialize.shadowCatResourceQueue[0])

				var spawnTimer = setInterval(function(){
					if (Object.keys(cluster.workers).length==10){
						clearInterval(spawnTimer)
					}else{

						var worker = cluster.fork()
						activeBotCount = Object.keys(cluster.workers).length
						console.log("Building Worker")
						worker.on('message', function(msg) {

							if (serialize.shadowCatResourceQueue[0]===null){
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
									var workItem = serialize.shadowCatResourceQueue.splice(0,1)

									worker.send({ req: workItem })
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

	setInterval(function(){
		if (!workedInLastMin){
			console.log('Worker #',cluster.worker.id, " I havent worked in the last min: ",activeData)
		}else{
			workedInLastMin = false
		}
	},60000)


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
				process.send({ results: results })
				process.send({ req: true })
			}else{
				process.send({ req: true })
			}
		})

		// if (msg.req[0].agents){
		// 	if (msg.req[0].agents.length>0){

		// 		var scAgents = msg.req[0].agents

		// 		activeData = msg.req[0]

		// 		async.eachSeries(scAgents, function(agent, eachCallback) {

		// 			var aAgent = JSON.parse(JSON.stringify(agent))
		// 			var newAgent = {}


		// 			//we don't care about non VIAF in this pass
		// 			if (aAgent.viaf){

		// 				serializeGeneral.returnViafData(aAgent.viaf, function(viaf){

		// 					serializeGeneral.returnAgentByViaf(aAgent.viaf, function(savedAgent){

		// 						var updateAgent = serialize.mergeScAgentViafRegistryAgent(aAgent,viaf,savedAgent)
		// 						updateAgent.useCount++
		// 						updateAgent.source = "catalog"+msg.req[0].bnumber
								
		// 						if (updateAgent.nameControlled){
		// 							updateAgent.nameControlled = updateAgent.nameControlled.trim() 
		// 							serializeGeneral.addAgentByViaf(updateAgent,function(){
		// 								eachCallback()
		// 							})	
		// 						}else{
		// 							//If there is no controlled name we do not want to use it
		// 							eachCallback()
		// 						}
		// 						process.send({ countTotal: true })			
		// 					})
		// 				})	
		// 			}else{
		// 				eachCallback()
		// 			}			

		// 		}, function(err){
		// 		   	if (err) console.log(err)


		// 		   	//done
		// 			process.nextTick(function(){	
		// 				process.send({ req: true })
		// 			})		

		// 		})

		// 	}else{
		// 	   	//done
		// 		process.nextTick(function(){	
		// 			process.send({ req: true })
		// 		})
		// 	}
		// }else{
		// 	console.log("Empty record.")
		// 	process.nextTick(function(){	
		// 		process.send({ req: true })
		// 	})			
		// }


	} 


	process.on('message', processResource)
	process.send({ req: true });

}

