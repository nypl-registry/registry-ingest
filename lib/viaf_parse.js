"use strict"

var file = require("../lib/file.js")
var config = require("config")
var utils = require("../lib/utils.js")
var db = require("../lib/db.js")
var errorLib = require("../lib/error.js")
var clc = require('cli-color')
var async = require("async")
var removeDiacritics = require('diacritics').remove
var libxmljs = require("libxmljs") 
require("string_score")



var exports = module.exports = {};



exports.parseXml= function(xml){
	var xmlDoc = libxmljs.parseXml(xml, {noblanks:true})
	return xmlDoc
}

exports.extractSourceCount = function(xmlDoc){
	var sourcesLength=0
	//grab how many sources this viaf record has
	var children = xmlDoc.root().childNodes()
	children.forEach(function(c){
		if (c.name() === 'sources'){
			sourcesLength = c.childNodes().length
		}
	})
	return sourcesLength
}

exports.extractType = function(xmlDoc){
	var type=false
	//grab how many sources this viaf record has
	var children = xmlDoc.root().childNodes()
	children.forEach(function(c){
		if (c.name() === 'nameType'){
			type = c.text().trim()
		}
	})
	return type
}

exports.hasLc = function(xmlDoc){
	var hasLc = false
	var children = xmlDoc.root().childNodes()
	children.forEach(function(c){
		if (c.name() === 'sources'){
			if(c.toString().search("LC|")>-1) hasLc = true
		}
	})
	return hasLc
}
exports.hasDbn = function(xmlDoc){
	var hasDbn = false
	var children = xmlDoc.root().childNodes()
	children.forEach(function(c){
		if (c.name() === 'sources'){
			if(c.toString().search("DNB|")>-1) hasDbn = true
		}
	})
	return hasDbn
}


exports.extractLcId = function(xmlDoc){
	var lcId = false
	var children = xmlDoc.root().childNodes()
	children.forEach(function(c){
		if (c.name() === 'sources'){
			var grandChildren = c.childNodes()

			grandChildren.forEach(function(gc){
				if (gc.text().search(/LC\|/)>-1){
					gc.attrs().forEach(function(attr){
						if (attr.name()==='nsid') lcId = attr.value()
					})					
				}
			})
		}
	})
	return lcId
}
exports.extractGettyId = function(xmlDoc){
	var gettyId = false
	var children = xmlDoc.root().childNodes()
	children.forEach(function(c){
		if (c.name() === 'sources'){
			var grandChildren = c.childNodes()

			grandChildren.forEach(function(gc){
				if (gc.text().search(/JPG\|/)>-1){
					gc.attrs().forEach(function(attr){
						if (attr.name()==='nsid') gettyId = attr.value()
					})					
				}
			})
		}
	})
	return gettyId
}



exports.extractWikidataId = function(xmlDoc){
	var wikiId = false
	var children = xmlDoc.root().childNodes()
	children.forEach(function(c){
		if (c.name() === 'sources'){
			var grandChildren = c.childNodes()

			grandChildren.forEach(function(gc){
				if (gc.text().search(/WKP\|/)>-1){
					gc.attrs().forEach(function(attr){
						if (attr.name()==='nsid') wikiId = attr.value()
					})					
				}
			})
		}
	})
	return wikiId
}

exports.extractLcTerm = function(xmlDoc){
	var lcTerm= false
	var children = xmlDoc.root().childNodes()
	children.forEach(function(c){
		if (c.name() === 'mainHeadings'){
			var grandChildren = c.childNodes()

			grandChildren.forEach(function(gc){
			
				if (gc.name() === 'data'){

					var greatGrandChildren = gc.childNodes()



					var name = false
					var hasLc = false

					greatGrandChildren.forEach(function(ggc){
						if (ggc.name() === 'text'){
							name = ggc.text()
						}
						if (ggc.name() === 'sources'){
							if (ggc.toString().search(/<s>LC<\/s>/)>-1){
								hasLc = true
							}
						}
					})

					if (hasLc){
						lcTerm = name
					}

				}


			})
		}
	})
	return lcTerm
}

exports.extractDnbTerm = function(xmlDoc){
	var dnbTerm= false
	var children = xmlDoc.root().childNodes()
	children.forEach(function(c){
		if (c.name() === 'mainHeadings'){
			var grandChildren = c.childNodes()

			grandChildren.forEach(function(gc){
			
				if (gc.name() === 'data'){

					var greatGrandChildren = gc.childNodes()

					var name = false
					var hasLc = false

					greatGrandChildren.forEach(function(ggc){
						if (ggc.name() === 'text'){
							name = ggc.text()
						}
						if (ggc.name() === 'sources'){
							if (ggc.toString().search(/<s>DNB<\/s>/)>-1){
								hasLc = true
							}
						}
					})

					if (hasLc){
						dnbTerm = name
					}

				}


			})
		}
	})
	return dnbTerm
}
exports.extractViafTerm = function(xmlDoc){

	var viafTerm = false
	var viafCount = -1

	var children = xmlDoc.root().childNodes()
	children.forEach(function(c){
		if (c.name() === 'mainHeadings'){
			var grandChildren = c.childNodes()

			grandChildren.forEach(function(gc){
			
				if (gc.name() === 'data'){

					var greatGrandChildren = gc.childNodes()

					var name = false
					var count = 0

					greatGrandChildren.forEach(function(ggc){
						if (ggc.name() === 'text'){
							name = ggc.text()
						}
						if (ggc.name() === 'sources'){
							count = ggc.childNodes().length
						}
					})

					if (count>viafCount){
						viafTerm = name
						viafCount = count
					}

				}


			})
		}
	})

	return viafTerm
}


exports.extractBirth = function(xmlDoc){
	var birth=false
	//grab how many sources this viaf record has
	var children = xmlDoc.root().childNodes()
	children.forEach(function(c){
		if (c.name() === 'birthDate'){
			birth = c.text().trim()
		}
	})
	return birth
}
exports.extractDeath = function(xmlDoc){
	var death=false
	//grab how many sources this viaf record has
	var children = xmlDoc.root().childNodes()
	children.forEach(function(c){
		if (c.name() === 'deathDate'){
			death = c.text().trim()
		}
	})
	return death
}


exports.extractDbpediaId = function(xmlDoc){
	var dbpediaId = false
	var children = xmlDoc.root().childNodes()
	children.forEach(function(c){
		if (c.name() === 'history'){
			var grandChildren = c.childNodes()
			grandChildren.forEach(function(gc){
				gc.attrs().forEach(function(attr){
					if (attr.value().search(/WKP\|/) > -1 && attr.value().search(/WKP\|Q/) == -1){
						dbpediaId = attr.value().split("WKP|")[1]
					}
				})

			})
		}
	})
	return dbpediaId
}

