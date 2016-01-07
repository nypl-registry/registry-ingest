"use strict"

var cluster = require('cluster');
var fs = require('fs');

if (cluster.isMaster) {

	var botCount = 10

	
	var archivesSeralize = require("../lib/serialize_archives_resources_utils.js")




	archivesSeralize.returnAllCollectionIds(function(collectionIds){



		console.log(collectionIds)


	})






	// mmsMappingStrategies.returnedMatchedMmsToArchivesCollections(function(err,results){

	// 	//results = [results[0]]

	// 	//console.log(results.length)

	// 	var report = ""

	// 	var getWork = function(){

	// 		if (results.length == 0){
	// 			return "die"
	// 		}


	// 		var record = JSON.parse(JSON.stringify(results[0]))

	// 		//delete this one
	// 		results.shift()


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

	// 				report = report + msg.title + "\n"
	// 				report = report + "\t" + "http://metadata.nypl.org/collection/" + msg.id + " --> " + "http://archives.nypl.org/collection/" + msg.archivesId + "\n"
					
	// 				var jsonRespone = JSON.stringify(msg.results,null,2).split("\n")
	// 				for (var x in jsonRespone){

	// 					report = report + "\t" + jsonRespone[x] + "\n"
	// 				}

	// 				report = report + "\n"
					
	// 				fs.writeFile("archives_mapping.txt", report, function(err) {
						
	// 					if(err) {
	// 						return console.log(err);
	// 					}


	// 				})


	// 			}

	// 		})


	// 		//send the first one
	// 		worker.send({ work: getWork() })


	// 	}

	// 	for (var i = 1; i <= botCount; i++) {
	// 		setTimeout(function(){
	// 			buildWorker()
	// 		}, Math.floor(Math.random() * (10000 - 0)))
	// 	}
	// })



	// cluster.on('disconnect', function(worker, code, signal) {
	// 	if (Object.keys(cluster.workers).length === 1){
	// 		process.exit()
	// 	}
	// });



	

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
