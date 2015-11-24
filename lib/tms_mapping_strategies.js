"use strict"

var file = require("../lib/file.js")
var config = require("config")
var utils = require("../lib/utils.js")
var db = require("../lib/db.js")
var errorLib = require("../lib/error.js")
var clc = require('cli-color')
var async = require("async")
var removeDiacritics = require('diacritics').remove

require("string_score")

var exports = module.exports = {};


exports.tmsBnumberToMmsBnumber = function(cb){

	var count = 0, countFound = 0, countAlreadyMatched = 0, mmsCollectionsCount = {}

	db.returnCollection("mmsCollections",function(err,mmsCollections,mmsDatabase){

		db.returnCollection("mmsItems",function(err,mmsItems,mmsItemsDatabase){	

			db.returnCollection("tmsObjects",function(err,tmsObjects,tmsObjectsDatabase){

				var cursor = tmsObjects.find({ bNumber: { $exists: true }})

				var test = {}
				
				cursor.on('data', function(object) {

					process.stdout.cursorTo(0)
					process.stdout.write(clc.black.bgGreenBright("" + count + " | countFound: " + countFound + " countAlreadyMatched: " + countAlreadyMatched ))

					cursor.pause()

					count++



					if (object.bNumber){


						mmsCollections.find({ bNumber: 'b'+object.bNumber }).toArray(function(err,rows){

							if (rows.length>0){	

								var collectionUuid = rows[0]._id

								if (!mmsCollectionsCount[collectionUuid]){
									mmsCollectionsCount[collectionUuid] = {
										title: rows[0].title,
										count : 0,
										mmsItems: []
									}
								}


								//load the collection items and try to find a match for this one
								async.series({
									buildMmsItems: function(callback){
										if (mmsCollectionsCount[collectionUuid].mmsItems.length==0){
											mmsItems.find({ collectionUuid: collectionUuid }).toArray(function(err,itemRows){
												mmsCollectionsCount[collectionUuid].mmsItems = itemRows
												callback()
											})
										}else{
											callback()
										}
									}
								},

								function(err, results) {

									var bestMatch = {}

									mmsCollectionsCount[collectionUuid].mmsItems.forEach(function(item){
										bestMatch[item._id] = {
											title: item.title,
											score: object.title.score(item.title, 0.5)
										}
									})

									console.log("-----------")
									console.log(object.title)
									


									var bestScore = -1, bestMatchId = false
									for (var x in bestMatch){
										if (!bestMatch[x].bestMatched){
											if (bestMatch[x].score>bestScore){
												bestMatchId = x
												bestScore = bestMatch[x].score
											}
										}
									}

									if (bestScore>0.4){

										console.log("Best Matcj:")
										console.log(bestMatch[bestMatchId])
										bestMatch[bestMatchId].bestMatched = true

										test[bestMatch[bestMatchId].title] = object.title



									}else{

										console.log("No best match!", collectionUuid)

									}




									mmsCollectionsCount[collectionUuid].count++

									if (object.matchedMms) countAlreadyMatched++	

									cursor.resume()
									countFound++


								})



							}else{

								cursor.resume()
							}


						})





					}






				})


				cursor.once('end', function() {
						
					setTimeout(function(){
						console.log("tmsBnumberToMmsBnumber - Done!")

						console.log(JSON.stringify(test,null,2))
						

						cb()
						tmsObjectsDatabase.close()
						mmsDatabase.close()
						mmsItemsDatabase.close()

					},5000)

				})


			})

		})
	
	})


}





