//this module works with the datastore to do things~


var clc = require('cli-color');
var keypress = require('keypress')
var fs = require('fs')

var MongoClient = require('mongodb').MongoClient
var config = require("config")
var Db = require('mongodb').Db
var Server = require('mongodb').Server
var ObjectID = require('mongodb').ObjectID

var mongoConnectURL = config['Db']['mongoConnectURL']
var mongoIp = config['Db']['mongoIp']
var mongoPort = config['Db']['mongoPort']
var mongoDb = config['Db']['mongoDb']


var mongoConnectURLShadowcat = config['DbShadowcat']['mongoConnectURL']
var askBefore = config['AskBeforeDeleting']

var exports = module.exports = {}


exports.databaseRegistry = null
exports.databaseShadowcat = null
exports.collectionLookup = {}


exports.returnObjectId = function(id){
	return new ObjectID(id)
}


//makes an active connection to be resued in the app
exports.databaseConnect = function(cb){

	if (exports.databaseRegistry && exports.databaseShadowcat){
		if (cb) cb()
		return true
	}
	
	MongoClient.connect(mongoConnectURL, function(err, dbRegistry) {
		

		if (err){
			console.log("Error connecting to registry:",err)
		}else{
			console.log("[DB]:Connecting to Registry")
			exports.databaseRegistry = dbRegistry
		}
		
		MongoClient.connect(mongoConnectURLShadowcat, function(err, dbShadowcat) {
			if (err){
				console.log("Error connecting to shadowcat:",err)
			}else{
				console.log("[DB]:Connecting to Shadowcat")
				exports.databaseShadowcat = dbShadowcat
			}
			if (cb) cb()
		})
	})
}


exports.databaseClose = function(cb){
	exports.databaseRegistry.close()
	exports.databaseShadowcat.close()
	if (cb) cb()
}

//return a collection requested, resuing the same DB connection and collection reference when possible
exports.returnCollectionShadowcat = function(collectionName,cb){
	exports.databaseConnect(function(){

		if (exports.collectionLookup[collectionName]){
			cb(null,exports.collectionLookup[collectionName])
		}else{
			var collection = exports.databaseShadowcat.collection(collectionName)
			exports.collectionLookup[collectionName] = collection
			cb(null,exports.collectionLookup[collectionName])
		}
		
		
	})
}

exports.returnCollectionRegistry = function(collectionName,cb){
	exports.databaseConnect(function(){
		if (exports.collectionLookup[collectionName]){
			cb(null,exports.collectionLookup[collectionName])
		}else{
			var collection = exports.databaseRegistry.collection(collectionName)
			exports.collectionLookup[collectionName] = collection
			cb(null,exports.collectionLookup[collectionName])
		}
	})
}

exports.logError = function(context,error){

	exports.databaseConnect(function(){
		if (!exports.collectionLookup["errors"]){			
			var collection = exports.databaseRegistry.collection("errors")
			exports.collectionLookup["errors"] = collection
		}

		
		var insert = {
			date : new Date().toString(),
			context: context,
			error: error			
		}
		//store the new data
		exports.collectionLookup["errors"].insert(insert, function(err, result) {})

	})
}



// 		var collection = activeDatabase.collection('errors')	





//prepare* gets any collections setup with the propper indexes

exports.prepareAgents = function(cb){
	exports.databaseConnect(function(){

		var go = function(callback){

			//remove the any old stuff
			var collection = exports.databaseRegistry.collection('agents')
			console.log("Dropping Table")
			//delete any existing data first
			collection.drop(function(err,results){
				console.log("agents Table dropped")
				if (err){
					if (err.message != 'ns not found'){
						console.log(clc.redBright('prepare agents - drop collection'), clc.greenBright(err), console.dir(err))
					}
				}

				var collection = exports.databaseRegistry.collection('agents')

				console.log("Creating Indexes")
				//now prepare the indexes
				collection.createIndex("viaf", {background: true, unique: true})
				collection.createIndex("viafAll", {background: true})
				collection.createIndex("registry", {background: true, unique: true})
				collection.createIndex("nameControlled", {background: true, unique: true })
				collection.createIndex("nameNormalized", {background: true})
				if (callback) callback()
			})

		}

		go(cb)

		// if (askBefore){

		// 	process.stdout.cursorTo(0)
		// 	process.stdout.write("Do you want to nuke the agent table? [y/n]: ")
		// 	keypress(process.stdin)

		// 	process.stdin.on('keypress', function (ch, key) {
		// 		if (key.name == 'y') {
		// 			go(cb)
		// 			console.log("\n")
		// 		}
		// 		if (key.name == 'n') {
		// 			console.log("\n")
		// 			if (cb) cb()
		// 		}		
		// 		if (key && key.ctrl && key.name == 'c') {
		// 			process.exit()
		// 		}

		// 	})

		// 	process.stdin.setRawMode(true)
		// 	process.stdin.resume()

		// }else{
		// 	go(cb)
		// }

	})

}



