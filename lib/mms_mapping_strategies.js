"use strict"

var file = require("../lib/file.js")
var config = require("config")
var utils = require("../lib/utils.js")
var mmsUtils = require("../lib/mms_utils.js")
var db = require("../lib/db.js")
var errorLib = require("../lib/error.js")
var exec = require('child_process').exec
var clc = require('cli-color')
var async = require("async")
var removeDiacritics = require('diacritics').remove

require("string_score")

var exports = module.exports = {};



//To Archives

exports.mapCollectionsToArchivesCollections = function(cb){

	//try to find collection matches based on bnumber/mss col, archives ids, etc

	db.returnCollectionRegistry("mmsCollections",function(err,mmsCollections,mmsDatabase){

		db.returnCollectionRegistry("archivesCollections",function(err,archiveCollections,archivesDatabase){

			mmsCollections.find({}).toArray(function(err, mmsCollectionAry) {

				var found = 0, total = mmsCollectionAry.length

				var processCollection = function(){

					if (!mmsCollectionAry[0]){


						cb()
						console.log("done")
							

						return true

					}

					var mss = (mmsCollectionAry[0].mss) ? mmsCollectionAry[0].mss : -1000
					var bNumber = (mmsCollectionAry[0].bNumber) ? mmsCollectionAry[0].bNumber : "Not a b number"
					var callNumber = (mmsCollectionAry[0].callNumber) ? mmsCollectionAry[0].callNumber : "this is not a call number"



					archiveCollections.find( { $or : [{ bNumber : bNumber }, {mss :  parseInt(mss) }] }).toArray(function(err, archiveCollectionAry) {

						if (archiveCollectionAry.length > 0){


							//update the MMS record saying it is matched and give the uuid and mmsDb
							var update = {
								_id: mmsCollectionAry[0]._id,
								matchedArchives: true,
								matchedArchivesType : "identifier",
								archivesCollectionDb: archiveCollectionAry[0]._id
							}

							mmsCollections.update({ _id : update._id }, { $set: update }, function(err, result) {
								if (err) console.log(err)		
							})

							var update = {
								_id: archiveCollectionAry[0]._id ,
								matchedMms: true,
								matchedMmsType : "identifier",
								mmsUuid: mmsCollectionAry[0]._id
							}

							archiveCollections.update({ _id : update._id }, { $set: update }, function(err, result) {
								if (err) console.log(err)


								mmsCollectionAry.shift()
								processCollection()
							})



						}else{

							//could not find a hit on bnumber or mss number, try call number number

							archiveCollections.find( {callNumber :  callNumber} ).toArray(function(err, archiveCollectionAry) {
								
								var use = false

								if (archiveCollectionAry.length == 1){		
									use = archiveCollectionAry[0]
								}else if (archiveCollectionAry.length > 1){	

									for (var x in archiveCollectionAry){
										if (utils.percentOverlap( mmsCollectionAry[0].title, archiveCollectionAry[x].title) > 75){
											use = archiveCollectionAry[x]
										}
									}
								}

								if (use){
									var update = {
										_id: mmsCollectionAry[0]._id,
										matchedArchives: true,
										matchedArchivesType : "title",
										archivesCollectionDb: use._id
									}

									//update mms 
									mmsCollections.update({ _id : update._id }, { $set: update }, function(err, result) {
										if (err) console.log(err)	

										var update = {
											_id: use._id,
											matchedMms: true,
											matchedMmsType : "title",
											mmsUuid: mmsCollectionAry[0]._id
										}

										//update archives
										archiveCollections.update({ _id : update._id }, { $set: update }, function(err, result) {
											if (err) console.log(err)	

											mmsCollectionAry.shift()
											processCollection()

										})
									})
								}else{
									mmsCollectionAry.shift()
									processCollection()
								}


							})



						}




					})




					




				}



				processCollection()


			})
		})
	})



}



exports.mapCollectionsToArchivesCollectionsTitleMatch = function(cb){


	db.returnCollectionRegistry("mmsCollections",function(err,mmsCollections,mmsDatabase){

		db.returnCollectionRegistry("archivesCollections",function(err,archiveCollections,archivesDatabase){

			var archivesDivs = []
			//get all the possible archives divisions 
			for (var x in config['MMSDivisions']['divisions']){

				if (config['MMSDivisions']['divisions'][x].processArchivesCollections){
					archivesDivs.push(x.toUpperCase())
				}

			}
		
			mmsCollections.find({  

				$and: [

					{bNumber : false },

					{matchedArchives : { $ne: true } },
					
					{$or : [
						{ divisions : { $in: archivesDivs }  },
						{ divisions : { $size: 0 }  }
					]}

				]

			 }).toArray(function(err, mmsCollectionAry) {


			 	archiveCollections.find({}, {title: 1}).toArray(function(err, archiveCollectionAry) {

		 			for (var m in mmsCollectionAry){

		 				var mTitle = mmsCollectionAry[m].title

				 		for (var a in archiveCollectionAry){

				 			var aTitle = archiveCollectionAry[a].title			 				

			 				if (utils.percentOverlap( aTitle, mTitle) > 75){

			 					//looks okay, lets flag that we are doing this though
			 					errorLib.error("Warning: MMS <-> Archives Collections, title match - assuming ", aTitle + " (archives title) is matched to " + mTitle + " (mms title)")
			 					if (aTitle.score(mTitle, 0.5) < 0.2){
			 						errorLib.error("EXTRA Warning: MMS <-> Archives Collections, title match - assuming ", aTitle + " (archives title) is matched to " + mTitle + " (mms title) low cosine similarity")
			 					}

			 					//update both systems
								var update = {
									_id: mmsCollectionAry[0]._id,
									matchedArchives: true,
									matchedArchivesType : "title",
									archivesCollectionDb: archiveCollectionAry[a]._id
								}

								//update mms 
								mmsCollections.update({ _id : update._id }, { $set: update }, function(err, result) {
									if (err) console.log(err)	

									var update = {
										_id: archiveCollectionAry[a]._id,
										matchedMms: true,
										matchedMmsType : "title",
										mmsUuid: mmsCollectionAry[0]._id
									}

									//update archives
									archiveCollections.update({ _id : update._id }, { $set: update }, function(err, result) {
										if (err) console.log(err)	
									})
								})

			 				}

			 			}

			 		}


			 		console.log("done")

			 		cb()



			 	})


			})


		})


	})




}



