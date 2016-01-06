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


exports.populateArchivesTermsCollections = function(cb){
	db.returnCollectionRegistry("archivesCollections",function(err,archivesCollections){

		db.returnCollectionRegistry("terms",function(err,termsCollection){



				var totalTerms = 0, totalTermsWithFast = 0, totalTermsNotFoundInRegistry = 0
				var cursor = archivesCollections.find({}, { 'subjects' : 1 })
				var types={}

				cursor.on('data', function(collection) {

					totalTerms++

					cursor.pause()

					process.stdout.cursorTo(0)
					process.stdout.write(clc.black.bgYellowBright("populateArchivesTermsCollections | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))



					async.each(collection.subjects, function(term, eachCallback) {

	
						if (!types[term.type]) types[term.type] = 0
						types[term.type]++

						if (term.text){

								if (term.type === 'name'){
									eachCallback()
									return
								}


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

										totalTermsNotFoundInRegistry++

										async.each(allTerms, function(subTerm, eachSubCallback) {

											subTerm = subTerm.trim()
										

											serializeGeneral.returnTermByTerm(subTerm,function(termRecord){


												if (termRecord){
													//the term is already in there, great
													eachSubCallback()
												}else{

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

														var term = serializeGeneral.buildTerm(sysTerm)

														term.source = "archivesCollectionDb|"+collection._id
														term.useCount = 0

														if (term.fast){
															serializeGeneral.adddTermByFast(term,function(){
																totalTermsWithFast++
																eachSubCallback()																
															})
														}else{
															serializeGeneral.addTermByTerm(term,function(){
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

	

					}, function(err){
						if (err) console.log(err)
						//done
						cursor.resume()

					})




				})

				cursor.once('end', function() {
						
					console.log("populateArchivesTermsCollections - Done!\n")
					process.stdout.cursorTo(0)
					process.stdout.write(clc.black.bgYellowBright("populateArchivesTermsCollections | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))
					cb()
				})
			})
	})
}

exports.populateArchivesTermsComponents = function(cb){
	db.returnCollectionRegistry("archivesComponents",function(err,archivesComponents){

		db.returnCollectionRegistry("terms",function(err,termsCollection){



				var totalTerms = 0, totalTermsWithFast = 0, totalTermsNotFoundInRegistry = 0
				var cursor = archivesComponents.find({}, { 'subjects' : 1 })
				var types={}

				cursor.on('data', function(component) {

					totalTerms++

					cursor.pause()

					process.stdout.cursorTo(0)
					process.stdout.write(clc.black.bgYellowBright("populateArchivesTermsComponents | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))



					async.eachSeries(component.subjects, function(term, eachCallback) {

	
						if (!types[term.type]) types[term.type] = 0
						types[term.type]++

						if (term.text){

								if (term.type === 'name'){
									eachCallback()
									return
								}


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

														var term = serializeGeneral.buildTerm(sysTerm)

														term.source = "archivesComponentDb|"+component._id
														term.useCount = 0

														if (term.fast){
															serializeGeneral.adddTermByFast(term,function(){
																totalTermsWithFast++
																eachSubCallback()																
															})
														}else{
															serializeGeneral.addTermByTerm(term,function(){
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

	

					}, function(err){
						if (err) console.log(err)
						//done
						cursor.resume()

					})




				})

				cursor.once('end', function() {
						
					console.log("populateArchivesTermsComponents - Done!\n")
					process.stdout.cursorTo(0)
					process.stdout.write(clc.black.bgYellowBright("populateArchivesTermsComponents | totalTerms: " + totalTerms + " totalTermsWithFast:" + totalTermsWithFast + " totalTermsNotFoundInRegistry: " + totalTermsNotFoundInRegistry ))
					cb()
				})
			})

	})
}

