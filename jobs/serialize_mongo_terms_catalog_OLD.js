"use strict"


var serialize = require("../lib/serialize_utils.js")



serialize.populateShadowcatTerms(function(agentId){

	//serialize.populateShadowcatAgentsNonViaf(agentId,function(){



	//})

})




// var cluster = require('cluster');

// if (cluster.isMaster) {

// 	// cluster.fork()
// 	// cluster.fork()
// 	// cluster.fork()
// 	// cluster.fork()

// 	// cluster.on('disconnect', function(worker, code, signal) {

// 	// 	if (Object.keys(cluster.workers).length === 1){
// 	// 		var mmsIngestPrune = require("../lib/mss_ingest_prune.js")
			
// 	// 		console.log("Pruning collections w/ out captures")
// 	// 		mmsIngestPrune.pruneCollectionsWithoutCaptures(function(err,results){

// 	// 			console.log("Pruning containers w/ out captures")
// 	// 			mmsIngestPrune.pruneContainersWithoutCaptures(function(err,results){

// 	// 				console.log("Pruning items w/ out captures")

// 	// 				mmsIngestPrune.pruneItemsWithoutCaptures(function(err,results){


// 	// 					console.log("Pruning manually defined collections")
						
// 	// 					mmsIngestPrune.pruneIgnoreCollections(function(err,results){

// 	// 						console.log("Removing items that have an invalid container.")

// 	// 						mmsIngestPrune.pruneItemsWithInvalidContainer(function(err,results){
							
// 	// 							process.exit()

// 	// 						})

// 	// 					})
// 	// 				})
// 	// 			})
// 	// 		})
// 	// 	}
// 	// });	



	



					


// } else {




// 	// if (cluster.worker.id == 1){

// 	// 	var mmsCollectionIngest = require("../lib/mss_ingest_collections.js")
// 	// 	mmsCollectionIngest.ingest(function(err,results){
// 	// 		console.log("Ingesting collections done")
// 	// 		cluster.worker.disconnect()
// 	// 	})

// 	// }else if (cluster.worker.id == 2){

// 	// 	var mmsContainerIngest = require("../lib/mss_ingest_containers.js")
// 	// 	mmsContainerIngest.ingest(function(err,results){
// 	// 		console.log("Ingesting containers done")
// 	// 		cluster.worker.disconnect()
// 	// 	})


// 	// }else if (cluster.worker.id == 3){

// 	// 	var mmsItemsIngest = require("../lib/mss_ingest_items.js")
// 	// 	mmsItemsIngest.ingest(function(err,results){
// 	// 		console.log("Ingesting items done")
// 	// 		cluster.worker.disconnect()
// 	// 	})

// 	// }else if (cluster.worker.id == 4){


// 	// 	var mmsCapturesIngest = require("../lib/mss_ingest_captures.js")
// 	// 	mmsCapturesIngest.ingest(function(err,results){
// 	// 		console.log("Ingesting captures done")
// 	// 		cluster.worker.disconnect()
// 	// 	})

// 	// }


// }
