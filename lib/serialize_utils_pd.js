"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js")
var db = require("../lib/db.js")
var clc = require('cli-color')
var async = require("async")
var sanitizeHtml = require('sanitize-html')
var fs = require('fs');
var json2csv = require('json2csv');

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

var marcRelatorCodes = config['Thesaurus']['marcRelatorCodes']

var marcLanguageCodes = config['Thesaurus']['languageCodes']

var noteMap = config['Thesaurus']['noteMap']
//overwrite and add false which cannot be represented in the json
noteMap[false] = ""
noteMap[""] = ""

exports.serializeMmsItem = function(cb){


	var collectionTitleLookup = {}, containerTitleLookup = {}
	var csvHeaderCheck = true
	var csvFields = ["UUID","Database ID","Title","Alternative Title","Contributor","Date","Date Start","Date End","Language","Description","Note","Subject Topical","Subject Name","Subject Geographic","Subject Temporal","Subject Title","Resource Type","Genre","Identifier BNumber","Identifier Accession Number","Identifier Call Number","Identifier ISBN","Identifier ISSN","Identifier Interview ID","Identifier Postcard ID","Identifier LCCN","Identifier OCLC/RLIN","Physical Description Extent","Physical Description Form","Publisher","Place Of Publication","Collection UUID","Container UUID","Collection Title","Container Title","Parent Hierarchy","Number of Captures","First Image","Digital Collections URL"]
	var counter = 0

	var nullCountIndex = {}


	fs.unlink(exportCsv, function (err) {

		fs.unlink(exportJson, function (err) {

			var totalCollections=0, totalTriples =0


			db.returnDb(function(err,databaseConnection){
				if (err) console.log(err)

				var databaseAgents = databaseConnection.collection("agents")
				var databaseTerms = databaseConnection.collection("terms")
				var databaseSerialized = databaseConnection.collection("serialized")
				var databaseMmsCollections = databaseConnection.collection("mmsCollections")
				var databaseMmsContainers = databaseConnection.collection("mmsContainers")

				var databaseMmsItems = databaseConnection.collection("mmsItems")
				var databaseMmsCaptures = databaseConnection.collection("mmsCaptures")

				console.log("Loading Collections")
				databaseMmsCollections.find({ }, { title: 1}).toArray(function(err, collections){	

					collections.forEach(function(c){
						collectionTitleLookup[c._id] = c.title
					})	

					console.log("Loading Containers")
					databaseMmsContainers.find({ }, { title: 1}).toArray(function(err, containers){
			
						containers.forEach(function(c){
							containerTitleLookup[c._id] = c.title
						})	

						var cursor = databaseMmsItems.find({ publicDomain: true, dcFlag:true })

						cursor.on('data', function(item) {

							counter++

							cursor.pause()

							var csvData = {
								"UUID" : "",
								"Database ID" : "",
								"Title" : "",
								"Alternative Title" : "",
								"Contributor" : "",
								"Date" : "",
								"Date Start" : "",
								"Date End" : "",
								"Language" : "",
								"Description" : "",
								"Note" : "",
								"Subject Topical" : "",
								"Subject Name" : "",
								"Subject Geographic" : "",
								"Subject Temporal" : "",
								"Subject Title" : "",
								"Resource Type" : "",
								"Genre" : "",
								"Identifier BNumber" : "",
								"Identifier Accession Number" : "",
								"Identifier Call Number" : "",
								"Identifier ISBN" : "",
								"Identifier ISSN" : "",
								"Identifier Interview ID" : "",
								"Identifier Postcard ID" : "",
								"Identifier LCCN" : "",
								"Identifier OCLC/RLIN" : "",
								"Physical Description Extent": "",
								"Physical Description Form": "",
								"Publisher": "",
								"Place Of Publication": "",	
								"Collection UUID" : "",
								"Container UUID" : "",
								"Collection Title" : "",
								"Container Title" : "",
								"Parent Hierarchy" : "",
								"Number of Captures" : "",
								"First Image" : "",
								"Digital Collections URL" : ""
							}

							var jsonData = {
								"UUID" : null,
								"databaseID" : null,
								"title" : null,
								"alternativeTitle" : [],
								"contributor" : [],
								"date" : [],
								"dateStart" : null,
								"dateEnd" : null,
								"language" : [],
								"description" : [],
								"note" : [],
								"subjectTopical" : [],
								"subjectName" : [],
								"subjectGeographic" : [],
								"subjectTemporal" : [],
								"subjectTitle" : [],
								"resourceType" : [],
								"genre" : [],
								"identifierBNumber" : null,
								"identifierAccessionNumber" : null,
								"identifierCallNumber" : null,
								"identifierISBN" : null,
								"identifierISSN" : null,
								"identifierInterviewID" : null,
								"identifierPostcardID" : null,
								"identifierLCCN" : null,
								"identifierOCLCRLIN" : null,
								"physicalDescriptionExtent": [],
								"physicalDescriptionForm": [],
								"publisher": null,
								"placeOfPublication": null,								
								"collectionUUID" : null,
								"containerUUID" : null,
								"collectionTitle" : null,
								"containerTitle" : null,
								"parentHierarchy" : null,
								"numberOfCaptures" : null,
								"captures" : [],
								"digitalCollectionsURL" : null
							}


							csvData["UUID"] = item._id
							jsonData["UUID"] = item._id


							csvData["Database ID"] = parseInt(item.mmsDb)
							jsonData["databaseID"] = parseInt(item.mmsDb)
							
							//console.log(item.mmsDb)

							var addedTitlesJson = []

							item.titles.forEach(function(title){
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

							item.agents.forEach(function(a){
								if (addedAgentsCSV.indexOf(a.namePart) == -1){
									addedAgentsCSV.push(a.namePart)									
								}

								var contributor = {
									contributorName: null,
									contributorType: null,
									contributorRole: [],
									contributorURI: null
								}
								
								if (a.role){
									a.role.forEach(function(r){
										var code = r.split('/relators/')[1]
										if (marcRelatorCodes[code]) contributor.contributorRole.push(marcRelatorCodes[code])
									})
								}

								contributor.contributorName = a.namePart
								contributor.contributorType = a.type
								if (a.viaf)	contributor.contributorURI = "http://viaf.org/viaf/" + a.viaf

								jsonData['contributor'].push(contributor)

							})

							csvData['Contributor'] = addedAgentsCSV.join(" | ")
							
							var datesStart = [], datesEnd = [], datesNoPoint = []
							item.dates.forEach(function(d){
								if (d.point === 'start') datesStart.push(d.value)
								if (d.point === 'end') datesEnd.push(d.value)	
								if (d.point === false) datesNoPoint.push(d.value)
							})

							var highestStart = 0, lowestEnd = 9999

							//try to find the highest start and lowest end if the dates are years

							datesStart.forEach(function(d){
								var year = d.match(/[0-9]{4}/)
								if (year){
									year = parseInt(year[0])
									if (year>highestStart) highestStart = year
								}
							})

							datesEnd.forEach(function(d){
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
							}else{
								//see if there is a year in the no point dates
								datesNoPoint.forEach(function(d){
									var year = d.match(/[0-9]{4}/)
									if (year){
										year = parseInt(year[0])
										csvData["Date Start"] = year
										jsonData["dateStart"] = year			
									}
								})
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

							//Fixme? TODO
							// if(csvData["Date Start"] && !csvData["Date End"]){
							// 	console.log(item.dates)	
							// }

							
							if (item.languages.length>0){
								var languages = []
								item.languages.forEach(function(l){
									var code = l.split('/iso639-2/')[1]
									if (marcLanguageCodes[code]) languages.push(marcLanguageCodes[code])
								})
								csvData['Language'] = languages.join(" | ").trim()
								jsonData['language'] = languages
							}

							
							if (item.abstracts.length>0){
								var abstracts = []
								item.abstracts.forEach(function(a){
									abstracts.push(a)
								})
								csvData['Description'] = abstracts.join(" ")
								jsonData['description'] = abstracts
							}				

							item.notes.forEach(function(n){
								var notes = []								
								if (n.type!='admin'){
									var noteLabel = ""
									if (noteMap[n.type]) noteLabel = noteMap[n.type]
									notes.push(noteLabel + " Note: " + n.text)
									jsonData['note'].push({
										type: (n.type == "") ? null : n.type,
										text: (n.text == "") ? null : n.text
									})
								}
								csvData['Note'] = notes.join(" ").trim()
							})

							var subjects = {
								'topic' : [],
								'name' : [],
								'geographic' : [],
								'temporal' : [],
								'titleInfo' : []
							}
							var subjectsJson = {
								'topic' : [],
								'name' : [],
								'geographic' : [],
								'temporal' : [],
								'titleInfo' : []
							}
							
							//[ 'geographic', 'topic',  'temporal',  'name',  'titleInfo',  'occupation',  'form' ]
							
							item.subjects.forEach(function(s){
								if (subjects[s.type]){
									if (subjects[s.type].indexOf(s.text) == -1){
										subjects[s.type].push(s.text)
										subjectsJson[s.type].push(
											{
												text: s.text,
												URI: (s.valueURI === false) ? null : s.valueURI 
											}
										)
									}
								}
							})



							if (subjects['topic'].length>0) csvData["Subject Topical"] = subjects['topic'].join(" | ")
							if (subjects['name'].length>0) csvData["Subject Name"] = subjects['name'].join(" | ")
							if (subjects['geographic'].length>0) csvData["Subject Geographic"] = subjects['geographic'].join(" | ")
							if (subjects['temporal'].length>0) csvData["Subject Temporal"] = subjects['temporal'].join(" | ")
							if (subjects['titleInfo'].length>0) csvData["Subject Title"] = subjects['titleInfo'].join(" | ")

							jsonData['subjectTopical'] = subjectsJson['topic']
							jsonData['subjectName'] = subjectsJson['name']
							jsonData['subjectGeographic'] = subjectsJson['geographic']
							jsonData['subjectTemporal'] = subjectsJson['temporal']
							jsonData['subjectTitle'] = subjectsJson['titleInfo']

							if (item.typeOfResource.length>0){
								var typeOfResource = []
								item.typeOfResource.forEach(function(l){
									typeOfResource.push(l)
								})
								csvData['Resource Type'] = typeOfResource.join(" | ").trim()
								jsonData['resourceType'] = typeOfResource
							}	

							if (item.genres.length>0){
								var genres = []
								item.genres.forEach(function(g){
									genres.push(g.text)
									jsonData['genre'].push({
										text: g.text,
										URI: (g.valueURI === false) ? null : g.valueURI
									})
								})
								csvData['Genre'] = genres.join(" | ").trim()
							}	



							if (item.bNumber){
								csvData['Identifier BNumber'] = utils.normalizeBnumber(item.bNumber)
								jsonData['identifierBNumber'] = utils.normalizeBnumber(item.bNumber)
							}
							if (item.accession){
								csvData['Identifier Accession Number'] = item.accession
								jsonData['identifierAccessionNumber'] = item.accession
							}
							if (item.callNumber){
								csvData['Identifier Call Number'] = item.callNumber
								jsonData['identifierCallNumber'] = item.callNumber
							}
							if (item.isbn){
								csvData['Identifier ISBN'] = item.isbn
								jsonData['identifierISBN'] = item.isbn
							}
							if (item.issn){
								csvData['Identifier ISSN'] = item.issn
								jsonData['identifierISSN'] = item.issn
							}
							if (item.exhibition){
								csvData['Identifier Interview ID'] = item.exhibition
								jsonData['identifierInterviewID'] = item.exhibition
							}
							if (item.lccn){
								csvData['LCCN'] = item.lccn
								jsonData['LCCN'] = item.lccn
							}
							if (item.oclc){
								csvData['Identifier OCLC/RLIN'] = item.oclc
								jsonData['identifierOCLCRLIN'] = item.oclc
							}

							var forms = [],extents = []

							item.physicalDescriptions.forEach(function(pd){

								pd.form.forEach(function(form){
									forms.push(form)
								})

								pd.extent.forEach(function(extent){
									extents.push(extent)
								})						

							})
							csvData['Physical Description Extent'] = extents.join(" | ").trim()
							jsonData['physicalDescriptionExtent'] = extents
							csvData['Physical Description Form'] = forms.join(" | ").trim()
							jsonData['physicalDescriptionForm'] = forms


							var publishers = [],places = []

							item.originInfos.forEach(function(oi){

								oi.place.forEach(function(place){
									places.push(place)
								})

								oi.publisher.forEach(function(publisher){
									publishers.push(publisher)
								})						

							})
							csvData['Publisher'] = publishers.join(" | ").trim()
							jsonData['publisher'] = publishers
							csvData['Place Of Publication'] = places.join(" | ").trim()
							jsonData['placeOfPublication'] = places

							if (item.collectionUuid){
								csvData['Collection UUID'] = item.collectionUuid
								jsonData['collectionUUID'] = item.collectionUuid
								//the title
								if (collectionTitleLookup[item.collectionUuid]){
									csvData['Collection Title'] = collectionTitleLookup[item.collectionUuid]
									jsonData['collectionTitle'] = collectionTitleLookup[item.collectionUuid]
								}
							}

							if (item.containerUuid){
								csvData['Container UUID'] = item.containerUuid
								jsonData['containerUUID'] = item.containerUuid
								if (containerTitleLookup[item.containerUuid]){
									csvData['Container Title'] = containerTitleLookup[item.containerUuid]
									jsonData['containerTitle'] = containerTitleLookup[item.containerUuid]
								}
							}

							var path = []
							item.parents.reverse().forEach(function(p){
								if (collectionTitleLookup[p]) path.push(collectionTitleLookup[p])
								if (containerTitleLookup[p]) path.push(containerTitleLookup[p])
							})


							csvData["Parent Hierarchy"] = path.join(" / ")
							jsonData["parentHierarchy"] = path.join(" / ")


							csvData["Digital Collections URL"] = "http://digitalcollections.nypl.org/items/" + item._id
							jsonData["digitalCollectionsURL"] = "http://digitalcollections.nypl.org/items/" + item._id




							databaseMmsCaptures.find({itemUuid: item._id }).toArray(function(err,captures){

								csvData["Number of Captures"] = captures.length
								jsonData["numberOfCaptures"] = captures.length

								if (captures[0]) if (captures[0].imageId) csvData["First Image"] = "http://images.nypl.org/index.php?id=" + captures[0].imageId  + "&t=g"

								captures.forEach(function(c){
									jsonData["captures"].push("http://images.nypl.org/index.php?id=" + c.imageId  + "&t=g")
								})

								//one file check before we sieralize out to CSV is to remove any "\" escaping backslashes that could break the formating
								for (var x in csvData){
									if (typeof csvData[x] === 'string')
										csvData[x] = csvData[x].replace(/\\/g,'/')
								}


								json2csv({ data: csvData, fields: csvFields, hasCSVColumnTitle : csvHeaderCheck }, function(err, csv) {
									if (err) console.log(err);
									csv = csv + "\n"
									csvHeaderCheck = false
									fs.appendFile(exportCsv,csv, function (err) {
										if (err) console.log(err);
										fs.appendFile(exportJson,JSON.stringify(jsonData)+"\n", function (err) {
											if (err) console.log(err);
											process.stdout.cursorTo(0)
											process.stdout.write(clc.black.bgYellowBright("Items PD: " + counter ))
											cursor.resume()
										})
									})					
								})
							})
						})

						cursor.once('end', function() {
								
							setTimeout(function(){
								console.log("serializeMMS ITEMS - Done!\n")
								cb()
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




exports.serializeMmsCollection = function(cb){


	var csvHeaderCheck = true
	var csvFields = ["UUID","Database ID","Title","Alternative Title","Contributor","Date","Date Start","Date End","Language","Description","Note","Subject Topical","Subject Name","Subject Geographic","Subject Temporal","Subject Title","Resource Type","Genre","Identifier BNumber","Identifier Accession Number","Identifier Call Number","Identifier ISBN","Identifier ISSN","Identifier Interview ID","Identifier Postcard ID","Identifier LCCN","Identifier OCLC/RLIN","Physical Description Extent","Physical Description Form","Publisher","Place Of Publication","Number of Items","Digital Collections URL"]
	var counter = 0

	var nullCountIndex = {}


	fs.unlink(exportCsv.replace("pd_items","pd_collections"), function (err) {

		fs.unlink(exportJson.replace("pd_items","pd_collections"), function (err) {

			var totalCollections=0, totalTriples =0


			db.returnDb(function(err,databaseConnection){
				if (err) console.log(err)

				var databaseAgents = databaseConnection.collection("agents")
				var databaseTerms = databaseConnection.collection("terms")
				var databaseSerialized = databaseConnection.collection("serialized")
				var databaseMmsCollections = databaseConnection.collection("mmsCollections")
				var databaseMmsContainers = databaseConnection.collection("mmsContainers")

				var databaseMmsItems = databaseConnection.collection("mmsItems")
				var databaseMmsCaptures = databaseConnection.collection("mmsCaptures")

				var cursor = databaseMmsCollections.find()

				cursor.on('data', function(collection) {


					counter++

					cursor.pause()

					//first find out if there are public domain and in DC items in this collection
					databaseMmsItems.count({ collectionUuid: collection._id, publicDomain: true, dcFlag:true  }, function(err,count){

						if (count>0){					

							var csvData = {
								"UUID" : "",
								"Database ID" : "",
								"Title" : "",
								"Alternative Title" : "",
								"Contributor" : "",
								"Date" : "",
								"Date Start" : "",
								"Date End" : "",
								"Language" : "",
								"Description" : "",
								"Note" : "",
								"Subject Topical" : "",
								"Subject Name" : "",
								"Subject Geographic" : "",
								"Subject Temporal" : "",
								"Subject Title" : "",
								"Resource Type" : "",
								"Genre" : "",
								"Identifier BNumber" : "",
								"Identifier Accession Number" : "",
								"Identifier Call Number" : "",
								"Identifier ISBN" : "",
								"Identifier ISSN" : "",
								"Identifier Interview ID" : "",
								"Identifier Postcard ID" : "",
								"Identifier LCCN" : "",
								"Identifier OCLC/RLIN" : "",
								"Physical Description Extent": "",
								"Physical Description Form": "",
								"Publisher": "",
								"Place Of Publication": "",	
								"Number of Items" : "",
								"Digital Collections URL" : ""
							}

							var jsonData = {
								"UUID" : null,
								"databaseID" : null,
								"title" : null,
								"alternativeTitle" : [],
								"contributor" : [],
								"date" : [],
								"dateStart" : null,
								"dateEnd" : null,
								"language" : [],
								"description" : [],
								"note" : [],
								"subjectTopical" : [],
								"subjectName" : [],
								"subjectGeographic" : [],
								"subjectTemporal" : [],
								"subjectTitle" : [],
								"resourceType" : [],
								"genre" : [],
								"identifierBNumber" : null,
								"identifierAccessionNumber" : null,
								"identifierCallNumber" : null,
								"identifierISBN" : null,
								"identifierISSN" : null,
								"identifierInterviewID" : null,
								"identifierPostcardID" : null,
								"identifierLCCN" : null,
								"identifierOCLCRLIN" : null,
								"physicalDescriptionExtent": [],
								"physicalDescriptionForm": [],
								"publisher": null,
								"placeOfPublication": null,								
								"numberOfItems" : null,
								"digitalCollectionsURL" : null
							}

							

							csvData["Number of Items"] = count
							jsonData["numberOfItems"] = count

							csvData["UUID"] = collection._id
							jsonData["UUID"] = collection._id


							csvData["Database ID"] = parseInt(collection.mmsDb)
							jsonData["databaseID"] = parseInt(collection.mmsDb)
							
							var addedTitlesJson = []

							collection.titles.forEach(function(title){
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

							collection.agents.forEach(function(a){
								if (addedAgentsCSV.indexOf(a.namePart) == -1){
									addedAgentsCSV.push(a.namePart)									
								}

								var contributor = {
									contributorName: null,
									contributorType: null,
									contributorRole: [],
									contributorURI: null
								}
								if (a.role){
									a.role.forEach(function(r){
										var code = r.split('/relators/')[1]
										if (marcRelatorCodes[code]) contributor.contributorRole.push(marcRelatorCodes[code])
									})
								}

								contributor.contributorName = a.namePart
								contributor.contributorType = a.type
								if (a.viaf)	contributor.contributorURI = "http://viaf.org/viaf/" + a.viaf

								jsonData['contributor'].push(contributor)

							})

							csvData['Contributor'] = addedAgentsCSV.join(" | ")
							
							var datesStart = [], datesEnd = [], datesNoPoint = []
							collection.dates.forEach(function(d){
								if (d.point === 'start') datesStart.push(d.value)
								if (d.point === 'end') datesEnd.push(d.value)	
								if (d.point === false) datesNoPoint.push(d.value)
							})

							var highestStart = 0, lowestEnd = 9999

							//try to find the highest start and lowest end if the dates are years

							datesStart.forEach(function(d){
								var year = d.match(/[0-9]{4}/)
								if (year){
									year = parseInt(year[0])
									if (year>highestStart) highestStart = year
								}
							})

							datesEnd.forEach(function(d){
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
							}else{
								//see if there is a year in the no point dates
								datesNoPoint.forEach(function(d){
									var year = d.match(/[0-9]{4}/)
									if (year){
										year = parseInt(year[0])
										csvData["Date Start"] = year
										jsonData["dateStart"] = year			
									}
								})
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

							//Fixme? TODO
							// if(csvData["Date Start"] && !csvData["Date End"]){
							// 	console.log(collection.dates)	
							// }

							
							if (collection.languages.length>0){
								var languages = []
								collection.languages.forEach(function(l){
									var code = l.split('/iso639-2/')[1]
									if (marcLanguageCodes[code]) languages.push(marcLanguageCodes[code])
								})
								csvData['Language'] = languages.join(" | ").trim()
								jsonData['language'] = languages
							}

							
							if (collection.abstracts.length>0){
								var abstracts = []
								collection.abstracts.forEach(function(a){
									abstracts.push(a)
								})
								csvData['Description'] = abstracts.join(" ")
								jsonData['description'] = abstracts
							}				

							collection.notes.forEach(function(n){
								var notes = []								
								if (n.type!='admin'){
									var noteLabel = ""
									if (noteMap[n.type]) noteLabel = noteMap[n.type]
									notes.push(noteLabel + " Note: " + n.text)
									jsonData['note'].push({
										type: (n.type == "") ? null : n.type,
										text: (n.text == "") ? null : n.text
									})
								}
								csvData['Note'] = notes.join(" ").trim()
							})

							var subjects = {
								'topic' : [],
								'name' : [],
								'geographic' : [],
								'temporal' : [],
								'titleInfo' : []
							}
							var subjectsJson = {
								'topic' : [],
								'name' : [],
								'geographic' : [],
								'temporal' : [],
								'titleInfo' : []
							}
							
							//[ 'geographic', 'topic',  'temporal',  'name',  'titleInfo',  'occupation',  'form' ]
							
							collection.subjects.forEach(function(s){
								if (subjects[s.type]){
									if (subjects[s.type].indexOf(s.text) == -1){
										subjects[s.type].push(s.text)
										subjectsJson[s.type].push(
											{
												text: s.text,
												URI: (s.valueURI === false) ? null : s.valueURI 
											}
										)
									}
								}
							})



							if (subjects['topic'].length>0) csvData["Subject Topical"] = subjects['topic'].join(" | ")
							if (subjects['name'].length>0) csvData["Subject Name"] = subjects['name'].join(" | ")
							if (subjects['geographic'].length>0) csvData["Subject Geographic"] = subjects['geographic'].join(" | ")
							if (subjects['temporal'].length>0) csvData["Subject Temporal"] = subjects['temporal'].join(" | ")
							if (subjects['titleInfo'].length>0) csvData["Subject Title"] = subjects['titleInfo'].join(" | ")

							jsonData['subjectTopical'] = subjectsJson['topic']
							jsonData['subjectName'] = subjectsJson['name']
							jsonData['subjectGeographic'] = subjectsJson['geographic']
							jsonData['subjectTemporal'] = subjectsJson['temporal']
							jsonData['subjectTitle'] = subjectsJson['titleInfo']

							if (collection.typeOfResource.length>0){
								var typeOfResource = []
								collection.typeOfResource.forEach(function(l){
									typeOfResource.push(l)
								})
								csvData['Resource Type'] = typeOfResource.join(" | ").trim()
								jsonData['resourceType'] = typeOfResource
							}	

							if (collection.genres.length>0){
								var genres = []
								collection.genres.forEach(function(g){
									genres.push(g.text)
									jsonData['genre'].push({
										text: g.text,
										URI: (g.valueURI === false) ? null : g.valueURI
									})
								})
								csvData['Genre'] = genres.join(" | ").trim()
							}	



							if (collection.bNumber){
								csvData['Identifier BNumber'] = utils.normalizeBnumber(collection.bNumber)
								jsonData['identifierBNumber'] = utils.normalizeBnumber(collection.bNumber)
							}
							if (collection.accession){
								csvData['Identifier Accession Number'] = collection.accession
								jsonData['identifierAccessionNumber'] = collection.accession
							}
							if (collection.callNumber){
								csvData['Identifier Call Number'] = collection.callNumber
								jsonData['identifierCallNumber'] = collection.callNumber
							}
							if (collection.isbn){
								csvData['Identifier ISBN'] = collection.isbn
								jsonData['identifierISBN'] = collection.isbn
							}
							if (collection.issn){
								csvData['Identifier ISSN'] = collection.issn
								jsonData['identifierISSN'] = collection.issn
							}
							if (collection.exhibition){
								csvData['Identifier Interview ID'] = collection.exhibition
								jsonData['identifierInterviewID'] = collection.exhibition
							}
							if (collection.lccn){
								csvData['LCCN'] = collection.lccn
								jsonData['LCCN'] = collection.lccn
							}
							if (collection.oclc){
								csvData['Identifier OCLC/RLIN'] = collection.oclc
								jsonData['identifierOCLCRLIN'] = collection.oclc
							}

							var forms = [],extents = []

							collection.physicalDescriptions.forEach(function(pd){

								pd.form.forEach(function(form){
									forms.push(form)
								})

								pd.extent.forEach(function(extent){
									extents.push(extent)
								})						

							})
							csvData['Physical Description Extent'] = extents.join(" | ").trim()
							jsonData['physicalDescriptionExtent'] = extents
							csvData['Physical Description Form'] = forms.join(" | ").trim()
							jsonData['physicalDescriptionForm'] = forms


							var publishers = [],places = []

							collection.originInfos.forEach(function(oi){

								oi.place.forEach(function(place){
									places.push(place)
								})

								oi.publisher.forEach(function(publisher){
									publishers.push(publisher)
								})						

							})
							csvData['Publisher'] = publishers.join(" | ").trim()
							jsonData['publisher'] = publishers
							csvData['Place Of Publication'] = places.join(" | ").trim()
							jsonData['placeOfPublication'] = places



							csvData["Digital Collections URL"] = "http://digitalcollections.nypl.org/collections/" + collection._id
							jsonData["digitalCollectionsURL"] = "http://digitalcollections.nypl.org/collections/" + collection._id



							//one file check before we sieralize out to CSV is to remove any "\" escaping backslashes that could break the formating
							for (var x in csvData){
								if (typeof csvData[x] === 'string')
									csvData[x] = csvData[x].replace(/\\/g,'/')
							}



							json2csv({ data: csvData, fields: csvFields, hasCSVColumnTitle : csvHeaderCheck }, function(err, csv) {
								if (err) console.log(err);
								csv = csv + "\n"
								csvHeaderCheck = false
								fs.appendFile(exportCsv.replace("pd_items","pd_collections"),csv, function (err) {
									if (err) console.log(err);
									fs.appendFile(exportJson.replace("pd_items","pd_collections"),JSON.stringify(jsonData)+"\n", function (err) {
										if (err) console.log(err);
										process.stdout.cursorTo(0)
										process.stdout.write(clc.black.bgYellowBright("Collections PD: " + counter ))
										cursor.resume()
									})
								})					
							})


						}else{

							cursor.resume()
						}
					})
				})

				cursor.once('end', function() {
						
					setTimeout(function(){
						console.log("serializeMMS Collections - Done!\n")
						cb()
						databaseConnection.close()
						//shadowcatDatabase.close()
					},5000)
				})
		

			})
		})
	})
}















