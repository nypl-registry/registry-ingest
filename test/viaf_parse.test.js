var should = require('should')
var viafParse = require('../lib/viaf_parse.js')
var fs = require("fs");




describe('viaf parse', function () {

	var xml = fs.readFileSync('test/viaf_cluster.xml', 'utf8');

	var xmlDoc= viafParse.parseXml(xml)


	it('extractSourceCount', function () {
		viafParse.extractSourceCount(xmlDoc).should.equal(27)		
	})
	it('hasLc', function () {
		viafParse.hasLc(xmlDoc).should.equal(true)
	})
	it('hasDbn', function () {
		viafParse.hasDbn(xmlDoc).should.equal(true)
	})
	it('extractLcId', function () {
		viafParse.extractLcId(xmlDoc).should.equal("n80036674")
	})
	it('extractGettyId', function () {
		viafParse.extractGettyId(xmlDoc).should.equal("500290917")
	})
	it('extractType', function () {
		viafParse.extractType(xmlDoc).should.equal("Personal")
	})
	it('extractLcTerm', function () {
		viafParse.extractLcTerm(xmlDoc).should.equal("Kerouac, Jack, 1922-1969")
	})
	it('extractDnbTerm', function () {
		viafParse.extractDnbTerm(xmlDoc).should.equal("Kerouac, Jack")
	})
	it('extractViafTerm', function () {
		viafParse.extractViafTerm(xmlDoc).should.equal("Kerouac, Jack, 1922-1969")
	})
	it('extractWikidataId', function () {
		viafParse.extractWikidataId(xmlDoc).should.equal("Q160534")
	})
	it('extractBirth', function () {
		viafParse.extractBirth(xmlDoc).should.equal("1922-03-12")
	})
	it('extractDeath', function () {
		viafParse.extractDeath(xmlDoc).should.equal("1969-10-21")
	})
	it('extractDbpediaId', function () {
		viafParse.extractDbpediaId(xmlDoc).should.equal("Jack_Kerouac")
	})
	


})