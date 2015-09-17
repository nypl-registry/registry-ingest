var S = require('string')

var exports = module.exports = {}


exports.normalize = function(input){

	if (!input) return false

	//force to string
	input = input.toString()

	input = input.toLowerCase()

	input = S(input).unescapeHTML().s

	input = input.replace(/\s/g, "")


	return input

}

//pass a object full of identifers and it will return the values normalized
exports.normalizeIdents = function(input){

	if (!input) return false

	var results = {}

	for (var x in input){

		results[x] = exports.normalize(input[x])


	}

	return results

}


//pass a string and it will make sure it is in bnumber format
exports.normalizeBnumber = function(bnumber){

	if (!bnumber) return false

	bnumber = bnumber.toString()

	//take off the b for now
	bnumber = bnumber.replace("b",'')

	//split off any check sum thing
	bnumber = bnumber.split("~")[0]

	//if it is long (why?) cut off the extra digit
	if (bnumber.length > 8){
		bnumber = bnumber.substring(0,8)
	}


	//make sure this is a god damn number because people are sometimes confused what a bnumber should be
	if ( isNaN(bnumber) ){
		return false
	}else{
		return "b" + bnumber
	}

	return results

}



