"use strict"

var config = require("config")
var utils = require("../lib/utils.js")
var errorLib = require("../lib/error.js");


var objectsMapping = ["ObjectID","ObjectNumber","SortNumber","ObjectCount","DepartmentID","ObjectStatusID","ClassificationID","SubClassID","Type","LoanClassID","DateBegin","DateEnd","ObjectName","Dated","Title","Medium","Dimensions","Signed","Inscribed","Markings","CreditLine","Chat","DimensionRemarks","Description","Exhibitions","Provenance","PubReferences","Notes","CuratorialRemarks","RelatedWorks","Portfolio","ObjectHeightCMOLD","ObjectWidthCMOLD","ObjectDepthCMOLD","ObjectDiameterCMOLD","ObjectWeightKGOLD","PublicAccess","CuratorApproved","OnView","TextSearchID","LoginID","EnteredDate","Accountability","PaperFileRef","ObjectLevelID","ObjectTypeID","ObjectScreenID","UserNumber1","UserNumber2","UserNumber3","UserNumber4","ObjectNameID","ObjectNameAltID","UserDate1","UserDate2","UserDate3","UserDate4","State","CatRais","HistAttributions","Bibliography","Negative","LoanClass","Edition","Cataloguer","CatalogueDateOld","Curator","CuratorRevDateOld","PaperSupport","ObjectDiamCMOLD","SysTimeStamp","IsVirtual","CatalogueISODate","CuratorRevISODate","IsTemplate","ObjectNumber2","SortNumber2","DateRemarks","DateEffectiveISODate","PhysicalParentID","InJurisdiction"]
var titleMapping = ["TitleID","ObjectID","TitleTypeID","Title","Remarks","Active","LoginID","EnteredDate","DisplayOrder","Displayed","LanguageID","SysTimeStamp","DateEffectiveISODate","IsExhTitle"]
var consituentMapping = ["ConstituentID","ConstituentTypeID","Active","AlphaSort","LastName","FirstName","NameTitle","Institution","LastSoundEx","FirstSoundEx","InstitutionSoundEx","DisplayName","BeginDate","EndDate","DisplayDate","Biography","Code","Nationality","School","LoginID","EnteredDate","PublicAccessOld","Remarks","Position","MiddleName","Suffix","CultureGroup","SysTimeStamp","N_DisplayName","N_DisplayDate","salutation","Approved","PublicAccess","IsPrivate","DefaultNameID","SystemFlag","InternalStatus"]
var objConXrefMapping = ["ConXrefID","ObjectID","ConstituentID","RoleID","DateBegin","DateEnd","Remarks","LoginID","EnteredDate","ConStatement","DisplayOrder","Displayed","Active","Prefix","Suffix","Amount","DisplayDate","Role"]
var altNumMapping = ["AltNumID","ID","TableID","AltNum","Description","LoginID","EnteredDate","Remarks","BeginISODate","EndISODate"]


exports.mapObjectCsvToJson = function(csvArray){
	var result = {}
	for (var x in csvArray){
		result[objectsMapping[x]] = csvArray[x]
	}
	return result
}

exports.mapTitleCsvToJson = function(csvArray){
	var result = {}
	for (var x in csvArray){
		result[titleMapping[x]] = csvArray[x]
	}
	return result
}

exports.mapConsituentCsvToJson = function(csvArray){
	var result = {}
	for (var x in csvArray){
		result[consituentMapping[x]] = csvArray[x]
	}
	return result
}

exports.mapObjConXrefCsvToJson = function(csvArray){
	var result = {}
	for (var x in csvArray){
		result[objConXrefMapping[x]] = csvArray[x]
	}
	return result
}

exports.mapAltNumCsvToJson = function(csvArray){
	var result = {}
	for (var x in csvArray){
		result[altNumMapping[x]] = csvArray[x]
	}
	return result
}



