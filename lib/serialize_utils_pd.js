"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")
var sanitizeHtml = require('sanitize-html')
var fs = require('fs');
require("string_score")


var exportCsv  =  __dirname + '/..' + config['Source']['pdExportCsv']
var exportJson =  __dirname + '/..' + config['Source']['pdExportJson']

var mmsTermsLookup = config['Thesaurus']['mmsTermTypes']
var archivesTermLookup = config['Thesaurus']['archivesTermTypes']

var locationLookupMms = config['Thesaurus']['serializeLocationMms']
var locationLookupCatalog = config['Thesaurus']['serializeCatalog']

var roleLookupCatalog = config['Thesaurus']['shadowcatRoleMap']
var noteLookupCatalog = config['Thesaurus']['shadowcatNoteMap']
var materialLookupCatalog = config['Thesaurus']['shadowcatMaterialTypeMap']

var noteMap = {
	"bioghist" : "Biographical/historical information",
	"scopecontent" : "Scope and content",
	"custodhist" : "Custodial history",
	"acqinfo" : "Acquisition information",
	"relatedmaterial" : "Related material",
	"content" : "Content",
	"biographical/historical": "Biographical/Historical",
	"admin": "Admin",
	"citation/reference" : "Citation/Reference",
	"ownership" : "Ownership",
	"statement of responsibility" : "Statement of Responsibility",
	"bibliography" : "bibliography",
	"source identifier": "Source Identifier",
	"source note" : "Source Note",
	"numbering"	: "Numbering",
	"exhibitions" : "Exhibitions",
	"language" : "Language",
	"date/sequential designation": "Date/Sequential Designation",
	"reproduction" : "Reproduction",
	"funding" : "Funding",
	"date" : "Date",
	"additional physical form" : "Additional Physical Form",
	"acquisition" : "Acquisition"
}

var mmsTorMap = {
	"three dimensional object" : "art",
	"sound recording" : "aud",
	"sound recording-musical" : "aud",
	"sound recording-nonmusical" : "aud",
	"cartographic" : "car",
	"mixed material" : "mix",
	"moving image" : "mov",
	"software, multimedia" : "mul",
	"notated music" : "not",
	"still image": "img",
	"text" : "txt"
}


var dereferenceAgent = function(agentsCollection, viaf, name, recordId, cb){


	if (viaf){

		//grab their info and check if they are in agents
		agentsCollection.find({ viaf : viaf }).toArray(function(err, agentsAry) {

			if (agentsAry.length>0){
				if (!agentsAry[0].useCount) agentsAry[0].useCount = 0
				agentsAry[0].useCount++
				agentsCollection.update({ _id: agentsAry[0]._id }, { $set : { useCount : agentsAry[0].useCount  } })
				cb(agentsAry[0])
			}else{
				errorLib.error("No Agent found for this record! ", JSON.stringify({ foundIn: recordId, viaf: viaf, name: name }))
				cb(false)
			}
		})	

	}else{

		if (!name){
			errorLib.error("No Agent found for this record! ", JSON.stringify({ foundIn: recordId, viaf: viaf, name: name }))
			cb(false)
			return false
		}

		agentsCollection.find({ nameNormalized : utils.normalizeAndDiacritics(name) }).toArray(function(err, agentsAry) {
			if (agentsAry.length>0){


				//if there are more than one try to find the very best match
				var bestScore = -100, bestMatch = false
				for (var x in agentsAry){
					var score = agentsAry[x].nameControlled.score(name,0.5)
					if (score > bestScore){
						bestScore = score
						bestMatch = agentsAry[x]
					}
				}

				//if (bestScore<0.02) console.log(name, " ---> ", bestMatch.nameControlled,bestScore)

				//we want to flip the switch on the agent to say it has been used 
				if (!bestMatch.useCount) bestMatch.useCount = 0
				bestMatch.useCount++
				agentsCollection.update({ _id: bestMatch._id }, { $set : { useCount : bestMatch.useCount  } })
				cb(bestMatch)
			}else{
				errorLib.error("No Agent found for this record! ", JSON.stringify({ foundIn: recordId, viaf: viaf, name: name }))
				cb(false)
			}
		})	



	}


	

}


