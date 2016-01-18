"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")
var sanitizeHtml = require('sanitize-html')
var serializeUtils = require("../lib/serialize_utils.js")

require("string_score")


var locationLookupMms = config['Thesaurus']['serializeLocationMms']
var noteMap = config['Thesaurus']['noteMap']



exports.returnAllCollectionIds = function(cb){
	db.returnCollectionRegistry('archivesCollections',function(err,archivesCollections){
		archivesCollections.find( {  }, { _id: 1 } ).toArray(function(err, collections){
			cb(collections)
		})
	})
}

exports.getBulk = function(cb){	
	db.newTripleStoreBulkOp('resources',function(bulk){
		cb(bulk)
	})
}


exports.serializeArchives = function(collectionId, cb){

	var totalTriples = 0

	db.returnCollectionShadowcat("bib",function(err,shadowcatBib){

		db.returnCollectionsRegistry(['agents','terms','serialized','archivesCollections','archivesComponents','archivesComponents','mmsItems','mmsCaptures'],function(err,collections){

			var databaseAgents = collections["agents"]
			var databaseTerms = collections["terms"]
			var databaseSerialized = collections["serialized"]
			var databaseArchivesCollections = collections["archivesCollections"]
			var databaseArchivesComponents = collections["archivesComponents"]
			var databaseMmsItems = collections["mmsItems"]
			var databaseMmsCaptures = collections["mmsCaptures"]

			var components = []
			var captures = []

			// var working = true

			var componentCounter = 0
			var componentAdded = {}
			
			databaseArchivesCollections.find({ _id : collectionId }).toArray(function(err, collection){


				collection = collection[0]

				var collectionObj = new serializeUtils.resourceObject()



				//make the default bnumber wrong so if there is no bnumber present we won't find anything (there should normally be a catalog rec for archives)
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

					//LOD stuff
					collectionObj.addTriple( 'rdf:type', 'nypl:Collection', null, null, "data:10001", collection.mss)



					//triples.push({  subject: collectionUri,  predicate: "dcterms:title", objectUri: null, objectLiteral :  title,  literalDataType: null, prov: collectionProv  })
					collectionObj.addTriple( 'dcterms:title', null, collection.title,  null, "data:10001", collection.mss)


					//No alt-title


					//Notes
					collection.notes.forEach(function(note){
						if (noteMap[note.type]){
							var noteText = serializeUtils.removeHtml(note.text)
							noteText = noteMap[note.type] + ":\n" + noteText
							//triples.push({  subject: collectionUri,  predicate: "skos:note", objectUri: null, objectLiteral :  note,  literalDataType: null, prov: collectionProv  })
							collectionObj.addTriple( 'skos:note', null, noteText,  null, "data:10001", collection.mss)
						}
					})

					

					var abstractText = ""
					collection.abstracts.forEach(function(abstract){
						abstractText = abstractText + " " + abstract
					})

					abstractText = serializeUtils.removeHtml(abstractText).trim()

					if (abstractText != ""){
						collectionObj.addTriple( 'dcterms:description', null, abstractText,  null, "data:10001", collection.mss)
					}


					//Identifiers
					if (collection.mss){
						//this is the collection level mss ID
						//triples.push({  subject: collectionUri,  predicate: "dcterms:identifier", objectUri: "urn:msscoll:" + collection.mss, objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
						collectionObj.addTriple( 'dcterms:identifier', "urn:msscoll:" + collection.mss, null,  null, "data:10001", collection.mss)
					}
					if (collection.bNumber){
						//triples.push({  subject: collectionUri,  predicate: "dcterms:identifier", objectUri: "urn:bnum:" + collection.bNumber, objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
						collectionObj.addTriple( 'dcterms:identifier', "urn:bnum:" + collection.bNumber, null,  null, "data:10001", collection.mss)
					}
					if (collection.callNumber){
						//triples.push({  subject: collectionUri,  predicate: "dcterms:identifier", objectUri: "urn:callnum:" + collection.callNumber.replace(/\s/g,''), objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
						collectionObj.addTriple( 'dcterms:identifier', "urn:callnum:" + collection.callNumber.replace(/\s/g,''), null,  null, "data:10001", collection.mss)
					}
					if (collection.matchedMms){
						//triples.push({  subject: collectionUri,  predicate: "dcterms:identifier", objectUri: "urn:uuid:" + collection.mmsUuid, objectLiteral :  null,  literalDataType: null, prov: collectionMmsProv  })
						collectionObj.addTriple( 'dcterms:identifier', "urn:uuid:" + collection.mmsUuid, null,  null, "data:10001", collection.mss)
					
					}


					

					//Material type
					//triples.push({  subject: collectionUri,  predicate: "dcterms:type", objectUri: "resourcetypes:col", objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
					collectionObj.addTriple( 'dcterms:type', "resourcetypes:col", null,  null, "data:10001", collection.mss)


					//there doesn't appear to be any Langauge at the collection level TODO/FIX


					//Dates
					collection.dates.forEach(function(d){
						if (d.point=='start'){
							//triples.push({  subject: collectionUri,  predicate: "db:dateStart", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: collectionProv  })
							collectionObj.addTriple( 'db:dateStart', null, d.value,  "xsd:date", "data:10001", collection.mss)
						}
						if (d.point=='end'){
							//triples.push({  subject: collectionUri,  predicate: "db:dateEnd", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: collectionProv  })
							collectionObj.addTriple( 'db:dateEnd', null, d.value,  "xsd:date", "data:10001", collection.mss)
						}
						if (d.point=='exact'){
							//triples.push({  subject: collectionUri,  predicate: "dcterms:created", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: collectionProv  })
							collectionObj.addTriple( 'dcterms:created', null, d.value,  "xsd:date", "data:10001", collection.mss)
						}
					})

					//Location Owners
					if (locationLookupMms[collection.divisions.toUpperCase()]){
						//triples.push({  subject: collectionUri,  predicate: "nypl:owner", objectUri: "orgs:"+locationLookupMms[collection.divisions.toUpperCase()], objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
						collectionObj.addTriple( 'nypl:owner',  "orgs:"+locationLookupMms[collection.divisions.toUpperCase()], null,  null, "data:10001", collection.mss)
					}else{
						//triples.push({  subject: collectionUri,  predicate: "nypl:owner", objectUri: "orgs:"+1000, objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
						collectionObj.addTriple( 'nypl:owner', "orgs:"+1000, null,  null, "data:10001", collection.mss)
					}

					var collectionLevelAgents = [], collectionLevelTerms = []

					

					//Collection level agents and subjects
					async.parallel({

						processAgents: function(callback){

							//build a simple ary of agents with possible viaf

							var agentsToCheck = []

							if (bib.agents.length > collection.agents.length){
								//use the catalog agents, it is just as good and maybe a little more structured
								bib.agents.forEach(function(a){
									var useName = a.nameLocal
									if (a.nameLc) useName = a.nameLc
									if (!useName && a.nameViaf)  useName = a.nameViaf
									agentsToCheck.push( { name: useName, viaf: (a.viaf) ? a.viaf : false, role: false, subject : (!a.contributor) ? true : false })								
								})
							}else{
								collection.agents.forEach(function(a){
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


								serializeUtils.dereferenceAgent(databaseAgents, agent.viaf, agent.name, "archivesCollectionMSS:"+collection.mss,function(registryAgent){
									if (registryAgent){
										registryAgent.subject = agent.subject
										registryAgents.push(registryAgent)
										collectionLevelAgents.push(registryAgent.registry)
									}
									eachCallback()
								})								

							}, function(err){
								if (err) console.log(err)								
								var addedContriubtors = [], addedSubjects = []

								//all the agents have been ran though and sorted out
								registryAgents.forEach(function(a){
									if (a.subject){
										if (addedSubjects.indexOf(a.registry) == -1){
											//triples.push({  subject: collectionUri,  predicate: "dcterms:subject", objectUri: "agents:"+a.registry, objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
											collectionObj.addTriple( 'dcterms:subject', "agents:"+a.registry, null,  null, "data:10001", collection.mss,a.nameControlled)
											addedSubjects.push(a.registry)
											collectionLevelTerms.push(a.registry)
											collectionObj.allAgents.push(a.registry)
										}
									}else{
										if (addedContriubtors.indexOf(a.registry) == -1){
											//triples.push({  subject: collectionUri,  predicate: "dcterms:contributor", objectUri: "agents:"+a.registry, objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
											collectionObj.addTriple( 'dcterms:contributor', "agents:"+a.registry, null,  null, "data:10001", collection.mss,a.nameControlled)
											addedContriubtors.push(a.registry)
											collectionLevelAgents.push(a.registry)
											collectionObj.allAgents.push(a.registry)
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

							if (!collection.subjects) collection.subjects = []
							if (!bib.terms) bib.terms = []

							collection.subjects.forEach(function(t){
								t.text.split("--").forEach(function(s){
									archiveTerms.push(s.trim())
								})
							})

							if (bib.terms.length >= collection.subjects.length){
								//use the catalog terms, it is just as good and maybe a little more structured
								bib.terms.forEach(function(a){
									var useTerm = false
									if (a.nameLocal) useTerm = a.nameLocal
									if (a.nameFast) useTerm = a.nameFast

									termsToCheck.push( { term: useTerm, fast: (a.fast) ? a.fast : false })								
								})
							}else{
								archiveTerms.forEach(function(a){
									termsToCheck.push( { term: a, fast: false })
								})
							}


							var registryTerms = []
							//send each one off to be dererfernced							
							async.eachSeries(termsToCheck, function(term, eachCallback) {
								serializeUtils.dereferenceTerm(databaseTerms, term.fast, term.term, "archivesCollectionMSS:"+collection.mss,function(registryTerm){
									if (registryTerm){
										registryTerms.push(registryTerm)
									}
									eachCallback()
								})
								

							}, function(err){
								if (err) console.log(err)				
								var addedSubjects = []
								//all the agents have been ran though and sorted out
								registryTerms.forEach(function(a){
									if (addedSubjects.indexOf(a.registry) == -1){
										//triples.push({  subject: collectionUri,  predicate: "dcterms:subject", objectUri: "terms:"+a._id, objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
										collectionObj.addTriple( 'dcterms:subject', "terms:"+a.registry, null,  null, "data:10001", collection.mss,a.termControlled)
										addedSubjects.push(a.registry)
										collectionLevelTerms.push(a.registry)
										collectionObj.allTerms.push(a.registry)
									}				

								})
								callback()
							})	

						},


						//mark this, the bnumber if there is one and the MMS collection as being serialized
						markAsSerialized: function(callback){
							serializeUtils.markSerialized(databaseSerialized, "archivesCol" + collection.mss,function(){
								if (bNumber>0){
									serializeUtils.markSerialized(databaseSerialized, "catalog" + bNumber)
								}
								if (collection.matchedMms){
									serializeUtils.markSerialized(databaseSerialized, "mms" + collection.mmsUuid)
								}
								callback()
							})
						}


					},
					function(err, results) {

						// working = false
							

						//there might be some MMS Items that were not matched to a archival component, those just need to get added to the root collection since we don't know where to place them
						//this can be done async with the rest of the process since we don't need to know anything about the archives component
						databaseMmsItems.find( { parents : collection.mmsUuid, matchedArchives: {$exists: false} } ).toArray(function(err, mssItems){


							//if there are more than one we need to make them all sub items of the collection
							async.eachSeries(mssItems, function(aMssItem, eachCallback) {

								// working = true

								var nyplItem = new serializeUtils.resourceObject()

								matchedMssLocalLookup[aMssItem._id] = true

								//add in alll the data from MMS for this item											
								serializeUtils.dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,aMssItem,function(defResults){
									
									var results = serializeUtils.buildMmsTriples(aMssItem,defResults,collectionObj.uri)
									results.mmsItemObj.addTriple( "rdf:type", "nypl:Item", null,  null, "data:10002", aMssItem.uuid )
									results.mmsItemObj.addTriple( "pcdm:memberOf", "res:"+collectionObj.uri, null,  null, "data:10002", aMssItem.uuid )
									results.mmsItemObj.addTriple( "dcterms:identifier", "urn:superparent:" + collectionObj.uri, null,  null, "data:10002", aMssItem.uuid )
									collectionObj.addTriple( "pcdm:hasMember", "res:" + results.mmsItemObj.uri, null,  null, "data:10002", aMssItem.uuid )

									components.push(results.mmsItemObj)
									results.captures.forEach(function(cap){ captures.push(cap)})									
									eachCallback()
								})

							}, function(err){
								if (err) console.log(err)													
								//all the multiple items have been added as children nypl:item to this component
								// working = false											
								componentCursor.resume()
							})
						})



						//while that is going/not going start working on the real components.
						//console.log("Loading Collection Components:",collection.title)
						//next step is to gather all of the children
						var componentCursor = databaseArchivesComponents.find({ collectionDb : collection.mssDb, mss: {$exists: true} }).sort( { orderSequence : 1})
						var parentLookup = {}
						var relationships = []


						parentLookup[collection.mssDb] = collectionObj.uri
				
						componentCursor.on('data', function(component) {


							// console.log(++componentCounter)

							// working = true

							componentCursor.pause()

							var componentObj = new serializeUtils.resourceObject()


							

							// //this is the collection level URI
							// var componentUri = componentObj.uri

							if (!component.parentDb){
								component.parentDb = component.collectionDb
							}


							//this is component level prov
							//var componentProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10001", recordIdentifier: component.mss  }							

							//shity error, fix later TODO FIXME
							if (component.matchedMms){
								if (!component.mmsUuid && component.archivesCollectionDb) component.mmsUuid = component.archivesCollectionDb
							}



							//LOD stuff
							//triples.push({  subject: componentUri,  predicate: "rdf:type", objectUri: "nypl:Component", objectLiteral :  null,  literalDataType: null, prov: componentProv  })
							//triples.push({  subject: componentUri,  predicate: "dcterms:identifier", objectUri: "urn:superparent:" + collectionRegistryId, objectLiteral :  null,  literalDataType: null, prov: componentProv  })

							componentObj.addTriple( 'rdf:type', "nypl:Component", null,  null, "data:10001", component.mss)
							componentObj.addTriple( 'dcterms:identifier',  "urn:superparent:" + collectionObj.uri, null,  null, "data:10001", component.mss)

							parentLookup[component.mssDb] = componentObj.uri



							relationships.push(
								JSON.parse(JSON.stringify(
								{
									s: component.parentDb,
									p: 'pcdm:hasMember',
									o: component.mssDb,
									g: component.mss
								}))
							)

							

							relationships.push(
								JSON.parse(JSON.stringify(
								{
									s: component.mssDb,
									p: 'pcdm:memberOf',
									o: component.parentDb,
									g: component.mss
								}))
							)




							//Component level agents and subjects
							var addedContriubtors = [], addedSubjects = [], addedDates = []


							//build all the same data as what was in the colelction level

							var title = (component.title) ? component.title : component.dateStatement
							title = serializeUtils.removeHtml(title)

							//triples.push({  subject: componentUri,  predicate: "dcterms:title", objectUri: null, objectLiteral :  title,  literalDataType: null, prov: componentProv  })
							componentObj.addTriple( 'dcterms:title', null, title,  null, 'data:10001', component.mss)

							//No alt-title

							//Notes
							component.notes.forEach(function(note){
								if (noteMap[note.type]){
									var noteText = serializeUtils.removeHtml(note.text)
									noteText = noteMap[note.type] + ':\n' + noteText
									//triples.push({  subject: componentUri,  predicate: 'skos:note', objectUri: null, objectLiteral :  note,  literalDataType: null, prov: componentProv  })
									componentObj.addTriple( 'skos:note', null, note,  null, 'data:10001', component.mss)
								}
							})


							var abstractText = ""
							component.abstracts.forEach(function(abstract){
								abstractText = abstractText + " " + abstract
							})

							abstractText = abstractText.trim()

							if (abstractText != ""){
								//triples.push({  subject: componentUri,  predicate: "dcterms:description", objectUri: null, objectLiteral :  abstractText,  literalDataType: null, prov: componentProv  })
								componentObj.addTriple( 'dcterms:description', null, abstractText,  null, "data:10001", component.mss)
							}

							//Identifiers
							if (component.mss){
								//this is the component level mss ID
								//triples.push({  subject: componentUri,  predicate: "dcterms:identifier", objectUri: "urn:msscoll:" + component.mss, objectLiteral :  null,  literalDataType: null, prov: componentProv  })
								componentObj.addTriple( 'dcterms:identifier', "urn:msscoll:" + component.mss, null,  null, "data:10001", component.mss)
							}
							if (component.barcode){
								//triples.push({  subject: componentUri,  predicate: "dcterms:identifier", objectUri: "urn:barcode:" + component.barcode, objectLiteral :  null,  literalDataType: null, prov: componentProv  })
								componentObj.addTriple( 'dcterms:identifier', "urn:barcode:" + component.barcode, null,  null, "data:10001", component.mss)
							}


							//Material type
							//triples.push({  subject: componentUri,  predicate: "dcterms:type", objectUri: "resourcetypes:col", objectLiteral :  null,  literalDataType: null, prov: componentProv  })
							componentObj.addTriple( 'dcterms:type', 'resourcetypes:col', null,  null, "data:10001", component.mss)

							//there doesn't appear to be any Langauge at the collection level TODO/FIX


							//Dates
							component.dates.forEach(function(d){
								if (d.point=='start'){
									addedDates.push(d.value)
									//triples.push({  subject: componentUri,  predicate: "db:dateStart", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: componentProv  })
									componentObj.addTriple( 'db:dateStart', null, d.value,  "xsd:date", "data:10001", component.mss)
								}
								if (d.point=='end'){
									addedDates.push(d.value)
									//triples.push({  subject: componentUri,  predicate: "db:dateEnd", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: componentProv  })
									componentObj.addTriple( 'db:dateEnd', null, d.value,  "xsd:date", "data:10001", component.mss)
								}
								if (d.point=='exact'){
									addedDates.push(d.value)
									//triples.push({  subject: componentUri,  predicate: "dcterms:created", objectUri: null, objectLiteral :  d.value,  literalDataType: "xsd:date", prov: componentProv  })
									componentObj.addTriple( 'db:created', null, d.value,  "xsd:date", "data:10001", component.mss)
								}
							})

							//Location Owners
							if (!component.divisions) component.divisions = collection.divisions
							if (locationLookupMms[component.divisions.toUpperCase()]){
								//triples.push({  subject: componentUri,  predicate: "nypl:owner", objectUri: "orgs:"+locationLookupMms[component.divisions.toUpperCase()], objectLiteral :  null,  literalDataType: null, prov: componentProv  })
								componentObj.addTriple( 'nypl:owner', "orgs:"+locationLookupMms[component.divisions.toUpperCase()], null,  null, "data:10001", component.mss)
							}else{
								//triples.push({  subject: componentUri,  predicate: "nypl:owner", objectUri: "orgs:"+1000, objectLiteral :  null,  literalDataType: null, prov: componentProv  })
								componentObj.addTriple( 'nypl:owner', "orgs:"+1000, null,  null, "data:10001", component.mss)
							}

							


							async.parallel({

								processAgents: function(callback){

									//build a simple ary of agents with possible viaf

									var agentsToCheck = []

									component.agents.forEach(function(a){
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
										serializeUtils.dereferenceAgent(databaseAgents, agent.viaf, agent.name, "archivesComponentMSS:"+component.mss,function(registryAgent){
											if (registryAgent){
												registryAgent.subject = agent.subject
												registryAgents.push(registryAgent)
											}
											eachCallback()
										})										

									}, function(err){
										if (err) console.log(err)							
										
										//all the agents have been ran though and sorted out
										registryAgents.forEach(function(a){
											if (a.subject){
												if (addedSubjects.indexOf(a.registry) == -1){
													//triples.push({  subject: componentUri,  predicate: "dcterms:subject", objectUri: "agents:"+a.registry, objectLiteral :  null,  literalDataType: null, prov: componentProv  })
													componentObj.addTriple( 'dcterms:subject', "agents:"+a.registry, null,  null, "data:10001", component.mss, a.nameControlled)
													addedSubjects.push(a.registry)
													componentObj.allAgents.push(a.registry)
												}
											}else{
												if (addedContriubtors.indexOf(a.registry) == -1){
													//triples.push({  subject: componentUri,  predicate: "dcterms:contributor", objectUri: "agents:"+a.registry, objectLiteral :  null,  literalDataType: null, prov: componentProv  })
													componentObj.addTriple( 'dcterms:contributor', "agents:"+a.registry, null,  null, "data:10001", component.mss, a.nameControlled)
													addedContriubtors.push(a.registry)
													componentObj.allAgents.push(a.registry)
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
									component.subjects.forEach(function(t){
										t.text.split("--").forEach(function(s){
											archiveTerms.push(s.trim())
										})
									})


									archiveTerms.forEach(function(a){
										termsToCheck.push( { term: a, fast: false })
									})


									var registryTerms = []
									//send each one off to be dererfernced							
									async.eachSeries(termsToCheck, function(term, eachCallback) {
										serializeUtils.dereferenceTerm(databaseTerms, term.fast, term.term, "archivesComponentMSS:"+component.mss,function(registryTerm){
											if (registryTerm){
												registryTerms.push(registryTerm)
											}
											eachCallback()
										})										

									}, function(err){
										if (err) console.log(err)				
										
										//all the agents have been ran though and sorted out
										registryTerms.forEach(function(a){
											if (addedSubjects.indexOf(a.registry) == -1){
												//triples.push({  subject: componentUri,  predicate: "dcterms:subject", objectUri: "terms:"+a.registry, objectLiteral :  null,  literalDataType: null, prov: componentProv  })
												componentObj.addTriple( 'dcterms:subject', "terms:"+a.registry, null,  null, "data:10001", component.mss, a.termControlled)
												addedSubjects.push(a.registry)
												collectionObj.allTerms.push(a.registry)
											}		

										})
										callback()
									})	

								},


								markAsSerialized: function(callback){
									serializeUtils.markSerialized(databaseSerialized, "archivesCom" + component.mss,function(){
										callback()
									})
								}							


							},
							function(err, results) {


								if (component.matchedMms){

									//it matched something

									if (component.matchedMmsType == 'containerMerge'){

										// working = true

										//this means it needs to merg all the child components under this container
										//we need to grab all the items that live under this 
										databaseMmsItems.find( { parents : component.mmsUuid } ).toArray(function(err, mssItems){

											//if there are more than one we need to make them all sub items of the component
											async.eachSeries(mssItems, function(aMssItem, eachCallback) {
												// working = true

												//var componentMmsProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: aMssItem.uuid  }

												//make a new nyplItem under this component

												//resourceId++
												//var nyplItem = "res:" + resourceId
												var nyplItem = new serializeUtils.resourceObject()



												matchedMssLocalLookup[aMssItem._id] = true

												//LOD stuff
												// triples.push({  subject: nyplItem,  predicate: "rdf:type", objectUri: "nypl:Item", objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
												// triples.push({  subject: componentUri,  predicate: "pcdm:hasMember", objectUri: nyplItem, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
												// triples.push({  subject: nyplItem,  predicate: "pcdm:memberOf", objectUri: componentUri, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
												// triples.push({  subject: nyplItem,  predicate: "dcterms:identifier", objectUri: "urn:superparent:" + collectionRegistryId, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })


												nyplItem.addTriple( 'rdf:type', "nypl:Item", null,  null, "data:10002", aMssItem.uuid)
												nyplItem.addTriple( 'pcdm:memberOf', "res:"+componentObj.uri, null,  null, "data:10002", aMssItem.uuid)
												nyplItem.addTriple( 'dcterms:identifier', "urn:superparent:" + collectionObj.uri, null,  null, "data:10002", aMssItem.uuid)
												componentObj.addTriple( 'pcdm:hasMember', "res:"+nyplItem.uri, null,  null, "data:10001", component.mss)

												//console.log(JSON.stringify(nyplItem.triples,null,2)) 


												//add in alll the data from MMS for this item											
												serializeUtils.dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,aMssItem,function(defResults){
													
													var results = serializeUtils.buildMmsTriples(aMssItem,defResults,collectionObj.uri)
													
													// results.triples.forEach(function(t){
													// 	console.log("FIX MEEE--->",t)
													// 	triples.push(t)
													// })

													results.mmsItemObj.addTriple( "rdf:type", "nypl:Item", null,  null, "data:10002", aMssItem.uuid )
													results.mmsItemObj.addTriple( "pcdm:memberOf", "res:"+componentObj.uri, null,  null, "data:10002", aMssItem.uuid )
													results.mmsItemObj.addTriple( "dcterms:identifier", "urn:superparent:" + collectionObj.uri, null,  null, "data:10002", aMssItem.uuid )
													componentObj.addTriple( "pcdm:hasMember", "res:" + results.mmsItemObj.uri, null,  null, "data:10002", aMssItem.uuid )

													components.push(results.mmsItemObj)
													results.captures.forEach(function(cap){ captures.push(cap)})


													
													eachCallback()
												})

											}, function(err){
												if (err) console.log(err)													
												//all the multiple items have been added as children nypl:item to this component
												// working = false											
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

												//var componentMmsProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: mssItem[0].uuid  }

												// console.log("checking: ",component.mss, component.mssDb)
												// console.log(component.title, component.matchedMmsType, component.mmsUuid, mssItem.length)

												//triples.push({  subject: componentUri,  predicate: "dcterms:identifier", objectUri: "urn:uuid:" + mssItem[0]._id, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
												componentObj.addTriple( "dcterms:identifier", "urn:uuid:" + mssItem[0]._id, null,  null, "data:10002", mssItem[0].uuid)


												matchedMssLocalLookup[mssItem[0]._id] = true
												// working = true
												serializeUtils.dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,mssItem[0],function(defResults){



													//console.log(defResults)


													//TODO FIX Dates from items comparision
													//TODO Roles better

													defResults.registryAgents.forEach(function(a){
														if (addedContriubtors.indexOf(a.registry) == -1 && collectionLevelAgents.indexOf(a.registry)==-1){
															//triples.push({  subject: componentUri,  predicate: "dcterms:contributor", objectUri: "agents:"+a.registry, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
															componentObj.addTriple( "dcterms:contributor", "agents:"+a.registry, null,  null, "data:10002", mssItem[0].uuid, a.nameControlled)
															componentObj.allAgents.push(a.registry)
														}
													})
													defResults.registryTerms.forEach(function(a){
														if (addedSubjects.indexOf(a.registry) == -1 && collectionLevelTerms.indexOf(a.registry)==-1){
															//triples.push({  subject: componentUri,  predicate: "dcterms:subject", objectUri: "terms:"+a.registry, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
															componentObj.addTriple( "dcterms:subject", "terms:"+a.registry, null,  null, "data:10002", mssItem[0].uuid, a.termControlled)
															collectionObj.allTerms.push(a.registry)
														}
													})




													//attach any captures to this component directly	
													defResults.captures.forEach(function(c){

														//var captureProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: c.uuid  }

														//make a new thing, a nypl:capture
														//resourceId++
														//var captureUri = "res:" + resourceId


														var captureObj = new serializeUtils.resourceObject()

														



														//LOD stuff
														//triples.push({  subject: captureUri,  predicate: "rdf:type", objectUri: "nypl:Capture", objectLiteral :  null,  literalDataType: null, prov: captureProv  })
														//triples.push({  subject: captureUri,  predicate: "dcterms:identifier", objectUri: "urn:superparent:" + collectionRegistryId, objectLiteral :  null,  literalDataType: null, prov: captureProv  })
															
														captureObj.addTriple( "rdf:type", "nypl:Capture", null,  null, "data:10002", c.uuid)
														captureObj.addTriple( "dcterms:identifier", "urn:superparent:" + collectionObj.uri, null,  null, "data:10002", c.uuid)


														//relationship to the component																						
														//triples.push({  subject: componentUri,  predicate: "pcdm:hasMember", objectUri: captureUri, objectLiteral :  null,  literalDataType: null, prov: captureProv  })
														//triples.push({  subject: captureUri,  predicate: "pcdm:memberOf", objectUri: componentUri, objectLiteral :  null,  literalDataType: null, prov: captureProv  })

														componentObj.addTriple( "pcdm:hasMember", "res:" + captureObj.uri, null,  null, "data:10002", c.uuid)
														captureObj.addTriple( "pcdm:memberOf", "res:" + componentObj.uri, null,  null, "data:10002", c.uuid)

														// triples.push({  subject: captureUri,  predicate: "nypl:dcflag", objectUri: null, objectLiteral :  c['nypl:dcflag'],  literalDataType: null, prov: captureProv  })
														// triples.push({  subject: captureUri,  predicate: "nypl:publicDomain", objectUri: null, objectLiteral :  c['nypl:publicDomain'],  literalDataType: null, prov: captureProv  })
														// triples.push({  subject: captureUri,  predicate: "dcterms:identifier", objectUri: "urn:uuid:" + c.uuid, objectLiteral :  null,  literalDataType: null, prov: captureProv  })
														

														captureObj.addTriple( "nypl:dcflag", null, c['nypl:dcflag'],  'xsd:boolean', "data:10002", c.uuid)
														captureObj.addTriple( "nypl:publicDomain", null, c['nypl:publicDomain'],  'xsd:boolean', "data:10002", c.uuid)
														captureObj.addTriple( "dcterms:identifier", "urn:uuid:" + c.uuid, null,  null, "data:10002", c.uuid)


														if (c.imageId){
															if (c.imageId!=""){
																//triples.push({  subject: captureUri,  predicate: "nypl:filename", objectUri: null, objectLiteral :  c.imageId,  literalDataType: null, prov: captureProv  })
																captureObj.addTriple( "nypl:filename", null, c.imageId,  null, "data:10002", c.uuid)
															}
														}

														captures.push(captureObj)
													})
													
													//double check here
													if (!componentAdded[componentObj.uri]) { components.push(componentObj); componentAdded[componentObj.uri] = true   }

													// working = false
													componentCursor.resume()

												})

											}if (mssItem.length>1){


												//if there are more than one we need to make them all sub items of the component
												async.eachSeries(mssItem, function(aMssItem, eachCallback) {

													// working = true



													//var componentMmsProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: aMssItem.uuid  }

													//make a new nyplItem under this component

													// resourceId++
													// var nyplItem = "res:" + resourceId
													//var nyplItem = new serializeUtils.resourceObject()



													matchedMssLocalLookup[aMssItem._id] = true

													// //LOD stuff
													// triples.push({  subject: nyplItem,  predicate: "rdf:type", objectUri: "nypl:Item", objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
													// triples.push({  subject: componentUri,  predicate: "pcdm:hasMember", objectUri: nyplItem, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
													// triples.push({  subject: nyplItem,  predicate: "pcdm:memberOf", objectUri: componentUri, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
													// triples.push({  subject: nyplItem,  predicate: "dcterms:identifier", objectUri: "urn:superparent:" + collectionRegistryId, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })



													//add in alll the data from MMS for this item											
													serializeUtils.dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,mssItem[0],function(defResults){

														var results = serializeUtils.buildMmsTriples(aMssItem,defResults,collectionObj.uri )

														results.mmsItemObj.addTriple( "rdf:type", "nypl:Item", null,  null, "data:10002", aMssItem.uuid )
														results.mmsItemObj.addTriple( "pcdm:memberOf", "res:"+componentObj.uri, null,  null, "data:10002", aMssItem.uuid )
														results.mmsItemObj.addTriple( "dcterms:identifier", "urn:superparent:" + collectionObj.uri, null,  null, "data:10002", aMssItem.uuid )
														componentObj.addTriple( "pcdm:hasMember", "res:" + results.mmsItemObj.uri, null,  null, "data:10002", aMssItem.uuid )

														components.push(results.mmsItemObj)
														results.captures.forEach(function(cap){ captures.push(cap)})

														eachCallback()
													})

												}, function(err){
													if (err) console.log(err)													
													//all the multiple items have been added as children nypl:item to this component
													// working = false										
													componentCursor.resume()
												})
											}else{
												//double check here
												if (!componentAdded[componentObj.uri]) { components.push(componentObj); componentAdded[componentObj.uri] = true   }
												// working = false
												componentCursor.resume()
											}
										})
									}
								}else{
									//double check here
									if (!componentAdded[componentObj.uri]) { components.push(componentObj); componentAdded[componentObj.uri] = true   }									
									// working = false
									componentCursor.resume()
								}
							})

						})



						componentCursor.once('end', function() {

							var totalObjs = 0




							var interval = setInterval(function(){

								// console.log("checking for end...")

								if (totalObjs === (components.length + captures.length) ){

									clearTimeout(interval)

									relationships.forEach(function(r){
										//build the relationships								
										if (!parentLookup[r.s] && !parentLookup[r.o]){
											console.log("ERROR:",r)
										}else{
											for (var aComponent in components){
												if (components[aComponent].uri === parentLookup[r.s]){									
													components[aComponent].addTriple( r.p, "res:"+parentLookup[r.o], null,  null, "data:10001", r.g )																			
												}
											}
										}
									})
									
									process.nextTick(function(){
										var all = [collectionObj]
										components.forEach(function(c){ all.push(c) })
										captures.forEach(function(c){ all.push(c) })

										cb( all )
										return true
									})

								}else{
									totalObjs = (components.length + captures.length)
								}


							},500)

						})
					})				

				})					

			})

		})

	})

}
