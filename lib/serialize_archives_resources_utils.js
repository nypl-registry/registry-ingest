"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")
var sanitizeHtml = require('sanitize-html')
require("string_score")

var removeHtml = function(hmtl){
	return sanitizeHtml(hmtl, { allowedTags: [], allowedAttributes: [] })
}


exports.returnAllCollectionIds = function(cb){


	db.returnCollectionRegistry('archivesCollections',function(err,archivesCollections){

		archivesCollections.find( {  }, { _id: 1 } ).toArray(function(err, collections){



			cb(collections)


		})
	})



}





exports.serializeArchives = function(collectionId, cb){

	var totalTriples = 0, totalCollections = 0


	db.returnCollectionShadowcat("bib",function(err,shadowcatBib){

		db.returnCollectionsRegistry(['agents','terms','serialized','archivesCollections','archivesComponents','archivesComponents','mmsItems','mmsCaptures'],function(collections){

			var databaseAgents = collections["agents"]
			var databaseTerms = collections["terms"]
			var databaseSerialized = collections["serialized"]
			var databaseArchivesCollections = collections["archivesCollections"]
			var databaseArchivesComponents = collections["archivesComponents"]
			var databaseMmsItems = collections["mmsItems"]
			var databaseMmsCaptures = collections["mmsCaptures"]

			
			databaseArchivesCollections.find({ _id : collectionId }).toArray(function(err, collection){

				collection = collection[0]

				console.log(collection.title,++totalCollections)


				// if (totalCollections<9568){

				// 	return false
				// }
				
				// if (collection.mssDb != 1509){

				// 	return false
				// }

				
				return false



				var bNumber = -9999999999

				if (collection.bNumber){
					try{
						bNumber = parseInt(utils.normalizeBnumber(collection.bNumber).replace("b",''))
					}catch (e) {
						bNumber = -9999999999
					}
					if (isNaN(bNumber)) bNumber = -9999999999
				}


				shadowcatBib.find({ _id : bNumber}).toArray(function(err, bibs) {


					//a dummy bib
					var bib = { agents : [], terms : [] }

					if (bibs[0]){

						bib.agents = bibs[0]['sc:agents']
						bib.terms = bibs[0]['sc:terms']

					}

					//keeps track of any MMS matches locally for faster lookup
					var matchedMssLocalLookup = {}

					var triples = []

					//Collection Level Data
					//bump the regsitery id
					resourceId++			

					//this is the collection level URI
					var collectionUri = "res:" + resourceId
					var collectionRegistryId = resourceId


					//this is collection level prov
					var collectionProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10001", recordIdentifier: collection.mss  }
					if (collection.matchedMms){
						var collectionMmsProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: collection.mmsUuid  }
					}


					//LOD stuff
					triples.push({  subject: collectionUri,  predicate: "rdf:type", objectUri: "nypl:Collection", objectLiteral :  null,  literalDataType: null, prov: collectionProv  })

					


					var title = collection.title
					triples.push({  subject: collectionUri,  predicate: "dcterms:title", objectUri: null, objectLiteral :  title,  literalDataType: null, prov: collectionProv  })

					//No alt-title


					//Notes
					collection.notes.map(function(note){
						if (noteMap[note.type]){
							var noteText = removeHtml(note.text)
							noteText = noteMap[note.type] + ":\n" + noteText
							triples.push({  subject: collectionUri,  predicate: "skos:note", objectUri: null, objectLiteral :  note,  literalDataType: null, prov: collectionProv  })
						}
					})


					var abstractText = ""
					collection.abstracts.map(function(abstract){
						abstractText = abstractText + " " + abstract
					})

					abstractText = abstractText.trim()

					if (abstractText != ""){
						triples.push({  subject: collectionUri,  predicate: "dcterms:description", objectUri: null, objectLiteral :  abstractText,  literalDataType: null, prov: collectionProv  })
					}

					//Identifiers
					if (collection.mss){
						//this is the collection level mss ID
						triples.push({  subject: collectionUri,  predicate: "dcterms:identifier", objectUri: "urn:msscoll:" + collection.mss, objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
					}
					if (collection.bNumber){
						triples.push({  subject: collectionUri,  predicate: "dcterms:identifier", objectUri: "urn:bnum:" + collection.bNumber, objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
					}
					if (collection.callNumber){
						triples.push({  subject: collectionUri,  predicate: "dcterms:identifier", objectUri: "urn:callnum:" + collection.callNumber.replace(/\s/g,''), objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
					}
					if (collection.matchedMms){
						triples.push({  subject: collectionUri,  predicate: "dcterms:identifier", objectUri: "urn:uuid:" + collection.mmsUuid, objectLiteral :  null,  literalDataType: null, prov: collectionMmsProv  })
					}

					//Material type
					triples.push({  subject: collectionUri,  predicate: "dcterms:type", objectUri: "resourcetypes:col", objectLiteral :  null,  literalDataType: null, prov: collectionProv  })


					//there doesn't appear to be any Langauge at the collection level TODO/FIX


					//Dates
					collection.dates.map(function(d){
						if (d.point=='start'){
							triples.push({  subject: collectionUri,  predicate: "db:dateStart", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: collectionProv  })
						}
						if (d.point=='end'){
							triples.push({  subject: collectionUri,  predicate: "db:dateEnd", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: collectionProv  })
						}
						if (d.point=='exact'){
							triples.push({  subject: collectionUri,  predicate: "dcterms:created", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: collectionProv  })
						}
					})

					//Location Owners
					if (locationLookupMms[collection.divisions.toUpperCase()]){
						triples.push({  subject: collectionUri,  predicate: "nypl:owner", objectUri: "orgs:"+locationLookupMms[collection.divisions.toUpperCase()], objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
					}else{
						triples.push({  subject: collectionUri,  predicate: "nypl:owner", objectUri: "orgs:"+1000, objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
					}


					var collectionLevelAgents = [], collectionLevelTerms = []



					//Collection level agents and subjects
					async.parallel({

						processAgents: function(callback){

							//build a simple ary of agents with possible viaf

							var agentsToCheck = []

							if (bib.agents.length > collection.agents.length){
								//use the catalog agents, it is just as good and maybe a little more structured
								bib.agents.map(function(a){
									var useName = a.nameLocal
									if (a.nameLc) useName = a.nameLc
									if (!useName && a.nameViaf)  useName = a.nameViaf
									agentsToCheck.push( { name: useName, viaf: (a.viaf) ? a.viaf : false, role: false, subject : (!a.contributor) ? true : false })								
								})
							}else{
								collection.agents.map(function(a){
									var viaf=false
									if (a.valueURI){
										if (a.valueURI.search("viaf.org")>-1){
											viaf = parseInt(a.valueURI.split('/viaf/')[1])
											if (isNaN(viaf)) viaf = false
										}
									}
									agentsToCheck.push( { name: a.namePart, viaf: viaf, role: false, subject: false })
								})
							}


							//dcterms:contributor
							var registryAgents = []

							//send each one off to be dererfernced							
							async.eachSeries(agentsToCheck, function(agent, eachCallback) {


								dereferenceAgent(databaseAgents, agent.viaf, agent.name, "archivesCollectionMSS:"+collection.mss,function(registryAgent){

									if (registryAgent){

										registryAgent.subject = agent.subject
										registryAgents.push(registryAgent)
										collectionLevelAgents.push(registryAgent._id)

									}



									eachCallback()

								})



								

							}, function(err){
								if (err) console.log(err)								
								var addedContriubtors = [], addedSubjects = []
								//all the agents have been ran though and sorted out
								registryAgents.map(function(a){
									if (a.subject){
										if (addedSubjects.indexOf(a._id) == -1){
											triples.push({  subject: collectionUri,  predicate: "dcterms:subject", objectUri: "agents:"+a._id, objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
											addedSubjects.push(a._id)
											collectionLevelTerms.push(a._id)
										}
									}else{
										if (addedContriubtors.indexOf(a._id) == -1){
											triples.push({  subject: collectionUri,  predicate: "dcterms:contributor", objectUri: "agents:"+a._id, objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
											addedContriubtors.push(a._id)
											collectionLevelAgents.push(a._id)
										}
									}
								})
								callback()
							})				
						},




						processSubjects: function(callback){


							var termsToCheck = []

							//split up our complex headings
							var archiveTerms = []
							collection.subjects.map(function(t){
								t.text.split("--").map(function(s){
									archiveTerms.push(s.trim())
								})
							})

							if (bib.terms.length >= archiveTerms.length){
								//use the catalog terms, it is just as good and maybe a little more structured
								bib.terms.map(function(a){
									var useTerm = false
									if (a.nameLocal) useTerm = a.nameLocal
									if (a.nameFast) useTerm = a.nameFast

									termsToCheck.push( { term: useTerm, fast: (a.fast) ? a.fast : false })								
								})
							}else{
								archiveTerms.map(function(a){
									termsToCheck.push( { term: a, fast: false })
								})
							}



							var registryTerms = []
							//send each one off to be dererfernced							
							async.eachSeries(termsToCheck, function(term, eachCallback) {


								dereferenceTerm(databaseTerms, term.fast, term.term, "archivesCollectionMSS:"+collection.mss,function(registryTerm){

									if (registryTerm){
										registryTerms.push(registryTerm)
									}

									eachCallback()

								})



								

							}, function(err){
								if (err) console.log(err)				
								var addedSubjects = []
								//all the agents have been ran though and sorted out
								registryTerms.map(function(a){
									if (addedSubjects.indexOf(a._id) == -1){
										triples.push({  subject: collectionUri,  predicate: "dcterms:subject", objectUri: "terms:"+a._id, objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
										addedSubjects.push(a._id)
										collectionLevelTerms.push(a._id)
									}				

								})
								callback()
							})	

						},


						//mark this, the bnumber if there is one and the MMS collection as being serialized
						markAsSerialized: function(callback){
							markSerialized(databaseSerialized, "archivesCol" + collection.mss,function(){
								if (bNumber>0){
									markSerialized(databaseSerialized, "catalog" + bNumber)
								}

								if (collection.matchedMms){
									markSerialized(databaseSerialized, "mms" + collection.mmsUuid)
								}
								callback()
							})
						}


					},
					function(err, results) {
							
						console.log("Loading Collection Components:",collection.title)



						//next step is to gather all of the children
						var componentCursor = databaseArchivesComponents.find({ collectionDb : collection.mssDb, mss: {$exists: true} }).sort( { orderSequence : 1})


						var parentLookup = {}
						var relationships = []


						parentLookup[collection.mssDb] = collectionUri
				
						componentCursor.on('data', function(component) {

							componentCursor.pause()

							resourceId++			

							//this is the collection level URI
							var componentUri = "res:" + resourceId
							var componentResourceId = resourceId

							if (!component.parentDb){
								component.parentDb = component.collectionDb
							}

							parentLookup[component.mssDb] = componentUri

							//this is component level prov
							var componentProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10001", recordIdentifier: component.mss  }
							

							//shity error, fix later TODO FIXME
							if (component.matchedMms){
								if (!component.mmsUuid && component.archivesCollectionDb) component.mmsUuid = component.archivesCollectionDb
							}



							//LOD stuff
							triples.push({  subject: componentUri,  predicate: "rdf:type", objectUri: "nypl:Component", objectLiteral :  null,  literalDataType: null, prov: componentProv  })
							triples.push({  subject: componentUri,  predicate: "dcterms:identifier", objectUri: "urn:superparent:" + collectionRegistryId, objectLiteral :  null,  literalDataType: null, prov: componentProv  })


							relationships.push(
								JSON.parse(JSON.stringify(
								{
									s: component.parentDb,
									p: 'pcdm:hasMember',
									o: component.mssDb,
									g: componentProv
								}))
							)

							relationships.push(
								JSON.parse(JSON.stringify(
								{
									s: component.mssDb,
									p: 'pcdm:memberOf',
									o: component.parentDb,
									g: componentProv
								}))
							)


							//Component level agents and subjects
							var addedContriubtors = [], addedSubjects = [], addedDates = []


							//build all the same data as what was in the colelction level

							var title = (component.title) ? component.title : component.dateStatement
							title = removeHtml(title)

							triples.push({  subject: componentUri,  predicate: "dcterms:title", objectUri: null, objectLiteral :  title,  literalDataType: null, prov: componentProv  })

							//No alt-title


							//Notes
							component.notes.map(function(note){
								if (noteMap[note.type]){
									var noteText = removeHtml(note.text)
									noteText = noteMap[note.type] + ":\n" + noteText
									triples.push({  subject: componentUri,  predicate: "skos:note", objectUri: null, objectLiteral :  note,  literalDataType: null, prov: componentProv  })
								}
							})


							var abstractText = ""
							component.abstracts.map(function(abstract){
								abstractText = abstractText + " " + abstract
							})

							abstractText = abstractText.trim()

							if (abstractText != ""){
								triples.push({  subject: componentUri,  predicate: "dcterms:description", objectUri: null, objectLiteral :  abstractText,  literalDataType: null, prov: componentProv  })
							}

							//Identifiers
							if (component.mss){
								//this is the component level mss ID
								triples.push({  subject: componentUri,  predicate: "dcterms:identifier", objectUri: "urn:msscoll:" + component.mss, objectLiteral :  null,  literalDataType: null, prov: componentProv  })
							}
							if (component.barcode){
								triples.push({  subject: componentUri,  predicate: "dcterms:identifier", objectUri: "urn:barcode:" + component.barcode, objectLiteral :  null,  literalDataType: null, prov: componentProv  })
							}


							//Material type
							triples.push({  subject: componentUri,  predicate: "dcterms:type", objectUri: "resourcetypes:col", objectLiteral :  null,  literalDataType: null, prov: componentProv  })


							//there doesn't appear to be any Langauge at the collection level TODO/FIX


							//Dates
							component.dates.map(function(d){
								if (d.point=='start'){
									addedDates.push(d.value)
									triples.push({  subject: componentUri,  predicate: "db:dateStart", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: componentProv  })
								}
								if (d.point=='end'){
									addedDates.push(d.value)
									triples.push({  subject: componentUri,  predicate: "db:dateEnd", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: componentProv  })
								}
								if (d.point=='exact'){
									addedDates.push(d.value)
									triples.push({  subject: componentUri,  predicate: "dcterms:created", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: componentProv  })
								}
							})

							//Location Owners
							if (!component.divisions) component.divisions = collection.divisions
							if (locationLookupMms[component.divisions.toUpperCase()]){
								triples.push({  subject: componentUri,  predicate: "nypl:owner", objectUri: "orgs:"+locationLookupMms[component.divisions.toUpperCase()], objectLiteral :  null,  literalDataType: null, prov: componentProv  })
							}else{
								triples.push({  subject: componentUri,  predicate: "nypl:owner", objectUri: "orgs:"+1000, objectLiteral :  null,  literalDataType: null, prov: componentProv  })
							}

							


							async.parallel({

								processAgents: function(callback){

									//build a simple ary of agents with possible viaf

									var agentsToCheck = []

									component.agents.map(function(a){
										var viaf=false
										if (a.valueURI){
											if (a.valueURI.search("viaf.org")>-1){
												viaf = parseInt(a.valueURI.split('/viaf/')[1])
												if (isNaN(viaf)) viaf = false
											}
										}
										agentsToCheck.push( { name: a.namePart, viaf: viaf, role: false, subject: false })
									})
				

									//dcterms:contributor
									var registryAgents = []

									//send each one off to be dererfernced							
									async.eachSeries(agentsToCheck, function(agent, eachCallback) {
										dereferenceAgent(databaseAgents, agent.viaf, agent.name, "archivesComponentMSS:"+component.mss,function(registryAgent){
											if (registryAgent){
												registryAgent.subject = agent.subject
												registryAgents.push(registryAgent)
											}
											eachCallback()
										})										

									}, function(err){
										if (err) console.log(err)							
										
										//all the agents have been ran though and sorted out
										registryAgents.map(function(a){
											if (a.subject){
												if (addedSubjects.indexOf(a._id) == -1){
													triples.push({  subject: componentUri,  predicate: "dcterms:subject", objectUri: "agents:"+a._id, objectLiteral :  null,  literalDataType: null, prov: componentProv  })
													addedSubjects.push(a._id)
												}
											}else{
												if (addedContriubtors.indexOf(a._id) == -1){
													triples.push({  subject: componentUri,  predicate: "dcterms:contributor", objectUri: "agents:"+a._id, objectLiteral :  null,  literalDataType: null, prov: componentProv  })
													addedContriubtors.push(a._id)
												}
											}
										})
										callback()
									})				
								},




								processSubjects: function(callback){


									var termsToCheck = []

									//split up our complex headings
									var archiveTerms = []
									component.subjects.map(function(t){
										t.text.split("--").map(function(s){
											archiveTerms.push(s.trim())
										})
									})


									archiveTerms.map(function(a){
										termsToCheck.push( { term: a, fast: false })
									})


									var registryTerms = []
									//send each one off to be dererfernced							
									async.eachSeries(termsToCheck, function(term, eachCallback) {
										dereferenceTerm(databaseTerms, term.fast, term.term, "archivesComponentMSS:"+component.mss,function(registryTerm){
											if (registryTerm){
												registryTerms.push(registryTerm)
											}
											eachCallback()
										})										

									}, function(err){
										if (err) console.log(err)				
										
										//all the agents have been ran though and sorted out
										registryTerms.map(function(a){
											if (addedSubjects.indexOf(a._id) == -1){
												triples.push({  subject: componentUri,  predicate: "dcterms:subject", objectUri: "terms:"+a._id, objectLiteral :  null,  literalDataType: null, prov: componentProv  })
												addedSubjects.push(a._id)
											}		

										})
										callback()
									})	

								},


								//mark this, the bnumber if there is one and the MMS collection as being serialized
								markAsSerialized: function(callback){
									markSerialized(databaseSerialized, "archivesCom" + component.mss,function(){
										callback()
									})
								},


								//mark this, the bnumber if there is one and the MMS collection as being serialized
								buildCaptures: function(callback){
									markSerialized(databaseSerialized, "archivesCom" + component.mss,function(){
										callback()
									})
								}


							},
							function(err, results) {


								if (component.matchedMms){

									//it matched something

									if (component.matchedMmsType == 'containerMerge'){



										//this means it needs to merg all the child components under this container

										//we need to grab all the items that live under this 
										databaseMmsItems.find( { parents : component.mmsUuid } ).toArray(function(err, mssItems){



											//if there are more than one we need to make them all sub items of the component
											async.eachSeries(mssItems, function(aMssItem, eachCallback) {


												var componentMmsProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: aMssItem.uuid  }

												//make a new nyplItem under this component

												resourceId++
												var nyplItem = "res:" + resourceId

												matchedMssLocalLookup[aMssItem._id] = true

												//LOD stuff
												triples.push({  subject: nyplItem,  predicate: "rdf:type", objectUri: "nypl:Item", objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
												triples.push({  subject: componentUri,  predicate: "pcdm:hasMember", objectUri: nyplItem, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
												triples.push({  subject: nyplItem,  predicate: "pcdm:memberOf", objectUri: componentUri, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
												triples.push({  subject: nyplItem,  predicate: "dcterms:identifier", objectUri: "urn:superparent:" + collectionRegistryId, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })

												//add in alll the data from MMS for this item											
												dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,aMssItem,function(defResults){
													var results = buildMmsTriples(aMssItem,defResults,resourceId,collectionRegistryId)
													results.triples.map(function(t){
														triples.push(t)
													})
													resourceId = results.resourceId
													eachCallback()
												})

											}, function(err){
												if (err) console.log(err)													
												//all the multiple items have been added as children nypl:item to this component											
												componentCursor.resume()
											})




										})

									}else{

										//grab the data from this item
										//databaseMmsItems
										//console.log(component)
										databaseMmsItems.find({ $or : [ { archivesComponentDb: component.mssDb }, { _id: component.mmsUuid}] }).toArray(function(err, mssItem){

											if (mssItem.length==1){

												//if there is only one we need to gather the agent/terms for them and compare to the archives component
												//we need to compare agents/terms/dates/genre to merge the two records to gether

												var componentMmsProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: mssItem[0].uuid  }

												// console.log("checking: ",component.mss, component.mssDb)
												// console.log(component.title, component.matchedMmsType, component.mmsUuid, mssItem.length)

												triples.push({  subject: componentUri,  predicate: "dcterms:identifier", objectUri: "urn:uuid:" + mssItem[0]._id, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })

												matchedMssLocalLookup[mssItem[0]._id] = true

												dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,mssItem[0],function(defResults){

													//console.log(defResults)


													//TODO FIX Dates from items comparision
													//TODO Roles better

													defResults.registryAgents.map(function(a){
														if (addedContriubtors.indexOf(a._id) == -1 && collectionLevelAgents.indexOf(a._id)==-1){
															triples.push({  subject: componentUri,  predicate: "dcterms:contributor", objectUri: "agents:"+a._id, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
														}
													})
													defResults.registryTerms.map(function(a){
														if (addedSubjects.indexOf(a._id) == -1 && collectionLevelTerms.indexOf(a._id)==-1){
															triples.push({  subject: componentUri,  predicate: "dcterms:subject", objectUri: "terms:"+a._id, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
														}
													})




													//attach any captures to this component directly	
													defResults.captures.map(function(c){

														var captureProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: c.uuid  }

														//make a new thing, a nypl:capture
														resourceId++
														var captureUri = "res:" + resourceId


														//LOD stuff
														triples.push({  subject: captureUri,  predicate: "rdf:type", objectUri: "nypl:Capture", objectLiteral :  null,  literalDataType: null, prov: captureProv  })
														triples.push({  subject: captureUri,  predicate: "dcterms:identifier", objectUri: "urn:superparent:" + collectionRegistryId, objectLiteral :  null,  literalDataType: null, prov: captureProv  })
														//relationship to the component																						
														triples.push({  subject: componentUri,  predicate: "pcdm:hasMember", objectUri: captureUri, objectLiteral :  null,  literalDataType: null, prov: captureProv  })
														triples.push({  subject: captureUri,  predicate: "pcdm:memberOf", objectUri: componentUri, objectLiteral :  null,  literalDataType: null, prov: captureProv  })

														triples.push({  subject: captureUri,  predicate: "nypl:dcflag", objectUri: null, objectLiteral :  c['nypl:dcflag'],  literalDataType: null, prov: captureProv  })
														triples.push({  subject: captureUri,  predicate: "nypl:publicDomain", objectUri: null, objectLiteral :  c['nypl:publicDomain'],  literalDataType: null, prov: captureProv  })
														triples.push({  subject: captureUri,  predicate: "dcterms:identifier", objectUri: "urn:uuid:" + c.uuid, objectLiteral :  null,  literalDataType: null, prov: captureProv  })
														if (c.imageId){
															if (c.imageId!=""){
																triples.push({  subject: captureUri,  predicate: "nypl:filename", objectUri: null, objectLiteral :  c.imageId,  literalDataType: null, prov: captureProv  })
															}
														}
													})

													componentCursor.resume()

												})

											}if (mssItem.length>1){


												//if there are more than one we need to make them all sub items of the component
												async.eachSeries(mssItem, function(aMssItem, eachCallback) {



													var componentMmsProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: aMssItem.uuid  }

													//make a new nyplItem under this component

													resourceId++
													var nyplItem = "res:" + resourceId

													matchedMssLocalLookup[aMssItem._id] = true

													//LOD stuff
													triples.push({  subject: nyplItem,  predicate: "rdf:type", objectUri: "nypl:Item", objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
													triples.push({  subject: componentUri,  predicate: "pcdm:hasMember", objectUri: nyplItem, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
													triples.push({  subject: nyplItem,  predicate: "pcdm:memberOf", objectUri: componentUri, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
													triples.push({  subject: nyplItem,  predicate: "dcterms:identifier", objectUri: "urn:superparent:" + collectionRegistryId, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })

													//add in alll the data from MMS for this item											
													dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,mssItem[0],function(defResults){
														var results = buildMmsTriples(aMssItem,defResults,resourceId,collectionRegistryId)
														results.triples.map(function(t){
															triples.push(t)
														})
														resourceId = results.resourceId
														eachCallback()
													})

												}, function(err){
													if (err) console.log(err)													
													//all the multiple items have been added as children nypl:item to this component											
													componentCursor.resume()
												})
											}else{

												componentCursor.resume()

											}
										})


									}


								}else{
									componentCursor.resume()
								}
							})

						})



						componentCursor.once('end', function() {

							relationships.map(function(r){
								//build the relationships
								triples.push({  subject: "res:"+r.s,  predicate: r.p, objectUri: "res:"+r.o, objectLiteral :  null,  literalDataType: null, prov: r.g  })
								if (!parentLookup[r.s] && !parentLookup[r.o]){
									console.log(r)
								}
							})


							//the last thing to do is loop through all the mms items that did not get matched and add them in

							//TODO FIXME

								
							setTimeout(function(){

								console.log(triples.length)
								
								totalTriples = totalTriples + triples.length
								console.log(totalTriples)
								
								process.nextTick(function(){
									cursor.resume()
								})

								

							},100)

						})


					})


					

				})

					

				console.log("err:",err)
				console.log("results:",results)
					
				setTimeout(function(){
					console.log("serializeArchives - Done!\n")
					
					

					cb(resourceId)
					return true

				},5000)



			})

		})

	})

}