exports.mapItemCollectionsToArchivesCollectionsIdentifiers = function(cb){


	db.returnCollectionRegistry("mmsItems",function(err,mmsItems,mmsDatabase){

		db.returnCollectionRegistry("archivesCollections",function(err,archiveCollections,archivesDatabase){


			 	mmsItems.find({ collectionUuid : false}).toArray(function(err, mmsItemsAry) {

			 		var process = function(){

						if (!mmsItemsAry[0]){
							cb()
							console.log("done")
							return true
						}


						var mss = (mmsItemsAry[0].mss) ? mmsItemsAry[0].mss : -1000
						var bNumber = (mmsItemsAry[0].bNumber) ? mmsItemsAry[0].bNumber : "Not a b number"
						var callNumber = (mmsItemsAry[0].callNumber) ? mmsItemsAry[0].callNumber : "this is not a call number"



			 			archiveCollections.find( { $or : [{ bNumber : bNumber }, {mss :  parseInt(mss) }] }).toArray(function(err, archiveCollectionAry) {

			 				if (archiveCollectionAry.length > 0){

			 					console.log(archiveCollectionAry[0].title, mmsItemsAry[0].bNumber, "\n", mmsItemsAry[0].title,parseInt(mmsItemsAry[0].mss))


			 					//update both systems
								var update = {
									_id: mmsItemsAry[0]._id,
									matchedArchives: true,
									matchedArchivesType : "identifier",
									archivesCollectionDb: archiveCollectionAry[0]._id
								}

								//update mms 
								mmsItems.update({ _id : update._id }, { $set: update }, function(err, result) {
									if (err) console.log(err)	

									var update = {
										_id: archiveCollectionAry[0]._id,
										matchedMms: true,
										matchedMmsType : "identifier",
										mmsUuid: mmsItemsAry[0]._id
									}

									//update archives
									archiveCollections.update({ _id : update._id }, { $set: update }, function(err, result) {
										if (err) console.log(err)	
									})
								})

								mmsItemsAry.shift()
								process()

			 				}else{
								mmsItemsAry.shift()
								process()
			 				}

			 			})

			 		}

					process()
			 		
			 	})



		})

	})

}




exports.mapItemsToArchivesComponentsByIdentifiers = function(cb){

	//try to find collection matches based on bnumber/mss col, archives ids, etc

	db.returnCollectionRegistry("mmsItems",function(err,mmsItems,mmsDatabase){

		db.returnCollectionRegistry("archivesComponents",function(err,archivesComponents,archivesDatabase){

			var totalItems = 1, count = 0, percentDone = 0

			mmsItems.count(function(err, result){
				totalItems = result
			})


			var cursor = mmsItems.find({})

			cursor.on('data', function(item) {

				cursor.pause()
				

				var mss = (item.mss) ? item.mss : -1000
				var bNumber = (item.bNumber) ? item.bNumber : "Not a b number"
				var callNumber = (item.callNumber) ? item.callNumber : "this is not a call number"

				archivesComponents.find( { $or : [{ bNumber : bNumber }, {mss :  parseInt(mss) }] }).toArray(function(err, archivesComponentsAry) {

					if (!archivesComponentsAry) return false

					count++


					if (Math.floor(count/totalItems*100) != percentDone){
						process.stdout.cursorTo(0)
						process.stdout.write(clc.black.bgYellowBright("MMS Item Map: " + percentDone + "%"))
						percentDone = Math.floor(count/totalItems*100)
					}

					if (archivesComponentsAry.length > 0){


						if (archivesComponentsAry.length > 1){
							errorLib.error("Warning: MMS <-> Archives Items, multi ident match for: ", "mss: " + mss + " or bNumber: " + bNumber )
						}


						var update = {
							_id: item._id,
							matchedArchives: true,
							matchedArchivesType : "identifier",
							archivesComponentDb: archivesComponentsAry[0]._id
						}

						//update mms 
						mmsItems.update({ _id : update._id }, { $set: update }, function(err, result) {
							if (err) console.log(err)	

							var update = {
								_id: archivesComponentsAry[0]._id,
								matchedMms: true,
								matchedMmsType : "identifier",
								mmsUuid: item._id
							}

							//update archives
							archivesComponents.update({ _id : update._id }, { $set: update }, function(err, result) {
								if (err) console.log(err)	

								cursor.resume()

							})

						})
					

					}else{


						cursor.resume()

					}

				})



				


			});



			cursor.once('end', function() {
				console.log("done")
				if (cb) cb()
			});


		})
	})

}

exports.mapContainersToArchivesComponentsByIdentifiers = function(cb){

	//try to find collection matches based on bnumber/mss col, archives ids, etc

	db.returnCollectionRegistry("mmsContainers",function(err,mmsContainers,mmsDatabase){

		db.returnCollectionRegistry("archivesComponents",function(err,archivesComponents,archivesDatabase){

			var totalItems = 1, count = 0, percentDone = 0

			mmsContainers.count(function(err, result){
				totalItems = result
			})


			var cursor = mmsContainers.find({})

			cursor.on('data', function(item) {

				cursor.pause()
				

				var mss = (item.mss) ? item.mss : -1000
				var bNumber = (item.bNumber) ? item.bNumber : "Not a b number"
				var callNumber = (item.callNumber) ? item.callNumber : "this is not a call number"

				archivesComponents.find( { $or : [{ bNumber : bNumber }, {mss :  parseInt(mss) }] }).toArray(function(err, archivesComponentsAry) {

					if (!archivesComponentsAry) return false

					count++


					if (Math.floor(count/totalItems*100) != percentDone){
						process.stdout.cursorTo(25)
						process.stdout.write(clc.black.bgYellowBright("MMS Container Map: " + percentDone + "%"))
						percentDone = Math.floor(count/totalItems*100)
					}

					if (archivesComponentsAry.length > 0){


						if (archivesComponentsAry.length > 1){
							errorLib.error("Warning: MMS <-> Archives Container, multi ident match for: ", "mss: " + mss + " or bNumber: " + bNumber )
						}


						var update = {
							_id: item._id,
							matchedArchives: true,
							matchedArchivesType : "identifier",
							archivesComponentDb: archivesComponentsAry[0]._id
						}

						//update mms 
						mmsContainers.update({ _id : update._id }, { $set: update }, function(err, result) {
							if (err) console.log(err)	

							var update = {
								_id: archivesComponentsAry[0]._id,
								matchedMms: true,
								matchedMmsType : "identifier",
								mmsUuid: item._id
							}

							//update archives
							archivesComponents.update({ _id : update._id }, { $set: update }, function(err, result) {
								if (err) console.log(err)	

								cursor.resume()

							})

						})
					

					}else{


						cursor.resume()

					}

				})



				


			});



			cursor.once('end', function() {					
				console.log("done")
				if (cb) cb()
			})


		})
	})

}


