"use strict"

var libxmljs = require("libxmljs")
var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js");


//Used for collection, container and items


//given a mms extract record pull out the required identifiers
exports.extractIds = function(record){


	var idThesaurus = config.get('Thesaurus')['mms']

	var idents = {}

	//get the mss system identifers

	if (record['id']){
		idents['mmsDb'] = record['id'] +""
	}
	if (record['type']){
		idents['mmsType'] = record['type']
	}
	if (record['uuid']){
		idents['mmsUuid'] = record['uuid']
	}

	if (record['solr_doc_hash']){
		if (record['solr_doc_hash']['identifier_local_image_id']){
			if (typeof record['solr_doc_hash']['identifier_local_image_id'] === 'string'){
				idents['captureIds'] = [record['solr_doc_hash']['identifier_local_image_id'] ]
			}else{
				idents['captureIds'] = []
				for (var x in record['solr_doc_hash']['identifier_local_image_id'] ){

					if (record['solr_doc_hash']['identifier_local_image_id'][x] !== null){
						idents['captureIds'].push(record['solr_doc_hash']['identifier_local_image_id'][x])
					}

				}
				
			}
		}

		if (record['solr_doc_hash']['collection_uuid']){
			if (record['solr_doc_hash']['collection_uuid'].length == 36){
				idents['collectionUuid'] = record['solr_doc_hash']['collection_uuid']
			}
		}

		if (record['solr_doc_hash']['container_uuid']){
			if (record['solr_doc_hash']['container_uuid'].length == 36){
				idents['containerUuid'] = record['solr_doc_hash']['container_uuid']
			}
		}





	}



	//the solr doc hash title is sometimes messed up with encoding errors
	// so pull it out below from the xml
	// if (record['solr_doc_hash']['title']){
	// 	if (record['solr_doc_hash']['title'].length>0){
	// 		idents['title'] = ""
	// 		for (var x in record['solr_doc_hash']['title']){
	// 			idents['title']+= record['solr_doc_hash']['title'][x] + ' '

	// 		}
	// 		idents['title']=idents['title'].trim()
	// 		idents['titleLast'] = record['solr_doc_hash']['title'][record['solr_doc_hash']['title'].length-1].trim()
	// 	}

	// }


	if (record['desc_xml']){


		//record['desc_xml'] = '<mods xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://uri.nypl.org/schema/nypl_mods" version="3.4" xsi:schemaLocation="http://uri.nypl.org/schema/nypl_mods http://uri.nypl.org/schema/nypl_mods"> <titleInfo ID="titleInfo_0" usage="primary" supplied="no" lang="eng"><nonSort>The </nonSort><title>Newtonian system of philosophy, adapted to the capacities of young gentlemen and ladies ... being the substance of six lectures read to the Lilliputian Society, by Tom Telescope, A. M., and collected and methodized for the benefit of the youth of these Kingdoms, by their old friend Mr. Newbery ...</title></titleInfo><name ID="name_0" type="personal" authority="naf" valueURI="" authorityRecordId=""><namePart>Newbery, John (1713-1767)</namePart><affiliation/><role><roleTerm valueURI="http://id.loc.gov/vocabulary/relators/aut" authority="marcrelator" type="code">aut</roleTerm><roleTerm valueURI="http://id.loc.gov/vocabulary/relators/aut" authority="marcrelator" type="text">Author</roleTerm></role></name><name ID="name_1" type="personal" authority="naf" valueURI="" authorityRecordId=""><namePart>Goldsmith, Oliver (1730?-1774)</namePart><affiliation/><role><roleTerm valueURI="http://id.loc.gov/vocabulary/relators/aut" authority="marcrelator" type="code">aut</roleTerm><roleTerm valueURI="http://id.loc.gov/vocabulary/relators/aut" authority="marcrelator" type="text">Author</roleTerm></role></name><name ID="name_2" type="personal" authority="naf" valueURI="" authorityRecordId=""><namePart>Telescope, Tom</namePart><affiliation/><role><roleTerm valueURI="http://id.loc.gov/vocabulary/relators/aut" authority="marcrelator" type="code">aut</roleTerm><roleTerm valueURI="http://id.loc.gov/vocabulary/relators/aut" authority="marcrelator" type="text">Author</roleTerm></role></name><originInfo ID="originInfo_0"><dateIssued encoding="w3cdtf" keyDate="yes">1761</dateIssued><place><placeTerm>London</placeTerm></place></originInfo><note ID="note_0" type="content">"To the young gentlemen and ladies of Great Britain and Ireland, this philosophy of tops and balls is ... inscribed, by ... J. Newbery": 3d prelim. p.</note><note ID="note_1" type="content">For variations see: Babson Institute Library Newton Collection, 115//</note><note ID="note_2" type="content">Imperfect: p. 111-112 mutilated, affecting 2 words of text.</note><note ID="note_3" type="content">Publisher\'s advertisements: p. 126-140.</note><note ID="note_4" type="content">Sometimes attributed to Oliver Goldsmith.</note><identifier ID="identifier_0" type="local_hades" displayLabel="Hades struc ID (legacy)">618679</identifier><identifier ID="identifier_1" type="local_other" displayLabel="RLIN/OCLC">NYPG784271303-B</identifier><identifier ID="identifier_2" type="local_catnyp" displayLabel="CATNYP ID (legacy)">b1493851</identifier><identifier ID="identifier_3" type="local_bnumber" displayLabel="NYPL catalog ID (B-number)">b10483503</identifier><location ID="location_0"><physicalLocation authority="marcorg" type="repository">nn</physicalLocation><physicalLocation type="division">Berg Collection</physicalLocation><shelfLocator>Berg Coll. 77-645</shelfLocator></location></mods>'

		try{
			var xmlDoc = libxmljs.parseXml(record['desc_xml'])
		} catch (err) {
			errorLib.error("extract mms identifiers - invalid MODS record",{error: err, data: record})
			return idents
		}

		idents['dates'] = []



		var children = xmlDoc.root().childNodes();
		for (var aChild in children){

			var n = children[aChild]

			if (n.name() == 'identifier'){

				var type = false,
				 	value = n.text()


				var attrs = n.attrs()

				for (var aAttr in attrs){

					var a = attrs[aAttr]

					if (a.name() == "type")
						type = a.value()

					//mms stores their identifiers differntly when it is a local_other, it uses the display label, overwrite the type if has a display label 
					if (a.name() == "displayLabel" || a.name() == "display_label")
						type = a.value()

				}



				if (idThesaurus[type]){

					//blah
					value=value.replace('archives_components_','')

					//this might happen, just to keep track of it
					if (idents[idThesaurus[type]]){
						//unless we are about to overwrite a bnumbe with obviously not bnumber
						if (type.search("catalog ID") > -1 && value.search("b") != -1){
							errorLib.error("extract mms identifiers - overwriting identifiers",type + "| was : " + idents[idThesaurus[type]] + " is now: " + value)
						}
					}

					idents[idThesaurus[type]] = value

				}else{
					errorLib.error("extract mms identifiers - unknown Identifier",n.toString())
				}

			}


			if (n.name() == 'location'){
				var locations = n.childNodes();

				for (var aLoc in locations){
					if (locations[aLoc].name() == 'shelfLocator' || locations[aLoc].name() == 'shelfocator')
						idents['callNumber'] = locations[aLoc].text()
				}
			}


			if (n.name() == 'titleInfo'){
				idents['title'] = n.text().trim()
			}


			if (n.name() == 'originInfo'){
				idents['originInfo'] = n.text().trim()


				//also get the specifc types of dates

				for (var aGrandChild in n.childNodes()){
					var nn = n.childNodes()[aGrandChild]
					if (nn.name() == 'dateIssued'){
						idents['dateIssued'] = nn.text().trim()
						idents['dates'].push(nn.text().trim())
					}
					if (nn.name() == 'dateCreated'){
						idents['dateCreated'] = nn.text().trim()
						idents['dates'].push(nn.text().trim())
					}

				}

			}

		}

	}


	//normalize the bnumber
	if (idents['bNumber']){
		idents['bNumber'] = utils.normalizeBnumber(idents['bNumber'])
	}


	//use the date if the title is not present otherwise set it to false
	if (!idents['title']){
		if (idents['originInfo'])  idents['title'] = idents['originInfo']
	}


	if (!idents['title']){
		idents['title'] = false
	}


	idents['sourceSystem'] = 'mms'


	return idents

}



