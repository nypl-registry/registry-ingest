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

var TripleStoreConnectURL = config['TripleStore']['mongoConnectURL']
var TripleStoreIp = config['TripleStore']['mongoIp']
var TripleStorePort = config['TripleStore']['mongoPort']
var TripleStoreDb = config['TripleStore']['mongoDb']





var exports = module.exports = {}


exports.databaseRegistry = null
exports.databaseShadowcat = null
exports.collectionLookup = {}
exports.databaseTripleStore = null

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

exports.databaseConnectTripleStore = function(cb){
	if (exports.databaseTripleStore){
		if (cb) cb()
		return true
	}	
	MongoClient.connect(TripleStoreConnectURL, function(err, dbTripleStore) {	
		if (err){
			console.log("Error connecting to registry:",err)
		}else{
			console.log("[DB]:Connecting to Registry Triplestore")
			exports.databaseTripleStore = dbTripleStore
		}

		if (cb) cb()
	})
}







exports.databaseClose = function(cb){
	if (exports.databaseRegistry) exports.databaseRegistry.close()
	if (exports.databaseShadowcat) exports.databaseShadowcat.close()
	if (exports.databaseTripleStore) exports.databaseTripleStore.close()
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


exports.returnCollectionsRegistry = function(collectionsName,cb){

	var collections = {}


	exports.databaseConnect(function(){

		collectionsName.forEach(function(collectionName){



			if (exports.collectionLookup[collectionName]){				
				collections[collectionName] = exports.collectionLookup[collectionName]
			}else{
				var collection = exports.databaseRegistry.collection(collectionName)
				exports.collectionLookup[collectionName] = collection
				collections[collectionName] = exports.collectionLookup[collectionName]				
			}

		})


		cb(null, collections)



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
			collection.createIndex("collectionDb", {background: true})	
			collection.createIndex("orderSequence", {background: true})
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
			collection.createIndex("matchedMms", {background: true})

			


			collection.createIndex({"title": "text"}, {background: true})
			collection.createIndex({"titleAlt": "text"}, {background: true})


			if (cb) cb()


		})
	})

}

// exports.dropSerialized = function(){
// 	exports.databaseConnect(function(){
// 		var collection = exports.databaseRegistry.collection('serialized')
// 		collection.drop(function(err,results){})
// 	})

// }


//---------

exports.prepareTripleStoreAgents = function(cb){
	exports.databaseConnectTripleStore(function(){


		//remove the any old stuff
		var collection = exports.databaseTripleStore.collection('agents')
		console.log("Dropping Table")
		//exports.dropSerialized()


		//delete any existing data first
		collection.drop(function(err,results){
			console.log("agents Table dropped")
			if (err){
				if (err.message != 'ns not found'){
					console.log(clc.redBright('prepare agents - drop collection'), clc.greenBright(err), console.dir(err))
				}
			}

			var collection = exports.databaseTripleStore.collection('agents')

			console.log("Creating Indexes")
			//now prepare the indexes
			collection.createIndex("viaf", {background: true, unique: true})			
			collection.createIndex("uri", {background: true, unique: true})
			//collection.createIndex("nameControlled", {background: true})			
			if (cb) cb()
		})

	})


		

}

exports.prepareTripleStoreResources = function(cb){
	exports.databaseConnectTripleStore(function(){


		//remove the any old stuff
		var collection = exports.databaseTripleStore.collection('resources')
		console.log("Dropping Table")
		//delete any existing data first
		collection.drop(function(err,results){
			console.log("resources Table dropped")
			if (err){
				if (err.message != 'ns not found'){
					console.log(clc.redBright('prepare resources - drop collection'), clc.greenBright(err), console.dir(err))
				}
			}

			var collection = exports.databaseTripleStore.collection('resources')

			console.log("Creating Indexes")
			//now prepare the indexes
			collection.createIndex("allAgents", {background: true})			
			collection.createIndex("allTerms", {background: true})			
			collection.createIndex("uri", {background: true, unique: true})

			if (cb) cb()
		})
	})
}


exports.newTripleStoreBulkOp = function(col,cb){
	exports.databaseConnectTripleStore(function(){
		var collection = exports.databaseTripleStore.collection(col)
		var bulk = collection.initializeUnorderedBulkOp()
		cb(bulk)
	})
}



exports.exportPDItemsRaw = function(cb){
 	
 	//remove the existing file
 	fs.writeFileSync('data/pd_mms_items.ndjson', "")
 	fs.writeFileSync('data/pd_mms_items_missing_from_dc.ndjson', "")

 	var solr_uuids = fs.readFileSync('data/pd-item-uuids.csv', "utf8")
 	solr_uuids=solr_uuids.split("\n")
 	console.log(solr_uuids.length)
 
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
				 				
				 
				 				if (solr_uuids.indexOf(doc._id)===-1){

					 				fs.appendFile('data/pd_mms_items_missing_from_dc.ndjson', out + "\n", function (err) {
					 					
					 				}) 

				 				}

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



//these are legacy used for PD export, but are useful for "just give me a DB pointer" type of deal

exports.returnDb = function(cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		if (err) console.log(err)
		cb(err,db)
	})
}
exports.returnDbShadowcat = function(cb){
	MongoClient.connect(mongoConnectURLShadowcat, function(err, db) {
		if (err) console.log(err)
		cb(err,db)
	})
}