exports.mapItemsToComponentsByRepoObjectTable = function(cb){

	db.returnCollectionRegistry("mmsItems",function(err,mmsItems,mmsDatabase){

		db.returnCollectionRegistry("mmsContainers",function(err,mmsContainers,mmsDatabase2){	

			db.returnCollectionRegistry("archivesComponents",function(err,archivesComponents,archivesDatabase){

			
				var cols = ["id","describable_id","describable_type","uuid","resource_type","total_captures","capture_ids","sib_seq","created_at","updated_at"]
				var filePath =  __dirname + '/..' + config['Source']['archivesRepoObjects']

				var count = 0, otherCount = 0

				file.streamCsvFile(filePath, function(record,recordCb){

					if (!record){					

						if (cb) cb(null,true)
						console.log("Done")	

						return true			
					}

					var repoObj = {}
					for (var x in record){
						repoObj[cols[x]] = record[x]
					}

					//see if it is already mapped
					if (repoObj.describable_type == 'Component'){

						archivesComponents.find( { _id : parseInt(repoObj.describable_id) } ).toArray(function(err, archivesComponentsAry) {

							archivesComponentsAry = archivesComponentsAry[0]

							if (!archivesComponentsAry.matchedMms){

								//now see if it is a real mms item
								mmsItems.find( { _id : repoObj.uuid } ).toArray(function(err, mmsItemsAry) {

									if (mmsItemsAry[0]){

										count++

										mmsItemsAry=mmsItemsAry[0]

										process.stdout.cursorTo(50)
										process.stdout.write(clc.black.bgYellowBright("Archives UUID Map: " + count + " matches"))

										//update the records

										var update = {
											_id: mmsItemsAry._id,
											matchedArchives: true,
											matchedArchivesType : "uuid",
											archivesComponentDb: archivesComponentsAry._id
										}

										//update mms 
										mmsItems.update({ _id : update._id }, { $set: update }, function(err, result) {
											if (err) console.log(err)	

											var update = {
												_id: archivesComponentsAry._id,
												matchedMms: true,
												matchedMmsType : "uuid",
												mmsUuid: mmsItemsAry._id
											}

											//update archives
											archivesComponents.update({ _id : update._id }, { $set: update }, function(err, result) {
												if (err) console.log(err)	

												recordCb()

											})

										})
									

									}else{

										

										mmsContainers.find( { _id : repoObj.uuid } ).toArray(function(err, mmsContainersAry) {

											if (mmsContainersAry.length>0){


												mmsContainersAry = mmsContainersAry[0]
		
												//map to eachother at the container component level and then update all the items to point to the archives component
												var mmsContainersUpdate = {
													mmsUuid : mmsContainersAry._id,
													matchedArchives: true,
													matchedArchivesType : "uuid",
													archivesComponentDb: parseInt(repoObj.describable_id),
												}


												//update mms 
												mmsContainers.update({ _id : mmsContainersUpdate.mmsUuid }, { $set: mmsContainersUpdate }, function(err, result) {
													
													if (err) console.log(err)	

													var archivesUpdate = {
														_id: parseInt(repoObj.describable_id),
														matchedMms: true,
														matchedMmsType : "uuid",
														mmsUuid: mmsContainersAry._id
													}



													//update archives
													archivesComponents.update({ _id : archivesUpdate._id }, { $set: archivesUpdate }, function(err, result) {
														if (err) console.log(err)	

														var updateComponents = {
															matchedArchives: true,
															matchedArchivesType : "uuid",
															archivesComponentDb: parseInt(repoObj.describable_id)
														}

														//do a multi update for all the items 
														mmsItems.update({ containerUuid : repoObj.uuid }, { $set: updateComponents }, { multi: true }, function(err, result) {


															if (err) console.log(err)

															recordCb()

														})


													})

												})


											}else{

												recordCb()

											}

										})


									}
								})
							}else{
								recordCb()
							}					
						})
					}else{
						recordCb()
					}
				})

			})

		})


	})


}



exports.returnedMatchedMmsToArchivesCollections = function(cb){
	db.returnCollectionRegistry("mmsCollections",function(err,mmsCollections,mmsDatabase){		
		mmsCollections.find( { matchedArchives: true  }).toArray(function(err, mmsCollectionsAry) {
			cb(null,mmsCollectionsAry)
		})
	})
}

exports.returnMmsCollectionDetails = function(collectionObject,cb){


	db.returnDb(function(err, db){

		var mmsContainers = db.collection('mmsContainers')
		var mmsItems = db.collection('mmsItems')
		var archivesComponents = db.collection('archivesComponents')

		async.parallel({


			containerCount: function(callback){
				mmsContainers.find( {collectionUuid : collectionObject._id } ).count(function(err, count) {
					callback(null,count)							
				})
			},

			containerCountMatchedToArchives: function(callback){
				mmsContainers.find( {collectionUuid : collectionObject._id, matchedArchives: true } ).count(function(err, count) {
					callback(null,count)							
				})
			},					

			itemCount: function(callback){
				mmsItems.find( {collectionUuid : collectionObject._id } ).count(function(err, count) {
					callback(null,count)							
				})
			},

			itemCountMatchedToArchives: function(callback){
				mmsItems.find( {collectionUuid : collectionObject._id, matchedArchives: true,  } ).count(function(err, count) {
					callback(null,count)							
				})
			},

			seriesCount: function(callback){
				archivesComponents.find( { collectionDb : collectionObject.archivesCollectionDb, levelText: "series" } ).count(function(err, count) {
					callback(null,count)							
				})
			},

			seriesCountMatchedToMms: function(callback){
				archivesComponents.find( { collectionDb : collectionObject.archivesCollectionDb, levelText: "series", matchedMms :true } ).count(function(err, count) {
					callback(null,count)							
				})
			},

			componentCount: function(callback){
				archivesComponents.find( { collectionDb : collectionObject.archivesCollectionDb, levelText: { $ne : "series" } } ).count(function(err, count) {
					callback(null,count)							
				})
			},

			componentCountMatchedToMms: function(callback){
				archivesComponents.find( { collectionDb : collectionObject.archivesCollectionDb,  levelText: { $ne : "series" }, matchedMms :true } ).count(function(err, count) {
					callback(null,count)							
				})
			},

			mmsContainers: function(callback){
				mmsContainers.find(  {collectionUuid : collectionObject._id } ).toArray(function(err, mmsContainersAry) {
					callback(null,mmsContainersAry)
				})
			},		

			mmsItems: function(callback){
				mmsItems.find(  {collectionUuid : collectionObject._id } ).toArray(function(err, mmsItemsAry) {
					callback(null,mmsItemsAry)
				})
			},

			archivesComponents: function(callback){
				archivesComponents.find(  {collectionDb : collectionObject.archivesCollectionDb } ).toArray(function(err, archivesComponentsAry) {
					callback(null,archivesComponentsAry)
				})
			}
			




		},

		function(err, results) {
			cb(null, results)
			db.close()
		})

	})

}