exports.prepareTerms = function(callback){


	//remove the any old stuff
	exports.databaseConnect(function(){

		//remove the any old stuff
		var collection = exports.databaseRegistry.collection('terms')
		console.log("Dropping Table")
		//delete any existing data first
		collection.drop(function(err,results){
			console.log("terms Table dropped")
			if (err){
				if (err.message != 'ns not found'){
					console.log(clc.redBright('prepare terms - drop collection'), clc.greenBright(err), console.dir(err))
				}
			}

			var collection = exports.databaseRegistry.collection('terms')

			console.log("Creating Indexes")
			collection.createIndex("fast", {background: true, unique: true})
			collection.createIndex("fastAll", {background: true, unique: true})
			collection.createIndex("registry", {background: true, unique: true})
			collection.createIndex("termControlled", {background: true, unique: true})
			collection.createIndex("termNormalized", {background: true})



			if (callback) callback()
		})

	})

}


exports.prepareIngestMmsCaptures = function(cb){


	//remove the any old stuff
	exports.databaseConnect(function(){


		var collection = exports.databaseRegistry.collection('mmsCaptures')

		//delete any existing data first
		collection.drop(function(err,results){
			if (err){
				if (err.message != 'ns not found'){
					console.log(clc.redBright('prepareIngestMmsCaptures - drop collection'), clc.greenBright(err), console.dir(err))
				}
			}

			//now prepare the indexes
			collection.createIndex("mmsDb", {background: true})
			collection.createIndex("itemMmsDb", {background: true})
			collection.createIndex("itemUuid", {background: true})
			collection.createIndex("collectionMmsDb", {background: true})
			collection.createIndex("containerMmsDb", {background: true})
			collection.createIndex("uuid", {background: true})
			collection.createIndex("imageId", {background: true})

			if (cb) cb()
		})
	})

}

exports.prepareIngestMmsCollections = function(cb){


	//remove the any old stuff
	exports.databaseConnect(function(){


		var collection = exports.databaseRegistry.collection('mmsCollections')

		//delete any existing data first
		collection.drop(function(err,results){
			if (err){
				if (err.message != 'ns not found'){
					console.log(clc.redBright('prepareIngestMmsCollections - drop collection'), clc.greenBright(err), console.dir(err))
				}
			}

			//now prepare the indexes
			collection.createIndex("mmsDb", {background: true})
			collection.createIndex("bNumber", {background: true})
			collection.createIndex("callNumber", {background: true})
			collection.createIndex({"title": "text"}, {background: true})
			collection.createIndex("archivesCollectionDb", {background: true})

			if (cb) cb()

		})
	})

}

exports.prepareIngestMmsContainers = function(cb){


	//remove the any old stuff
	exports.databaseConnect(function(){

		var collection = exports.databaseRegistry.collection('mmsContainers')

		//delete any existing data first
		collection.drop(function(err,results){
			if (err){
				if (err.message != 'ns not found'){
					console.log(clc.redBright('prepareIngestMmsCollections - drop collection'), clc.greenBright(err), console.dir(err))
				}
			}


			//now prepare the indexes
			collection.createIndex("mmsDb", {background: true})
			collection.createIndex("bNumber", {background: true})
			collection.createIndex("callNumber", {background: true})
			collection.createIndex({"title": "text"}, {background: true})
			collection.createIndex("collectionUuid", {background: true})
			collection.createIndex("parents", {background: true})
			collection.createIndex("archivesComponentDb", {background: true})




			if (cb) cb()

		})
	})

}

