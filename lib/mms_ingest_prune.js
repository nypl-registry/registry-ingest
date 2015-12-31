"use strict"

var db = require("../lib/db.js");
var errorLib = require("../lib/error.js");
var exec = require('child_process').exec;
var clc = require('cli-color');
var config = require("config")

var exports = module.exports = {};






exports.pruneIgnoreCollections = function(cb){

	db.returnCollectionRegistry("mmsItems",function(err,items){

		//get a db cursor to insert on
		db.returnCollectionRegistry("mmsContainers",function(err,containers){


			db.returnCollectionRegistry("mmsCollections",function(err,collections){

				var uuids = config['MMSIgnoreCollections']



				var deleteStuff = function(){

					if (!uuids[0]){

						if (cb) cb()
						return true
					}


					items.remove({ collectionUuid : uuids[0] }, function(err,result){
						if (err) console.log(err)

						containers.remove({ collectionUuid : uuids[0] }, function(err,result){
							if (err) console.log(err)

							collections.remove({ _id : uuids[0] }, function(err,result){
								if (err) console.log(err)

								console.log(uuids[0])

								uuids.shift()
								deleteStuff()
					

							})

						})



					})





				}

				deleteStuff()

			})

		})

	})

}



exports.pruneItemsMarkedAsExternal = function(cb){

	var totalItemsDeleted = 0

	//we are going to use this later to delete items
	db.returnCollectionRegistry("mmsItems",function(err,items){


		var cursor = items.find({ divisions: /external/i })


		cursor.on('data', function(doc) {
			
			cursor.pause()

			items.remove({ _id  : doc._id }, function(err,result){

				
				if (err) console.log(err)

				totalItemsDeleted++ 
				process.stdout.clearLine()
				process.stdout.cursorTo(0)
				process.stdout.write(clc.black.bgYellowBright(doc._id + " " + totalItemsDeleted + " for being external."))

				cursor.resume()

			})

		})


		cursor.once('end', function() {

			if (cb) cb()

		});

	})

}

exports.pruneItemsWithInvalidContainer = function(cb){

	var totalItemsDeleted = 0

	//we are going to use this later to delete items
	db.returnCollectionRegistry("mmsItems",function(err,items){

		db.returnCollectionRegistry("mmsContainers",function(err,containers){



			var cursor = items.find({})


			cursor.on('data', function(doc) {
				
				if (doc.containerUuid){

					if (doc.containerUuid != ''){


						cursor.pause()

						containers.find({  _id : doc.containerUuid }).count(function(err, result) {

							if (err){
								console.log(err)
							}
									


							if (result === 0){

								//remove it if there are no captures and any items that belong to that container

								// items.remove({ containerUuid : itemsArray[0]._id }, function(err,result){
								// 	if (err) console.log(err)



								// 	totalItemsDeleted = totalItemsDeleted + result.result.n

								// 	containers.remove({ _id : itemsArray[0]._id }, function(err,result){
								// 		if (err) console.log(err)
								// 		containerArray.shift()
								// 		checkForCaptures()
								// 		totalContainersDeleted = totalContainersDeleted + result.result.n

								// 		process.stdout.clearLine()
								// 		process.stdout.cursorTo(0)
								// 		process.stdout.write(clc.black.bgYellowBright("Deleted: " + totalItemsDeleted + " Items " + totalContainersDeleted + " Containers." ))

								// 		return true;
								// 	})


								// 	return true;
								// })

								totalItemsDeleted++ 

								items.remove({ _id  : doc._id }, function(err,result){
									
									if (err) console.log(err)


									totalItemsDeleted++ 
									process.stdout.clearLine()
									process.stdout.cursorTo(0)
									process.stdout.write(clc.black.bgYellowBright(doc._id + " " + totalItemsDeleted + " for not having a real container."))

									cursor.resume()

								})




							}else{
								cursor.resume()


							}

						})


					}

				}






			});



			cursor.once('end', function() {

				if (cb) cb()

			});

	

		})


	})


}