exports.mapItemToComponent = function(data){

	for (var item in data.mmsItems){

		item = data.mmsItems[item]

		var bestMatch = { id: null, score: -1, title: "" }

		for (var component in data.archivesComponents){

			component = data.archivesComponents[component]

			var componentTitle = component.title
			

			if (componentTitle == '') componentTitle = false

			if (!componentTitle){
				componentTitle = component.dateStatement
				var componentTitleWithDate = componentTitle
			}else{
				if (component.dateStatement){
					var componentTitleWithDate = componentTitle + " " + component.dateStatement
				}else{
					var componentTitleWithDate = componentTitle
				}
			}


			var score = utils.compareNormalizedTitles(componentTitle,item.title,0.9)
			var scoreWithDate = utils.compareNormalizedTitles(componentTitleWithDate,item.title,0.9)


			if (scoreWithDate > score) score = scoreWithDate

			if (score > bestMatch.score){
				bestMatch.score = score
				bestMatch.id = component._id
				bestMatch.title = componentTitle
			}



		}

		console.log(item.title)
		console.log(bestMatch)


	}

	return bestMatch
}


exports.mapHierarchyByContainers = function(data){


	var warnings = []

	//build a map of the containers to see if they match up with the archives hierarchy
	var mmsTitleIndex = {}
	for (var x in data.mmsContainers){
		if (data.mmsContainers[x].title){
			mmsTitleIndex[data.mmsContainers[x]._id] = data.mmsContainers[x].title
		}else{
			mmsTitleIndex[data.mmsContainers[x]._id] = ""
		}
	}

	var mssContainerPaths = {}
	var mmsContainerLookup = {}
	for (var mmsContainer in data.mmsContainers){

		mmsContainer = data.mmsContainers[mmsContainer]

		mmsContainerLookup[mmsContainer._id] = mmsContainer

		var parents = []
		for (var x in mmsContainer.parents){

			var uuid = mmsContainer.parents[x]

			if (uuid != data.collection._id){
				if (!mmsTitleIndex[uuid]) console.log("Not in index, mmsContainer:",uuid,data.collection._id)
				parents.push(mmsTitleIndex[uuid])
			}


		}

		parents.unshift(mmsContainer.title)
		parents = parents.reverse()

		mssContainerPaths[mmsContainer._id] = parents
	
	}


	var itemsByContainer = {}
	var itemsLookup = {}
	var rootItems = []
	for (var mssItem in data.mmsItems){

		mssItem = data.mmsItems[mssItem]

		itemsLookup[mssItem._id] = mssItem

		if (mssItem.containerUuid){
			if (!itemsByContainer[mssItem.containerUuid]) itemsByContainer[mssItem.containerUuid] = []
			itemsByContainer[mssItem.containerUuid].push(mssItem)
		}else{
			rootItems.push(mssItem)
		}
	}

	var mmsItemPaths = {}

	//build the items map as well based off of the last container
	for (var uuid in mssContainerPaths){

		var items = itemsByContainer[uuid]

		for (var x in items){
			var containerPath = JSON.parse(JSON.stringify(mssContainerPaths[uuid]))

			if (items[x].title){
				containerPath.push(items[x].title)
				mmsItemPaths[items[x]._id] = containerPath
			}
		}
	}

	var archivesPaths = {}
	var archivesPathsWithDates = {}
	var componentMap = {}
	var archivesLookup = {}
	for (var x in data.archivesComponents){
		var archviesComponentData = data.archivesComponents[x]

		archivesLookup[archviesComponentData._id] = archviesComponentData
		
		if (!archviesComponentData.title && archviesComponentData.dateStatement){
			archviesComponentData.title = archviesComponentData.dateStatement
		}

		if (archviesComponentData.title){
			if (archviesComponentData.title.trim() == '' && archviesComponentData.dateStatement){
				archviesComponentData.title = archviesComponentData.dateStatement
			}



		}



		componentMap[data.archivesComponents[x].mssDb] = data.archivesComponents[x]
	}



	//now build a similar structure for the archvies component hiearchy
	for (var archviesComponent in data.archivesComponents){

		archviesComponentData = data.archivesComponents[archviesComponent]

		var path = []
		var pathWithDates = []


		//build teh complete recursive tree for thisone
		var recursiveThang = function(mssDb){
			path.push(componentMap[mssDb].title)

			pathWithDates.push( (componentMap[mssDb].dateStatement) ? componentMap[mssDb].title + " " + componentMap[mssDb].dateStatement : componentMap[mssDb].title )

			if (componentMap[mssDb].parentDb){
				recursiveThang(componentMap[mssDb].parentDb)
			}
		}
		recursiveThang(archviesComponentData.mssDb)
		path = path.reverse()

		archivesPaths[archviesComponentData.mssDb] = path
		archivesPathsWithDates[archviesComponentData.mssDb] = pathWithDates
	}

	var c = 0, cTotal = Object.keys(mmsItemPaths).length
	var itemMappings = {}, containerMappings = {}, subContainerUnableToMap = {}


	//lets compare the two hierachies first with the items path and archives path
	for (var mmsItemPath in mmsItemPaths){

		process.stdout.cursorTo(10)
		process.stdout.write(clc.black.bgYellowBright("Done: " + ++c + " of " + cTotal))

		var mmsIndex = mmsItemPath
		mmsItemPath = mmsItemPaths[mmsItemPath]

		for (var archivesPath in archivesPathsWithDates ){

			var archivesIndex = archivesPath
			archivesPath = archivesPathsWithDates[archivesPath]


	
			if (mmsItemPath.length == archivesPath.length){

				//now check if each of the hierarchies match at each level
				var passing = true
				var sofar = []

				for (var x = 0; x < mmsItemPath.length; x++){

					if (utils.compareNormalizedTitles(mmsItemPath[x],archivesPath[x],0.9) >= 0.7){
						//sofar.push(mmsItemPath[x])
						//console.log(sofar)

						passing = true
					}else{
						//console.log("\n")
						//console.log(mmsItemPath[x], "||",archivesPath[x],utils.compareNormalizedTitles(mmsItemPath[x],archivesPath[x],0.9))
						passing = false
						break
					}
				}

				if (passing){
					//console.log("-----------------------------")
					//console.log(mmsItemPath)
					//console.log("~~~~~~~~~")
					//console.log(archivesPath)
					itemMappings[mmsIndex] = archivesIndex
				}
			}
		}
	}

	
	var removeItems = Object.keys(itemMappings)
	
	//delete these from the items by components 
	//so if we map them over to the container level we do not include them
	for (var uuid in itemsByContainer){			
		for (var aItem in itemsByContainer[uuid]){
			if (removeItems.indexOf(itemsByContainer[uuid][aItem]._id) > -1){
				delete itemsByContainer[uuid][aItem]				
			}
		}
	}

	c = 0

	//try the same thing with archive title do not have the dates

	//lets compare the two hierachies first with the items path and archives path
	for (var mmsItemPath in mmsItemPaths){

		process.stdout.cursorTo(10)
		process.stdout.write(clc.black.bgYellowBright("Done: " + ++c + " of " + cTotal))

		var mmsIndex = mmsItemPath
		mmsItemPath = mmsItemPaths[mmsItemPath]

		for (var archivesPath in archivesPaths ){

			var archivesIndex = archivesPath
			archivesPath = archivesPaths[archivesPath]
	
			if (mmsItemPath.length == archivesPath.length){

				//now check if each of the hierarchies match at each level
				var passing = true
				var sofar = []

				for (var x = 0; x < mmsItemPath.length; x++){

					if (utils.compareNormalizedTitles(mmsItemPath[x],archivesPath[x],0.9) >= 0.7){
						//sofar.push(mmsItemPath[x])
						//console.log(sofar)
						passing = true
					}else{
						//console.log("\n")
						//console.log(mmsItemPath[x], "||",archivesPath[x],utils.compareNormalizedTitles(mmsItemPath[x],archivesPath[x],0.9))
						passing = false
						break
					}
				}

				if (passing){
					//console.log("-----------------------------")
					//console.log(mmsItemPath)
					//console.log("~~~~~~~~~")
					//console.log(archivesPath)
					itemMappings[mmsIndex] = archivesIndex
				}
			}
		}
	}

	var removeItems = Object.keys(itemMappings)
	
	//delete these from the items by components 
	//so if we map them over to the container level we do not include them
	for (var uuid in itemsByContainer){			
		for (var aItem in itemsByContainer[uuid]){
			if (removeItems.indexOf(itemsByContainer[uuid][aItem]._id) > -1){
				delete itemsByContainer[uuid][aItem]				
			}
		}
	}





	//lets compare the two hierachies of the containers 



	for (var mssContainerPath in mssContainerPaths){

		var mmsIndex = mssContainerPath

		mssContainerPath = mssContainerPaths[mssContainerPath]

		for (var archivesPath in archivesPathsWithDates ){
			
			var archivesIndex = archivesPath

			archivesPath = archivesPathsWithDates[archivesPath]		


			if (mssContainerPath.length == archivesPath.length){


				//now check if each of the hierarchies match at each level
				var passing = true
				var sofar = []

				for (var x = 0; x < mssContainerPath.length; x++){

					if (utils.compareNormalizedTitles(mssContainerPath[x],archivesPath[x],0.9) >= 0.75){
						//sofar.push(mssContainerPath[x])
						//console.log(sofar)
						passing = true
					}else{
						//console.log("\n")
						//console.log(mssContainerPath[x], "||",archivesPath[x],utils.compareNormalizedTitles(mssContainerPath[x],archivesPath[x],0.9))
						passing = false
						break
					}
				}

				if (passing){

					containerMappings[archivesIndex] = mmsIndex

					if (itemsByContainer[mmsIndex]){
						//console.log("-----------------------------",itemsByContainer[mmsIndex].length)
						//console.log(mssContainerPath)
						//console.log("~~~~~~~~~")
						//console.log(archivesPath)						


						itemsByContainer[mmsIndex]

						for (var y in itemsByContainer[mmsIndex]){
							//each one of these items mapps to the archival component and the component maps to the container
							var item = itemsByContainer[mmsIndex][y]
							itemMappings[item._id] = archivesIndex
						}

						
					}else{
						//console.log("--------------Does not contain any items---------------")
						//console.log(mssContainerPath)
						//console.log("~~~~~~~~~")
						//console.log(archivesPath)
						subContainerUnableToMap[mmsIndex] = { uuid: mmsIndex, archivesDb:archivesIndex,  depth : mssContainerPath.length }
					}					
				}
			}
		}
	}



	var removeItems = Object.keys(itemMappings)
	var deleteing = 0
	//delete these from the items by components 
	//so if we map them over to the container level we do not include them
	for (var uuid in itemsByContainer){			
		for (var aItem in itemsByContainer[uuid]){
			if (removeItems.indexOf(itemsByContainer[uuid][aItem]._id) > -1){
				deleteing++
				delete itemsByContainer[uuid][aItem]
			}
		}
	}


	//now without dates
	for (var mssContainerPath in mssContainerPaths){

		var mmsIndex = mssContainerPath

		mssContainerPath = mssContainerPaths[mssContainerPath]


		for (var archivesPath in archivesPaths ){
			
			var archivesIndex = archivesPath

			archivesPath = archivesPaths[archivesPath]		


			if (mssContainerPath.length == archivesPath.length){


				//now check if each of the hierarchies match at each level
				var passing = true
				var sofar = []

				for (var x = 0; x < mssContainerPath.length; x++){


					if (utils.compareNormalizedTitles(mssContainerPath[x],archivesPath[x],0.9) >= 0.75){
						//sofar.push(mssContainerPath[x])
						//console.log(sofar)
						passing = true
					}else{

						//be a litte more lax for the container matching
						if (utils.compareNormalizedTitles(mssContainerPath[x],archivesPath[x],0.9) >= 0.55){

							//flag it that it may be probalmatic, only the first time
							var warning = mssContainerPath[x] + " =? " + archivesPath[x] + " UUID:" + mmsIndex
							if (warnings.indexOf(warning) == -1){
								
								//errorLib.error("Warning: low confidence container match ", warning)
								warnings.push(warning)
							}
							passing = true

						}else{


							//console.log("\n")
							//console.log(mssContainerPath[x], "||",archivesPath[x],utils.compareNormalizedTitles(mssContainerPath[x],archivesPath[x],0.9))
							passing = false
							break

						}
					}
				}

				if (passing){

					containerMappings[archivesIndex] = mmsIndex

					if (itemsByContainer[mmsIndex]){
						//console.log("-----------------------------",itemsByContainer[mmsIndex].length)
						//console.log(mssContainerPath)
						//console.log("~~~~~~~~~")
						//console.log(archivesPath)


						for (var y in itemsByContainer[mmsIndex]){
							//each one of these items mapps to the archival component and the component maps to the container
							var item = itemsByContainer[mmsIndex][y]
							itemMappings[item._id] = archivesIndex
						}


					}else{
						//console.log("--------------Does not contain any items---------------")
						//console.log(mssContainerPath)
						//console.log("~~~~~~~~~")
						//console.log(archivesPath)
						subContainerUnableToMap[mmsIndex] = { uuid: mmsIndex, archivesDb:archivesIndex,  depth : mssContainerPath.length }
					}					
				}
			}
		}
	}


	var removeItems = Object.keys(itemMappings)
	var deleteing = 0
	//delete these from the items by components 
	//so if we map them over to the container level we do not include them
	for (var uuid in itemsByContainer){			
		for (var aItem in itemsByContainer[uuid]){
			if (removeItems.indexOf(itemsByContainer[uuid][aItem]._id) > -1){
				deleteing++
				delete itemsByContainer[uuid][aItem]
			}
		}
	}


	var sortable = [];
	for (var c in subContainerUnableToMap)
		sortable.push([subContainerUnableToMap[c].depth, subContainerUnableToMap[c]])
	
	sortable.sort(function(a, b) {return a[0] - b[0]}).reverse()



	//build a lookup of all the children
	var childrenContainers = {}
	for (var mmsContainer in data.mmsContainers){
		mmsContainer = data.mmsContainers[mmsContainer]
		if (mmsContainer.containerUuid){
			if (!childrenContainers[mmsContainer.containerUuid]) childrenContainers[mmsContainer.containerUuid] = []
			if (childrenContainers[mmsContainer.containerUuid].indexOf(mmsContainer._id)){
				if (mmsContainer.containerUuid != mmsContainer._id){
					childrenContainers[mmsContainer.containerUuid].push(mmsContainer._id)
				}
			}
			
		}

	}

	var containerToComponentMap = {}
	var closeMappings = 0
	
	
	//go through an resolve the deepest hiearchies first and remove them from the possible candiddates

	//find all the containers that are the children of this container
	for (var x in sortable){

		var thisUuid = sortable[x][1].uuid
		var thisArchivesIndex = sortable[x][1].archivesDb


		for (var mmsContainer in data.mmsContainers){

			mmsContainer = data.mmsContainers[mmsContainer]

			//id this conatiner a child of the one we are looping thorugh?

			if (childrenContainers[thisUuid].indexOf(mmsContainer._id) > -1){


				// //any subcontainer children items are now mine
				if (itemsByContainer[mmsContainer._id]){

					containerToComponentMap[mmsContainer._id] = thisArchivesIndex

					for (var item in itemsByContainer[mmsContainer._id]){
						item = itemsByContainer[mmsContainer._id][item]
						itemMappings[item._id] = thisArchivesIndex
						closeMappings++
					}

					var removeItems = Object.keys(itemMappings)
					var deleteing = 0
					//delete these from the items by components 
					//so if we map them over to the container level we do not include them
					for (var uuid in itemsByContainer){			
						for (var aItem in itemsByContainer[uuid]){
							if (removeItems.indexOf(itemsByContainer[uuid][aItem]._id) > -1){
								deleteing++
								delete itemsByContainer[uuid][aItem]
							}
						}
					}

				}

			}

		}

	}

	if (warnings.length>0){

		errorLib.error("Warning: low confidence container match ", warnings.join(" | "))

	}

	var results = { info : {totalItems: data.mmsItems.length, totalMapped : Object.keys(itemMappings).length, closeMapped : closeMappings, percentMapped: Math.floor(Object.keys(itemMappings).length / data.mmsItems.length * 100)}  }

	results.itemMap = []
	results.containerMapMerge = []
	results.containerMapInherit = []


	for (var uuid in itemMappings){
		var mssDb = itemMappings[uuid]
		//console.log("http://metadata.nypl.org/items/show/" + itemsLookup[uuid].mmsDb , "http://archives.nypl.org/detail/" + archivesLookup[mssDb].mss )
		results.itemMap.push( { uuid: uuid, mssDb: mssDb   } )
	}


	for (var mssDb in containerMappings){
		var uuid = containerMappings[mssDb]
		results.containerMapMerge.push( { uuid: uuid, mssDb: mssDb   } )
		//console.log("http://metadata.nypl.org/containers/show/" + mmsContainerLookup[uuid].mmsDb ,  "http://archives.nypl.org/detail/" + archivesLookup[mssDb].mss , mmsContainerLookup[uuid].title )

	}


	for (var uuid in containerToComponentMap){
		var mssDb = containerToComponentMap[uuid]
		//console.log("http://metadata.nypl.org/containers/show/" + mmsContainerLookup[uuid].mmsDb ,  "http://archives.nypl.org/detail/" + archivesLookup[mssDb].mss )
		results.containerMapInherit.push( { uuid: uuid, mssDb: mssDb   } )
	}









	//console.log(itemMappings)
	//console.log(itemMappings)
	//console.log(">>>>",Object.keys(itemMappings).length)
	
	//console.log(containerToComponentMap)
	//console.log(Object.keys(itemMappings).length,closeMappings)
	return results

}

