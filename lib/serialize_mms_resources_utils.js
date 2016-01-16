"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")

var serializeUtils = require("../lib/serialize_utils.js")

require("string_score")


var locationLookupMms = config['Thesaurus']['serializeLocationMms']
var noteMap = config['Thesaurus']['noteMap']



exports.returnAllCollectionIds = function(cb){
	db.returnCollectionRegistry('mmsCollections',function(err,mmsCollections){
		mmsCollections.find( { matchedArchives: { $exists: false} }, { _id: 1 } ).toArray(function(err, collections){
			cb(collections)
		})
	})
}


exports.serializeMmsCollections = function(collectionId, cb){

	console.log(collectionId)

	db.returnCollectionShadowcat("bib",function(err,shadowcatBib){

		db.returnCollectionsRegistry(['agents','terms','serialized','mmsCollections','mmsContainers','mmsItems','mmsCaptures','tmsObjects'],function(err,collections){

			var databaseAgents = collections["agents"]
			var databaseTerms = collections["terms"]
			var databaseSerialized = collections["serialized"]
			var databaseMmsCollections = collections["mmsCollections"]
			var databaseMmsContainers = collections["mmsContainers"]
			var databaseMmsItems = collections["mmsItems"]
			var databaseMmsCaptures = collections["mmsCaptures"]
			var databaseTmsObjects = collections["tmsObjects"]

			var allObjects = []

			// var working = true

			var componentCounter = 0
			var componentAdded = {}

			
			databaseMmsCollections.find({ _id : collectionId }).toArray(function(err, collection){

				collection = collection[0]

				var collectionObj = new serializeUtils.resourceObject()


				//console.log(++totalCollections, " ", collection.title)

				// if (collection.matchedArchives){
				// 	//this one was taken care of in the archives ingest
				// 	cb([])
				// 	return
				// }

				//var collectionProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: collection.uuid  }


				//console.log(collection)					

				var bNumber = -9999999999

				if (collection.bNumber){
					try{
						bNumber = parseInt(utils.normalizeBnumber(collection.bNumber).replace("b",''))
					}catch (e) {
						bNumber = -9999999999
					}
					if (isNaN(bNumber)) bNumber = -9999999999
				}


				//var collectionCatalogProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10000", recordIdentifier: bNumber  }
				if (bNumber>0){
					serializeUtils.markSerialized(databaseSerialized, "catalog" + bNumber)
				}




				shadowcatBib.find({ _id : bNumber}).toArray(function(err, bibs) {

					//work it
					serializeUtils.dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,collection,function(defResults){

						if (bibs.length>0){	

							var bib = bibs[0]
							var addedSubjects = [], addedAgents = [], registryTerms = [], registryAgents = []

							defResults.registryAgents.forEach(function(a){registryAgents.push(a.registry)})
							defResults.registryTerms.forEach(function(a){registryTerms.push(a.registry)})


							var results = serializeUtils.buildMmsTriples(collection,defResults,collectionObj.uri)

							//copy over the triples built in the helper function to the main object
							for (var x in results.mmsItemObj.triples){
								collectionObj.triples[x] = results.mmsItemObj.triples[x]
							}
							collectionObj.allAgents = results.mmsItemObj.allAgents
							collectionObj.allTerms = results.mmsItemObj.allTerms


							//use the shadow cat terms and agents as well if they are not yet in there
							async.parallel({

								processAgents: function(callback){

									//send each one off to be dererfernced							
									async.eachSeries(bib['sc:agents'], function(agent, eachCallback) {

										if (!agent.nameLc) agent.nameLc = agent.nameLocal

										//dereferenceAgent(databaseAgents, agent.viaf, agent.nameLc, "catalog:"+bib._id,function(registryAgent){

										serializeUtils.dereferenceAgent(databaseAgents, agent.viaf, agent.nameLc, "catalog:"+bib._id,function(registryAgent){
											if (registryAgent){			
												registryAgent.subject = true
												if (registryAgent.contributor) registryAgent.subject = false
												registryAgents.push(registryAgent)
											}
											eachCallback()
										})										

									}, function(err){

										if (err) console.log(err)

										//all the agents have been ran though and sorted out
										registryAgents.forEach(function(a){
											if (a.registry){
												if (a.subject){
													if (addedSubjects.indexOf(a.registry) == -1){
														if (collectionObj.allAgents.indexOf(a.registry) == -1){
															collectionObj.addTriple( 'dcterms:subject', "agents:"+a.registry, null,  null, "data:10000", bNumber,a.nameControlled)
															addedSubjects.push(a.registry)
															collectionObj.allAgents.push(a.registry)
														}
													}
												}else{
													if (addedAgents.indexOf(a.registry) == -1){
														if (collectionObj.allAgents.indexOf(a.registry) == -1){
															collectionObj.addTriple( 'dcterms:contributor', "agents:"+a.registry, null,  null, "data:10000", bNumber,a.nameControlled)
															addedAgents.push(a.registry)
															
															collectionObj.allAgents.push(a.registry)
														}
													}
												}
											}
										})
										
										callback()
									})				
								},




								processSubjects: function(callback){
									
									//send each one off to be dererfernced							
									async.eachSeries(bib['sc:terms'], function(term, eachCallback) {
										serializeUtils.dereferenceTerm(databaseTerms, term.fast, term.nameLocal, "catalog:"+bib.registry,function(registryTerm){
											if (registryTerm){
												registryTerms.push(registryTerm)
											}
											eachCallback()
										})										

									}, function(err){
										if (err) console.log(err)				

										registryTerms.forEach(function(a){
											if (a.registry){
												if (addedSubjects.indexOf(a.registry) == -1){
													if (collectionObj.allTerms.indexOf(a.registry) == -1){
														//triples.push({  subject: collectionUri,  predicate: "dcterms:subject", objectUri: "terms:"+a.registry, objectLiteral :  null,  literalDataType: null, prov: collectionCatalogProv  })
														collectionObj.addTriple( 'dcterms:subject', "terms:"+a.registry, null,  null, "data:10000", bNumber,a.termControlled)
														addedSubjects.push(a.registry)
													}
												}
											}	

										})
										callback()
									})	

								},

								//mark this, the bnumber if there is one and the MMS collection as being serialized
								markAsSerialized: function(callback){

									if (bNumber){
										serializeUtils.markSerialized(databaseSerialized, "catalog" + bNumber,function(){
										})										
									}
									serializeUtils.markSerialized(databaseSerialized, "mms" + collection.uuid,function(){
										callback()
									})
								}
							},
							function(err, results) {


								var parentUriLookup = {}
								var relationships = []

								//the collection lookup
								parentUriLookup[collection._id] = collectionObj.uri
								
								var bibLevel = 'c'
								if (bib.bibLevel.code) bibLevel = bib.bibLevel.code.trim()

								if (['7','c','s','d'].indexOf(bibLevel) > -1){
									//triples.push({  subject: collectionUri,  predicate: "rdf:type", objectUri: "nypl:Collection", objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
									collectionObj.addTriple( 'rdf:type', 'nypl:Collection', null,  null, "data:10002", collection._id)
								}else{
									//triples.push({  subject: collectionUri,  predicate: "rdf:type", objectUri: "nypl:Item", objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
									collectionObj.addTriple( 'rdf:type', 'nypl:Item', null,  null, "data:10002", collection._id)
								}


								//console.log(bibLevel,collection.title,collection._id)



								//triples.push({  subject: collectionUri,  predicate: "rdf:type", objectUri: "nypl:Collection", objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
								
								//triples.push({  subject: componentUri,  predicate: "pcdm:hasMember", objectUri: nyplItem, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
								//triples.push({  subject: nyplItem,  predicate: "pcdm:memberOf", objectUri: componentUri, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
								//triples.push({  subject: nyplItem,  predicate: "dcterms:identifier", objectUri: "urn:superparent:" + collectionRegistryId, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })


								databaseMmsContainers.find({ collectionUuid : collection._id}).toArray(function(err, containers) {

									console.log(containers.length)
									
									//these all become components
									async.eachSeries(containers, function(c, eachCallback) {


										//work it
										serializeUtils.dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,c,function(defResults){

											var results = serializeUtils.buildMmsTriples(c,defResults,collectionObj.uri)

											var containerObj = results.mmsItemObj

											containerObj.addTriple( 'rdf:type', 'nypl:Component', null,  null, 'data:10002', c.uuid)
											containerObj.addTriple( 'dcterms:identifier', 'urn:superparent:' + collectionObj.uri, null,  null, 'data:10002', c.uuid)

											parentUriLookup[c._id] = containerObj.uri


											//no cotainer map this to the collection
											if (c.containerUuid){
												relationships.push(
													JSON.parse(JSON.stringify(
													{
														s: c.containerUuid,
														p: 'pcdm:hasMember',
														o: c._id,
														g: c.uuid
													}))
												)

												relationships.push(
													JSON.parse(JSON.stringify(
													{
														s: c._id,
														p: 'pcdm:memberOf',
														o: c.containerUuid,
														g: c.uuid
													}))
												)
											}else{
												relationships.push(
													JSON.parse(JSON.stringify(
													{
														s: collection._id,
														p: 'pcdm:hasMember',
														o: c._id,
														g: c.uuid
													}))
												)
												relationships.push(
													JSON.parse(JSON.stringify(
													{
														s: c._id,
														p: 'pcdm:memberOf',
														o: collection._id,
														g: c.uuid
													}))
												)

											}

											allObjects.push(containerObj)
															
											eachCallback()


										})


									}, function(err){

										if (err) console.log(err)				
										
										//now grab all the items for this collection now that we know all the containers

										//next step is to gather all of the children
										var itemCursor = databaseMmsItems.find({ collectionUuid : collection._id})

										var totalItem = 10000000, itemCounter = 0

										databaseMmsItems.count({ collectionUuid : collection._id},function(err,count){
											totalItem = count
										})
								
										itemCursor.on('data', function(item) {

											itemCursor.pause()
											itemCounter++
											
											process.stdout.cursorTo(0)
											process.stdout.write(clc.black.bgGreenBright(itemCounter + "/" + totalItem))


											//work the item
											serializeUtils.dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,item,function(defResults){
												
												var results = serializeUtils.buildMmsTriples(item,defResults,collectionObj.uri)
												
												var itemObj = results.mmsItemObj



												itemObj.addTriple( 'rdf:type', 'nypl:Item', null,  null, 'data:10002', item.uuid)
												itemObj.addTriple( 'dcterms:identifier', 'urn:superparent:' + collectionObj.uri, null,  null, 'data:10002', item.uuid)

												parentUriLookup[item._id] = itemObj.uri

												if (item.containerUuid){
													relationships.push(
														JSON.parse(JSON.stringify(
														{
															s: item.containerUuid,
															p: 'pcdm:hasMember',
															o: item._id,
															g: item.uuid
														}))
													)
													relationships.push(
														JSON.parse(JSON.stringify(
														{
															s: item._id,
															p: 'pcdm:memberOf',
															o: item.containerUuid,
															g: item.uuid
														}))
													)	
												}else{
													relationships.push(
														JSON.parse(JSON.stringify(
														{
															s: item.collectionUuid,
															p: 'pcdm:hasMember',
															o: item._id,
															g: item.uuid
														}))
													)
													relationships.push(
														JSON.parse(JSON.stringify(
														{
															s: item._id,
															p: 'pcdm:memberOf',
															o: item.collectionUuid,
															g: item.uuid
														}))
													)	

												}

												results.captures.forEach(function(cap){ allObjects.push(cap)})
												allObjects.push(itemObj)

												if (item.matchedTms){

													AGHHHHHH.OHHHNOOOOO

												}else{

													itemCursor.resume()

												}

											})

										})


										itemCursor.on('end', function(item) {


											var length = 0


											var i = setInterval(function(){

												if (length===allObjects.length){

													clearTimeout(i)

													relationships.forEach(function(r){
														//build the relationships								
														if (!parentUriLookup[r.s] && !parentUriLookup[r.o]){
															console.log("ERROR:",r)
														}else{
															for (var aObject in allObjects){
																if (allObjects[aObject].uri === parentUriLookup[r.s]){									
																	allObjects[aObject].addTriple( r.p, "res:"+parentUriLookup[r.o], null,  null, "data:10002", r.g )																			
																}
															}
														}
													})

													allObjects.push(collectionObj)

													console.log(JSON.stringify(allObjects,null,2) )

													cb(allObjects)

													return


												}else{
													length=allObjects.length
												}

											},200)



											//console.log(JSON.stringify(allObjects,null,2))

										})


										
									})	



								})

							})


						}else{

							var itemBnumbers = {}, containerBnumbers = {}, allBnumbers = []
							var parentUriLookup = {}
							var relationships = [], allObjects = []


							async.parallel({

								checkContainers: function(callback){

									databaseMmsContainers.find({ parents: collection._id}, { bNumber:1 }).toArray(function(err, bnumbers){

										bnumbers.forEach(function(b){
											if (!b.bNumber){ 
												b.bNumber = "noBnumber"
											}else{
												if (allBnumbers.indexOf(b.bNumber) == -1) allBnumbers.push(b.bNumber)
											}											

											if (!containerBnumbers[b.bNumber] && b.bNumber != "noBnumber"){
												containerBnumbers[b.bNumber] = []
											}
											if (containerBnumbers[b.bNumber]) containerBnumbers[b.bNumber].push(b._id)
										})
										callback()
									})									
								},

								checkItems: function(callback){
									databaseMmsItems.find({ parents: collection._id}, { bNumber: 1 }).toArray(function(err, bnumbers){
										bnumbers.forEach(function(b){	
											if (!b.bNumber){ 
												b.bNumber = "noBnumber"
											}										
											//don't add any items w/ bnumbers that were already added at the container level because they will be taken care of in the buildSeperateContainers 
											if (!containerBnumbers[b.bNumber] && b.bNumber != "noBnumber"){
												if (!itemBnumbers[b.bNumber]){												
													itemBnumbers[b.bNumber] = []
												}
												itemBnumbers[b.bNumber].push(b._id)
											}
										})										
										callback()
									})
								}

							},
							function(err, results){

								//we are going to build collections/items for each of the bnumbers in this collection and then all the junk leftover into this collection
								//console.log(itemBnumbers)
								async.series({
									buildSeperateContainers: function(callback){
										

										//make a ary for the eachSeries
										var ary = []
										for (var x in containerBnumbers){
											ary.push({ bNumber : x, uuids: containerBnumbers[x]  })
										}

										async.eachSeries(ary, function(containerMap, eachCallback) {
											console.log("buildSeperateContainers",allObjects.length)

											serializeUtils.buildShadowcatTriples( containerMap.bNumber,function(shadowResults){

												if (shadowResults){

													//get the containers
													databaseMmsContainers.find({ _id : { $in : containerMap.uuids }  }).toArray(function(err, containers) {

														
														containers.forEach(function(container){
															serializeUtils.dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,container,function(defResults){

																//merge any data into the shadowcat resource
																var results = serializeUtils.buildMmsTriples(container,defResults)
																//overwrite the owner
																if (results.mmsItemObj.triples['nypl:owner']){
																	shadowResults.bibObj.triples['nypl:owner'] = results.mmsItemObj.triples['nypl:owner']
																}

																//make a ary of all the shadowcat notes and see if each mms note is in it, if not add it.
																if (results.mmsItemObj.triples['skos:note'] && shadowResults.bibObj.triples['skos:note']){
																	var allBibNotes = []
																	shadowResults.bibObj.triples['skos:note'].forEach(function(n){
																		allBibNotes.push(n.objectLiteral)
																	})
																	results.mmsItemObj.triples['skos:note'].forEach(function(n){																		
																		if (allBibNotes.indexOf(n.objectLiteral) == -1){
																			shadowResults.bibObj.triples['skos:note'].push(n)
																		}
																	})
																}else if (results.mmsItemObj.triples['skos:note'] && !shadowResults.bibObj.triples['skos:note']){
																	//add all the mss notes in 
																	shadowResults.bibObj.triples['skos:note'] = JSON.parse(JSON.stringify(results.mmsItemObj.triples['skos:note']))
																}


																//check the agents
																for (var x in results.mmsItemObj.triples){
																	results.mmsItemObj.triples[x].forEach(function(t){
																		if (t.objectUri){																			
																			var agentId = parseInt(t.objectUri.split('agents:')[1])
																			if (agentId){
																				if (shadowResults.bibObj.allAgents.indexOf(agentId)==-1){
																					if (!shadowResults.bibObj.triples[x]) shadowResults.bibObj.triples[x] = []
																					shadowResults.bibObj.triples[x].push(t)
																					shadowResults.bibObj.allAgents.push(agentId)
																				}																				
																			}
																		}
																	})
																}

																for (var x in results.mmsItemObj.triples){
																	results.mmsItemObj.triples[x].forEach(function(t){
																		if (t.objectUri){																			
																			var termId = parseInt(t.objectUri.split('terms:')[1])
																			if (termId){
																				if (shadowResults.bibObj.allTerms.indexOf(termId)==-1){
																					if (!shadowResults.bibObj.triples[x]) shadowResults.bibObj.triples[x] = []
																					shadowResults.bibObj.triples[x].push(t)
																					shadowResults.bibObj.allTerms.push(termId)
																				}																				
																			}
																		}
																	})
																}

																//find all the items of this container and make them children of this container
																databaseMmsItems.find({ parents: container._id  }).toArray(function(err, items) {


																	items.forEach(function(item){
																		serializeUtils.dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,item,function(defResults){
																			
																			var results = serializeUtils.buildMmsTriples(item,defResults,shadowResults.bibObj.uri)															
																			var itemObj = results.mmsItemObj

																			itemObj.addTriple( 'rdf:type', 'nypl:Item', null,  null, 'data:10002', item.uuid)
																			itemObj.addTriple( 'dcterms:identifier', 'urn:superparent:' + shadowResults.bibObj.uri, null,  null, 'data:10002', item.uuid)

																			itemObj.addTriple( 'pcdm:memberOf', 'res:' + shadowResults.bibObj.uri, null,  null, 'data:10002', item.uuid)

																			shadowResults.bibObj.addTriple( 'pcdm:hasMember', 'res:' + itemObj.uri, null,  null, 'data:10002', item.uuid)


																			results.captures.forEach(function(cap){ allObjects.push(cap)})
																			allObjects.push(itemObj)


																			if (item.matchedTms){
																				AGHHHHHH.OHHHNOOOOO
																			}

																		})
																	})
																	
																	allObjects.push(shadowResults.bibObj)

																	eachCallback()

																})
															})
														})
													})
												}else{
													errorLib.error("buildSeperateContainers Serialization - MMS - Bnumber Does not exist:", JSON.stringify({ bnumber: itemMap.bNumber, uuids: itemMap.uuids }) )
													eachCallback()

												}

											})


										}, function(err, results){

											console.log("DONE!")
											callback()

										})




									},
									buildSeperateItems: function(callback){



										//make a ary for the eachSeries
										var ary = []
										for (var x in itemBnumbers){
											ary.push({ bNumber : x, uuids: itemBnumbers[x]  })
										}

										async.eachSeries(ary, function(itemMap, eachCallback) {

											console.log("buildSeperateItems",allObjects.length)

											var allItemObjects = []
											
											serializeUtils.buildShadowcatTriples( itemMap.bNumber,function(shadowResults){

												if (shadowResults){

													//mark it done
													serializeUtils.markSerialized(databaseSerialized, "catalog" + itemMap.bNumber,function(){})

													//we need to merge the records shadowcat record into the mms record
													//compare Contributors, Subjects set the owner from MMS, notes from mms
													async.eachSeries(itemMap.uuids, function(uuid, eachSubCallback) {

														databaseMmsItems.find({ _id : uuid}).toArray(function(err, item) {

															item = item[0]

															serializeUtils.dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,item,function(defResults){
																
																var results = serializeUtils.buildMmsTriples(item,defResults)

																//overwrite the owner
																if (results.mmsItemObj.triples['nypl:owner']){
																	shadowResults.bibObj.triples['nypl:owner'] = results.mmsItemObj.triples['nypl:owner']
																}

																//make a ary of all the shadowcat notes and see if each mms note is in it, if not add it.
																if (results.mmsItemObj.triples['skos:note'] && shadowResults.bibObj.triples['skos:note']){
																	var allBibNotes = []
																	shadowResults.bibObj.triples['skos:note'].forEach(function(n){
																		allBibNotes.push(n.objectLiteral)
																	})
																	results.mmsItemObj.triples['skos:note'].forEach(function(n){																		
																		if (allBibNotes.indexOf(n.objectLiteral) == -1){
																			shadowResults.bibObj.triples['skos:note'].push(n)
																		}
																	})
																}else if (results.mmsItemObj.triples['skos:note'] && !shadowResults.bibObj.triples['skos:note']){
																	//add all the mss notes in 
																	shadowResults.bibObj.triples['skos:note'] = JSON.parse(JSON.stringify(results.mmsItemObj.triples['skos:note']))
																}


																//check the agents
																for (var x in results.mmsItemObj.triples){
																	results.mmsItemObj.triples[x].forEach(function(t){
																		if (t.objectUri){																			
																			var agentId = parseInt(t.objectUri.split('agents:')[1])
																			if (agentId){
																				if (shadowResults.bibObj.allAgents.indexOf(agentId)==-1){
																					if (!shadowResults.bibObj.triples[x]) shadowResults.bibObj.triples[x] = []
																					shadowResults.bibObj.triples[x].push(t)
																					shadowResults.bibObj.allAgents.push(agentId)
																				}																				
																			}
																		}
																	})
																}

																for (var x in results.mmsItemObj.triples){
																	results.mmsItemObj.triples[x].forEach(function(t){
																		if (t.objectUri){																			
																			var termId = parseInt(t.objectUri.split('terms:')[1])
																			if (termId){
																				if (shadowResults.bibObj.allTerms.indexOf(termId)==-1){
																					if (!shadowResults.bibObj.triples[x]) shadowResults.bibObj.triples[x] = []
																					shadowResults.bibObj.triples[x].push(t)
																					shadowResults.bibObj.allTerms.push(termId)
																				}																				
																			}
																		}
																	})
																}

																results.captures.forEach(function(cap){
																	//remove the mmsObj as the parent
																	cap.triples['pcdm:memberOf'] = []
																	//add in correct owner
																	cap.addTriple( 'pcdm:memberOf', 'res:' + shadowResults.bibObj.uri, null,  null, 'data:10002', item.uuid)
																	//add the reverse
																	shadowResults.bibObj.addTriple( 'pcdm:hasMember', 'res:' + results.mmsItemObj.uri, null,  null, 'data:10002', item.uuid)
																	//add it in
																	allItemObjects.push(cap)
																})



																eachSubCallback()
															})

														})


														

													}, function(err){

														//add it into the master list of objects
														allObjects.push(shadowResults.bibObj)
														allItemObjects.forEach(function(i){
															allObjects.push(i)
														})

														// console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
														// console.log(JSON.stringify(allItemObjects,null,2))

														eachCallback()

													})



												}else{
													errorLib.error("buildSeperateItems Serialization - MMS - Bnumber Does not exist:", JSON.stringify({ bnumber: itemMap.bNumber, uuids: itemMap.uuids }) )
													eachCallback()

												}


											})										

										}, function(err){

											//this is called when all the bnumber->items are done
											callback()

										})
										
									},



									buildLeftovers: function(callback){

										var allObjectsLeftovers = []

										//we are going to make a regular collection of container and items found in this MMS collection that did not have any link to the catalog

										//first build the collection item
										serializeUtils.dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,collection,function(defResults){

											var results = serializeUtils.buildMmsTriples(collection,defResults)
											var collectionObj = results.mmsItemObj
											collectionObj.addTriple( 'rdf:type', 'nypl:Collection', null,  null, 'data:10002', collection.uuid)
											parentUriLookup[collection._id] = collectionObj.uri

											//do the containers and items
											databaseMmsContainers.find({ collectionUuid : collection._id, bNumber: {$exists: false} }).toArray(function(err, containers) {

												
												//these all become components
												async.each(containers, function(c, eachCallback) {


													//work it
													serializeUtils.dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,c,function(defResults){

														var results = serializeUtils.buildMmsTriples(c,defResults,collectionObj.uri)

														var containerObj = results.mmsItemObj

														containerObj.addTriple( 'rdf:type', 'nypl:Component', null,  null, 'data:10002', c.uuid)														
														containerObj.addTriple( 'dcterms:identifier', 'urn:superparent:' + collectionObj.uri, null,  null, 'data:10002', c.uuid)

														parentUriLookup[c._id] = containerObj.uri

														//no cotainer map this to the collection
														if (c.containerUuid){
															relationships.push(
																JSON.parse(JSON.stringify(
																{
																	s: c.containerUuid,
																	p: 'pcdm:hasMember',
																	o: c._id,
																	g: c.uuid
																}))
															)

															relationships.push(
																JSON.parse(JSON.stringify(
																{
																	s: c._id,
																	p: 'pcdm:memberOf',
																	o: c.containerUuid,
																	g: c.uuid
																}))
															)
														}else{
															relationships.push(
																JSON.parse(JSON.stringify(
																{
																	s: collection._id,
																	p: 'pcdm:hasMember',
																	o: c._id,
																	g: c.uuid
																}))
															)
															relationships.push(
																JSON.parse(JSON.stringify(
																{
																	s: c._id,
																	p: 'pcdm:memberOf',
																	o: collection._id,
																	g: c.uuid
																}))
															)

														}

														allObjectsLeftovers.push(containerObj)																		
														eachCallback()


													})


												}, function(err){

													if (err) console.log(err)				
													
													//now grab all the items for this collection now that we know all the containers

													//next step is to gather all of the children
													var itemCursor = databaseMmsItems.find({ collectionUuid : collection._id, bNumber: {$exists: false} })

													var totalItem = 10000000, itemCounter = 0
													databaseMmsItems.count({ collectionUuid : collection._id, bNumber: {$exists: false}},function(err,count){
														totalItem = count
													})
											
													itemCursor.on('data', function(item) {


														itemCursor.pause()
														itemCounter++
														
														//process.stdout.cursorTo(0)
														//process.stdout.write(clc.black.bgGreenBright(itemCounter + "/" + totalItem))


														//work the item
														serializeUtils.dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,item,function(defResults){
															
															var results = serializeUtils.buildMmsTriples(item,defResults,collectionObj.uri)															
															var itemObj = results.mmsItemObj

															itemObj.addTriple( 'rdf:type', 'nypl:Item', null,  null, 'data:10002', item.uuid)
															itemObj.addTriple( 'dcterms:identifier', 'urn:superparent:' + collectionObj.uri, null,  null, 'data:10002', item.uuid)

															parentUriLookup[item._id] = itemObj.uri

															if (item.containerUuid){
																relationships.push(
																	JSON.parse(JSON.stringify(
																	{
																		s: item.containerUuid,
																		p: 'pcdm:hasMember',
																		o: item._id,
																		g: item.uuid
																	}))
																)
																relationships.push(
																	JSON.parse(JSON.stringify(
																	{
																		s: item._id,
																		p: 'pcdm:memberOf',
																		o: item.containerUuid,
																		g: item.uuid
																	}))
																)	
															}else{
																relationships.push(
																	JSON.parse(JSON.stringify(
																	{
																		s: item.collectionUuid,
																		p: 'pcdm:hasMember',
																		o: item._id,
																		g: item.uuid
																	}))
																)
																relationships.push(
																	JSON.parse(JSON.stringify(
																	{
																		s: item._id,
																		p: 'pcdm:memberOf',
																		o: item.collectionUuid,
																		g: item.uuid
																	}))
																)	

															}

															results.captures.forEach(function(cap){ allObjectsLeftovers.push(cap)})
															allObjectsLeftovers.push(itemObj)

															if (item.matchedTms){

																AGHHHHHH.OHHHNOOOOO

															}else{

																itemCursor.resume()

															}

														})

													})


													itemCursor.on('end', function(item) {
														var length = 0
														var i = setInterval(function(){
															if (length===allObjectsLeftovers.length){
																clearTimeout(i)
																relationships.forEach(function(r){
																	//build the relationships								
																	if (!parentUriLookup[r.s] && !parentUriLookup[r.o]){
																		console.log("ERROR:",r)
																	}else{
																		for (var aObject in allObjectsLeftovers){
																			if (allObjectsLeftovers[aObject].uri === parentUriLookup[r.s]){									
																				allObjectsLeftovers[aObject].addTriple( r.p, "res:"+parentUriLookup[r.o], null,  null, "data:10002", r.g )																			
																			}
																		}
																	}
																})
																allObjectsLeftovers.push(collectionObj)

																allObjectsLeftovers.forEach(function(c){
																	allObjects.push(c)
																})
																
																callback()
																return
															}else{
																length=allObjectsLeftovers.length
															}

														},200)

													})												
												})
											})
										})									

									}
								},
								function(err, results){
									//all the proceses are done at this point


								})


							})
			

						}


					})					

				})			

			})

		})

	})

}
