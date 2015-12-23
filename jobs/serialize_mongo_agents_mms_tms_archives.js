"use strict"


var serializeArchives = require("../lib/serialize_archives_agents_utils.js")
var serializeMms = require("../lib/serialize_mms_agents_utils.js")
var serializeTms = require("../lib/serialize_tms_agents_utils.js")



// serializeArchives.populateArchivesAgentsCollctions(function(){
// 	serializeArchives.populateArchivesAgentsComponents(function(){

			
// 		process.nextTick(function() {
// 			console.log('Done');
// 			process.exit()
// 		});


// 	})
// })






// 		serializeTms.populateTmsAgents(function(){
			serializeMms.populateMmsAgentsCollections(function(){
 				serializeMms.populateMmsAgentsContainers(function(){
					serializeMms.populateMmsAgentsItems(function(){

						console.log('Done');
						process.exit()


					})
				})
			})
// 		})




