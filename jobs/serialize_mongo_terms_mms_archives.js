"use strict"


var serializeArchives = require("../lib/serialize_archives_terms_utils.js")
var serializeMms = require("../lib/serialize_mms_terms_utils.js")

serializeArchives.populateArchivesTermsCollections(function(){

	serializeArchives.populateArchivesTermsComponents(function(){

		serializeMms.populateMmsTermsCollections(function(){

	 		serializeMms.populateMmsTermsContainers(function(){

	 			serializeMms.populateMmsTermsItems(function(){

					console.log('Done');
					process.exit()
					
	 			})

	 		})

		})

	})

})









