"use strict"

var cluster = require('cluster');
var fs = require('fs');

if (cluster.isMaster) {

	var botCount = 8

	// cluster.fork()
	// cluster.fork()
	// cluster.fork()
	// cluster.fork()

	// cluster.on('disconnect', function(worker, code, signal) {

	// 	if (Object.keys(cluster.workers).length === 1){
	// 		var mmsIngestPrune = require("../lib/mss_ingest_prune.js")
	// 		console.log("Pruning collections w/ out captures")
	// 		mmsIngestPrune.pruneCollectionsWithoutCaptures(function(err,results){
	// 			console.log("Pruning containers w/ out captures")
	// 			mmsIngestPrune.pruneContainersWithoutCaptures(function(err,results){
	// 				process.exit()
	// 			})
	// 		})
	// 	}

	// });
	
	var mmsMappingStrategies = require("../lib/mms_mapping_strategies.js")
	mmsMappingStrategies.returnedMatchedMmsToArchivesCollections(function(err,results){

		//results = [results[0]]

		//console.log(results.length)

		var report = ""

		var getWork = function(){

			if (results.length == 0){
				return "die"
			}


			var record = JSON.parse(JSON.stringify(results[0]))

			//delete this one
			results.shift()


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

					report = report + msg.title + "\n"
					report = report + "\t" + "http://metadata.nypl.org/collection/" + msg.id + " --> " + "http://archives.nypl.org/collection/" + msg.archivesId + "\n"
					
					var jsonRespone = JSON.stringify(msg.results,null,2).split("\n")
					for (var x in jsonRespone){

						report = report + "\t" + jsonRespone[x] + "\n"
					}

					report = report + "\n"
					
					fs.writeFile("archives_mapping.txt", report, function(err) {
						
						if(err) {
							return console.log(err);
						}


					})


				}

			})


			//send the first one
			worker.send({ work: getWork() })


		}


		for (var i = 1; i <= botCount; i++) {

			

			setTimeout(function(){

				buildWorker()

			}, Math.floor(Math.random() * (10000 - 0))  )
			



		}

	})



	// 	var p = function(){


	// 		if (results.length == 0) return false

	// 		var record = JSON.parse(JSON.stringify(results[0]))

	// 		//delete this one
	// 		results.shift()

	// 		if ([4610].indexOf(record.archivesCollectionDb) > -1){
	// 			console.log("skip")
				
	// 			p()
	// 			return true
	// 		}



	// 		mmsMappingStrategies.returnMmsCollectionDetails(record,function(err,data){


	// 			console.log("-----------------")
	// 			console.log(record.title)
	// 			console.log(record._id,record.archivesCollectionDb)

	// 			console.log("containerCount",data.containerCount)
	// 			console.log("containerCountMatchedToArchives",data.containerCountMatchedToArchives)
	// 			console.log("itemCount",data.itemCount)
	// 			console.log("itemCountMatchedToArchives",data.itemCountMatchedToArchives)
	// 			console.log("seriesCount",data.seriesCount)
	// 			console.log("seriesCountMatchedToMms",data.seriesCountMatchedToMms)
	// 			console.log("componentCount",data.componentCount)
	// 			console.log("componentCountMatchedToMms",data.componentCountMatchedToMms)

	// 			data.collection = record



	// 			//diffrent stragies for differnt situiationsssss

	// 			//it already has some sort of mapping from identifiers or from manual work, go with that.
	// 			if (data.itemCountMatchedToArchives >= 5 || data.containerCountMatchedToArchives >= 5){

	// 				console.log("Already has mapping")
	// 				p()
	// 				return true

	// 			}


	// 			//there is nothing to map the items to
	// 			if (data.componentCount == 0 ){

	// 				console.log("No Components")

	// 				p()
	// 				return true

	// 			}


	// 			//there is not a lot of possiblities 
	// 			if (data.itemCount <= 15 ){


	// 				var mappingResults = mmsMappingStrategies.mapHierarchyByContainers(data)

	// 				if (mappingResults == 0){
	// 					var mappingResults = mmsMappingStrategies.mapItemToComponent(data)
	// 				}


	// 				p()
	// 				return true

	// 			}else{

	// 				var mappingResults = mmsMappingStrategies.mapHierarchyByContainers(data)
	// 				console.log(mappingResults)
	// 				p()

	// 			}





	// 			// mmsMappingStrategies.mapHierarchyByContainers(data,function(){

	// 			// 	p()
	// 			// 	return true

	// 			// })

		



	// 		})



			
	// 	}


	// 	p()


	// })



	cluster.on('disconnect', function(worker, code, signal) {
		if (Object.keys(cluster.workers).length === 1){
			process.exit()
		}
	});



	

} else {




	var mmsMappingStrategies = require("../lib/mms_mapping_strategies.js")



	var processRecord = function(msg){

		if (msg.work){

			console.log("Working:",msg.work.title)

			// setTimeout(function(){

			// 	process.send({ results: msg.work.title })
			// 	process.send({ request: true })

			// }, Math.floor(Math.random() * (2000 - 0))  )
			
			var record = msg.work


			if (record==="die"){
				console.log("No more work, I'm leaving. 😵")
				cluster.worker.disconnect()
				process.exit()
			}

			mmsMappingStrategies.returnMmsCollectionDetails(record,function(err,data){


				console.log("-----------------")
				console.log(record.title)
				console.log(record._id,record.archivesCollectionDb)

				console.log("containerCount",data.containerCount)
				console.log("containerCountMatchedToArchives",data.containerCountMatchedToArchives)
				console.log("itemCount",data.itemCount)
				console.log("itemCountMatchedToArchives",data.itemCountMatchedToArchives)
				console.log("seriesCount",data.seriesCount)
				console.log("seriesCountMatchedToMms",data.seriesCountMatchedToMms)
				console.log("componentCount",data.componentCount)
				console.log("componentCountMatchedToMms",data.componentCountMatchedToMms)

				data.collection = record

				//it already has some sort of mapping from identifiers or from manual work, go with that.
				if (data.itemCountMatchedToArchives >= 5 || data.containerCountMatchedToArchives >= 5){
					process.send({ results: "Already has mapping", title: record.title, id: record.mmsDb, archivesId: record.archivesCollectionDb })
					process.send({ request: true })
					return true
				}


				//there is nothing to map the items to
				if (data.componentCount == 0 ){
					process.send({ results: "No Components to map to", title: record.title, id: record.mmsDb, archivesId: record.archivesCollectionDb })
					process.send({ request: true })
					return true
				}

				//normal course of action

				var r = mmsMappingStrategies.mapHierarchyByContainers(data)

				mmsMappingStrategies.updateHierarchyMatches(r, function(){


					process.send({ results: r, title: record.title, id: record.mmsDb, archivesId: record.archivesCollectionDb })
					process.send({ request: true })			

					return true


				})





			})



		}


	}



	process.on('message', processRecord)





}
