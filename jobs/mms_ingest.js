"use strict"

var cluster = require('cluster');

if (cluster.isMaster) {

	cluster.fork()
	cluster.fork()
	cluster.fork()
	cluster.fork()



	cluster.on('disconnect', function(worker, code, signal) {
		if (Object.keys(cluster.workers).length === 0){

			process.exit()

		}

	});

} else {




	if (cluster.worker.id == 1){

		var mmsCollectionIngest = require("../lib/mss_ingest_collections.js")
		mmsCollectionIngest.ingest(function(err,results){
			console.log("done")

			cluster.worker.disconnect()


		})



	}else if (cluster.worker.id == 2){

		var mmsContainerIngest = require("../lib/mss_ingest_containers.js")
		mmsContainerIngest.ingest(function(err,results){
			console.log("done")
			cluster.worker.disconnect()
		})


	}else if (cluster.worker.id == 3){

		var mmsItemsIngest = require("../lib/mss_ingest_items.js")
		mmsItemsIngest.ingest(function(err,results){
			console.log("done")
			cluster.worker.disconnect()
		})

	}else if (cluster.worker.id == 4){


		var mmsCapturesIngest = require("../lib/mss_ingest_captures.js")
		mmsCapturesIngest.ingest(function(err,results){
			console.log("done")
			cluster.worker.disconnect()
		})

	}


}
