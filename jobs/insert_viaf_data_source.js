"use strict"

var config = require("config")
var fs = require("fs")
var byline = require('byline')
var N3 = require('n3')
var db = require("../lib/db.js")
var utils = require("../lib/utils.js")
var clc = require('cli-color')


var viafExtract =  __dirname + '/..' + config['Source']['viafExtractInsertSource']

var allLookup = {}
var count = 0

db.prepareViafLookup(function(){

	db.returnCollection("viaf",function(err,viaf,database){

		var stream = fs.createReadStream(viafExtract, { encoding: 'utf8' });
		stream = byline.createStream(stream);

		stream.on('data', function(line) {

			stream.pause()



			process.stdout.cursorTo(0)
			process.stdout.write(clc.black.bgYellowBright("insert viaf: " + ++count ))


			var updateRecord = JSON.parse(line)


			viaf.update({ _id : updateRecord._id }, { $set: updateRecord }, { upsert: true} , function(err, result) {				
				if (err) console.log(err)
				return true
			})		

			if (count % 10000 === 0){
				setTimeout(function(){ stream.resume()},2500)
			}else{
				stream.resume()
			}

			

		})

		stream.on('end', function () {


			console.log("Doneeeeee")	
			setTimeout(function(){
				database.close()
			},130000)		
			
		})

	})

})