exports.updateHierarchyMatches = function(data,cb){

	db.returnDb(function(err, db){

		var mmsContainers = db.collection('mmsContainers')
		var mmsItems = db.collection('mmsItems')
		var archivesComponents = db.collection('archivesComponents')



		async.series({

			itemMap: function(callback){

				async.each(data.itemMap, function(itemMap, eachCallback) {

					var update = {
						_id: itemMap.uuid,
						matchedArchives: true,
						matchedArchivesType : "hierarchyItem",
						archivesCollectionDb: itemMap.mssDb
					}

					mmsItems.update({ _id : update._id }, { $set: update }, function(err, result) {
						if (err) console.log(err)

						var archivesUpdate = {
							_id: parseInt(itemMap.mssDb),
							matchedMms: true,
							matchedMmsType: "hierarchyItem",
							mmsUuid: itemMap.uuid
						}

						archivesComponents.update({ _id : archivesUpdate._id }, { $set: archivesUpdate }, function(err, result) {
							if (err) console.log(err)
							eachCallback()	
						})


					})

				}, function(err){
				   	if (err) console.log(err)
				   	//done
					callback()

				})

			},


			containerMapMerge: function(callback){

				async.each(data.containerMapMerge, function(itemMap, eachCallback) {

					var update = {
						_id: itemMap.uuid,
						matchedArchives: true,
						matchedArchivesType : "containerMerge",
						archivesCollectionDb: itemMap.mssDb
					}

					mmsContainers.update({ _id : update._id }, { $set: update }, function(err, result) {
						if (err) console.log(err)

						var archivesUpdate = {
							_id: parseInt(itemMap.mssDb),
							matchedMms: true,
							matchedMmsType: "containerMerge",
							mmsUuid: itemMap.uuid
						}

						archivesComponents.update({ _id : archivesUpdate._id }, { $set: archivesUpdate }, function(err, result) {
							if (err) console.log(err)
							eachCallback()	
						})

					})



				}, function(err){
				   	if (err) console.log(err)
				   	//done
					callback()

				})

			},

			containerMapInherit: function(callback){

				async.each(data.containerMapInherit, function(itemMap, eachCallback) {

					var update = {
						_id: itemMap.uuid,
						matchedArchives: true,
						matchedArchivesType : "containerMulti",
						archivesCollectionDb: itemMap.mssDb
					}

					mmsContainers.update({ _id : update._id }, { $set: update }, function(err, result) {
						if (err) console.log(err)
					
						var archivesUpdate = {
							_id: parseInt(itemMap.mssDb),
							matchedMms: true,
							matchedMmsType: "containerMulti",
							mmsUuid: itemMap.uuid
						}

						archivesComponents.update({ _id : archivesUpdate._id }, { $set: archivesUpdate }, function(err, result) {
							if (err) console.log(err)
							eachCallback()	
						})
					})

				}, function(err){
				   	if (err) console.log(err)
				   	//done
					callback()
				})
			}
		},

		function(err, results) {
			console.log("done")
			cb(null, results)
			db.close()
		})

	})


}
