var dereferenceTerm = function(termsCollection, fast, term, recordId, cb){


	if (fast){

		//grab their info and check if they are in agents
		termsCollection.find({ fast : fast }).toArray(function(err, termsAry) {

			if (termsAry.length>0){
				if (!termsAry[0].useCount) termsAry[0].useCount = 0
				termsAry[0].useCount++
				termsCollection.update({ _id: termsAry[0]._id }, { $set : { useCount : termsAry[0].useCount  } })
				cb(termsAry[0])
			}else{
				errorLib.error("No Term found for this record! ", JSON.stringify({ foundIn: recordId, fast: fast, term: term }))
				cb(false)
			}
		})	

	}else{

		if (!term){
			errorLib.error("No Term found for this record! ", JSON.stringify({ foundIn: recordId, fast: fast, term: term }))
			cb(false)
			return false
		}

		termsCollection.find({ nameNormalized :  utils.singularize(utils.normalizeAndDiacritics(term))  }).toArray(function(err, termsAry) {
			if (termsAry.length>0){

				//if there are more than one try to find the very best match
				var bestScore = -100, bestMatch = false
				for (var x in termsAry){
					var score = termsAry[x].nameControled.score(term,0.5)
					if (score > bestScore){
						bestScore = score
						bestMatch = termsAry[x]
					}
				}

				if (bestScore<0.02) console.log(term, " ---> ", bestMatch.nameControlled,bestScore)

				if (bestScore==-100){
					cb(false)
					errorLib.error("Terms table problem for this recordrecord! ", JSON.stringify({ foundIn: recordId, fast: fast, term: term }))
					return false
				}

				//we want to flip the switch on the agent to say it has been used 
				if (!bestMatch.useCount) bestMatch.useCount = 0
				bestMatch.useCount++
				termsCollection.update({ _id: bestMatch._id }, { $set : { useCount : bestMatch.useCount  } })

				cb(bestMatch)
			}else{
				errorLib.error("No Term found for this record! ", JSON.stringify({ foundIn: recordId, fast: fast, term: term }))
				cb(false)
			}
		})	



	}


	

}


var dereferenceMmsItem = function(agentsCollection, termsCollection, databaseSerialized, mmsCaptures,  mmsItem, cb){


	var registryAgents = [], registryTerms = [], captures = []


	async.parallel({

		processAgents: function(callback){

			//build a simple ary of agents with possible viaf

			var addedAgents = []

			var agentsToCheck = []
			mmsItem.agents.map(function(a){
				if (a.role){
					a.role.map(function(r){
						var role = r.split('/relators/')[1]
						if (!role) role = 'unk'
						agentsToCheck.push( { name: a.namePart, viaf: false, role: role, subject: false })
					})

				}else{
					agentsToCheck.push( { name: a.namePart, viaf: false, role: false, subject: false })

				}				
			})

			mmsItem.subjects.map(function(a){
				if (a.type =='name'){
					agentsToCheck.push( { name: a.text, viaf: false, role: false, subject: true })
				}				
			})



			//send each one off to be dererfernced							
			async.eachSeries(agentsToCheck, function(agent, eachCallback) {
				dereferenceAgent(agentsCollection, agent.viaf, agent.name, "mmsItem:"+mmsItem.mmsDb,function(registryAgent){
					if (registryAgent){
						registryAgent.subject = agent.subject
						registryAgent.role = agent.role


						if (addedAgents.indexOf(registryAgent._id)==-1){
							registryAgents.push(registryAgent)
							addedAgents.push(registryAgent._id)
						}
					}
					eachCallback()
				})										

			}, function(err){
				if (err) console.log(err)		
				callback()
			})				
		},

		processSubjects: function(callback){


			var termsToCheck = [], addedSubjects = []


			//split up our complex headings
			var archiveTerms = []
			mmsItem.subjects.map(function(t){
				if (t.type != 'name'){
					t.text.split("--").map(function(s){
						archiveTerms.push(s.trim())
					})
				}
			})

			if (mmsItem.typeOfResource){
				mmsItem.typeOfResource.map(function(tor){
					archiveTerms.push(tor.trim())					
				})
			}

			archiveTerms.map(function(a){
				termsToCheck.push( { term: a, fast: false })
			})

			//send each one off to be dererfernced							
			async.eachSeries(termsToCheck, function(term, eachCallback) {
				dereferenceTerm(termsCollection, term.fast, term.term, "mmsItem:"+mmsItem.mmsDb,function(registryTerm){
					if (registryTerm){
						registryTerms.push(registryTerm)
					}else{
						//console.log(mmsItem.subjects)
						//TODO FIX ingest is taking type 'name' into subjects!

					}
					eachCallback()
				})										

			}, function(err){
				if (err) console.log(err)				
				
				//all the agents have been ran though and sorted out
				registryTerms.map(function(a){
					if (addedSubjects.indexOf(a._id) == -1){
						addedSubjects.push(a._id)
					}
				})
				callback()
			})
		},


		//mark this, the bnumber if there is one and the MMS collection as being serialized
		markAsSerialized: function(callback){
			markSerialized(databaseSerialized, "mmsItem" +mmsItem.mmsDb,function(){
				callback()
			})
		},


		//mark this, the bnumber if there is one and the MMS collection as being serialized
		buildCaptures: function(callback){


			//is it public domain is it in DC?
			var publicDomain = false, inDc = false

			if (mmsItem.publicDomain) publicDomain = true
			if (mmsItem.rights){
				mmsItem.rights.map(function(r){
					if (r=='Can be used on NYPL website') inDc = true
				})
			}


			mmsCaptures.find({ itemMmsDb : parseInt(mmsItem.mmsDb)}).toArray(function(err,captureAry){
				

				captureAry.map(function(c){

					captures.push({
						'nypl:dcflag' : inDc,
						'nypl:publicDomain' : publicDomain,
						'uuid' : c._id,
						mmsDb: c.itemMmsDb,
						imageId:  c.imageId
					})


				})


				callback()

			})



		}


	},
	function(err, results) {


		cb({
			registryAgents: registryAgents,
			registryTerms: registryTerms,
			captures: captures


		})

	})


}



