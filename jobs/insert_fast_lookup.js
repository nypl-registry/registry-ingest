"use strict"

var config = require("config")
var fs = require("fs")
var byline = require('byline')
var N3 = require('n3')
var db = require("../lib/db.js")
var utils = require("../lib/utils.js")
var clc = require('cli-color')
var async = require("async")


var fastChronological =  __dirname + '/..' + config['Source']['fastChronological'] + ".json"
var fastEvent =  __dirname + '/..' + config['Source']['fastEvent'] + ".json"
var fastFormGenre =  __dirname + '/..' + config['Source']['fastFormGenre'] + ".json"
var fastGeographic =  __dirname + '/..' + config['Source']['fastGeographic'] + ".json"
var fastTitle =  __dirname + '/..' + config['Source']['fastTitle'] + ".json"
var fastTopical =  __dirname + '/..' + config['Source']['fastTopical'] + ".json"

var files = [fastChronological,fastEvent,fastFormGenre,fastGeographic,fastTitle,fastTopical]

var fastLookup = {}
var sameAsLookup = {}
var count = 0

db.prepareFastLookup(function(){

	db.returnCollection("fastLookup",function(err,fastLookup,database){


		async.eachSeries(files, function(file, eachCallback) {

			var type = false

			if (file.search(/Chronological/i) > -1) type = "terms:Chronological"
			if (file.search(/Event/i) > -1) type = "terms:Event"
			if (file.search(/FormGenre/i) > -1) type = "terms:FormGenre"
			if (file.search(/Geographic/i) > -1) type = "terms:Geographic"
			if (file.search(/Title/i) > -1) type = "terms:Title"
			if (file.search(/Topical/i) > -1) type = "terms:Topical"


			console.log(type)
			var stream = fs.createReadStream(file, { encoding: 'utf8' });
			stream = byline.createStream(stream);

			stream.on('data', function(line) {

				stream.pause()

				process.stdout.cursorTo(0)
				process.stdout.write(clc.black.bgYellowBright("insert fast: " + ++count ))

				var updateRecord = JSON.parse(line)

				updateRecord._id = updateRecord.fast
				updateRecord.type = type


				delete updateRecord.fast

				fastLookup.update({ _id : updateRecord._id }, { $set: updateRecord }, { upsert: true} , function(err, result) {
					
					if (err) console.log(err)
					return true

				})		

				if (count % 10000 === 0){
					setTimeout(function(){ stream.resume()},5000)
				}else{
					stream.resume()
				}



			})



			stream.on('end', function () {

				count = 0
				//now we need to add in all the same as terms
				eachCallback()



			})
				


		}, function(err){

			console.log("Completed All Files")
			console.log("Doneeeeee")	
			setTimeout(function(){

				database.close()
			},130000)		


		})

	})

})




