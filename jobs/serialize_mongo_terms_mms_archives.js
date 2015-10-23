"use strict"


var serialize = require("../lib/serialize_utils.js")

serialize.populateArchivesTermsCollections(function(){

	serialize.populateArchivesTermsComponents(function(){

		serialize.populateMmsTermsCollections(function(){

			serialize.populateMmsTermsContainers(function(){

				serialize.populateMmsTermsItems(function(){

				})

			})

		})

	})

})









