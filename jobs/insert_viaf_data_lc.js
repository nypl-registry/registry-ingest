"use strict"

var config = require("config")
var fs = require("fs")
var byline = require('byline')
var N3 = require('n3')
var db = require("../lib/db.js")
var utils = require("../lib/utils.js")
var clc = require('cli-color')


var viafExtract =  __dirname + '/..' + config['Source']['viafExtractInsertLc']

var count = 0, updated = 0


db.returnCollection("viaf",function(err,viaf,database){

	var stream = fs.createReadStream(viafExtract, { encoding: 'utf8' })
	stream = byline.createStream(stream)

	stream.on('data', function(line) {

		stream.pause()

		process.stdout.cursorTo(0)
		process.stdout.write(clc.black.bgYellowBright("insert viaf: " + ++count + " | update: " + updated ))

		var lcData = JSON.parse(line)


		//grab the record from viaf
		viaf.find({lcId: lcData._id}).toArray(function(error,record){

			var update = false

			if (record.length>0){	

				record = record[0]
				lcData.normalized.forEach(function(normal){
					if (record.normalized.indexOf(normal) == -1){
						if (normal.length>3){
							if (isNaN(parseInt(normal))){
								record.normalized.push(normal)
								record.lcAlt = lcData.lcAlt
								update = true
							}
						}
					}
				})
			}

			if (update){				
				viaf.update({ _id : record._id }, { $set: record }, function(err, result) {	
					if (err) console.log(err)
					updated++
					return true
				})	
			}


		})

		process.nextTick(function(){
			if (count % 1000 === 0 && updated > 0){
				setTimeout(function(){ stream.resume()},1000)
			}else{
				stream.resume()
			}

		})		

	})

	stream.on('end', function () {
		console.log("Doneeeeee")	
		setTimeout(function(){
			database.close()
		},130000)	
	})

})

