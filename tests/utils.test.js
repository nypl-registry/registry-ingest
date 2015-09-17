var should = require('should')
var utils = require("../lib/utils.js");


describe('utils', function () {

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


})