// TMS Mappings

exports.mapItemsToTmsObjectsByIdentifiers = function(cb){

	//try to find collection matches based on bnumber/mss col, archives ids, etc

	db.returnCollectionRegistry("mmsItems",function(err,mmsItems,mmsDatabase){

		db.returnCollectionRegistry("tmsObjects",function(err,tmsObjects,tmsDatabase){

			var totalItems = 1, count = 0, percentDone = 0, matched = 0

			mmsItems.count(function(err, result){
				totalItems = result
			})


			var cursor = mmsItems.find({})

			cursor.on('data', function(item) {

				cursor.pause()
				

				var tmsObject = (item.tmsObject) ? item.tmsObject : -1000
				var tmsId = (item.tmsId) ? item.tmsId : -1000
				var callNumber = (item.callNumber) ? item.callNumber : -1000

				tmsObjects.find( { $or : [{ objectNumber : tmsObject }, {callNumber :  callNumber }, {objectID :  parseInt(tmsId) }] }).toArray(function(err, tmsObjectAry) {


					if (!tmsObjectAry) return false

					count++


					if (Math.floor(count/totalItems*100) != percentDone){
						process.stdout.cursorTo(0)
						process.stdout.write(clc.black.bgYellowBright("tmsObjects Item Map: " + percentDone + "% " + matched))
						percentDone = Math.floor(count/totalItems*100)
					}

					if (tmsObjectAry.length > 0){

						matched++

						if (tmsObjectAry.length > 1){
							errorLib.error("Warning: MMS <-> TMS, multi ident match for: ", "tms: " + parseInt(tmsId) + " or tmsObject: " + tmsObject + " or callNumber: " + callNumber )
						}



						var updateMms = {
							_id: item._id,
							matchedTms: true,
							matchedTmsType : "identifier",
							tmsId: tmsObjectAry[0]._id
						}

						//update mms 
						mmsItems.update({ _id : updateMms._id }, { $set: updateMms }, function(err, result) {
							if (err) console.log(err)	

							var updateTms = {
								_id: tmsObjectAry[0]._id,
								matchedMms: true,
								matchedMmsType : "identifier",
								mmsUuid: item._id
							}

							//update archives
							tmsObjects.update({ _id : updateTms._id }, { $set: updateTms }, function(err, result) {
								if (err) console.log(err)
								cursor.resume()
							})
						})
					

					}else{

						cursor.resume()

					}

				})		


			})

			cursor.once('end', function() {
				console.log("done")
				cb()
			})

		})
	})

}





