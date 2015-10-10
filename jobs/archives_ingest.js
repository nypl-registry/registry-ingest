"use strict"

var cluster = require('cluster');

if (cluster.isMaster) {

	cluster.fork()
	cluster.fork()


	cluster.on('disconnect', function(worker, code, signal) {

		if (Object.keys(cluster.workers).length === 1){
			process.exit()			
		}

	});
	



	

} else {




	if (cluster.worker.id == 1){



		var archivesCollectionIngest = require("../lib/archives_ingest_collections.js")
		archivesCollectionIngest.ingest(function(err,results){

			console.log("Ingesting archives collections done")
			cluster.worker.disconnect()
		})




	}else if (cluster.worker.id == 2){

		var archivesComponentsIngest = require("../lib/archives_ingest_components.js")
		archivesComponentsIngest.ingest(function(err,results){

			console.log("Ingesting archives components done")
			cluster.worker.disconnect()
		})


	}


}
