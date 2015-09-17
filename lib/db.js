//this module works with the datastore to do things~


var clc = require('cli-color');

var MongoClient = require('mongodb').MongoClient
var config = require("config")
var Db = require('mongodb').Db
var Server = require('mongodb').Server

var mongoConnectURL = config['Db']['mongoConnectURL']
var mongoIp = config['Db']['mongoIp']
var mongoPort = config['Db']['mongoPort']
var mongoDb = config['Db']['mongoDb']



var exports = module.exports = {}



//make a clean ingest env for the various ingest sources
exports.prepareIngestMmsCollections = function(cb){


	//remove the any old stuff
	MongoClient.connect(mongoConnectURL, function(err, db) {


		var collection = db.collection('mmsCollections')

		//delete any existing data first
		collection.drop(function(err,results){
			if (err){
				if (err.message != 'ns not found'){
					console.log(clc.redBright('prepareIngestMmsCollections - drop collection'), clc.greenBright(err), console.dir(err))
				}
			}

			var collection = db.collection('mmsCollections')


			//now prepare the indexes
			collection.createIndex("mmsDb", {background: true})
			collection.createIndex("bNumber", {background: true})
			collection.createIndex("callNumber", {background: true})
			collection.createIndex({"title": "text"}, {background: true})



			if (cb) cb()



			db.close()

		})
	})

}

//make a clean ingest env for the various ingest sources
exports.prepareIngestMmsContainers = function(cb){


	//remove the any old stuff
	MongoClient.connect(mongoConnectURL, function(err, db) {


		var collection = db.collection('mmsContainers')

		//delete any existing data first
		collection.drop(function(err,results){
			if (err){
				if (err.message != 'ns not found'){
					console.log(clc.redBright('prepareIngestMmsCollections - drop collection'), clc.greenBright(err), console.dir(err))
				}
			}

			var collection = db.collection('mmsContainers')


			//now prepare the indexes
			collection.createIndex("mmsDb", {background: true})
			collection.createIndex("bNumber", {background: true})
			collection.createIndex("callNumber", {background: true})
			collection.createIndex({"title": "text"}, {background: true})
			collection.createIndex("collectionUuid", {background: true})

			if (cb) cb()

			db.close()

		})
	})

}

//make a clean ingest env for the various ingest sources
exports.prepareIngestMmsItems = function(cb){


	//remove the any old stuff
	MongoClient.connect(mongoConnectURL, function(err, db) {


		var collection = db.collection('mmsItems')

		//delete any existing data first
		collection.drop(function(err,results){
			if (err){
				if (err.message != 'ns not found'){
					console.log(clc.redBright('prepareIngestMmsItems - drop collection'), clc.greenBright(err), console.dir(err))
				}
			}

			var collection = db.collection('mmsItems')


			//now prepare the indexes
			collection.createIndex("mmsDb", {background: true})
			collection.createIndex("bNumber", {background: true})
			collection.createIndex("callNumber", {background: true})
			collection.createIndex({"title": "text"}, {background: true})
			collection.createIndex("collectionUuid", {background: true})
			collection.createIndex("containerUuid", {background: true})

			if (cb) cb()

			db.close()

		})
	})

}

//make a clean ingest env for the various ingest sources
exports.prepareIngestMmsCaptures = function(cb){


	//remove the any old stuff
	MongoClient.connect(mongoConnectURL, function(err, db) {


		var collection = db.collection('mmsCaptures')

		//delete any existing data first
		collection.drop(function(err,results){
			if (err){
				if (err.message != 'ns not found'){
					console.log(clc.redBright('prepareIngestMmsCaptures - drop collection'), clc.greenBright(err), console.dir(err))
				}
			}

			var collection = db.collection('mmsCaptures')


			//now prepare the indexes
			collection.createIndex("mmsDb", {background: true})
			collection.createIndex("itemMmsDb", {background: true})
			collection.createIndex("itemUuid", {background: true})
			collection.createIndex("collectionMmsDb", {background: true})
			collection.createIndex("containerMmsDb", {background: true})
			collection.createIndex("uuid", {background: true})


			if (cb) cb()

			db.close()

		})
	})

}



exports.logError = function(context, error){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = db.collection('errors')	
		var insert = {
			date : new Date().toString(),
			context: context,
			error: error			
		}
		//store the new data
		collection.insert(insert, function(err, result) {	
			db.close()
		})		
	})
}


exports.returnCollection = function(collectionName,cb){
	var db = new Db(mongoDb, new Server(mongoIp, mongoPort));
	db.open(function(err, db) {
		var collection = db.collection(collectionName)
		cb(err, collection, db)
	})
}



exports.insertItem = function(insert, cb){

	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = db.collection('mmsItems')	
		//store the new data
		collection.insert(insert, function(err, result) {	
			db.close()
			cb(err,result)
			return true
		})

		return true		
	})

	return true

}





// exports.returnBibCollection = function(cb){

// 	var db = new Db(mongoDb, new Server(mongoIp, mongoPort));

// 	db.open(function(err, db) {

// 		var collection = db.collection('bib')

