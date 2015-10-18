"use strict"

var db = require("../lib/db.js");
var clc = require('cli-color');



var exports = module.exports = {}



exports.error = function(context,error,database){

	console.log(clc.redBright(context),clc.greenBright(error))

	//log it in the DB
	db.logError(context,error,database)

}



