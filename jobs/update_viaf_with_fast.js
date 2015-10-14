"use strict"

//This script will need like 20GB of ram, because it stores all the data internally for the final output.

var config = require("config")
var fs = require("fs")
var byline = require('byline')
var db = require("../lib/db.js")
var utils = require("../lib/utils.js")
var clc = require('cli-color')

var viafExtract =  __dirname + '/..' + config['Source']['viafFast']

var allLookup = {}
var count = 0

db.returnCollection("viafLookup",function(err,viafLookup,database){

	var stream = fs.createReadStream(viafExtract, { encoding: 'utf8' });
	stream = byline.createStream(stream);

	stream.on('data', function(line) {



		process.stdout.cursorTo(0)
		process.stdout.write(clc.black.bgYellowBright("Updating VIAF: " + ++count ))

		stream.pause()

		var fast = parseInt(line.split('/fast/')[1].split('>')[0])
		var viaf = parseInt(line.split('/viaf/')[1].split('>')[0])



		var updateRecord = {
			_id: viaf,
			fast: fast
		}

		viafLookup.update({ _id : updateRecord._id }, { $set: updateRecord }, { upsert: true} , function(err, result) {
			
			if (err) console.log(err)
			
			stream.resume()
			return true

		})	


		


	})



	stream.on('end', function () {
		console.log("Doneeeeee")
	})

})