exports.returnXmlNode = function(xml){

	try{
		var xmlDoc = libxmljs.parseXml(xml)
		return xmlDoc
	} catch (err) {
		errorLib.error("MMS - returnXmlNode " + err,xml)
		return false
	}
}

exports.extractAgents = function(xmlDoc){

	var agents = []

	var children = xmlDoc.root().childNodes();

	for (var aChild in children){

		var n = children[aChild]

		if (n.name() == 'name'){	

			var agent = {

				namePart : false,
				type : false,
				authority : false,
				valueURI : false,
				usage : false,
				role: []


			}


			var attrs = n.attrs()

			for (var aAttr in attrs){

				var a = attrs[aAttr]

				if (a.name() == "type")
					agent.type = a.value()

				if (a.name() == "authority")
					agent.authority = a.value()

				if (a.name() == "valueURI")
					agent.valueURI = a.value()

				if (a.name() == "usage")
					agent.usage = a.value()

			}


			for (var aGrandChild in n.childNodes()){

				var nn = n.childNodes()[aGrandChild]
				//TODO multi nameParts?
				if (nn.name() == 'namePart'){
					agent.namePart = nn.text().trim()
				}

				if (nn.name() == 'role'){


					for (var aGreatGrandChild in nn.childNodes()){

						var nnn = nn.childNodes()[aGreatGrandChild]

						if (nnn.name() == 'roleTerm'){
							var attrs = nnn.attrs()

							for (var aAttr in attrs){
								var a = attrs[aAttr]
								if (a.name() == "valueURI"){
									if (agent.role.indexOf(a.value()) === -1) agent.role.push(a.value())
								}
							}
						}
					}

				}

			}

			//no empty values
			for (var x in agent){
				if (typeof agent[x] === 'string') if (agent[x].trim() === '') agent[x] = false;
			}


			agents.push(agent)

		}

	}

	return agents

}