exports.accessionToCallnumber = function(cb){

	var count = 0, countFound = 0, callLookup = [], callObject = {}, bNumberLookup = {}


	db.returnCollection("shadowcatMaterialKLookup",function(err,shadowcatMaterialKLookup,shadowcatMaterialKLookupDatabase){




		//build a big list of the possible call numbers
		var cursor = shadowcatMaterialKLookup.find({})
		
		cursor.on('data', function(bib) {

			if (bib['sc:callnumber']) {

				bib['sc:callnumber'].map(function(c){

					if (c.search(/[0-9]+ph/i)>-1){
						callLookup.push(c)
						bNumberLookup[c] = bib._id
					}else{
						callObject[utils.normalizeAndDiacritics(c)] = 0
						bNumberLookup[utils.normalizeAndDiacritics(c)] = bib._id
					}

				})




			}



		})


		cursor.once('end', function() {



			console.log("Loaded: ",callLookup.length," number of call numbers.")



			db.returnCollection("tmsObjects",function(err,tmsObjects,tmsObjectsDatabase){

				var cursor = tmsObjects.find({})
				
				cursor.on('data', function(object) {

					process.stdout.cursorTo(0)
					process.stdout.write(clc.black.bgGreenBright("" + count + " | countFound: " + countFound ))



					count++

					if (object.callNumber){

						var call = utils.normalizeAndDiacritics(object.callNumber)


						if (typeof callObject[call] != 'undefined'){

							callObject[call]++
							countFound++

							//add it to the TMS record

							if (bNumberLookup[call]){

								cursor.pause()

								var update = {
									_id: object._id,
									bNumber: bNumberLookup[call]
								}

								tmsObjects.update({_id: update._id}, { $set :update }, function(err,results){
									if (err) console.log(err)
									cursor.resume()
								})
								
								return

							}




						}

						


					}


					
					if (object.acquisitionNumber){

						var a = object.acquisitionNumber.split('.')[0]

						if (a.search(/\*/)>-1) return
						if (a.search(/test/i)>-1) return

						try{
							var regex = new RegExp(a,"gi");
						}catch (e){
							return
						}

						cursor.pause()


						//callLookup.map(function(calls){
							callLookup.map(function(c){
								if (c.search(regex)>-1){
									countFound++


									cursor.pause()

									var update = {
										_id: object._id,
										bNumber: bNumberLookup[c]
									}


									tmsObjects.update({_id: update._id}, { $set :update }, function(err,results){
										if (err) console.log(err)
										cursor.resume()
									})
								



								}
							})
						//})

						cursor.resume()
				
		


					}




				})


				cursor.once('end', function() {
						
					setTimeout(function(){
						console.log("accessionToCallnumber - Done!")

						// for (var x in callObject){
						// 	if (callObject[x] > 0){
						// 		console.log(x,callObject[x])
						// 	}
						// }
						

						cb()
						tmsObjectsDatabase.close()
						shadowcatMaterialKLookupDatabase.close()

					},5000)

				})


			})




		})



	})



}

exports.buildShadowcatMaterialKLookup = function(cb){

	var count = 0, countFound = 0
	db.returnCollection("shadowcatMaterialKLookup",function(err,shadowcatMaterialKLookup,shadowcatMaterialKLookupDatabase){


		//set the index on the fields we need for the lookup
		shadowcatMaterialKLookup.createIndex('sc:callnumber', {background: true})

		shadowcatMaterialKLookup.remove({},function(err,results){

			db.returnCollectionShadowcat("bib",function(err,shadowcatBib,shadowcatDatabase){


				var cursor = shadowcatBib.find({},{'sc:callnumber':1, 'fixedFields.30':1})
				
				cursor.on('data', function(bib) {
					
					
					if (bib.fixedFields){
						if (bib.fixedFields['30']){

							if (bib.fixedFields['30'].value){

								if (bib.fixedFields['30'].value.trim() === 'k'){

									shadowcatMaterialKLookup.insert(bib,function(err,results){
										cursor.resume()
									})
									countFound++
								}
							}
						}
					}

					count++

					process.stdout.cursorTo(0)
					process.stdout.write(clc.black.bgGreenBright("" + count + " | countFound: " + countFound ))

				})


				cursor.once('end', function() {
						
					setTimeout(function(){
						console.log("buildShadowcatMaterialKLookup - Done!")

						cb()
						shadowcatMaterialKLookupDatabase.close()
						shadowcatDatabase.close()

					},5000)

				})




			})

		})

	})


}