// 		cb(err, collection, db)



// 	})



// }


// //do a janky cache for the really large ones 
// exports.storeSample = function(classmark, sampleJson){


// 	MongoClient.connect(mongoApiConnectURL, function(err, db) {



// 		var collection = db.collection('sampleStore')

// 		//delete any existing data first
// 		collection.remove({ _id: classmark },

// 			function(err, results) {


// 				var insert = {
// 					_id : classmark,
// 					json : sampleJson,
// 					timestamp : (Math.floor(Date.now() / 1000)  ) 
// 				}

// 				//store the new data
// 				collection.insert(insert, function(err, result) {	
// 					console.log(err)			
// 					db.close()
// 				})
// 			}
// 		)




// 	})




// }

// exports.retriveSample = function(classmark, cb){

// 	if (!classmark){
// 		cb([])
// 		return false
// 	}


// 	//check to see if we have it
// 	MongoClient.connect(mongoApiConnectURL, function(err, db) {


// 		var collection = db.collection('sampleStore')

// 		collection.find({ _id: classmark }).toArray(function(err, docs) {
			
// 			if (docs.length == 0){

// 				cb(err,false)

// 			}else{

// 				//we have it, check to see if it is still fresh (1 week)

// 				var r = docs[0]

// 				var setDate = r.timestamp


// 				if (Math.floor(Date.now() / 1000) - r.timestamp > 604800){
// 					cb(err,false)
// 				}else{
// 					cb(err,r.json)
// 				}	
// 			}


// 			db.close()
			



// 		})
// 	})



// }




// exports.sampleByLccRange = function(range, cb){

// 	if (!range){
// 		cb([])
// 		return false
// 	}

// 	//range = range.toLowerCase().replace(/\./g,'').replace(/_/g,' ')

// 	exports.retriveSample(range,function(err,cache){



// 		if (cache){

// 			cb(null,JSON.parse(cache))


// 		}else{



// 			MongoClient.connect(mongoConnectURL, function(err, db) {



// 				var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')
// 				collection.find({ 'sc:lccCoarse' : range, 'sc:research': true}, {title: 1, publishYear: 1 }).sort( { _id : -1} ).limit(50).toArray(function(err, docs) {
					
// 					var r = []


// 					for (var x in docs){
// 						r.push({id:docs[x]['_id'], title:docs[x]['title'], publishYear:docs[x]['publishYear']})
// 					}

// 					db.close()
// 					cb(err,r)

// 					//store this result for later
// 					exports.storeSample(range,JSON.stringify(r))

// 				})
// 			})


// 		}

// 	})








// }


// exports.sampleByClassmark = function(classmark, cb){


// 	if (!classmark){
// 		cb([])
// 		return false
// 	}

// 	classmark = classmark.toLowerCase().replace(/\./g,'').replace(/_/g,' ')


// 	exports.retriveSample(classmark,function(err,cache){



// 		if (cache){

// 			cb(null,JSON.parse(cache))


// 		}else{


// 			MongoClient.connect(mongoConnectURL, function(err, db) {

// 				var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')
// 				collection.find({ 'sc:classmark' : classmark, 'sc:research': true}, {title: 1, publishYear: 1 }).sort( { _id : -1} ).limit(50).toArray(function(err, docs) {

// 					var r = []
// 					for (var x in docs){
// 						r.push({id:docs[x]['_id'], title:docs[x]['title'], publishYear:docs[x]['publishYear']})
// 					}

// 					db.close()
// 					cb(err,r)

// 					//store this result for later
// 					exports.storeSample(classmark,JSON.stringify(r))

// 				})
// 			})


// 		}

// 	})





// }




// // exports.updateBibRecord = function(bib,cb){
// // 	MongoClient.connect(mongoConnectURL, function(err, db) {
// // 		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')
// // 		collection.update({ _id : bib.id }
// // 			, { $set: bib }, function(err, result) {
// // 			db.close()
// // 			if (cb) cb(err,result);
// // 		})

// // 	})

// // }


// // exports.insertBibRecord = function(bib,cb){
// // 	MongoClient.connect(mongoConnectURL, function(err, db) {
// // 		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')
// // 		collection.insert(bib, function(err, result) {
// // 			if (cb) cb(err,result);
// // 			db.close()
// // 		})
// // 	})
// // }











// // exports.updateItemRecord = function(item,cb){
// // 	MongoClient.connect(mongoConnectURL, function(err, db) {
// // 		var collection = (exports.testOverride) ? db.collection('test') : db.collection('item')
// // 		collection.update({ _id : item.id }
// // 			, { $set: item }, function(err, result) {
// // 			db.close()
// // 			if (cb) cb(err,result);
// // 		})

// // 	})

// // }


// // exports.insertItemRecord = function(item,cb){
// // 	MongoClient.connect(mongoConnectURL, function(err, db) {
// // 		var collection = (exports.testOverride) ? db.collection('test') : db.collection('item')
// // 		collection.insert(item, function(err, result) {
// // 			if (cb) cb(err,result);
// // 			db.close()
// // 		})
// // 	})
// // }