exports.extractSubjects = function(xmlDoc){

	var subjects = []

	var children = xmlDoc.root().childNodes();

	for (var aChild in children){

		var n = children[aChild]

		if (n.name() == 'subject'){	


			for (var aGrandChild in n.childNodes()){

				var nn = n.childNodes()[aGrandChild]

				var subject = {
					type : false,
					nameType : false,
					authority : false,
					valueURI : false,
					text : false
				}

				subject.type = nn.name();

				if (subject.type === 'text') continue

				var attrs = nn.attrs()

				for (var aAttr in attrs){
					var a = attrs[aAttr]
					if (a.name() == "type")
						subject.nameType = a.value()

					if (a.name() == "authority")
						subject.authority = a.value()

					if (a.name() == "valueURI")
						subject.valueURI = a.value()

					if (a.name() == "usage")
						subject.usage = a.value()
				}

				subject.text = nn.text().trim()

				//no empty values
				for (var x in subject){
					if (typeof subject[x] === 'string') if (subject[x].trim() === '') subject[x] = false;
				}

				subjects.push(subject)
			}



		}

	}

	return subjects

}

exports.extractDivision = function(xmlDoc){

	var divisions = []

	var children = xmlDoc.root().childNodes();

	for (var aChild in children){


		var n = children[aChild]

		if (n.name() == 'location'){	


			for (var aGrandChild in n.childNodes()){

				var nn = n.childNodes()[aGrandChild]

				var attrs = nn.attrs()

				for (var aAttr in attrs){
					var a = attrs[aAttr]
					if (a.name() === "type" && a.value() === 'code') divisions.push(nn.text().trim())
				}
			}
		}
	}

	return divisions
}

