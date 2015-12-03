var should = require('should')
var utils = require("../lib/utils.js");



describe('utils', function () {

	it('normalizeAndDiacritics', function () {
		utils.normalizeAndDiacritics("González Hernández, Rafael").should.equal("gonzalez hernandez rafael")
	})

	it('normalizeAndDiacritics', function () {
		utils.normalizeAndDiacritics("Voronikhina, L︠i︡udmila Nikolaevna.").should.equal("voronikhina liudmila nikolaevna")
	})

	it('should take funky string and lowercase remove whitespace and convert any html codes', function () {
		utils.normalize("     Hello There  4  ").should.equal("hellothere4")
		utils.normalize("Hello &gt; There").should.equal("hello>there")


		utils.normalize(false).should.equal(false)

		utils.normalize(null).should.equal(false)
		utils.normalize(1234).should.equal('1234')
	})


	it('should take funky object full of identifiers and normalize all of them', function () {
	

		var test = { "bNumber" : "b123 456", "callNumber" : "*MAT 98z" };

		test = utils.normalizeIdents(test)
		
		test['bNumber'].should.equal("b123456")
		test['callNumber'].should.equal("*mat98z")



	})

	it('should a bnumber and make sure it is a bnumber formated to specific style: no b', function () {

		r = utils.normalizeBnumber("12345678")
		r.should.equal('b12345678')

	})

	it('should a bnumber and make sure it is a bnumber formated to specific style: check suffix', function () {

		r = utils.normalizeBnumber("b12345678~S1")
		r.should.equal("b12345678")

	})

	it('should a bnumber and make sure it is a bnumber formated to specific style: normal', function () {

		r = utils.normalizeBnumber("b123456")
		r.should.equal("b123456")

	})

	it('should a bnumber and make sure it is a bnumber formated to specific style: not a b number', function () {

		r = utils.normalizeBnumber("NYP-123543-A1")
		r.should.equal(false)

	})

	it('should a bnumber and make sure it is a bnumber formated to specific style: extra digit', function () {

		r = utils.normalizeBnumber("b1234567890")
		r.should.equal("b12345678")

	})

	it('should use the overlap library return precentage two phrases are the same 100%', function () {		
		var r = utils.percentOverlap("Joe Laurie, Jr. papers, 1880-1950.",'Joe Laurie, Jr. papers, 1880-1950.')
		r.should.equal(100)
	})

	it('should use the overlap library return precentage two phrases are the same 100%', function () {		
		var r = utils.percentOverlap('Joe Laurie, Jr. papers, 1880-1950.',"Joe Laurie papers")
		r.should.equal(50)
	})

	
	it('should take two strings and return their similarity no fuzzy', function () {
		r = compare.compareTitles('Richard Tucker photographs, 1934-1951', 'Richard Tucker photographs')
		r.should.be.above(0.8)
	})

	it('should take two strings and return their similarity with fuzzy', function () {
		r = compare.compareTitles('Richard Tucker photographs', 'Richardersd Tuckers [sic] photographs',0.75)
		r.should.be.above(0.75)
	})


	it('should take two strings and compare them by words: non-fuzzy', function () {
		r = compare.compareByWords("Deposition of Christian Goodman in Lincoln's hand", 'A. D folio (1 leaf). Deposition of Christian Goodman')
		r.should.equal(true)
	})

	it('should take two strings and compare them by words: fuzzy', function () {
		r = compare.compareByWords("Deposition of Christian Goodman in Lincoln's hand", 'A. D folio (1 leaf). Depositions of Christians Goodman',true)
		r.should.equal(true)
	})



})