exports.mapItemsToTmsObjectsByImageId = function(cb){

	//try to find collection matches based on bnumber/mss col, archives ids, etc

	db.returnCollectionRegistry("mmsCaptures",function(err,mmsCaptures,mmsDatabase){

		db.returnCollectionRegistry("mmsItems",function(err,mmsItems,mmsDatabase2){

			db.returnCollectionRegistry("tmsObjects",function(err,tmsObjects,tmsDatabase){


				var totalItems = 1, count = 0, percentDone = 0, matched = 0

				tmsObjects.find({ imageId : { $ne : false } }).count(function(err, result){
					totalItems = result
				})


				var cursor = tmsObjects.find({ imageId : { $ne : false } })

				cursor.on('data', function(item) {

					cursor.pause()
					
					mmsCaptures.find( { imageId : item.imageId  }).toArray(function(err, mmsCaptureAry) {


						if (!mmsCaptureAry) return false

						count++

						if (Math.floor(count/totalItems*100) != percentDone){
							process.stdout.cursorTo(0)
							process.stdout.write(clc.black.bgYellowBright("mmsCapture Image Id: " + percentDone + "% " + matched))
							percentDone = Math.floor(count/totalItems*100)
						}

						if (mmsCaptureAry.length > 0){
							//console.log(item)

							if (mmsCaptureAry.length == 1){
								

								matched++


								//update MMS
								var updateMms = {
									_id: mmsCaptureAry[0].itemUuid,
									matchedTms: true,
									matchedTmsType : "identifier",
									tmsId: item._id
								}

								//update mms 
								mmsItems.update({ _id : updateMms._id }, { $set: updateMms }, function(err, result) {
									if (err) console.log(err)	

									var updateTms = {
										_id: item._id,
										matchedMms: true,
										matchedMmsType : "identifier",
										mmsUuid: mmsCaptureAry[0].itemUuid
									}

									//update archives
									tmsObjects.update({ _id : updateTms._id }, { $set: updateTms }, function(err, result) {
										if (err) console.log(err)
										cursor.resume()
									})
								})

							}


							cursor.resume()
						

						}else{


							cursor.resume()

						}

					})



					


				})



				cursor.once('end', function() {
					console.log("done")
					if (cb) cb()
				})

			})
	
		})

	})

}