exports.extractNotes = function(xmlDoc){

	var notes = []

	var children = xmlDoc.root().childNodes();

	for (var aChild in children){


		var n = children[aChild]

		if (n.name() == 'note'){	
				
			var note = {
				type: false,
				text : false
			}


			var attrs = n.attrs()

			for (var aAttr in attrs){
				var a = attrs[aAttr]
				if (a.name() == "type")
					note.type = a.value()
			}

			note.text = n.text().trim()



			notes.push(note)

		}
	}

	return notes
}


exports.extractTitles = function(xmlDoc){

	var titles = []

	var children = xmlDoc.root().childNodes();

	for (var aChild in children){


		var n = children[aChild]

		if (n.name() == 'titleInfo'){	
				
			var title = {
				primary: false,
				title: false,
				subTitle : false,
				partName : false,
				partNumber : false,
				supplied : false,
				lang : false,
				script : false,
				type : false,
				authority : false
			}


			var attrs = n.attrs()

			for (var aAttr in attrs){
				var a = attrs[aAttr]
				if (a.name() == "type")
					title.type = a.value()
				if (a.name() == "authority")
					title.authority = a.value()
				if (a.name() == "usage")
					if (a.value() === 'primary') title.primary = true					
				if (a.name() == "lang")
					title.lang = a.value()
				if (a.name() == "supplied")
					title.supplied = a.value()				
				if (a.name() == "script")
					title.script = a.value()
			}

			for (var aGrandChild in n.childNodes()){

				var nn = n.childNodes()[aGrandChild]

				if (nn.name() == 'title'){
					title.title = nn.text().trim()
				}
				if (nn.name() == 'subTitle'){
					title.subTitle = nn.text().trim()
				}
				if (nn.name() == 'partName'){
					title.partName = nn.text().trim()
				}
				if (nn.name() == 'partNumber'){
					title.partNumber = nn.text().trim()
				}


			}

			//no empty values
			for (var x in title){
				if (typeof title[x] === 'string') if (title[x].trim() === '') title[x] = false;
			}

			titles.push(title)

		}
	}

	return titles
}




exports.extractLanguage = function(xmlDoc){

	var languages = []

	var children = xmlDoc.root().childNodes();

	for (var aChild in children){


		var n = children[aChild]

		if (n.name() == 'language'){	
			


			for (var aGrandChild in n.childNodes()){

				var nn = n.childNodes()[aGrandChild]

				if (nn.name() == 'languageTerm'){

					var attrs = nn.attrs()

					for (var aAttr in attrs){

						var a = attrs[aAttr]

						if (a.name() == "valueURI"){
							
							if ( languages.indexOf( a.value() ) === -1 ){
								languages.push(a.value())
							}

						}
					}

				}

			}

		}
	}

	return languages
}


exports.extractDates = function(xmlDoc){

	var dates = []

	var children = xmlDoc.root().childNodes();

	for (var aChild in children){


		var n = children[aChild]

		if (n.name() == 'originInfo'){	


			for (var aGrandChild in n.childNodes()){

				var nn = n.childNodes()[aGrandChild]

				if (nn.name() == 'dateIssued' || nn.name() == 'dateCreated' || nn.name() == 'copyrightDate'){	

					var date = {
						field: nn.name(),
						type: false,
						value: nn.text(),
						keyDate: false,
						point: false,
						encoding: false
					}

					var attrs = nn.attrs()

					for (var aAttr in attrs){
						var a = attrs[aAttr]
						if (a.name() == "encoding")
							date.type = a.value()
						if (a.name() == "keyDate")
							date.keyDate = a.value()				
						if (a.name() == "point")
							date.point = a.value()
					}

					//no empty values
					for (var x in date){
						if (typeof date[x] === 'string') if (date[x].trim() === '') date[x] = false;
					}

					dates.push(date)
				}

			}
				

		}
	}

	return dates
}

