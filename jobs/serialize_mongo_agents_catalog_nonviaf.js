"use strict"

var cluster = require('cluster')
var serialize = require("../lib/serialize_catalog_agents_utils.js")
var serializeGeneral = require("../lib/serialize_utils.js")
var utils = require("../lib/utils.js")



if (cluster.isMaster) {

	
	var countBibRecords = 0, countTotal = 0

	console.log("Initializing shadowcat agent Queue")

	serialize.populateShadowcatAgentsBuildQueue(function(){

		console.log("Finding Starting Agent Id")
		serializeGeneral.returnMaxAgentId(function(agentId){

			console.log("Using",agentId)
			//console.log(serialize.shadowCatAgentsQueue[0])

			var spawnTimer = setInterval(function(){
				if (Object.keys(cluster.workers).length==50){
					clearInterval(spawnTimer)
				}else{

					var worker = cluster.fork()

					worker.on('message', function(msg) {


						if (serialize.shadowCatAgentsQueue[0]===null){
							console.log("Sending QUIT msg",Object.keys(cluster.workers).length)
							//that is it, we've reached the end
							worker.send({ quit: true })
							setTimeout(function(){
								if (Object.keys(cluster.workers).length==1||Object.keys(cluster.workers).length==0){
									console.log("Finished Working records.")
									console.log("Agents | countBibRecords: " + countBibRecords + " countTotal: " + countTotal)
									console.log("Agents | countBibRecords: " + countBibRecords + " countTotal: " + countTotal)
									process.exit()
								}
							},1000)
							return false
						}




						if (msg.req) {
							//console.log("serialize.shadowCatAgentsQueue.length:",serialize.shadowCatAgentsQueue.length)
							//they are asking for new work							
							if (serialize.shadowCatAgentsQueue.length>0){
								var workItem = serialize.shadowCatAgentsQueue.splice(0,1)

								worker.send({ req: workItem })
							}else{
								console.log("Nothing left to work in the queue!")
								worker.send({ sleep: true })
							}
						}

						if (msg.countBibRecords) {
							countBibRecords++
						}
						if (msg.countTotal) {
							countTotal++
						}

						process.stdout.clearLine()
						process.stdout.cursorTo(0)
						process.stdout.write("Agents | countBibRecords: " + countBibRecords + " countTotal: " + countTotal )

						msg = null
						workItem = null


						return true



					})

				}
			},1000)



			//setup request





		})
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


	var processAgent = function(msg) {

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
		if (msg.req[0].agents){
			if (msg.req[0].agents.length>0){

				var scAgents = msg.req[0].agents

				activeData = msg.req[0]

				async.eachSeries(scAgents, function(agent, eachCallback) {

					var aAgent = JSON.parse(JSON.stringify(agent))
					var newAgent = {}

					//we don't care about VIAF in this pass
					if (!aAgent.viaf){

						//serializeGeneral.returnViafData(aAgent.viaf, function(viaf){

						serializeGeneral.returnAgentByName(aAgent.nameLocal, function(savedAgent){


							if (!savedAgent){

								// //we can check VIAF for an exact heading match
								// serializeGeneral.returnViafByName(aAgent.nameLocal,function(records){

								// 	if (records){

								// 		//see if any of the names are an exact match
								// 		records.forEach(function(r){

								// 			console.log(utils.normalizeAndDiacritics(aAgent.nameLocal), " | ", utils.normalizeAndDiacritics(r.viafTerm) )
								// 		if (utils.normalizeAndDiacritics(aAgent.nameLocal) ===  utils.normalizeAndDiacritics(r.viafTerm)){
								// 			console.log(aAgent.nameLocal, " == ", r)
								// 		}
								// 		})


								// 	}else{
								// 		//no viaf

								// 	}

								// 	eachCallback()	


								// })

								var updateAgent = serialize.mergeScAgentViafRegistryAgent(aAgent,false,false)

								//need to make the viaf unique for now
								updateAgent.viaf = "noViaf" + Date.now() + Math.floor(Math.random() * (1000000 - 1)) + 1
								updateAgent.useCount++
								updateAgent.source = "catalog"+msg.req[0].bnumber

								serializeGeneral.addAgentByName(updateAgent,function(){
								 	eachCallback()
								})
								



							}else{
								//something is in there that is matching
								//console.log(aAgent.nameLocal,"===",savedAgent)

								savedAgent.useCount++

								serializeGeneral.addAgentByName(savedAgent,function(){
								 	eachCallback()
								})

							}



							

							// var updateAgent = serialize.mergeScAgentViafRegistryAgent(aAgent,false,savedAgent)
							// updateAgent.useCount++
							// updateAgent.source = "catalog"+msg.req[0].bnumber



							
							// if (updateAgent.nameControlled){
							// 	updateAgent.nameControlled = updateAgent.nameControlled.trim() 
							// 	serializeGeneral.addAgentByViaf(updateAgent,function(){
							// 		eachCallback()
							// 	})	
							// }else{
							// 	//If there is no controlled name we do not want to use it
							// 	eachCallback()
							// }


							process.send({ countTotal: true })			
						})
						//})	

					}else{
						eachCallback()
					}			

				}, function(err){
				   	if (err) console.log(err)


				   	//done
					process.nextTick(function(){	
						process.send({ req: true })
					})		

				})

			}else{
			   	//done
				process.nextTick(function(){	
					process.send({ req: true })
				})
			}
		}else{
			console.log("Empty record.")
			process.nextTick(function(){	
				process.send({ req: true })
			})			
		}


	} 


	process.on('message', processAgent)
	process.send({ req: true });

}

