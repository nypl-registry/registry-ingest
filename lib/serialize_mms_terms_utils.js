"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")
var serializeGeneral = require("../lib/serialize_utils.js")
require("string_score")


var mmsTermsLookup = config['Thesaurus']['mmsTermTypes']
var archivesTermLookup = config['Thesaurus']['archivesTermTypes']


exports.populateMmsTermsCollections = function(cb){
	db.returnCollectionRegistry("mmsCollections",function(err,mmsCollections){




		var totalTerms = 0, totalTermsWithFast = 0, totalTermsNotFoundInRegistry = 0
		var cursor = mmsCollections.find({}, { 'subjects' : 1 })
		var types={}

		cursor.on('data', function(collection) {

			totalTerms++

			cursor.pause()

			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgYellowBright("populateMmsTermsCollections | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))

			if (collection.typeOfResource){
				collection.typeOfResource.forEach(function(tor){
					collection.subjects.push(
				        {
				            "authority": false,
				            "nameType": 'genre',
				            "text": tor,
				            "type": "genre",
				            "valueURI": false
				        }
					)
				})
			}

			async.eachSeries(collection.subjects, function(term, eachCallback) {

				if (term.type != 'genre' &&  term.type != 'topic' && term.type != 'topical' && term.type != 'geographic' && term.type != 'temporal' && term.type != 'titleInfo' ){
					eachCallback()
					return false
				}

				if (!types[term.type]) types[term.type] = 0
				types[term.type]++


				//we can look it up by lcsh
				if (term.valueURI){



					serializeGeneral.returnFastByLc(term.valueURI, function(fastRecord){


						if (fastRecord){

							totalTermsWithFast++



							//see if that FAST ID is in our terms
							serializeGeneral.returnTermByFast(fastRecord._id, function(termRecord){
								


								if (termRecord){
									//it is in there, make sure that our version of the normalized name is in there.
									var normal = utils.singularize(utils.normalizeAndDiacritics(term.text))
									if (termRecord.termNormalized.indexOf(normal)==-1){
										termRecord.termNormalized.push(normal)																		
										serializeGeneral.updateNormalizedTerms(termRecord.registry,termRecord.termNormalized)
									}									
									eachCallback()
								}else{

									var sysTerm = {
										fast: fastRecord._id,
										type: fastRecord.type,
										termControlled: fastRecord.prefLabel,
										termLocal: term.text
									}

									var newTerm = serializeGeneral.buildTerm(sysTerm)

									newTerm.source = "mmsCollection|"+collection._id

									newTerm.useCount = 0

									serializeGeneral.adddTermByFast(newTerm,function(){
										totalTermsWithFast++
										eachCallback()
									})

								}
							})

							

						}else{



							if (term.text){


									var allTerms = term.text.split("--")

									var type = mmsTermsLookup[term.type]
									if (!type) type = "terms:Topical"


									//see if the preconfigured subject heading is in there
									var preconfigured = term.text.replace(/\s+\-\-\s+/g,'--')

									if (preconfigured.search(/\-\-/)===-1) preconfigured = "Not Preconfigured Subject Heading"

									var allTerms = term.text.split("--")

									var type = archivesTermLookup[term.type]
									if (!type) type = "terms:Topical"

									serializeGeneral.returnTermByTerm(preconfigured,function(termRecord){

										if (termRecord){
											//the preconfigured term is already in the terms table, we are all set!
											eachCallback()
										}else{

											async.each(allTerms, function(subTerm, eachSubCallback) {

												subTerm = subTerm.trim()												
												serializeGeneral.returnTermByTerm(subTerm,function(termRecord){


													if (termRecord){
														//the term is already in there, great
														eachSubCallback()
													}else{	

														totalTermsNotFoundInRegistry++

														//no term lets see if it is in FAST
														serializeGeneral.returnFastByTerm(subTerm,function(termRecord){

															var fast = false

															var sysTerm = {
																fast: fast,
																type: type,
																termControlled: subTerm
															}

															if (termRecord){
																sysTerm.fast = termRecord._id
																sysTerm.termControlled = termRecord.prefLabel
																sysTerm.termLocal = subTerm
															}

															var newTerm = serializeGeneral.buildTerm(sysTerm)

															newTerm.source = "mmsCollection|"+collection._id
															newTerm.useCount = 0

															if (newTerm.fast){
																serializeGeneral.adddTermByFast(newTerm,function(){
																	totalTermsWithFast++
																	eachSubCallback()																
																})
															}else{
																serializeGeneral.addTermByTerm(newTerm,function(){
																	eachSubCallback()																
																})													
															}
														})												
													}
												})

											}, function(err){
												if (err) console.log(err)
												//done
												eachCallback()
											})
										}

									})


							}else{
								eachCallback()
								return true
							}


						}

					})



				}else{




					if (term.text){

							var allTerms = term.text.split("--")

							var type = mmsTermsLookup[term.type]
							if (!type) type = "terms:Topical"


							//see if the preconfigured subject heading is in there
							var preconfigured = term.text.replace(/\s+\-\-\s+/g,'--')

							if (preconfigured.search(/\-\-/)===-1) preconfigured = "Not Preconfigured Subject Heading"

							var allTerms = term.text.split("--")

							var type = archivesTermLookup[term.type]
							if (!type) type = "terms:Topical"

							serializeGeneral.returnTermByTerm(preconfigured,function(termRecord){

								if (termRecord){
									//the preconfigured term is already in the terms table, we are all set!
									eachCallback()
								}else{

									async.each(allTerms, function(subTerm, eachSubCallback) {

										subTerm = subTerm.trim()												
										serializeGeneral.returnTermByTerm(subTerm,function(termRecord){


											if (termRecord){
												//the term is already in there, great
												eachSubCallback()
											}else{	

												totalTermsNotFoundInRegistry++

												//no term lets see if it is in FAST
												serializeGeneral.returnFastByTerm(subTerm,function(termRecord){

													var fast = false

													var sysTerm = {
														fast: fast,
														type: type,
														termControlled: subTerm
													}

													if (termRecord){
														sysTerm.fast = termRecord._id
														sysTerm.termControlled = termRecord.prefLabel
														sysTerm.termLocal = subTerm
													}

													var newTerm = serializeGeneral.buildTerm(sysTerm)

													newTerm.source = "mmsCollection|"+collection._id
													newTerm.useCount = 0


													if (newTerm.fast){
														serializeGeneral.adddTermByFast(newTerm,function(){
															totalTermsWithFast++
															eachSubCallback()																
														})
													}else{
														serializeGeneral.addTermByTerm(newTerm,function(){
															eachSubCallback()																
														})													
													}
												})												
											}
										})

									}, function(err){
										if (err) console.log(err)
										//done
										eachCallback()
									})
								}

							})


					}else{
						eachCallback()
						return true
					}



				}
	

			}, function(err){
				if (err) console.log(err)
				//done
				cursor.resume()

			})



		})

		cursor.once('end', function() {
				
			console.log("populateMmsTermsCollections - Done!\n")
			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgYellowBright("populateMmsTermsCollections | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))
			cb()
		})
	})
}

exports.populateMmsTermsContainers = function(cb){
	db.returnCollectionRegistry("mmsContainers",function(err,mmsContainers){


		var totalTerms = 0, totalTermsWithFast = 0, totalTermsNotFoundInRegistry = 0
		var cursor = mmsContainers.find({}, { 'subjects' : 1 })
		var types={}

		cursor.on('data', function(container) {

			totalTerms++

			cursor.pause()

			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgYellowBright("populateMmsTermsContainers | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))

			if (container.typeOfResource){
				container.typeOfResource.forEach(function(tor){
					container.subjects.push(
				        {
				            "authority": false,
				            "nameType": 'genre',
				            "text": tor,
				            "type": "genre",
				            "valueURI": false
				        }
					)
				})
			}

			async.eachSeries(container.subjects, function(term, eachCallback) {

				if (term.type != 'genre' &&  term.type != 'topic' && term.type != 'topical' && term.type != 'geographic' && term.type != 'temporal' && term.type != 'titleInfo' ){
					eachCallback()
					return false
				}

				if (!types[term.type]) types[term.type] = 0
				types[term.type]++


				//we can look it up by lcsh
				if (term.valueURI){



					serializeGeneral.returnFastByLc(term.valueURI, function(fastRecord){


						if (fastRecord){

							totalTermsWithFast++



							//see if that FAST ID is in our terms
							serializeGeneral.returnTermByFast(fastRecord._id, function(termRecord){
								


								if (termRecord){
									//it is in there, make sure that our version of the normalized name is in there.
									var normal = utils.singularize(utils.normalizeAndDiacritics(term.text))
									if (termRecord.termNormalized.indexOf(normal)==-1){
										termRecord.termNormalized.push(normal)																		
										serializeGeneral.updateNormalizedTerms(termRecord.registry,termRecord.termNormalized)
									}
									eachCallback()
								}else{

									var sysTerm = {
										fast: fastRecord._id,
										type: fastRecord.type,
										termControlled: fastRecord.prefLabel,
										termLocal: term.text
									}

									var newTerm = serializeGeneral.buildTerm(sysTerm)

									newTerm.source = "mmsContainers|"+container._id

									newTerm.useCount = 0

									serializeGeneral.adddTermByFast(newTerm,function(){
										totalTermsWithFast++
										eachCallback()
									})

								}
							})

							

						}else{



							if (term.text){


									var allTerms = term.text.split("--")

									var type = mmsTermsLookup[term.type]
									if (!type) type = "terms:Topical"


									//see if the preconfigured subject heading is in there
									var preconfigured = term.text.replace(/\s+\-\-\s+/g,'--')

									if (preconfigured.search(/\-\-/)===-1) preconfigured = "Not Preconfigured Subject Heading"

									var allTerms = term.text.split("--")

									var type = archivesTermLookup[term.type]
									if (!type) type = "terms:Topical"

									serializeGeneral.returnTermByTerm(preconfigured,function(termRecord){

										if (termRecord){
											//the preconfigured term is already in the terms table, we are all set!
											eachCallback()
										}else{

											async.each(allTerms, function(subTerm, eachSubCallback) {

												subTerm = subTerm.trim()												
												serializeGeneral.returnTermByTerm(subTerm,function(termRecord){


													if (termRecord){
														//the term is already in there, great
														eachSubCallback()
													}else{	

														totalTermsNotFoundInRegistry++

														//no term lets see if it is in FAST
														serializeGeneral.returnFastByTerm(subTerm,function(termRecord){

															var fast = false

															var sysTerm = {
																fast: fast,
																type: type,
																termControlled: subTerm
															}

															if (termRecord){
																sysTerm.fast = termRecord._id
																sysTerm.termControlled = termRecord.prefLabel
																sysTerm.termLocal = subTerm
															}

															var newTerm = serializeGeneral.buildTerm(sysTerm)

															newTerm.source = "mmsContainers|"+container._id
															newTerm.useCount = 0

															if (newTerm.fast){
																serializeGeneral.adddTermByFast(newTerm,function(){
																	totalTermsWithFast++
																	eachSubCallback()																
																})
															}else{
																serializeGeneral.addTermByTerm(newTerm,function(){
																	eachSubCallback()																
																})													
															}
														})												
													}
												})

											}, function(err){
												if (err) console.log(err)
												//done
												eachCallback()
											})
										}

									})


							}else{
								eachCallback()
								return true
							}


						}

					})



				}else{




					if (term.text){

							var allTerms = term.text.split("--")

							var type = mmsTermsLookup[term.type]
							if (!type) type = "terms:Topical"


							//see if the preconfigured subject heading is in there
							var preconfigured = term.text.replace(/\s+\-\-\s+/g,'--')

							if (preconfigured.search(/\-\-/)===-1) preconfigured = "Not Preconfigured Subject Heading"

							var allTerms = term.text.split("--")

							var type = archivesTermLookup[term.type]
							if (!type) type = "terms:Topical"

							serializeGeneral.returnTermByTerm(preconfigured,function(termRecord){

								if (termRecord){
									//the preconfigured term is already in the terms table, we are all set!
									eachCallback()
								}else{

									async.each(allTerms, function(subTerm, eachSubCallback) {

										subTerm = subTerm.trim()												
										serializeGeneral.returnTermByTerm(subTerm,function(termRecord){


											if (termRecord){
												//the term is already in there, great
												eachSubCallback()
											}else{	

												totalTermsNotFoundInRegistry++

												//no term lets see if it is in FAST
												serializeGeneral.returnFastByTerm(subTerm,function(termRecord){

													var fast = false

													var sysTerm = {
														fast: fast,
														type: type,
														termControlled: subTerm
													}

													if (termRecord){
														sysTerm.fast = termRecord._id
														sysTerm.termControlled = termRecord.prefLabel
														sysTerm.termLocal = subTerm
													}

													var newTerm = serializeGeneral.buildTerm(sysTerm)

													newTerm.source = "mmsContainers|"+container._id
													newTerm.useCount = 0


													if (newTerm.fast){
														serializeGeneral.adddTermByFast(newTerm,function(){
															totalTermsWithFast++
															eachSubCallback()																
														})
													}else{
														serializeGeneral.addTermByTerm(newTerm,function(){
															eachSubCallback()																
														})													
													}
												})												
											}
										})

									}, function(err){
										if (err) console.log(err)
										//done
										eachCallback()
									})
								}

							})


					}else{
						eachCallback()
						return true
					}



				}
	

			}, function(err){
				if (err) console.log(err)
				//done
				cursor.resume()

			})



		})

		cursor.once('end', function() {
				
			console.log("populateMmsTermsContainers - Done!\n")
			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgYellowBright("populateMmsTermsContainers | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))
			cb()
		})
	})
	
}

exports.populateMmsTermsItems = function(cb){
	db.returnCollectionRegistry("mmsItems",function(err,mmsItems){


		var totalTerms = 0, totalTermsWithFast = 0, totalTermsNotFoundInRegistry = 0
		var cursor = mmsItems.find({ }, { 'subjects' : 1 })
		var types={}

		cursor.on('data', function(item) {

			totalTerms++

			cursor.pause()

			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgYellowBright("populateMmsTermsItems | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))

			if (item.typeOfResource){
				item.typeOfResource.forEach(function(tor){
					item.subjects.push(
				        {
				            "authority": false,
				            "nameType": 'genre',
				            "text": tor,
				            "type": "genre",
				            "valueURI": false
				        }
					)
				})
			}

			async.eachSeries(item.subjects, function(term, eachCallback) {

				if (term.type != 'genre' &&  term.type != 'topic' && term.type != 'topical' && term.type != 'geographic' && term.type != 'temporal' && term.type != 'titleInfo' ){
					eachCallback()
					return false
				}

				if (!types[term.type]) types[term.type] = 0
				types[term.type]++


				//we can look it up by lcsh
				if (term.valueURI){

					serializeGeneral.returnFastByLc(term.valueURI, function(fastRecord){

						if (fastRecord){
							totalTermsWithFast++

							//see if that FAST ID is in our terms
							serializeGeneral.returnTermByFast(fastRecord._id, function(termRecord){
								
								if (termRecord){
									//it is in there, make sure that our version of the normalized name is in there.
									var normal = utils.singularize(utils.normalizeAndDiacritics(term.text))
									if (termRecord.termNormalized.indexOf(normal)==-1){
										termRecord.termNormalized.push(normal)																		
										serializeGeneral.updateNormalizedTerms(termRecord.registry,termRecord.termNormalized)
									}
									eachCallback()
								}else{

									var sysTerm = {
										fast: fastRecord._id,
										type: fastRecord.type,
										termControlled: fastRecord.prefLabel,
										termLocal: term.text
									}

									var newTerm = serializeGeneral.buildTerm(sysTerm)

									newTerm.source = "mmsItem|"+item._id

									newTerm.useCount = 0

									serializeGeneral.adddTermByFast(newTerm,function(){
										totalTermsWithFast++
										eachCallback()
									})

								}
							})

							

						}else{



							if (term.text){


									var allTerms = term.text.split("--")

									var type = mmsTermsLookup[term.type]
									if (!type) type = "terms:Topical"


									//see if the preconfigured subject heading is in there
									var preconfigured = term.text.replace(/\s+\-\-\s+/g,'--')

									if (preconfigured.search(/\-\-/)===-1) preconfigured = "Not Preconfigured Subject Heading"

									var allTerms = term.text.split("--")

									var type = archivesTermLookup[term.type]
									if (!type) type = "terms:Topical"

									serializeGeneral.returnTermByTerm(preconfigured,function(termRecord){

										if (termRecord){
											//the preconfigured term is already in the terms table, we are all set!
											eachCallback()
										}else{

											async.each(allTerms, function(subTerm, eachSubCallback) {

												subTerm = subTerm.trim()												
												serializeGeneral.returnTermByTerm(subTerm,function(termRecord){


													if (termRecord){														
														//the term is already in there, great
														eachSubCallback()
													}else{	

														totalTermsNotFoundInRegistry++

														//no term lets see if it is in FAST
														serializeGeneral.returnFastByTerm(subTerm,function(termRecord){

															var fast = false

															var sysTerm = {
																fast: fast,
																type: type,
																termControlled: subTerm
															}

															if (termRecord){
																sysTerm.fast = termRecord._id
																sysTerm.termControlled = termRecord.prefLabel
																sysTerm.termLocal = subTerm
															}

															var newTerm = serializeGeneral.buildTerm(sysTerm)

															newTerm.source = "mmsItem|"+item._id
															newTerm.useCount = 0



															if (newTerm.fast){
																serializeGeneral.adddTermByFast(newTerm,function(){
																	totalTermsWithFast++
																	eachSubCallback()																
																})
															}else{
																serializeGeneral.addTermByTerm(newTerm,function(){
																	eachSubCallback()																
																})													
															}
														})												
													}
												})

											}, function(err){
												if (err) console.log(err)
												//done
												eachCallback()
											})
										}

									})


							}else{
								eachCallback()
								return true
							}


						}

					})



				}else{




					if (term.text){

							var allTerms = term.text.split("--")

							var type = mmsTermsLookup[term.type]
							if (!type) type = "terms:Topical"


							//see if the preconfigured subject heading is in there
							var preconfigured = term.text.replace(/\s+\-\-\s+/g,'--')

							if (preconfigured.search(/\-\-/)===-1) preconfigured = "Not Preconfigured Subject Heading"

							var allTerms = term.text.split("--")

							var type = archivesTermLookup[term.type]
							if (!type) type = "terms:Topical"

							serializeGeneral.returnTermByTerm(preconfigured,function(termRecord){

								if (termRecord){
									//the preconfigured term is already in the terms table, we are all set!
									eachCallback()
								}else{

									async.each(allTerms, function(subTerm, eachSubCallback) {


										subTerm = subTerm.trim()												
										serializeGeneral.returnTermByTerm(subTerm,function(termRecord){


											if (termRecord){
												
												//the term is already in there, great
												eachSubCallback()
											}else{	

												totalTermsNotFoundInRegistry++

												//no term lets see if it is in FAST
												serializeGeneral.returnFastByTerm(subTerm,function(termRecord){

													var fast = false

													var sysTerm = {
														fast: fast,
														type: type,
														termControlled: subTerm
													}

													if (termRecord){
														sysTerm.fast = termRecord._id
														sysTerm.termControlled = termRecord.prefLabel
														sysTerm.termLocal = subTerm
													}

													var newTerm = serializeGeneral.buildTerm(sysTerm)

													newTerm.source = "mmsItem|"+item._id
													newTerm.useCount = 0


													if (newTerm.fast){
														serializeGeneral.adddTermByFast(newTerm,function(){
															totalTermsWithFast++
															eachSubCallback()																
														})
													}else{
														serializeGeneral.addTermByTerm(newTerm,function(){
															eachSubCallback()																
														})													
													}
												})												
											}
										})

									}, function(err){
										if (err) console.log(err)
										//done
										eachCallback()
									})
								}

							})


					}else{
						eachCallback()
						return true
					}



				}
	

			}, function(err){
				if (err) console.log(err)
				//done
				cursor.resume()

			})



		})

		cursor.once('end', function() {
				
			console.log("populateMmsTermsItems - Done!\n")
			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgYellowBright("populateMmsTermsItems | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))
			cb()
		})
	})
	
}
