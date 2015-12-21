"use strict"


var serializeArchives = require("../lib/serialize_archives_agents_utils.js")



serializeArchives.populateArchivesAgentsCollctions(function(){
	serializeArchives.populateArchivesAgentsComponents(function(){

			
		process.nextTick(function() {
			console.log('Done');
			process.exit()
		});


	})
})





// serialize.populateArchivesAgentsCollctions(function(){	
// 	serialize.populateArchivesAgentsComponents(function(){	
// 		serialize.populateTmsAgents(function(){
// 			serialize.populateMmsAgentsCollections(function(){
// 				serialize.populateMmsAgentsContainers(function(){
// 					serialize.populateMmsAgentsItems(function(){

// 					})
// 				})
// 			})
// 		})
// 	})
// })