exports.pruneContainersWithoutCaptures = function(cb){

	var totalItemsDeleted = 0
	var totalContainersDeleted = 0
	//we are going to use this later to delete items
	db.returnCollectionRegistry("mmsItems",function(err,items){

		//get a db cursor to insert on
		db.returnCollectionRegistry("mmsContainers",function(err,containers){

			containers.find().toArray(function(err, containerArray) {

				//now get a cursor for the captures
				db.returnCollectionRegistry("mmsCaptures",function(err,captures){

					var stats = {
						"0": 0,
						"1": 0,
						"2-50": 0,
						"50-100" : 0,
						"100-200" : 0,
						"200-300" : 0,
						"300-400" : 0,
						"400-500" : 0,
						"500-600" : 0,
						"600-700" : 0,
						"700-800" : 0,
						"800-900" : 0,
						"900-1000" : 0,
						"1000-1500" : 0,
						"1500-2000" : 0,
						"2000-3000" : 0,
						"3000-4000" : 0,
						"4000-5000" : 0,
						"5000+"     : 0
					}



					var checkForCaptures = function(){

						if (!containerArray[0]){

							if (cb) cb()
							
							// for (var x in stats){
							// 	console.log(x,"\t",stats[x], "\t", Math.round( (stats[x]/75404*100) * 100) / 100 ,"%")
							// }


							return
						}

						

						//find all the container mmsDBs to see if there are any capture allong the hierarchy
						containers.find( { $or : [ { parents : containerArray[0]._id }, { _id: containerArray[0]._id }]}, { mmsDb: 1 } ).toArray(function(err, result) {

							var containerMmsDbs = []

							for (var x in result){
								containerMmsDbs.push(parseInt(result[x].mmsDb))
							}






							captures.find({ containerMmsDb: { $in : containerMmsDbs } }, {mmsDb: 1 }).count(function(err, result) {

								if (err){
									console.log(err)
								}

								//console.log(containerArray[0].mmsDb, result)

								if (result == 0){
									stats['0']++
								}else if (result == 1){
									stats['1']++
								}else if (result > 1 && result <= 50){
									stats['2-50']++
								}else if (result > 50 && result <= 100){
									stats['50-100']++
								}else if (result > 100 && result <= 200){
									stats['100-200']++
								}else if (result > 200 && result <= 300){
									stats['200-300']++
								}else if (result > 300 && result <= 400){
									stats['300-400']++
								}else if (result > 400 && result <= 500){
									stats['400-500']++
								}else if (result > 500 && result <= 600){
									stats['500-600']++
								}else if (result > 600 && result <= 700){
									stats['600-700']++
								}else if (result > 700 && result <= 800){
									stats['700-800']++
								}else if (result > 800 && result <= 900){
									stats['800-900']++
								}else if (result > 900 && result <= 1000){
									stats['900-1000']++
								}else if (result > 1000 && result <= 1500){
									stats['1000-1500']++
								}else if (result > 1500 && result <= 2000){
									stats['1500-2000']++
								}else if (result > 2000 && result <= 3000){
									stats['2000-3000']++
								}else if (result > 3000 && result <= 4000){
									stats['3000-4000']++
								}else if (result > 4000 && result <= 5000){
									stats['4000-5000']++
								}else if (result > 5000){
									stats['5000+']++
								}				



								if (result === 0){

									//remove it if there are no captures and any items that belong to that container

									items.remove({ containerUuid : containerArray[0]._id }, function(err,result){
										if (err) console.log(err)



										totalItemsDeleted = totalItemsDeleted + result.result.n

										containers.remove({ _id : containerArray[0]._id }, function(err,result){
											if (err) console.log(err)
											containerArray.shift()
											checkForCaptures()
											totalContainersDeleted = totalContainersDeleted + result.result.n

											process.stdout.clearLine()
											process.stdout.cursorTo(0)
											process.stdout.write(clc.black.bgYellowBright("Deleted: " + totalItemsDeleted + " Items " + totalContainersDeleted + " Containers." ))

											return true;
										})


										return true;
									})


								}else{

									containerArray.shift()
									checkForCaptures()


								}







							})


						})





					}


					checkForCaptures()

				})	

			})

		})

	})

}


