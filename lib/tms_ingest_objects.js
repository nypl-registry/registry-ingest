"use strict"
var fs = require('fs')
var file = require("../lib/file.js")
var config = require("config")
var db = require("../lib/db.js")
var errorLib = require("../lib/error.js")
var exec = require('child_process').exec
var clc = require('cli-color')
var request = require('request')

var async = require("async")



var tmsUtils = require("../lib/tms_utils.js")



var exports = module.exports = {};


function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
}


exports.reconcileUlan = function(cb){

	var ulansToViaf = {}
	var counter = 0

	fs.readFile(__dirname + '/../data/tmp_tms_ulan_lookup.json', 'utf8', function (err,data) {
		if (err) {
			console.log(err);
		}else{
			ulansToViaf = JSON.parse(data)
		}


		db.returnCollection("tmsObjects",function(err,tmsObjects,database){

			var cursor = tmsObjects.find({})		

			cursor.on('data', function(item) {

				counter++
				process.stdout.cursorTo(25)
				process.stdout.write(clc.black.bgGreenBright("ULAN to VIAF: " + counter + " | " + Object.keys(ulansToViaf).length ))


				cursor.pause()

				var idsToViaf = {}
				

				async.each(item.agents, function(agent, eachCallback) {


					//find if this one exists

					if (agent.ulan){



						//do we have it already?
						if (ulansToViaf[agent.ulan]){

							idsToViaf[agent.id] = ulansToViaf[agent.ulan]

							eachCallback()

						}else{

							var options = {

								url : "http://viaf.org/viaf/sourceID/JPG%7C" + agent.ulan,
								followRedirect : false

							}

							request(options, function (error, response, body) {

							
								if (response.statusCode==301){

									if (response.headers){
										if (response.headers.location){

											var viafId = response.headers.location

											viafId = parseInt(viafId.split('/viaf/')[1])
											ulansToViaf[agent.ulan] = viafId
											idsToViaf[agent.id] = viafId

			
										}
									}
									



								}

								eachCallback()

							})



						}



					}else{

						eachCallback()
					}






					

				//fires when all the lookups are done		

				}, function(err){



					//loop through an update with the new 
					for (var x in item.agents){
						if (idsToViaf[item.agents[x].id]){
							item.agents[x].viaf = idsToViaf[item.agents[x].id]
							
						}


					}


					var update = {
						_id: item._id,
						agents : item.agents
					}

					//update mms 
					tmsObjects.update({ _id : update._id }, { $set: update }, function(err, result) {
						if (err) console.log(err)	


						// console.log(item._id,"<<<<")
						// console.log(result.result)
						cursor.resume()


					})

					

					cursor.resume()


				})		


			})


			cursor.once('end', function() {


				fs.writeFile(__dirname + '/../data/tmp_tms_ulan_lookup.json', JSON.stringify(ulansToViaf,null,2), function (err) {

					if (err) console.log(err)


					setTimeout(function(){
						console.log("reconcileUlan - done")
						database.close()
						if (cb) cb()
					},1000)


				})





			})

		})


	})


}