exports.extractAbstracts = function(xmlDoc){

	var abstracts = []

	var children = xmlDoc.root().childNodes();

	for (var aChild in children){


		var n = children[aChild]

		if (n.name() == 'abstract'){	
				
			var attrs = n.attrs()

			abstracts.push(n.text().trim())

		}
	}

	return abstracts
}


exports.extractGenres = function(xmlDoc){

	var genres = []

	var children = xmlDoc.root().childNodes();

	for (var aChild in children){


		var n = children[aChild]

		if (n.name() == 'genre'){	
				
			var genre = {
				authority: false,
				valueURI: false,
				text : false
			}


			var attrs = n.attrs()

			for (var aAttr in attrs){
				var a = attrs[aAttr]
				if (a.name() == "authority")
					genre.authority = a.value()
				if (a.name() == "valueURI")
					genre.valueURI = a.value()

			}

			genre.text = n.text().trim()



			genres.push(genre)

		}
	}

	return genres
}



exports.extractCollectionAndContainer = function(xmlDoc){

	var hostHierarchy = []


	var recursiveTime = function(node){

		var next = false

		for (var aChild in node.childNodes()){

			var n = node.childNodes()[aChild]
			if (n.name() === 'identifier'){

				var attrs = n.attrs()
				for (var aAttr in attrs){
					var a = attrs[aAttr]
					if (a.name() == "type"){
						if (a.value().trim() === 'uuid'){
							hostHierarchy.push(n.text().trim())
						}
					}
				}				
			}

			if (n.name() === 'relatedItem'){
				next = n
			}

		}

		if (next){
			recursiveTime(next)
		}


	}

	

	var children = xmlDoc.root().childNodes();

	for (var aChild in children){

		var n = children[aChild]

		if (n.name() == 'relatedItem'){	
			recursiveTime(n)
		}


	}
	var results = {
		parents : hostHierarchy,
		collection : (hostHierarchy[0]) ? hostHierarchy[0] : false,
		container: false
	}

	if (hostHierarchy.length > 1){
		results.container = hostHierarchy[0]		
		results.collection = hostHierarchy[hostHierarchy.length-1]		
	}

	return results
}


exports.extractCapture = function(record){

	var results = {

		mmsDb : false,
		imageId : false,
		itemMmsDb : false,
		itemUuid: false,
		name: false,
		collectionMmsDb: false,
		containerMmsDb: false,
		notesOrder: false,
		notesProcessing: false,
		relationshipContent: false,
		relationshipName: false,
		uuid: false,
		workOrders: false

	}

	if (record.id) results.mmsDb = record.id
	if (record.image_id) results.imageId = record.image_id
	if (record.item){
		if (record.item.item){

			if (record.item.item.id) results.itemMmsDb = record.item.item.id
			if (record.item.item.uuid) results.itemUuid = record.item.item.uuid
			if (record.item.item.name) results.name = record.item.item.name
			if (record.item.item.collection_id) results.collectionMmsDb = record.item.item.collection_id	
			if (record.item.item.container_id) results.containerMmsDb = record.item.item.container_id	

		}
	}

	if (record.ordered_records) results.notesOrder = record.ordered_records
	if (record.processing_notes) results.notesProcessing = record.processing_notes

	if (record.relationship){
		if (record.relationship.relationship){
			if (record.relationship.relationship.content_relationship) results.relationshipContent = record.relationship.relationship.content_relationship
			if (record.relationship.relationship.name) results.relationshipName = record.relationship.relationship.name
		}
	}

	if (record.uuid) results.uuid = record.uuid
	if (record.uuid) results._id = record.uuid
	if (record.work_orders) results.workOrders = record.work_orders

	return results
}