exports.pruneCollectionsWithoutCaptures = function(cb){


	var totalItemsDeleted = 0
	var totalContainersDeleted = 0
	var totalCollectionsDeleted = 0


	db.returnCollectionRegistry("mmsItems",function(err,items){


		db.returnCollectionRegistry("mmsContainers",function(err,containers){

			//get a db cursor to insert on
			db.returnCollectionRegistry("mmsCollections",function(err,collections){

				collections.find().toArray(function(err, collectionArray) {

					//now get a cursor for the captures
					db.returnCollectionRegistry("mmsCaptures",function(err,captures){


						var stats = {

							"0": 0,
							"1": 0,
							"2-50": 0,
							"50-100" : 0,
							"100-200" : 0,
							"200-300" : 0,
							"300-400" : 0,
							"400-500" : 0,
							"500-600" : 0,
							"600-700" : 0,
							"700-800" : 0,
							"800-900" : 0,
							"900-1000" : 0,
							"1000-1500" : 0,
							"1500-2000" : 0,
							"2000-3000" : 0,
							"3000-4000" : 0,
							"4000-5000" : 0,
							"5000+"     : 0
						}

						var oneCaptureHasBbumber = 0
						var oneCaptureHasArchives = 0
						var oneCaptureHasTms = 0


						var checkForCaptures = function(){



							if (!collectionArray[0]){
								if (cb) cb()
								
								// for (var x in stats){
								// 	console.log(x,"\t",stats[x], "\t", Math.round( (stats[x]/6201*100) * 100) / 100 ,"%")
								// }

								// console.log("oneCaptureHasBbumber",oneCaptureHasBbumber)
								// console.log("oneCaptureHasTms",oneCaptureHasTms)
								// console.log("oneCaptureHasArchives",oneCaptureHasArchives)

								return
							}


							captures.find({ collectionMmsDb: parseInt(collectionArray[0].mmsDb) }).count(function(err, result) {

								if (err){
									console.log(err)
								}

								//console.log(collectionArray[0].mmsDb, result)

								if (result == 0){
									stats['0']++
								}else if (result == 1){
									stats['1']++

									if (collectionArray[0].bNumber) oneCaptureHasBbumber++
									if (collectionArray[0].tmsObject || collectionArray[0].tmsId) oneCaptureHasTms++
									if (collectionArray[0].mss) oneCaptureHasArchives++


									// if (!collectionArray[0].bNumber && !collectionArray[0].tmsObject && !collectionArray[0].tmsId && !collectionArray[0].mss ){
									// 	console.log("http://metadata.nypl.org/collection/" + collectionArray[0].mmsDb)
									// }

								}else if (result > 1 && result <= 50){
									stats['2-50']++
								}else if (result > 50 && result <= 100){
									stats['50-100']++
								}else if (result > 100 && result <= 200){
									stats['100-200']++
								}else if (result > 200 && result <= 300){
									stats['200-300']++
								}else if (result > 300 && result <= 400){
									stats['300-400']++
								}else if (result > 400 && result <= 500){
									stats['400-500']++
								}else if (result > 500 && result <= 600){
									stats['500-600']++
								}else if (result > 600 && result <= 700){
									stats['600-700']++
								}else if (result > 700 && result <= 800){
									stats['700-800']++
								}else if (result > 800 && result <= 900){
									stats['800-900']++
								}else if (result > 900 && result <= 1000){
									stats['900-1000']++
								}else if (result > 1000 && result <= 1500){
									stats['1000-1500']++
								}else if (result > 1500 && result <= 2000){
									stats['1500-2000']++
								}else if (result > 2000 && result <= 3000){
									stats['2000-3000']++
								}else if (result > 3000 && result <= 4000){
									stats['3000-4000']++
								}else if (result > 4000 && result <= 5000){
									stats['4000-5000']++
								}else if (result > 5000){
									stats['5000+']++
								}				

								if (result == 0){


									items.remove({ collectionUuid : collectionArray[0]._id }, function(err,result){
										if (err) console.log(err)

										totalItemsDeleted = totalItemsDeleted + result.result.n


										containers.remove({ collectionUuid : collectionArray[0]._id }, function(err,result){
											if (err) console.log(err)


											totalContainersDeleted = totalContainersDeleted + result.result.n


											collections.remove({ _id : collectionArray[0]._id }, function(err,result){
												if (err) console.log(err)
												collectionArray.shift()
												checkForCaptures()


												totalCollectionsDeleted = totalCollectionsDeleted + result.result.n


												process.stdout.clearLine()
												process.stdout.cursorTo(0)
												process.stdout.write(clc.black.bgYellowBright("Deleted: " + totalItemsDeleted + " Items " + totalContainersDeleted + " Containers " + totalCollectionsDeleted + " Collections."  ))


												return true;
											})



											return true;
										})


										return true;
									})




								}else{

									collectionArray.shift()
									checkForCaptures()


								}




							})



						}


						checkForCaptures()



					})	

				})

			})
	
		})
	})

}


exports.pruneItemsWithoutCaptures = function(cb){

	var totalItemsDeleted = 0


	//we are going to use this later to delete items
	db.returnCollectionRegistry("mmsItems",function(err,items){

		db.returnCollectionRegistry("mmsCaptures",function(err,captures){



			var cursor = items.find({})


			cursor.on('data', function(doc) {

				
				cursor.pause()

				captures.find({ itemUuid: doc._id }).count(function(err, result) {

					if (err){
						console.log(err)
					}




					if (result === 0){


						items.remove({ _id  : doc._id }, function(err,result){
							
							if (err) console.log(err)


							totalItemsDeleted++ 
							process.stdout.clearLine()
							process.stdout.cursorTo(0)
							process.stdout.write(clc.black.bgYellowBright(doc._id + " " + totalItemsDeleted))

							cursor.resume()

						})




					}else{

						cursor.resume()


					}







				})






			});



			cursor.once('end', function() {

				if (cb) cb()


			});

	

		})


	})

}
