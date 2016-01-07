"use strict"



var mmsMappingStrategies = require("../lib/mms_mapping_strategies.js")

mmsMappingStrategies.mapCollectionsToArchivesCollections(function(err,results){
	
	mmsMappingStrategies.mapCollectionsToArchivesCollectionsTitleMatch(function(err,results){	

		mmsMappingStrategies.mapItemCollectionsToArchivesCollectionsIdentifiers(function(err,results){

			mmsMappingStrategies.mapItemsToArchivesComponentsByIdentifiers(function(err,results){

				mmsMappingStrategies.mapContainersToArchivesComponentsByIdentifiers(function(err,results){

					mmsMappingStrategies.mapItemsToComponentsByRepoObjectTable(function(err,results){

							
						console.log("Finished - map_mms_to_archives")
						process.exit()

					})
				})
			})
		})		
	})	
})













	
