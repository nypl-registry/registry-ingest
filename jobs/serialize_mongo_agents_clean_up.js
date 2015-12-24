"use strict"

var cluster = require('cluster')
var serializeGeneral = require("../lib/serialize_utils.js")
var utils = require("../lib/utils.js")


serializeGeneral.cleanUpEmptyNormalizedNames(function(){


	process.exit()


})