exports.mapMmsPortraitFileToTms = function(cb){

	//try to find collection matches based on bnumber/mss col, archives ids, etc

	db.returnCollectionRegistry("mmsContainers",function(err,mmsContainers,mmsDatabase){

		db.returnCollectionRegistry("mmsItems",function(err,mmsItems,mmsDatabase2){

			db.returnCollectionRegistry("tmsObjects",function(err,tmsObjects,tmsDatabase){


				//find all the mms containers for this collection
				
				mmsContainers.find({ collectionUuid: '16ad5350-c52e-012f-aecf-58d385a7bc34', matchedTms : {$ne : true} }).toArray(function(err, mmsContainersAry) {

					var mmsMatched = {}, matchedCount = 0

					//get the portraits
					var cursor =  tmsObjects.find({ objectNumber: /Portraits/, matchedMms : {$ne : true}})


					cursor.on('data', function(tmsObj) {

						cursor.pause()

						var matched = false

						for (var mmsCont in mmsContainersAry){							

							mmsCont = mmsContainersAry[mmsCont]
							

							if (mmsMatched[mmsCont._id]) continue

							if (tmsObj.title.toLowerCase().replace(/\s/g,'').replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()\[\]]/g,'') === mmsCont.title.toLowerCase().replace(/\s/g,'').replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()\[\]]/g,'')){
								mmsMatched[mmsCont._id] = tmsObj._id

								var matched = true

								process.stdout.cursorTo(0)
								process.stdout.write(clc.black.bgYellowBright("PortraitFileToTms: " + ++matchedCount))
								//console.log(tmsObj.title, " -> ", mmsCont.title)

								//update the container to point to this tms object
								var updateMms1 = {
									_id: mmsCont._id,
									matchedTms: true,
									matchedTmsType : "portraits",
									tmsId: tmsObj._id
								}

								
								//update mms 
								mmsContainers.update({ _id : updateMms1._id }, { $set: updateMms1 }, function(err, result1) {

									if (err) console.log(err)	

									//console.log(updateMms1)
									//console.log(result1.result)

									var updateMms2 = {
										matchedTms: true,
										matchedTmsType : "portraits",
										tmsId: tmsObj._id
									}


									//now update all the items that belong to this container 
									mmsItems.update({ containerUuid : updateMms1._id }, { $set: updateMms2 }, { multi: true }, function(err, result2) {
										if (err) console.log(err)

										// console.log(updateMms2)
										// console.log(result2.result)

										//and any sub-sub children 
										mmsItems.update({ parents : updateMms1._id }, { $set: updateMms2 }, { multi: true }, function(err, result2) {
											if (err) console.log(err)

											var updateTms = {
												_id: tmsObj._id,
												matchedMms: true,
												matchedMmsType : "portraits",
												mmsUuid: mmsCont._id
											}


											//update archives
											tmsObjects.update({ _id : updateTms._id }, { $set: updateTms }, function(err, result3) {
												if (err) console.log(err)

												cursor.resume()
											})
										})

									})
								})

							}

						}

						//if it made it through without matching anything, go to the next one
						if (!matched){
							cursor.resume()
						}



					})

					cursor.once('end', function() {
						
						console.log("done")
						if (cb) cb()


					})						


				})



			})
	
		})

	})

}




exports.mapMmsPortraitFileToTmsFuzzy = function(threshold, cb){

	//try to find collection matches based on bnumber/mss col, archives ids, etc

	db.returnCollectionRegistry("mmsContainers",function(err,mmsContainers,mmsDatabase){

		db.returnCollectionRegistry("mmsItems",function(err,mmsItems,mmsDatabase2){

			db.returnCollectionRegistry("tmsObjects",function(err,tmsObjects,tmsDatabase){


				//find all the mms containers for this collection
				
				mmsContainers.find({ collectionUuid: '16ad5350-c52e-012f-aecf-58d385a7bc34', matchedTms : {$ne : true} }).toArray(function(err, mmsContainersAry) {

					var mmsMatched = {}, matchedCount = 0

					//get the portraits
					var cursor =  tmsObjects.find({ objectNumber: /Portraits/, matchedMms : {$ne : true}})


					cursor.on('data', function(tmsObj) {

						cursor.pause()

						var matched = false

						tmsObj.title = removeDiacritics(tmsObj.title).toLowerCase().replace(/\s+/g,' ').replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()\[\]]/g,'')


						for (var mmsCont in mmsContainersAry){							

							mmsCont = mmsContainersAry[mmsCont]
							


							if (mmsMatched[mmsCont._id]) continue
							
							mmsCont.title = removeDiacritics(mmsCont.title).toLowerCase().replace(/\s+/g,' ').replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()\[\]]/g,'')


							//if (tmsObj.title.toLowerCase().replace(/\.|\s/g,'') === mmsCont.title.toLowerCase().replace(/\.|\s/g,'')){
							if (tmsObj.title.score(mmsCont.title, 0.5) > threshold){

								mmsMatched[mmsCont._id] = tmsObj._id

								
								var matched = true

								console.log(tmsObj.title, "--->", mmsCont.title, " ~ ", tmsObj.title.score(mmsCont.title, 0.5))

								process.stdout.cursorTo(0)
								process.stdout.write(clc.black.bgYellowBright("PortraitFileToTms: " + ++matchedCount))
								//console.log(tmsObj.title, " -> ", mmsCont.title)

								//update the container to point to this tms object
								var updateMms1 = {
									_id: mmsCont._id,
									matchedTms: true,
									matchedTmsType : "portraits",
									tmsId: tmsObj._id
								}

								
								//update mms 
								mmsContainers.update({ _id : updateMms1._id }, { $set: updateMms1 }, function(err, result1) {

									if (err) console.log(err)	

									//console.log(updateMms1)
									//console.log(result1.result)

									var updateMms2 = {
										matchedTms: true,
										matchedTmsType : "portraits",
										tmsId: tmsObj._id
									}


									//now update all the items that belong to this container 
									mmsItems.update({ containerUuid : updateMms1._id }, { $set: updateMms2 }, { multi: true }, function(err, result2) {
										if (err) console.log(err)

									//	console.log(updateMms2)
									//	console.log(result2.result)


										var updateTms = {
											_id: tmsObj._id,
											matchedMms: true,
											matchedMmsType : "portraits",
											mmsUuid: mmsCont._id
										}


										//update archives
										tmsObjects.update({ _id : updateTms._id }, { $set: updateTms }, function(err, result3) {
											if (err) console.log(err)

										//	console.log(updateTms)
										//	console.log(result3.result)

											cursor.resume()
										})

									})
								})

							}

						}

						//if it made it through without matching anything, go to the next one
						if (!matched){


							cursor.resume()
						}



					})

					cursor.once('end', function() {						
						console.log("done")
						cb()
					})						


				})



			})
	
		})

	})

}