exports.ingest = function(cb){


	var tmsConsituents =  __dirname + '/..' + config['Source']['tmsConsituents']
	var tmsObjects =  __dirname + '/..' + config['Source']['tmsObjects']
	var tmsObjConXref =  __dirname + '/..' + config['Source']['tmsObjConXref']
	var tmsAltNum =  __dirname + '/..' + config['Source']['tmsAltNum']
	var tmsTitles =  __dirname + '/..' + config['Source']['tmsTitles']
	var tmsDepartments =  __dirname + '/..' + config['Source']['tmsDepartments']
	var tmsClassification =  __dirname + '/..' + config['Source']['tmsClassification']

	var tmsConsituentsLookup = {}
	var tmsTitlesLookup = {}
	var tmsAltNumLookup = {}
	var tmsObjConXrefLookup = {}
	var tmsDepartmentsLookup = {}
	var tmsClassificationLookup = {}


	var writeOutLookup= { 
		tmsConsituentsLookup: tmsConsituentsLookup,  
		tmsTitlesLookup: tmsTitlesLookup, 
		tmsAltNumLookup: tmsAltNumLookup,
		tmsObjConXrefLookup: tmsObjConXrefLookup,
		tmsDepartmentsLookup: tmsDepartmentsLookup,
		tmsClassificationLookup: tmsClassificationLookup
	}


	//we need to load lookups for all this connected data between objects, identfiers, titles and consituents
	//do this parralle 
	async.parallel({

		tmsConsituentsLookup: function(callback){

			console.log('Starting tmsConsituents lookup load')

			//try to open the saved version of this if it exists otherwise make it from the extracts
			fs.readFile( __dirname + '/../data/tmp_tmsConsituentsLookup', function (err, data) {
				
				if (err) {
					
					//build it
					//load the consituents lookup with key on consituents id
					file.streamCsvFile(tmsConsituents, {}, function(record,recordCb){

						if (!record){
							console.log('tmsConsituents lookup load complete')
							callback(null,true)
							return true
						}


						//map the array to obj
						var cObj = tmsUtils.mapConsituentCsvToJson(record)

						//make a smaller  obj for it
						var c = {
							id :  parseInt(cObj.ConstituentID),
							nameAlpha : cObj.AlphaSort,
							nameLast : cObj.LastName,
							nameFirst : cObj.FirstName,
							nameDisplay : cObj.DisplayName,
							dateStart : cObj.BeginDate,
							dateEnd : cObj.EndDate,
							nationality : cObj.Nationality
						}

						tmsConsituentsLookup[parseInt(cObj.ConstituentID)] = JSON.parse(JSON.stringify(c))

						recordCb()
					})



				}else{

					//just load the data in

					tmsConsituentsLookup = JSON.parse(data.toString())
					callback(null,false)
					

				}


				
			})		





			

		},



		tmsTitlesLookup: function(callback){

			console.log('Starting tmsTitles lookup load')


			//try to open the saved version of this if it exists otherwise make it from the extracts
			fs.readFile( __dirname + '/../data/tmp_tmsTitlesLookup', function (err, data) {
				
				if (err) {
					
					//build it

					//the alt titles or titles lookup
					file.streamCsvFile(tmsTitles, {}, function(record,recordCb){

						if (!record){
							console.log('tmsTitles lookup load complete')
							callback(null,true)
							return true
						}

						//map the array to obj
						var cObj = tmsUtils.mapTitleCsvToJson(record)

						if (!tmsTitlesLookup[parseInt(cObj.ObjectID)]) tmsTitlesLookup[parseInt(cObj.ObjectID)] = []
						tmsTitlesLookup[parseInt(cObj.ObjectID)].push(JSON.stringify(cObj.Title))

						record = null
						cObj = null

						recordCb()
					})



				}else{

					//just load the data in
					tmsTitlesLookup = JSON.parse(data.toString())
					callback(null,false)
					

				}


				
			})			

		},

		tmsAltNumLookup: function(callback){

			console.log('Starting tmsAltNum lookup load')


			//try to open the saved version of this if it exists otherwise make it from the extracts
			fs.readFile( __dirname + '/../data/tmp_tmsAltNumLookup', function (err, data) {
				
				if (err) {
					
					//build it
					//load the alt number lookup with key on object id

					file.streamCsvFile(tmsAltNum, {}, function(record,recordCb){


						if (!record){
							console.log('tmsAltNum lookup load complete')
							callback(null,true)
							return true
						}


						//map the array to obj
						var cObj = tmsUtils.mapAltNumCsvToJson(record)

						//make a smaller  obj for it
						var c = {
							value :  cObj.AltNum,
							type : cObj.Description,
							table : parseInt(cObj.TableID)
						}

						if (c.type != 'Previous Number' && c.type != '' && c.value != ''){

							if (!tmsAltNumLookup[parseInt(cObj.ID) + "-" + c.table]) tmsAltNumLookup[parseInt(cObj.ID) + "-" + c.table] = []
							tmsAltNumLookup[parseInt(cObj.ID) + "-" + c.table].push(JSON.parse(JSON.stringify(c)))
						
						}

						recordCb()
					})



				}else{

					//just load the data in
					tmsAltNumLookup = JSON.parse(data.toString())
					callback(null,false)
					

				}


				
			})		

		},



		tmsObjConXrefLookup: function(callback){

			console.log('Starting tmsObjConXref lookup load')


			//try to open the saved version of this if it exists otherwise make it from the extracts
			fs.readFile( __dirname + '/../data/tmp_tmsObjConXrefLookup', function (err, data) {
				
				if (err) {
					
					//build it
					//load the consituents lookup with key on consituents id

					file.streamCsvFile(tmsObjConXref, {}, function(record,recordCb){

						if (!record){
							console.log('tmsObjConXref lookup load complete')
							callback(null,true)
							return true
						}

						//map the array to obj
						var cObj = tmsUtils.mapObjConXrefCsvToJson(record)

						
						//make a smaller  obj for it
						var c = {
							consituentId : parseInt(cObj.ConstituentID),
							role : cObj.Role,
						}


						if (!tmsObjConXrefLookup[parseInt(cObj.ObjectID)]) tmsObjConXrefLookup[parseInt(cObj.ObjectID)] = []

						tmsObjConXrefLookup[parseInt(cObj.ObjectID)].push(JSON.parse(JSON.stringify(c)))

						recordCb()
					})




				}else{

					//just load the data in
					tmsObjConXrefLookup = JSON.parse(data.toString())
					callback(null,false)
					

				}


				
			})

		},


		//these are the two small files that don't need to be resaved for later
		tmsDepartmentsLookup: function(callback){

			console.log('Starting tmsDepartments lookup load')
			
			//build it
			//load the alt number lookup with key on object id

			file.streamCsvFile(tmsDepartments, {}, function(record,recordCb){
				if (!record){
					console.log('tmsDepartments lookup load complete')
					callback(null,true)
					return true
				}
				tmsDepartmentsLookup[parseInt(record[0])] = record[1].trim()			
				recordCb()
			})
		},

		//these are the two small files that don't need to be restored for later
		tmsClassificationLookup: function(callback){

			console.log('Starting tmsClassification lookup load')
			
			//build it
			//load the alt number lookup with key on object id
			file.streamCsvFile(tmsClassification, {}, function(record,recordCb){
				if (!record){
					console.log('tmsClassification lookup load complete')
					callback(null,true)
					return true
				}
				tmsClassificationLookup[parseInt(record[0])] = record[1].trim()			
				recordCb()
			})
		}

	},

	function(err, results) {
	


		//write these out for later
		for (var x in results){			
			//did it create it from the extracts?
			if (results[x]){
				fs.writeFile(__dirname + '/../data/tmp_' + x, JSON.stringify(writeOutLookup[x],null,2), function(err) {
					if(err) {
						return console.log(err);
					}				
				})
			}
		}



		//okay we have all the data we need lets parse the objects file

		//set the stage
		db.prepareIngestTmsObject(function(){
			
			var rolesObjects = {}, rolesAgents = {}

			//find out how many lines there are
			exec('wc -l ' + tmsObjects, function (error, results) {

				var totalLines = results.trim().split(" ")[0]
				var totalInserted = 0

				var previousPercent = -1;

				if (isNaN(totalLines)) totalLines = 0
				totalLines = parseInt(totalLines)

				var exampleRecord = {}

				//get a db cursor to insert on
				db.returnCollection("tmsObjects",function(err,collection,database){

					//load the file and stream it
					file.streamCsvFile(tmsObjects, {}, function(record,recordCb){

						if (!record){					
							//done, close our pointer but let anything finish up so it doesn't complain aobut closed connections
							setTimeout(function(){
								database.close()
								if (cb) cb()
							},500)					
							return true;					
						}

						var obj = tmsUtils.mapObjectCsvToJson(record)

						var objectDb = parseInt(obj.ObjectID)
						

						if (!isNaN(objectDb)){

							var insert = {
								_id : objectDb,
								objectID : objectDb,
								title : false,
								titleAlt : false,
								objectNumber : false,

								callNumber : false,
								acquisitionNumber : false,
								imageId : false,
								lcc : false,
								classmark : false

							}

							insert.materialTypeId = parseInt(obj.ClassificationID)
							insert.materialType = tmsClassificationLookup[parseInt(obj.ClassificationID)]


							//first lets get possible titles
							if (tmsTitlesLookup[objectDb]){

								insert.titleAlt = []

								for (var x in tmsTitlesLookup[objectDb]){
									insert.titleAlt.push(tmsTitlesLookup[objectDb][x].replace(/"/gi,''))
								}

							}

							if (obj.Title) insert.title = capitalizeFirstLetter(obj.Title.toLowerCase())

							if (obj.ObjectNumber) insert.objectNumber = obj.ObjectNumber.trim()

							//lets find possible other ids //108 === objects tables only here
							for (var x in tmsAltNumLookup[objectDb + '-108'] ){

								var id = tmsAltNumLookup[objectDb + '-108'][x];

								// if (!rolesObjects[id.type.toLowerCase()]) rolesObjects[id.type.toLowerCase()] = 0
								// rolesObjects[id.type.toLowerCase()]++

								if (id.type.toLowerCase() === 'catalog number'){
									if (id.value) insert.callNumber = id.value.trim()
								}
								if (id.type.toLowerCase() === 'acquisition number'){
									if (id.value) insert.acquisitionNumber = id.value.trim()
								}
								if (id.type.toLowerCase() === 'digital id'){
									if (id.value) insert.imageId = id.value.trim()									
								}
								if (id.type.toLowerCase() === 'library of congress call number'){
									if (id.value) insert.lcc = id.value.trim()									
								}							
								if (id.type.toLowerCase() === 'classmark'){
									if (id.value) insert.classmark = id.value.trim()
								}

							}

							insert.agents = []


							//pull out the agents and their roles
							for (var x in tmsObjConXrefLookup[objectDb] ){
								var r =   tmsObjConXrefLookup[objectDb][x].role.toLowerCase()
								var cId = tmsObjConXrefLookup[objectDb][x].consituentId

								//grab the real info from the consituents tables
								if (tmsConsituentsLookup[cId]){
									var agent = tmsConsituentsLookup[cId]
									agent.role = r


									//check if they have ids in the AltNum tables 23 === the consitutents tables
									for (var x in tmsAltNumLookup[cId + '-23'] ){

										var id = tmsAltNumLookup[cId + '-23'][x]


										if (id.type.toLowerCase() === 'ulan id'){
											agent.ulan = id.value
										}
										if (id.type.toLowerCase() === 'wikipedia'){
											agent.wikipedia = id.value
										}
										if (id.type.toLowerCase() === 'viaf'){
											agent.viaf = id.value
										}
										if (id.type.toLowerCase() === 'lccn'){
											agent.lccn = id.value
										}
										if (id.type.toLowerCase() === 'worldcat id'){
											agent.worldcatId = id.value
										}
										if (id.type.toLowerCase() === 'picid'){
											agent.picid = id.value
										}

										
										// if (!rolesAgents[id.type.toLowerCase()]) rolesAgents[id.type.toLowerCase()] = 0
										// rolesAgents[id.type.toLowerCase()]++


									}

									insert.agents.push(agent)

								}
							}

							//it is a pictire unless it is a print
							insert.division = "PHG"
							if (parseInt(obj.DepartmentID) === 2) insert.division = "PRN"


							insert.dates=[]

							if (obj.DateBegin){

								insert.dates.push({

									field: 'inclusive',
									type: false,
									value : (!isNaN(parseInt(obj.DateBegin))) ? parseInt(obj.DateBegin) : obj.DateBegin,
									keyDate: false,
									point: "start",
									encoding: false

								})
							}


							if (obj.DateEnd){

								insert.dates.push({

									field: 'inclusive',
									type: false,
									value: (!isNaN(parseInt(obj.DateEnd))) ? parseInt(obj.DateEnd) : obj.DateEnd,
									keyDate: false,
									point: "end",
									encoding: false

								})
							}

							if (obj.Dated){

								insert.dates.push({

									field: 'free',
									type: false,
									value: obj.Dated,
									keyDate: false,
									point: "exact",
									encoding: false

								})
							}


							var notesFields = ['Medium','Dimensions','Signed','Inscribed','Markings','CreditLine','Chat','Description','Exhibitions','Provenance','PubReferences','Notes','CuratorialRemarks','RelatedWorks','Portfolio','State','CatRais','HistAttributions','Bibliography','Edition','PaperSupport','DateRemarks']

							//notes of various types
							insert.notes = []


							for (var x in notesFields){

								if (obj[notesFields[x]]){
									if (obj[notesFields[x]].trim() != ''){

										insert.notes.push({
												type: notesFields[x].toLowerCase(),
												value: obj[notesFields[x]]
											}
										)
									}
								}
							}



							
							collection.insert(insert, function(err, result) {		

								if (err){
									errorLib.error("tmsObjects collection ingest - error inserting record",err)
								}else{
									totalInserted++
								}					

								var percent = Math.floor(totalInserted/totalLines*100)
								
								if (percent > previousPercent){
									previousPercent = percent
									if (process.stdout.cursorTo){
										process.stdout.cursorTo(0)
										process.stdout.write(clc.black.bgYellowBright("tmsObjects Collection: " + percent + "%"))
									}
								}		
							})

							

						}
						

						//okay next one please
						recordCb()



					})

				})

			})

		})




	});	


}
