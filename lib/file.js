
var byline = require('byline')
var fs = require("fs")
var errorLib = require("../lib/error.js");
var clc = require('cli-color');
var parseCsv = require('csv-parse');

var exports = module.exports = {};


exports.streamCsvFile = function(filename,options,cb){

	//options is....optional
	if (!cb && options) {
		cb = options
		options = {escape : "\\"}
	}



	var stream = fs.createReadStream(filename, { encoding: 'utf8' });
	stream = byline.createStream(stream);


	stream.on('data', function(line) {


		stream.pause()




		try {



			parseCsv(line, options, function(err, item){


				if (err){



					console.log(clc.bgRedBright("--------------------------"))
					console.log(line)
					console.log(clc.bgRedBright("CSV PARSE Error " + err))
					console.log(clc.bgRedBright("--------------------------"))					
				}


				cb(item[0],function(){
					stream.resume()
					item = null
					return true
				})

			});


		}catch (e) {

			errorLib.error("Uncaught error in stream " + filename, e )

			//make sure we see this 
			console.log(clc.bgRedBright("--------------------------"))
			console.log(clc.bgRedBright("Uncaught error in stream " + filename + e))
			console.log(clc.bgRedBright("--------------------------"))

			stream.resume()

		}

	})

	stream.on('end', function () {

		cb(null)


	});


}


exports.streamJsonFile = function(filename,cb){

	var stream = fs.createReadStream(filename, { encoding: 'utf8' });
	stream = byline.createStream(stream);


	stream.on('data', function(line) {


		stream.pause()

		try {

			var item = JSON.parse(line)
			cb(item,function(){
				stream.resume()
				item = null
				return true
			})

		}catch (e) {

			errorLib.error("Uncaught error in stream " + filename, e )

			//make sure we see this 
			console.log(clc.bgRedBright("--------------------------"))
			console.log(clc.bgRedBright("Uncaught error in stream " + filename + e))
			console.log(clc.bgRedBright("--------------------------"))

			stream.resume()

		}

	})

	stream.on('end', function () {

		cb(null)


	});




}