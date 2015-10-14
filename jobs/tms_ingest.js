"use strict"


var tmsObjectsIngest = require("../lib/tms_ingest_objects.js")


// tmsObjectsIngest.ingest(function(err,results){

// 	console.log("Ingesting tms objects done")

	tmsObjectsIngest.reconcileUlan(function(err,results){

		

		console.log("reconcileUlan tms objects done")
		//cluster.worker.disconnect()
	})



// })