//given a mms extract record pull out the required identifiers
exports.extractIds = function(record){

	var idents = {}

	if (record.title) idents.title = record.title

	if (record.id) idents.mssDb = record.id

	if (record.identifier_type){
		if (record.identifier_type === 'local_mss'){
			if (record.identifier_value){
				idents.mss = parseInt(record.identifier_value)
			}
		}
	}


	if (record.bnumber) idents.bNumber = record.bnumber

	if (record.call_number) idents.callNumber = record.call_number

	if (record.org_unit_code) idents.divisions = record.org_unit_code
	
	if (record.collection_id) idents.collectionDb = record.collection_id

	if (record.parent_id) idents.parentDb = record.parent_id

	if (record.type) idents.type = record.type

	if (record.resource_type) idents.resourceType = record.resource_type

	if (record.sib_seq) idents.orderSequence = record.sib_seq

	if (record.level_num) idents.orderLevel = record.level_num



	for (var x in record.unitid){

		var unitid = record.unitid[x]

		if (unitid){
			if (unitid.type){
				if (unitid.type === 'local_barcode'){
					if (unitid.value){
						idents.barcode = parseInt(unitid.value)
					}
				}
			}
		}


	}

	return idents

}



exports.extractAgents = function(record){

	var agents = []

	if (record.origination){
		for (var x in record.origination){

			x = record.origination[x]

			agents.push(
				{
					id : (x.id) ? x.id : false,
					namePart : (x.term) ? x.term : false,
					type : (x.type) ? x.type : false,
					authority : (x.source) ? x.source : false,
					role : (x.role) ? x.role : false,
					valueURI : (x.controlaccess) ? x.controlaccess : false
				}
			)
		}

	}


	//now pull out the control terms
	if (record.controlaccess){

		if (record.controlaccess.name){

			for (var x in record.controlaccess.name){

					var name = record.controlaccess.name[x]

					agents.push(
						{
							id : (name.id) ? name.id : false,
							namePart : (name.term) ? name.term : false,
							type : (name.type) ? name.type : false,
							authority : (name.source) ? name.source : false,
							role : "contributor",
							valueURI : (name.controlaccess) ? name.controlaccess : false
						}
					)

			}

		}


	}

	return agents

}

exports.extractSubjects = function(record){

	var subjects = []

	if (record.controlaccess){



		for (var controlType in record.controlaccess){


			if (controlType == "subject" || controlType == "occupation" || controlType == "genreform" || controlType == "geogname"){

				for (var x in record.controlaccess[controlType]){

					var r = record.controlaccess[controlType][x]


					subjects.push({

						id: (r.id) ? r.id : false,
						type : (r.type) ? r.type : false,
						nameType : controlType,
						authority : (r.source) ? r.source : false,
						valueURI : false,
						text : (r.term) ? r.term : false,

					})


				}


			}

		}

	}

	return subjects

}


exports.extractNotes = function(record){

	var notes = []

	var noteFields = ['bioghist','custodhist','scopecontent','acqinfo','relatedmaterial','langmaterial']


	for (var note in noteFields){

		note = noteFields[note]


		if (record[note]) {
			record[note].map(function(obj){
				if (obj.value) {
				 notes.push({ type: note, text : obj.value})
				}
			})
		}
	}


	for (var x in record.note){
		x = record.note[x]
		notes.push({

			type: (x.type) ? x.type : false,
			text: (x.value) ? x.value : false
		})
	}


	return notes
}



exports.extractLanguage = function(record){

	var languages = []

	if (record.langmaterial_code){

		record.langmaterial_code.map(function(val){
			languages.push(val)
		})

	}


	return languages
}


exports.extractDates = function(record){


	var dates = []


	if (record.date_inclusive_start){
		dates.push({

			field: 'inclusive',
			type: false,
			value: record.date_inclusive_start,
			keyDate: false,
			point: "start",
			encoding: false

		})
	}

	if (record.date_inclusive_end){
		dates.push({

			field: 'inclusive',
			type: false,
			value: record.date_inclusive_end,
			keyDate: false,
			point: "end",
			encoding: false

		})
	}

	if (record.keydate){
		dates.push({

			field: 'exact',
			type: false,
			value: record.keydate,
			keyDate: true,
			point: false,
			encoding: false

		})


	}

	return dates


}


exports.extractAbstracts = function(record){

	var abstracts = []


	if (record.abstract){
		for (var x in record.abstract){
			if (record.abstract[x].value){
				abstracts.push(record.abstract[x].value)
			}
		}
	}


	return abstracts
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


