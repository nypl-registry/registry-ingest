"use strict"

var config = require("config")
var fs = require("fs")
var byline = require('byline')


//this job just fixes the CSV files exported out of TMS, it removes the line breaks mid cells 
var tmsConsituents =  __dirname + '/..' + config['Source']['tmsConsituents']
var tmsObjects =  __dirname + '/..' + config['Source']['tmsObjects']
var tmsObjConXref =  __dirname + '/..' + config['Source']['tmsObjConXref']
var tmsAltNum =  __dirname + '/..' + config['Source']['tmsAltNum']
var tmsTitles =  __dirname + '/..' + config['Source']['tmsTitles']
var tmsDepartments =  __dirname + '/..' + config['Source']['tmsDepartments']
var tmsClassification =  __dirname + '/..' + config['Source']['tmsClassification']


var files = {

	//"tmsConsituents" : { regex: /[0-9]+,[0-9]+,[0-9]+,"/, filename : tmsConsituents }
	//"tmsObjects" : { regex: /^[0-9]+,"/, filename : tmsObjects }
	//"tmsObjConXref" : { regex: /^[0-9]+,[0-9]+,[0-9]+,[0-9]+,/, filename : tmsObjConXref }
	//"tmsAltNum" : { regex: /[0-9]+,[0-9]+,[0-9]+,"/, filename : tmsAltNum }
	//"tmsTitles" : { regex: /[0-9]+,[0-9]+,[0-9]+,"/, filename : tmsTitles }


}

for (var file in files){

	var stream = fs.createReadStream(files[file].filename, { encoding: 'utf8' });
	stream = byline.createStream(stream);

	var lineStorage = "", lastLine = ""

	stream.on('data', function(line) {


		stream.pause()



		var okay = true
		var m = line.match(files[file].regex)


		if (!m){
			okay = false
		}else if (m.index != 0){
			okay = false
		}

		if (okay){

			//this line is okay meaning the last line is ready to get get put into file
			if (lastLine.search(/\n/) == -1) lastLine = lastLine + "\n"

			lineStorage = lineStorage + lastLine

			lastLine = line
			
		}else{

			lastLine = lastLine.replace(/\n/g,"")

			//it was not okay, meaning this line belongs to the last line
			lastLine = lastLine + line.replace(/\n/g,"")


		}

		



		stream.resume()

	})

	stream.on('end', function () {


		lineStorage = lineStorage + lastLine

		console.log("Doneeeeee")
		var tmp = fs.createWriteStream(files[file].filename + '.new')
		tmp.end(lineStorage)

	});




}