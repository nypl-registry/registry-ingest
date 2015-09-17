
var byline = require('byline')
var fs = require("fs")
var errorLib = require("../lib/error.js");
var clc = require('cli-color');

var exports = module.exports = {};



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