//make a clean ingest env for the various ingest sources
exports.prepareIngestMmsItems = function(cb){


	//remove the any old stuff
	exports.databaseConnect(function(){


		var collection = exports.databaseRegistry.collection('mmsItems')

		//delete any existing data first
		collection.drop(function(err,results){
			if (err){
				if (err.message != 'ns not found'){
					console.log(clc.redBright('prepareIngestMmsItems - drop collection'), clc.greenBright(err), console.dir(err))
				}
			}

			//now prepare the indexes
			collection.createIndex("mmsDb", {background: true})
			collection.createIndex("bNumber", {background: true})
			collection.createIndex("callNumber", {background: true})
			collection.createIndex({"title": "text"}, {background: true})
			collection.createIndex("collectionUuid", {background: true})
			collection.createIndex("containerUuid", {background: true})
			collection.createIndex("publicDomain", {background: true})
			collection.createIndex("parents", {background: true})
			collection.createIndex("archivesComponentDb", {background: true})

			if (cb) cb()

		})
	})

}

//make a clean ingest env for the various ingest sources


//make a clean ingest env for the various ingest sources
exports.prepareIngestArchivesCollections = function(cb){


	//remove the any old stuff
	exports.databaseConnect(function(){


		var collection = exports.databaseRegistry.collection('archivesCollections')

		//delete any existing data first
		collection.drop(function(err,results){
			if (err){
				if (err.message != 'ns not found'){
					console.log(clc.redBright('prepareIngestArchivesCollections - drop collection'), clc.greenBright(err), console.dir(err))
				}
			}

			//now prepare the indexes
			collection.createIndex("mssDb", {background: true})
			collection.createIndex("mss", {background: true})
			collection.createIndex("bNumber", {background: true})
			collection.createIndex("callNumber", {background: true})
			collection.createIndex("divisions", {background: true})
			collection.createIndex("uuid", {background: true})


			if (cb) cb()


		})
	})

}

//make a clean ingest env for the various ingest sources
exports.prepareIngestArchivesComponents = function(cb){


	//remove the any old stuff
	exports.databaseConnect(function(){


		var collection = exports.databaseRegistry.collection('archivesComponents')

		//delete any existing data first
		collection.drop(function(err,results){
			if (err){
				if (err.message != 'ns not found'){
					console.log(clc.redBright('prepareIngestArchivesComponents - drop collection'), clc.greenBright(err), console.dir(err))
				}
			}


			//now prepare the indexes
			collection.createIndex("mssDb", {background: true})
			collection.createIndex("mss", {background: true})
			collection.createIndex("bNumber", {background: true})
			collection.createIndex("callNumber", {background: true})
			collection.createIndex("divisions", {background: true})
			collection.createIndex("uuid", {background: true})
			collection.createIndex("levelText", {background: true})

			if (cb) cb()

		})
	})

}


exports.prepareIngestTmsObject = function(cb){


	//remove the any old stuff
	exports.databaseConnect(function(){


		var collection = exports.databaseRegistry.collection('tmsObjects')

		//delete any existing data first
		collection.drop(function(err,results){
			if (err){
				if (err.message != 'ns not found'){
					console.log(clc.redBright('prepareIngestTmsObject - drop collection'), clc.greenBright(err), console.dir(err))
				}
			}


			//now prepare the indexes
			collection.createIndex("objectNumber", {background: true})
			collection.createIndex("imageId", {background: true})
			collection.createIndex("bNumber", {background: true})
			collection.createIndex("callNumber", {background: true})
			collection.createIndex("division", {background: true})
			collection.createIndex("classmark", {background: true})
			collection.createIndex("objectID", {background: true})
			collection.createIndex("acquisitionNumber", {background: true})


			collection.createIndex({"title": "text"}, {background: true})
			collection.createIndex({"titleAlt": "text"}, {background: true})


			if (cb) cb()


		})
	})

}