// exports.returnBots = function(cb){

// 	MongoClient.connect(mongoConnectURL, function(err, db) {
// 		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bots')
// 		collection.find().sort({$natural: -1}).limit(50).toArray(function(err, docs) {
// 			db.close()
// 			cb(err,docs)
// 		});
// 	});	
// }


// exports.returnBnumber = function(id,cb){


// 	//if a db is already active 


// 	if (!id) return {};


// 	MongoClient.connect(mongoConnectURL, function(err, db) {

// 		id = id.replace(/b/gi,'').replace(/\s/gi,'')
// 		id = parseInt(id)
// 		console.log(err)
// 		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')
// 		collection.find({_id : id}).toArray(function(err, docs) {

// 			// if (docs[0]){
// 			// 	exports.returnItemByBibIds(docs[0].id,function(err,items){


					
// 			// 	})
// 			// }


// 			db.close()
// 			cb(err,docs,db)
// 		});
// 	});	


// }



// exports.returnBibById = function(id,cb,db){


// 	//if a db is already active 
// 	if (db){

// 		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')
// 		collection.find({_id : id}).toArray(function(err, docs) {
// 			cb(err,docs)
// 		});

// 	}else{

// 		MongoClient.connect(mongoConnectURL, function(err, db) {
// 			var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')
// 			collection.find({_id : id}).toArray(function(err, docs) {
// 				db.close()
// 				cb(err,docs)
// 			});
// 		});	

// 	}

// }

// exports.returnItemByBibIds = function(id,cb,db){


// 	//if a db is already active 
// 	if (db){

// 		var collection = (exports.testOverride) ? db.collection('test') : db.collection('item')
// 		collection.find({bibIds : id}).toArray(function(err, docs) {
// 			cb(err,docs)
// 		});

// 	}else{

// 		MongoClient.connect(mongoConnectURL, function(err, db) {
// 			var collection = (exports.testOverride) ? db.collection('test') : db.collection('item')
// 			collection.find({bibIds : id}).toArray(function(err, docs) {
// 				db.close()
// 				cb(err,docs)
// 			})
// 		})

// 	}




// }




// exports.allBibs = function(cb){



// 	MongoClient.connect(mongoConnectURL, function(err, db) {
// 		var collection = (exports.testOverride) ? db.collection('test') : db.collection('bib')


// 		var cursor = collection.find({})
		
// 		cursor.on('data', function(doc) {

// 			cursor.pause()

// 			//send the data to the calling function with the cursor

// 			cb(doc,cursor,db)


// 		});



// 		cursor.once('end', function() {
// 			db.close();
// 		});




// 	})


// }




// exports.allItemsReverse = function(cb){



// 	MongoClient.connect(mongoConnectURL, function(err, db) {

// 		console.log(err)

// 		var collection = (exports.testOverride) ? db.collection('test') : db.collection('item')


// 		var cursor = collection.find({}).sort({ $natural: -1 });
		
// 		cursor.on('data', function(doc) {

// 			cursor.pause()

// 			//send the data to the calling function with the cursor

// 			cb(doc,cursor,db)


// 		});



// 		cursor.once('end', function() {
// 			db.close();
// 		});




// 	})


// }




// // exports.dropTestCollection = function(cb){
// // 	MongoClient.connect(mongoConnectURL, function(err, db) {
// // 		var collection = db.collection('test')
// // 		collection.drop(function(err, reply) {
// // 			if (cb) cb(reply)
// // 		})
// // 	})
// // }



// exports.returnNextApiHoldingsWork = function(cb){


// 	MongoClient.connect(mongoConnectURL, function(err, db) {
// 		var collection = (exports.testOverride) ? db.collection('test') : db.collection('apiHoldings')
// 		collection.find().limit(1).toArray(function(err, docs) {
// 			db.close()
// 			cb(err,docs)
// 		})
// 	})	



// }

// exports.deleteApiHoldingsWork = function(id,cb){


// 	MongoClient.connect(mongoConnectURL, function(err, db) {
// 		var collection = (exports.testOverride) ? db.collection('test') : db.collection('apiHoldings')
// 		collection.remove({_id : id}, function(err, results){

// 			if (err) console.log(err)

// 			db.close()
// 			cb(err,results)


// 		})


// 	})



// }

// exports.returnNextApiLccnWork = function(cb){

// 	MongoClient.connect(mongoConnectURL, function(err, db) {
// 		if (err) console.log(err)
// 		var collection = (exports.testOverride) ? db.collection('test') : db.collection('apiLccn')
// 		collection.find().limit(1).toArray(function(err, docs) {
// 			db.close()
// 			cb(err,docs)
// 		})
// 	})	



// }

// exports.deleteApiLccnWork = function(id,cb){


// 	MongoClient.connect(mongoConnectURL, function(err, db) {
// 		var collection = (exports.testOverride) ? db.collection('test') : db.collection('apiLccn')
// 		collection.remove({_id : id}, function(err, results){

// 			if (err) console.log(err)

// 			db.close()
// 			cb(err,results)


// 		})


// 	})



// }


