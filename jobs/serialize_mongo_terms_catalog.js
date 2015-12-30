"use strict"

var cluster = require('cluster')
var serialize = require("../lib/serialize_catalog_terms_utils.js")
var serializeGeneral = require("../lib/serialize_utils.js")
var errorLib = require("../lib/error.js")



if (cluster.isMaster) {

	
	var countBibRecords = 0, countTotal = 0

	console.log("Initializing shadowcat TERMS Queue")
	
	serialize.prepareTerms(function(){

		serialize.populateShadowcatTermsBuildQueue(function(){
			
				//console.log(serialize.shadowCatTermsQueue[0])

				var spawnTimer = setInterval(function(){
					if (Object.keys(cluster.workers).length==20){
						clearInterval(spawnTimer)
					}else{

						var worker = cluster.fork()

						worker.on('message', function(msg) {


							if (serialize.shadowCatTermsQueue[0]==="END"){
								console.log("Sendiing QUIT msg",Object.keys(cluster.workers).length)
								//that is it, we've reached the end
								worker.send({ quit: true })

								setInterval(function(){
									if (Object.keys(cluster.workers).length<2){
										console.log("Finished Working records.")
										console.log("Catalog Terms | countBibRecords: " + countBibRecords + " countTotal: " + countTotal)
										console.log("Catalog Terms | countBibRecords: " + countBibRecords + " countTotal: " + countTotal)
										process.exit()
									}
								},1000)
								return false
							}



							if (msg.req) {

								//they are asking for new work							
								if (serialize.shadowCatTermsQueue.length>0){
									
									var workItem = serialize.shadowCatTermsQueue.splice(0,1)
									//console.log(workItem)
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
							process.stdout.write("Catalog Terms | countBibRecords: " + countBibRecords + " countTotal: " + countTotal + " Workers: " + Object.keys(cluster.workers).length)

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


		if (msg.req[0].terms){
			if (msg.req[0].terms.length>0){

				var scTerms = msg.req[0].terms

				activeData = msg.req[0]

				async.each(scTerms, function(term, eachCallback) {

					var aTerm = JSON.parse(JSON.stringify(term))
					var newAgent = {}

					if (term.fast){


						serializeGeneral.returnTermByFast(term.fast,function(termsRecord){

							if (!termsRecord){

								//it is not in the terms table add it

								//grab the info

								serializeGeneral.returnFastByFast(term.fast,function(fastRecord){
									
									if (fastRecord){

										//console.log(fastRecord)
										term.termControlled = fastRecord.prefLabel
										term.termAlt = fastRecord.altLabel

										if (!term.termControlled){
											if (term.nameLocal) term.termControlled = term.nameLocal
											if (term.nameFast) term.termControlled = term.nameFast
										}

										var updateTerm = serializeGeneral.buildTerm(term)



										updateTerm.source = "catalog" + msg.req[0].bnumber

										serializeGeneral.adddTermByFast(updateTerm,function(){
											eachCallback()
										})

									}else{

										errorLib.error("Term Serialization - Catalog - Cannot find this FAST Term:", JSON.stringify(term))
										//no FAST ID, do a name lookup on the TABLE and see if it is added yet


										if (term.nameLocal) term.termControlled = term.nameLocal
										if (term.nameFast) term.termControlled = term.nameFast

										serializeGeneral.returnTermByTerm(term.termControlled,function(termsRecord){
											if (!termsRecord){


												

												var updateTerm = serializeGeneral.buildTerm(term)
												updateTerm.source = "catalog" + msg.req[0].bnumber
												
												errorLib.error("^^^ Adding it in:", JSON.stringify(updateTerm))

												serializeGeneral.addTermByTerm(updateTerm,function(){
													eachCallback()
												})
											}else{
												eachCallback()								
											}

										})										

									}
									




								})
							}else{
								//It is in there, fine
								eachCallback()
							}

						})




					}else{

						
						//no FAST ID, do a name lookup on the TABLE and see if it is added yet
						serializeGeneral.returnTermByTerm(term.nameLocal,function(termsRecord){
							if (!termsRecord){

								term.termControlled = term.nameLocal
								var updateTerm = serializeGeneral.buildTerm(term)
								updateTerm.source = "catalog" + msg.req[0].bnumber
								serializeGeneral.addTermByTerm(updateTerm,function(){
									eachCallback()
								})
							}else{
								eachCallback()								
							}

						})


						



					}




					// //we don't care about non VIAF in this pass
					// if (aTerm.viaf){

					// 	serializeGeneral.returnViafData(aTerm.viaf, function(viaf){

					// 		serializeGeneral.returnAgentByViaf(aTerm.viaf, function(savedAgent){

					// 			var updateAgent = serialize.mergeScAgentViafRegistryAgent(aTerm,viaf,savedAgent)
					// 			updateAgent.useCount++
					// 			updateAgent.source = "catalog"+msg.req[0].bnumber
								
					// 			if (updateAgent.nameControlled){
					// 				updateAgent.nameControlled = updateAgent.nameControlled.trim() 
					// 				serializeGeneral.addAgentByViaf(updateAgent,function(){
					// 					eachCallback()
					// 				})	
					// 			}else{
					// 				//If there is no controlled name we do not want to use it
					// 				eachCallback()
					// 			}
					// 			process.send({ countTotal: true })			
					// 		})
					// 	})	
					// }else{
					// 	eachCallback()
					// }			

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