exports.exportPDItemsRaw = function(cb){
 	
 	//remove the existing file
 	fs.writeFileSync('data/pd_mms_items.ndjson', "")
 
 	exports.databaseConnect(function(){

 		exports.returnCollectionRegistry("mmsCollections",function(err,mmsCollections){

 			var collectionLookup = {}
 			console.log("Building Collection Title Lookup...")
 			//build a quick lookup
			mmsCollections.find({ }, { title: 1}).toArray(function(err, collections){
				
				collections.forEach(function(c){
					collectionLookup[c._id] = c.title
				})

				exports.returnCollectionRegistry("mmsCaptures",function(err,mmsCaptures){	

					// //loop through the items
		 			exports.returnCollectionRegistry("mmsItems",function(err,mmsItems){			
				 
						var c = 0
						var capturesCount = 0
						var cursor = mmsItems.find({ publicDomain : true, dcFlag: true  })				
			 
						//send the data to the calling function with the cursor							
						cursor.on('data', function(doc) {

							cursor.pause()
			 
			 				var title =""
							//if (col) if (col[0]) if (col[0].title) title = col[0].title
							if (collectionLookup[doc.collectionUuid]){
								title = collectionLookup[doc.collectionUuid]
							}
			 
			 				doc.collectionTitle = title

			 				//get the capture uuids
			 				mmsCaptures.find({ itemUuid: doc._id }).toArray(function(err, captures){

			 					doc.captures = []

			 					if (captures){
				 					captures.forEach(function(cap){
				 						doc.captures.push({  uuid: cap._id, imageId : cap.imageId })
				 						capturesCount++
				 					})
				 				}

								//console.log(doc)
				 				var out = JSON.stringify(doc)
				 				c++
				 				
				 
				 				fs.appendFile('data/pd_mms_items.ndjson', out + "\n", function (err) {
				 					cursor.resume()
				 					console.log(c,capturesCount)
				 				}) 

			 				})


				 	 
						})	 
			 
						cursor.once('end', function() {

							//exports.databaseClose()
						})

					})
				})
		 
	 		})

 		}) 
 
 	})
 
}











// exports.prepareViafLookup = function(cb){


// 	//remove the any old stuff
// 	MongoClient.connect(mongoConnectURL, function(err, db) {


// 		var collection = db.collection('viaf')

// 		//delete any existing data first
// 		collection.drop(function(err,results){
// 			if (err){
// 				if (err.message != 'ns not found'){
// 					console.log(clc.redBright('viaf - drop collection'), clc.greenBright(err), console.dir(err))
// 				}
// 			}

// 			var collection = db.collection('viaf')


// 			//now prepare the indexes
// 			//collection.createIndex("prefLabel", {background: true})
// 			//collection.createIndex("altLabel", {background: true})
// 			collection.createIndex("normalized", {background: true})
// 			collection.createIndex("fast", {background: true})
// 			collection.createIndex("hasLc", {background: true})
// 			collection.createIndex("hasDbn", {background: true})
// 			collection.createIndex("lcId", {background: true})
// 			collection.createIndex("gettyId", {background: true})
			

// 			if (cb) cb()



// 			db.close()

// 		})
// 	})

// }
// exports.prepareFastLookup = function(cb){


// 	//remove the any old stuff
// 	MongoClient.connect(mongoConnectURL, function(err, db) {


// 		var collection = db.collection('fastLookup')

// 		//delete any existing data first
// 		collection.drop(function(err,results){
// 			if (err){
// 				if (err.message != 'ns not found'){
// 					console.log(clc.redBright('fastLookup - drop collection'), clc.greenBright(err), console.dir(err))
// 				}
// 			}

// 			var collection = db.collection('fastLookup')


// 			//now prepare the indexes
// 			//collection.createIndex("prefLabel", {background: true})
// 			//collection.createIndex("altLabel", {background: true})
// 			collection.createIndex("normalized", {background: true})
// 			collection.createIndex("type", {background: true})
// 			collection.createIndex("sameAsLc", {background: true})

// 			if (cb) cb()



// 			db.close()

// 		})
// 	})

// }




// exports.logError = function(context, error, activeDatabase){

// 	if (!activeDatabase){
// 		MongoClient.connect(mongoConnectURL, function(err, db) {
// 			var collection = db.collection('errors')	
// 			var insert = {
// 				date : new Date().toString(),
// 				context: context,
// 				error: error			
// 			}
// 			//store the new data
// 			collection.insert(insert, function(err, result) {	
// 				db.close()
// 			})		
// 		})

// 	}else{

// 		var collection = activeDatabase.collection('errors')	
// 		var insert = {
// 			date : new Date().toString(),
// 			context: context,
// 			error: error			
// 		}
// 		//store the new data
// 		collection.insert(insert, function(err, result) {})
// 	}
// }

// exports.returnDb = function(cb){
// 	MongoClient.connect(mongoConnectURL, function(err, db) {
// 		if (err) console.log(err)
// 		cb(err,db)
// 	})
// }
// exports.returnDbShadowcat = function(cb){
// 	MongoClient.connect(mongoConnectURLShadowcat, function(err, db) {
// 		if (err) console.log(err)
// 		cb(err,db)
// 	})
// }


// exports.returnCollection = function(collectionName,cb){
// 	var db = new Db(mongoDb, new Server(mongoIp, mongoPort));
// 	db.open(function(err, db) {
// 		var collection = db.collection(collectionName)
// 		cb(err, collection, db)
// 	})
// }