exports.serializeMmsItem = function(cb){


	var noteType ={}


	fs.unlink(exportCsv, function (err) {

		fs.unlink(exportJson, function (err) {

			var totalCollections=0, totalTriples =0


			db.returnDb(function(err,databaseConnection){
				if (err) console.log(err)

				var resourceId = 100000000


				var databaseAgents = databaseConnection.collection("agents")
				var databaseTerms = databaseConnection.collection("terms")
				var databaseSerialized = databaseConnection.collection("serialized")
				var databaseMmsCollections = databaseConnection.collection("mmsCollections")
				var databaseMmsContainers = databaseConnection.collection("mmsContainers")

				var databaseMmsItems = databaseConnection.collection("mmsItems")
				var databaseMmsCaptures = databaseConnection.collection("mmsCaptures")

				console.log("Loading Collections")
				databaseMmsCollections.find({ }, { title: 1}).toArray(function(err, collections){		

					console.log("Loading Containers")
					databaseMmsContainers.find({ }, { title: 1}).toArray(function(err, containers){

						//console.log(containers[0])

						//loop through all the archives collections
						var cursor = databaseMmsItems.find({ publicDomain: true, dcFlag:true })

						cursor.on('data', function(item) {

							cursor.pause()

							var csvData = {
								"UUID" : null,
								"Database ID" : null,
								"Title" : null,
								"Alternative Title" : null,
								"Contributor" : null,
								"Date" : null,
								"Date Start" : null,
								"Date End" : null,
								"Language" : null,
								"Description" : null,
								"Note" : null,
								"Subject Topical" : null,
								"Subject Name" : null,
								"Subject Geographic" : null,
								"Subject Temporal" : null,
								"Subject Title" : null,
								"Resource type" : null,
								"Genre URI" : null,
								"Identifier BNumber" : null,
								"Identifier Accession Number" : null,
								"Identifier Call Number" : null,
								"Identifier ISBN" : null,
								"Identifier ISSN" : null,
								"Identifier Interview ID" : null,
								"Identifier Postcard ID" : null,
								"Identifier LCCN" : null,
								"Identifier OCLC/RLIN" : null,
								"Collection UUID" : null,
								"Container UUID" : null,
								"Collection Title" : null,
								"Container Title" : null,
								"Parent Hierarchy" : null,
								"Number of Captures" : null,
								"First Image" : null,
								"DC URL" : null
							}

							var jsonData = {
								"UUID" : null,
								"databaseID" : null,
								"title" : null,
								"alternativeTitle" : [],
								"contributor" : null,
								"date" : [],
								"dateStart" : null,
								"dateEnd" : null,
								"language" : null,
								"description" : null,
								"note" : null,
								"subjectTopical" : null,
								"subjectName" : null,
								"subjectGeographic" : null,
								"subjectTemporal" : null,
								"subjectTitle" : null,
								"resourceType" : null,
								"genreURI" : null,
								"identifierBNumber" : null,
								"identifierAccessionNumber" : null,
								"identifierCallNumber" : null,
								"identifierISBN" : null,
								"identifierISSN" : null,
								"identifierInterviewID" : null,
								"identifierPostcardID" : null,
								"identifierLCCN" : null,
								"identifierOCLCRLIN" : null,
								"collectionUUID" : null,
								"containerUUID" : null,
								"collectionTitle" : null,
								"containerTitle" : null,
								"firstImage" : null,
								"dcURL" : null
							}


							csvData["UUID"] = item._id
							jsonData["UUID"] = item._id


							csvData["Database ID"] = parseInt(item.mmsDb)
							jsonData["databaseID"] = parseInt(item.mmsDb)
							
							//console.log(item.mmsDb)

							var addedTitlesJson = []

							item.titles.map(function(title){
								if (title.primary === true){
									if (!csvData["Title"]) csvData["Title"] = title.title				
									if (!jsonData.title) jsonData.title = csvData["Title"]
									addedTitlesJson.push(csvData["Title"])
								}else{
									if (!csvData["Alternative Title"]) csvData["Alternative Title"] = title.title
									if (addedTitlesJson.indexOf(csvData["Title"])==-1){
										jsonData.alternativeTitle.push(title.title)									
									}
								}
							})


							//agents
							var addedAgentsCSV = []

							item.agents.map(function(a){




							})


							console.log(item.agents)


							var datesStart = [], datesEnd = [], datesNoPoint = []
							item.dates.map(function(d){
								if (d.point === 'start') datesStart.push(d.value)
								if (d.point === 'end') datesEnd.push(d.value)	
								if (d.point === false) datesNoPoint.push(d.value)
							})

							var highestStart = 0, lowestEnd = 9999

							//try to find the highest start and lowest end if the dates are years

							datesStart.map(function(d){
								var year = d.match(/[0-9]{4}/)
								if (year){
									year = parseInt(year[0])
									if (year>highestStart) highestStart = year
								}
							})

							datesEnd.map(function(d){
								var year = d.match(/[0-9]{4}/)
								if (year){
									year = parseInt(year[0])
									if (year<lowestEnd) lowestEnd = year
								}
							})

							if (highestStart===0) highestStart = false
							if (lowestEnd===9999) lowestEnd = false

							if (highestStart){
								csvData["Date Start"] = highestStart
								jsonData["dateStart"] = highestStart
							}				

							if (lowestEnd){
								csvData["Date End"] = lowestEnd
								jsonData["dateEnd"] = lowestEnd
							}

							if (datesNoPoint.length>0){
								csvData["Date"] = datesNoPoint[0]
								jsonData["date"] = datesNoPoint
							}


							//lets catch any missing date with no dates being assigned
							if(!csvData["Date"] && highestStart){
								csvData["Date"] = highestStart
								jsonData["date"] = [highestStart]
							}
							
							// if(csvData["Date Start"] && !csvData["Date End"]){
							// 	console.log(item.dates)	
							// }


							

							// item.notes.map(function(n){
							// 	if (!noteType[n.type]){
							// 		noteType[n.type]=0
							// 	}
							// 	noteType[n.type]++
							// })			

							


							cursor.resume()

							// var triples = []

							// resourceId++

							// var collectionUri = "res:" + resourceId
							// var collectionRegistryId = resourceId


							// var collectionProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: collection.uuid  }


							// //console.log(collection)					

							// var bNumber = -9999999999

							// if (collection.bNumber){
							// 	try{
							// 		bNumber = parseInt(utils.normalizeBnumber(collection.bNumber).replace("b",''))
							// 	}catch (e) {
							// 		bNumber = -9999999999
							// 	}
							// 	if (isNaN(bNumber)) bNumber = -9999999999
							// }


							// var collectionCatalogProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10000", recordIdentifier: bNumber  }


							// if (bNumber>0){
							// 	markSerialized(databaseSerialized, "catalog" + bNumber)
							// }

							// shadowcatBib.find({ _id : bNumber}).toArray(function(err, bibs) {


							// 	//work it
							// 	dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,collection,function(defResults){
									


							// 		//TODO FIXME compare shadowcat to MMS agents/terms


							// 		if (bibs.length>0){	


							// 			defResults.registryAgents=[]
							// 			defResults.registryTerms =[]

							// 			var results = buildMmsTriples(collection,defResults,resourceId,collectionRegistryId)

							// 			results.triples.map(function(t){
							// 				triples.push(t)
							// 			})

							// 			resourceId = results.resourceId

							// 			var bib = bibs[0]

							// 			var addedSubjects = [], addedAgents = [], registryTerms = [], registryAgents = []
							// 			//use the shadow cat terms and agents
							// 			async.parallel({

							// 				processAgents: function(callback){

							// 					//send each one off to be dererfernced							
							// 					async.eachSeries(bib['sc:agents'], function(agent, eachCallback) {

							// 						if (!agent.nameLc) agent.nameLc = agent.nameLocal

							// 						dereferenceAgent(databaseAgents, agent.viaf, agent.nameLc, "catalog:"+bib._id,function(registryAgent){
							// 							if (registryAgent){			
							// 								registryAgent.subject = true
							// 								if (registryAgent.contributor) registryAgent.subject = false
							// 								registryAgents.push(registryAgent)
							// 							}
							// 							eachCallback()
							// 						})										

							// 					}, function(err){
							// 						if (err) console.log(err)							
													
							// 						//all the agents have been ran though and sorted out
							// 						registryAgents.map(function(a){
							// 							if (a.subject){
							// 								if (addedSubjects.indexOf(a._id) == -1){
							// 									triples.push({  subject: collectionUri,  predicate: "dcterms:subject", objectUri: "agents:"+a._id, objectLiteral :  null,  literalDataType: null, prov: collectionCatalogProv  })
							// 									addedSubjects.push(a._id)
							// 								}
							// 							}else{
							// 								if (addedContriubtors.indexOf(a._id) == -1){
							// 									triples.push({  subject: collectionUri,  predicate: "dcterms:contributor", objectUri: "agents:"+a._id, objectLiteral :  null,  literalDataType: null, prov: collectionCatalogProv  })
							// 									addedContriubtors.push(a._id)
							// 								}
							// 							}
							// 						})
							// 						callback()
							// 					})				
							// 				},




							// 				processSubjects: function(callback){



												
							// 					//send each one off to be dererfernced							
							// 					async.eachSeries(bib['sc:terms'], function(term, eachCallback) {
							// 						dereferenceTerm(databaseTerms, term.fast, term.nameLocal, "catalog:"+bib._id,function(registryTerm){
							// 							if (registryTerm){
							// 								registryTerms.push(registryTerm)
							// 							}
							// 							eachCallback()
							// 						})										

							// 					}, function(err){
							// 						if (err) console.log(err)				
													
							// 						//all the agents have been ran though and sorted out
							// 						registryTerms.map(function(a){
							// 							if (addedSubjects.indexOf(a._id) == -1){
							// 								triples.push({  subject: collectionUri,  predicate: "dcterms:subject", objectUri: "terms:"+a._id, objectLiteral :  null,  literalDataType: null, prov: collectionCatalogProv  })
							// 								addedSubjects.push(a._id)
							// 							}		

							// 						})
							// 						callback()
							// 					})	

							// 				},

							// 				//mark this, the bnumber if there is one and the MMS collection as being serialized
							// 				markAsSerialized: function(callback){

							// 					if (bNumber){
							// 						markSerialized(databaseSerialized, "catalog" + bNumber,function(){

							// 						})										
							// 					}


							// 					markSerialized(databaseSerialized, "mms" + collection.uuid,function(){
							// 						callback()
							// 					})





							// 				}

							// 			},
							// 			function(err, results) {


							// 				var parentUriLookup = {}
							// 				var relationships = []

							// 				//the collection lookup
							// 				parentUriLookup[collection._id] = collectionUri
											
							// 				var bibLevel = 'c'
							// 				if (bib.bibLevel.code) bibLevel = bib.bibLevel.code.trim()




							// 				if (['7','c','s','d'].indexOf(bibLevel) > -1){
							// 					triples.push({  subject: collectionUri,  predicate: "rdf:type", objectUri: "nypl:Collection", objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
							// 				}else{
							// 					triples.push({  subject: collectionUri,  predicate: "rdf:type", objectUri: "nypl:Item", objectLiteral :  null,  literalDataType: null, prov: collectionProv  })

							// 				}


							// 				console.log(bibLevel,collection.title,collection._id)



							// 				triples.push({  subject: collectionUri,  predicate: "rdf:type", objectUri: "nypl:Collection", objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
											
							// 				//triples.push({  subject: componentUri,  predicate: "pcdm:hasMember", objectUri: nyplItem, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
							// 				//triples.push({  subject: nyplItem,  predicate: "pcdm:memberOf", objectUri: componentUri, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
							// 				//triples.push({  subject: nyplItem,  predicate: "dcterms:identifier", objectUri: "urn:superparent:" + collectionRegistryId, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })


							// 				databaseMmsContainers.find({ collectionUuid : collection._id}).toArray(function(err, containers) {

							// 					// console.log(containers.length)
							// 					// containers.map(function(c){



							// 					// 	var containerBnumber = -9999999999
							// 					// 	if (c.bNumber){
							// 					// 		try{
							// 					// 			containerBnumber = parseInt(utils.normalizeBnumber(c.containerBnumber).replace("b",''))
							// 					// 		}catch (e) {
							// 					// 			containerBnumber = -9999999999
							// 					// 		}
							// 					// 		if (isNaN(containerBnumber)) containerBnumber = -9999999999
							// 					// 	}
							// 					// 	if (containerBnumber>0 && containerBnumber != bNumber){
							// 					// 		console.log(c)
							// 					// 	}
							// 					// })


							// 					//these all become components

							// 					async.eachSeries(containers, function(c, eachCallback) {


							// 						resourceId++											
							// 						var containerUri = "res:" + resourceId
							// 						var containerProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: c.uuid  }

							// 						if (['7','c','s','d'].indexOf(bibLevel) > -1){
							// 							triples.push({  subject: containerUri,  predicate: "rdf:type", objectUri: "nypl:Component", objectLiteral :  null,  literalDataType: null, prov: containerProv  })
							// 						}else{
							// 							triples.push({  subject: containerUri,  predicate: "rdf:type", objectUri: "nypl:Item", objectLiteral :  null,  literalDataType: null, prov: containerProv  })
							// 						}
							// 						triples.push({  subject: containerUri,  predicate: "dcterms:identifier", objectUri: "urn:superparent:" + collectionRegistryId, objectLiteral :  null,  literalDataType: null, prov: containerProv  })

							// 						parentUriLookup[c._id] = containerUri


							// 						//no cotainer map this to the collection
							// 						if (c.containerUuid){
							// 							relationships.push(
							// 								JSON.parse(JSON.stringify(
							// 								{
							// 									s: c.containerUuid,
							// 									p: 'pcdm:hasMember',
							// 									o: c._id,
							// 									g: containerProv
							// 								}))
							// 							)

							// 							relationships.push(
							// 								JSON.parse(JSON.stringify(
							// 								{
							// 									s: c._id,
							// 									p: 'pcdm:memberOf',
							// 									o: c.containerUuid,
							// 									g: containerProv
							// 								}))
							// 							)
							// 						}else{
							// 							relationships.push(
							// 								JSON.parse(JSON.stringify(
							// 								{
							// 									s: collection._id,
							// 									p: 'pcdm:hasMember',
							// 									o: c._id,
							// 									g: containerProv
							// 								}))
							// 							)
							// 							relationships.push(
							// 								JSON.parse(JSON.stringify(
							// 								{
							// 									s: c._id,
							// 									p: 'pcdm:memberOf',
							// 									o: collection._id,
							// 									g: containerProv
							// 								}))
							// 							)

							// 						}


							// 						//work it
							// 						dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,c,function(defResults){



							// 							var results = buildMmsTriples(c,defResults,resourceId,collectionRegistryId)

							// 							results.triples.map(function(t){
							// 								triples.push(t)
							// 							})

							// 							resourceId = results.resourceId

																		
							// 							eachCallback()


							// 						})


							// 					}, function(err){

							// 						if (err) console.log(err)				
													
							// 						//now grab all the items for this collection now that we know all the containers

							// 						//next step is to gather all of the children
							// 						var itemCursor = databaseMmsItems.find({ collectionUuid : collection._id})

							// 						var totalItem = 10000000, itemCounter = 0

							// 						databaseMmsItems.count({ collectionUuid : collection._id},function(err,count){
							// 							totalItem = count
							// 						})


											
							// 						itemCursor.on('data', function(item) {

							// 							itemCursor.pause()
							// 							itemCounter++

														
							// 							process.stdout.cursorTo(0)
							// 							process.stdout.write(clc.black.bgGreenBright(itemCounter + "/" + totalItem))




							// 							resourceId++											
							// 							var itemUri = "res:" + resourceId
							// 							var itemProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: item.uuid  }

							// 							triples.push({  subject: itemUri,  predicate: "rdf:type", objectUri: "nypl:Item", objectLiteral :  null,  literalDataType: null, prov: itemProv  })
							// 							triples.push({  subject: itemUri,  predicate: "dcterms:identifier", objectUri: "urn:superparent:" + collectionRegistryId, objectLiteral :  null,  literalDataType: null, prov: itemProv  })

							// 							parentUriLookup[item._id] = itemUri

							// 							if (item.containerUuid){
							// 								relationships.push(
							// 									JSON.parse(JSON.stringify(
							// 									{
							// 										s: item.containerUuid,
							// 										p: 'pcdm:hasMember',
							// 										o: item._id,
							// 										g: itemProv
							// 									}))
							// 								)
							// 								relationships.push(
							// 									JSON.parse(JSON.stringify(
							// 									{
							// 										s: item._id,
							// 										p: 'pcdm:memberOf',
							// 										o: item.containerUuid,
							// 										g: itemProv
							// 									}))
							// 								)	
							// 							}else{
							// 								relationships.push(
							// 									JSON.parse(JSON.stringify(
							// 									{
							// 										s: item.collectionUuid,
							// 										p: 'pcdm:hasMember',
							// 										o: item._id,
							// 										g: itemProv
							// 									}))
							// 								)
							// 								relationships.push(
							// 									JSON.parse(JSON.stringify(
							// 									{
							// 										s: item._id,
							// 										p: 'pcdm:memberOf',
							// 										o: item.collectionUuid,
							// 										g: itemProv
							// 									}))
							// 								)	

							// 							}


							// 							//work the item
							// 							dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,item,function(defResults){


							// 								var results = buildMmsTriples(item,defResults,resourceId,collectionRegistryId)
							// 								results.triples.map(function(t){
							// 									triples.push(t)
							// 								})
							// 								resourceId = results.resourceId

							// 								itemCursor.resume()
							// 							})									
							// 						})


							// 						itemCursor.on('end', function(item) {


							// 							relationships.map(function(r){
							// 								//build the relationships
							// 								triples.push({  subject: parentUriLookup[r.s],  predicate: r.p, objectUri: parentUriLookup[r.o], objectLiteral :  null,  literalDataType: null, prov: r.g  })
							// 								if (!parentUriLookup[r.s] && !parentUriLookup[r.o]){
							// 									console.log(r)
							// 								}
							// 							})

							// 							//console.log(triples.length)

							// 							totalTriples = totalTriples + triples.length
							// 							console.log("Total triples:",totalTriples)



							// 							cursor.resume()

							// 						})


													
							// 					})	



							// 				})

							// 			})


							// 		}else{


							// 			//FIXME TODO, MAKE SEPERATE COLLECTIONs/ITEMS FOR EACH SUB COLLECTION/ITEM


							// 			var parentUriLookup = {}
							// 			var relationships = []

							// 			//the collection lookup
							// 			parentUriLookup[collection._id] = collectionUri

							// 			triples.push({  subject: collectionUri,  predicate: "rdf:type", objectUri: "nypl:Item", objectLiteral :  null,  literalDataType: null, prov: collectionProv  })
										
							// 			//triples.push({  subject: componentUri,  predicate: "pcdm:hasMember", objectUri: nyplItem, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
							// 			//triples.push({  subject: nyplItem,  predicate: "pcdm:memberOf", objectUri: componentUri, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })
							// 			//triples.push({  subject: nyplItem,  predicate: "dcterms:identifier", objectUri: "urn:superparent:" + collectionRegistryId, objectLiteral :  null,  literalDataType: null, prov: componentMmsProv  })


							// 			databaseMmsContainers.find({ collectionUuid : collection._id}).toArray(function(err, containers) {

							// 				// console.log(containers.length)
							// 				// containers.map(function(c){




							// 					// if (containerBnumber>0 && containerBnumber != bNumber){
							// 					// 	console.log(c)
							// 					// }
							// 				//})


							// 				//these all become components

							// 				async.eachSeries(containers, function(c, eachCallback) {


							// 					resourceId++											
							// 					var containerUri = "res:" + resourceId
							// 					var containerProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: c.uuid  }


							// 					triples.push({  subject: containerUri,  predicate: "rdf:type", objectUri: "nypl:Item", objectLiteral :  null,  literalDataType: null, prov: containerProv  })

							// 					triples.push({  subject: containerUri,  predicate: "dcterms:identifier", objectUri: "urn:superparent:" + collectionRegistryId, objectLiteral :  null,  literalDataType: null, prov: containerProv  })

							// 					parentUriLookup[c._id] = containerUri

							// 					var containerBnumber = -9999999999
							// 					if (c.bNumber){
							// 						try{
							// 							containerBnumber = parseInt(utils.normalizeBnumber(c.containerBnumber).replace("b",''))
							// 						}catch (e) {
							// 							containerBnumber = -9999999999
							// 						}
							// 						if (isNaN(containerBnumber)) containerBnumber = -9999999999
							// 					}


							// 					if (containerBnumber>0){
							// 						markSerialized(databaseSerialized, "catalog" + containerBnumber,function(){

							// 						})	
							// 					}


							// 					//no cotainer map this to the collection
							// 					if (c.containerUuid){
							// 						relationships.push(
							// 							JSON.parse(JSON.stringify(
							// 							{
							// 								s: c.containerUuid,
							// 								p: 'pcdm:hasMember',
							// 								o: c._id,
							// 								g: containerProv
							// 							}))
							// 						)

							// 						relationships.push(
							// 							JSON.parse(JSON.stringify(
							// 							{
							// 								s: c._id,
							// 								p: 'pcdm:memberOf',
							// 								o: c.containerUuid,
							// 								g: containerProv
							// 							}))
							// 						)
							// 					}else{
							// 						relationships.push(
							// 							JSON.parse(JSON.stringify(
							// 							{
							// 								s: collection._id,
							// 								p: 'pcdm:hasMember',
							// 								o: c._id,
							// 								g: containerProv
							// 							}))
							// 						)
							// 						relationships.push(
							// 							JSON.parse(JSON.stringify(
							// 							{
							// 								s: c._id,
							// 								p: 'pcdm:memberOf',
							// 								o: collection._id,
							// 								g: containerProv
							// 							}))
							// 						)

							// 					}


							// 					//work it
							// 					dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,c,function(defResults){



							// 						var results = buildMmsTriples(c,defResults,resourceId,collectionRegistryId)

							// 						results.triples.map(function(t){
							// 							triples.push(t)
							// 						})

							// 						resourceId = results.resourceId

																	
							// 						eachCallback()


							// 					})


							// 				}, function(err){

							// 					if (err) console.log(err)				
												
							// 					//now grab all the items for this collection now that we know all the containers

							// 					//next step is to gather all of the children
							// 					var itemCursor = databaseMmsItems.find({ collectionUuid : collection._id})

							// 					var totalItem = 10000000, itemCounter = 0

							// 					databaseMmsItems.count({ collectionUuid : collection._id},function(err,count){
							// 						totalItem = count
							// 					})


										
							// 					itemCursor.on('data', function(item) {

							// 						itemCursor.pause()
							// 						itemCounter++

													
							// 						process.stdout.cursorTo(0)
							// 						process.stdout.write(clc.black.bgGreenBright(itemCounter + "/" + totalItem))




							// 						resourceId++											
							// 						var itemUri = "res:" + resourceId
							// 						var itemProv = {  creator : "registry_ingest_script", created : new Date, source : "data:10002", recordIdentifier: item.uuid  }

							// 						triples.push({  subject: itemUri,  predicate: "rdf:type", objectUri: "nypl:Item", objectLiteral :  null,  literalDataType: null, prov: itemProv  })
							// 						triples.push({  subject: itemUri,  predicate: "dcterms:identifier", objectUri: "urn:superparent:" + collectionRegistryId, objectLiteral :  null,  literalDataType: null, prov: itemProv  })

							// 						parentUriLookup[item._id] = itemUri

							// 						if (item.containerUuid){
							// 							relationships.push(
							// 								JSON.parse(JSON.stringify(
							// 								{
							// 									s: item.containerUuid,
							// 									p: 'pcdm:hasMember',
							// 									o: item._id,
							// 									g: itemProv
							// 								}))
							// 							)
							// 							relationships.push(
							// 								JSON.parse(JSON.stringify(
							// 								{
							// 									s: item._id,
							// 									p: 'pcdm:memberOf',
							// 									o: item.containerUuid,
							// 									g: itemProv
							// 								}))
							// 							)	
							// 						}else{
							// 							relationships.push(
							// 								JSON.parse(JSON.stringify(
							// 								{
							// 									s: item.collectionUuid,
							// 									p: 'pcdm:hasMember',
							// 									o: item._id,
							// 									g: itemProv
							// 								}))
							// 							)
							// 							relationships.push(
							// 								JSON.parse(JSON.stringify(
							// 								{
							// 									s: item._id,
							// 									p: 'pcdm:memberOf',
							// 									o: item.collectionUuid,
							// 									g: itemProv
							// 								}))
							// 							)	

							// 						}


							// 						if (item.matchedTms){
							// 							markSerialized(databaseSerialized, "tms" + item.tmsId,function(){

							// 							})	
							// 						}

							// 						//work the item
							// 						dereferenceMmsItem(databaseAgents,databaseTerms,databaseSerialized,databaseMmsCaptures,item,function(defResults){


							// 							var results = buildMmsTriples(item,defResults,resourceId,collectionRegistryId)
							// 							results.triples.map(function(t){
							// 								triples.push(t)
							// 							})
							// 							resourceId = results.resourceId

							// 							itemCursor.resume()
							// 						})									
							// 					})


							// 					itemCursor.on('end', function(item) {


							// 						relationships.map(function(r){
							// 							//build the relationships
							// 							triples.push({  subject: parentUriLookup[r.s],  predicate: r.p, objectUri: parentUriLookup[r.o], objectLiteral :  null,  literalDataType: null, prov: r.g  })
							// 							if (!parentUriLookup[r.s] && !parentUriLookup[r.o]){
							// 								console.log(r)
							// 							}
							// 						})

							// 						totalTriples = totalTriples + triples.length
							// 						console.log("Total triples:",totalTriples)

							// 						cursor.resume()

							// 					})


												
							// 				})	



							// 			})


									

							// 		}







							// 		//console.log(defResults)


							// 	})








								

							// })




						})

						cursor.once('end', function() {
								
							setTimeout(function(){
								console.log("serializeMMS ITEMS - Done!\n")
								cb(resourceId)
								databaseConnection.close()
								//shadowcatDatabase.close()
							},5000)

						})


					})

				})


			})


		})

	})

}


















