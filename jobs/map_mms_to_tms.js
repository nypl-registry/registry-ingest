"use strict"


var mmsMappingStrategies = require("../lib/mms_mapping_strategies.js")

// console.log("mapItemsToTmsObjectsByIdentifiers")
mmsMappingStrategies.mapItemsToTmsObjectsByIdentifiers(function(err,results){


	mmsMappingStrategies.mapItemsToTmsObjectsByImageId(function(err,results){


		//LAYER CAAAKE
		mmsMappingStrategies.mapMmsPortraitFileToTmsFuzzy(0.8,function(err,results){

			mmsMappingStrategies.mapMmsPortraitFileToTmsFuzzy(0.7,function(err,results){

				mmsMappingStrategies.mapMmsPortraitFileToTmsFuzzy(0.6,function(err,results){
					console.log("Finished - map_mms_to_tms")
					process.exit()
				})
			})
		})
	})
})



	



