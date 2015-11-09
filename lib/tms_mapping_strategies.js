"use strict"

var file = require("../lib/file.js")
var config = require("config")
var utils = require("../lib/utils.js")
var db = require("../lib/db.js")
var errorLib = require("../lib/error.js")
var clc = require('cli-color')
var async = require("async")
var removeDiacritics = require('diacritics').remove

require("string_score")

var exports = module.exports = {};


exports.buildShadowcatMaterialKLookup = function(cb){

	var count = 0, countFound = 0
	db.returnCollection("shadowcatMaterialKLookup",function(err,shadowcatMaterialKLookup,shadowcatMaterialKLookupDatabase){


		//set the index on the fields we need for the lookup
		shadowcatMaterialKLookup.createIndex('sc:callnumber', {background: true})

		shadowcatMaterialKLookup.remove({},function(err,results){

			db.returnCollectionShadowcat("bib",function(err,shadowcatBib,shadowcatDatabase){


				var cursor = shadowcatBib.find({},{'sc:callnumber':1, 'fixedFields.30':1})
				
				cursor.on('data', function(bib) {
					
					
					if (bib.fixedFields){
						if (bib.fixedFields['30']){

							if (bib.fixedFields['30'].value){

								if (bib.fixedFields['30'].value.trim() === 'k'){

									shadowcatMaterialKLookup.insert(bib,function(err,results){
										cursor.resume()
									})
									countFound++
								}
							}
						}
					}

					count++

					process.stdout.cursorTo(0)
					process.stdout.write(clc.black.bgGreenBright("" + count + " | countFound: " + countFound ))

				})


				cursor.once('end', function() {
						
					setTimeout(function(){
						console.log("buildShadowcatMaterialKLookup - Done!")




						cb()
						shadowcatMaterialKLookupDatabase.close()
						shadowcatDatabase.close()

					},5000)

				})




			})

		})

	})


}









