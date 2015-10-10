"use strict"
var assert = require('assert')
var should = require('should')
var tmsUtils = require("../lib/tms_utils.js");











describe('mmsUtils', function () {

	var testRecord = {"id":26994,"type":"Collection","uuid":"1837b570-c605-012f-2625-58d385a7bc34","solr_doc_hash":{"type":"collection","mms_id":26994,"uuid":"1837b570-c605-012f-2625-58d385a7bc34","mms_name":"The Newtonian system of philosophy, adapted to the capacities of young gentlemen and ladies ... being the substance of six lectures read to the Lilliputian Society, by Tom Telescope, A. M., and collected and methodized for the benefit of the youth of these Kingdoms, by their old friend Mr. Newbery ...","ingested":false,"org_unit_name_short":"Berg Collection","org_unit_code":"BRG","mms_org_unit_id":10002,"digitization_approved":null,"desc_md_status":"draft","title":["The  Newtonian system of philosophy, adapted to the capacities of young gentlemen and ladies ... being the substance of six lectures read to the Lilliputian Society, by Tom Telescope, A. M., and collected and methodized for the benefit of the youth of these Kingdoms, by their old friend Mr. Newbery ..."],"title_sort":[" Newtonian system of philosophy, adapted to the capacities of young gentlemen and ladies ... being the substance of six lectures read to the Lilliputian Society, by Tom Telescope, A. M., and collected and methodized for the benefit of the youth of these Kingdoms, by their old friend Mr. Newbery ..."],"title_primary":[true],"title_supplied":[true],"title_lang":["eng"],"title_script":[""],"title_type":[""],"title_authority":["",""],"title_uri":[""],"title_authority_record_id":[],"identifier_local_hades":["618679"], "identifier_local_image_id" : "1234567890", "identifier_idx_local_hades":["618679"],"identifier_local_other":["NYPG784271303-B"],"identifier_idx_local_other":["NYPG784271303-B"],"identifier_local_catnyp":["b1493851"],"identifier_idx_local_catnyp":["b1493851"],"identifier_local_bnumber":["b10483503"],"identifier_idx_local_bnumber":["b10483503"],"date":["1761-01-01T12:00:00Z"],"date_year":[1761],"date_point":["single"],"date_type":["dateIssued"],"date_qualifier":[""],"date_index":[0],"date_year_index":[0],"name":["Newbery, John (1713-1767)","Goldsmith, Oliver (1730?-1774)","Telescope, Tom"],"name_primary":[false,false,false],"name_type":["personal","personal","personal"],"name_authority":["naf","naf","naf"],"name_uri":["","",""],"name_role":["aut","aut","aut"],"name_authority_record_id":["","",""],"name_display_form":["","",""],"name_affiliation":["","",""],"name_description":["","",""],"note":["\"To the young gentlemen and ladies of Great Britain and Ireland, this philosophy of tops and balls is ... inscribed, by ... J. Newbery\": 3d prelim. p.","For variations see: Babson Institute Library Newton Collection, 115//","Imperfect: p. 111-112 mutilated, affecting 2 words of text.","Publisher's advertisements: p. 126-140.","Sometimes attributed to Oliver Goldsmith."],"note_type":["content","content","content","content","content"],"location_repository":["nn"],"location_division":["Berg Collection"],"location_shelflocator":[],"identifier_local_call":["Berg Coll. 77-645"],"identifier_idx_local_call":["Berg Coll. 77-645"]},"desc_xml":"<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<mods xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns=\"http://uri.nypl.org/schema/nypl_mods\" version=\"3.4\" xsi:schemaLocation=\"http://uri.nypl.org/schema/nypl_mods http://uri.nypl.org/schema/nypl_mods\">\n<titleInfo ID=\"titleInfo_0\" usage=\"primary\" supplied=\"no\" lang=\"eng\"><nonSort>The </nonSort><title>Newtonian system of philosophy, adapted to the capacities of young gentlemen and ladies ... being the substance of six lectures read to the Lilliputian Society, by Tom Telescope, A. M., and collected and methodized for the benefit of the youth of these Kingdoms, by their old friend Mr. Newbery ...</title></titleInfo><name ID=\"name_0\" type=\"personal\" authority=\"naf\" valueURI=\"\" authorityRecordId=\"\"><namePart>Newbery, John (1713-1767)</namePart><affiliation/><role><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/aut\" authority=\"marcrelator\" type=\"code\">aut</roleTerm><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/aut\" authority=\"marcrelator\" type=\"text\">Author</roleTerm></role></name><name ID=\"name_1\" type=\"personal\" authority=\"naf\" valueURI=\"\" authorityRecordId=\"\"><namePart>Goldsmith, Oliver (1730?-1774)</namePart><affiliation/><role><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/aut\" authority=\"marcrelator\" type=\"code\">aut</roleTerm><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/aut\" authority=\"marcrelator\" type=\"text\">Author</roleTerm></role></name><name ID=\"name_2\" type=\"personal\" authority=\"naf\" valueURI=\"\" authorityRecordId=\"\"><namePart>Telescope, Tom</namePart><affiliation/><role><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/aut\" authority=\"marcrelator\" type=\"code\">aut</roleTerm><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/aut\" authority=\"marcrelator\" type=\"text\">Author</roleTerm></role></name><originInfo ID=\"originInfo_0\"><dateCreated encoding=\"w3cdtf\">1861-08-22</dateCreated><dateIssued encoding=\"w3cdtf\" keyDate=\"yes\">1761</dateIssued><place><placeTerm>London</placeTerm></place></originInfo><note ID=\"note_0\" type=\"content\">\"To the young gentlemen and ladies of Great Britain and Ireland, this philosophy of tops and balls is ... inscribed, by ... J. Newbery\": 3d prelim. p.</note><note ID=\"note_1\" type=\"content\">For variations see: Babson Institute Library Newton Collection, 115//</note><note ID=\"note_2\" type=\"content\">Imperfect: p. 111-112 mutilated, affecting 2 words of text.</note><note ID=\"note_3\" type=\"content\">Publisher's advertisements: p. 126-140.</note><note ID=\"note_4\" type=\"content\">Sometimes attributed to Oliver Goldsmith.</note><identifier ID=\"identifier_0\" type=\"local_hades\" displayLabel=\"Hades struc ID (legacy)\">618679</identifier><identifier ID=\"identifier_1\" type=\"local_other\" displayLabel=\"RLIN/OCLC\">NYPG784271303-B</identifier><identifier ID=\"identifier_2\" type=\"local_catnyp\" displayLabel=\"CATNYP ID (legacy)\">b1493851</identifier><identifier ID=\"identifier_3\" type=\"local_bnumber\" displayLabel=\"NYPL catalog ID (B-number)\">b10483503</identifier><location ID=\"location_0\"><physicalLocation authority=\"marcorg\" type=\"repository\">nn</physicalLocation><physicalLocation type=\"division\">Berg Collection</physicalLocation><shelfLocator>Berg Coll. 77-645</shelfLocator></location></mods>\n"};

	it('should parse a mms record into identfiers used to match', function () {

		var r = mmsUtils.extractIds(testRecord)	

		r['mmsDb'].should.equal("26994")
		r['oclc'].should.equal('NYPG784271303-B')
		r['callNumber'].should.equal('Berg Coll. 77-645')

		r['dates'].length.should.equal(2)
		
		r.should.have.property('dateIssued')
		r.should.have.property('dateCreated')

		r['title'].should.equal('The Newtonian system of philosophy, adapted to the capacities of young gentlemen and ladies ... being the substance of six lectures read to the Lilliputian Society, by Tom Telescope, A. M., and collected and methodized for the benefit of the youth of these Kingdoms, by their old friend Mr. Newbery ...')
		
	})

	it('should parse a mods xml through libxmljs', function () {
		var xmlDoc = mmsUtils.returnXmlNode(xml1)
		xmlDoc.root().childNodes().length.should.equal(39)
	})

	it('extractAgents', function () {
		var xmlDoc = mmsUtils.returnXmlNode(xml1)
		var agents = mmsUtils.extractAgents(xmlDoc)

		agents[0].namePart.should.equal('Handel, George Frideric (1685-1759)')
		agents[0].type.should.equal('personal')
		agents[0].authority.should.equal('naf')
		agents[0].valueURI.should.equal(false)
		agents[0].usage.should.equal('primary')
		agents[0].role[0].should.equal('http://id.loc.gov/vocabulary/relators/cmp')
		agents[0].valueURI.should.equal(false)

	})

	it('extractSubjects', function () {
		var xmlDoc = mmsUtils.returnXmlNode(xml2)
		var subjects = mmsUtils.extractSubjects(xmlDoc)

		subjects[0].text.should.equal('Littman, David, 1933-')
		subjects[0].nameType.should.equal('personal')
		subjects[0].type.should.equal('name')
		subjects[0].authority.should.equal('naf')
		subjects[0].valueURI.should.equal(false)

		subjects[2].text.should.equal('Jews')
		subjects[2].type.should.equal('topic')
		subjects[2].authority.should.equal('lcsh')
		subjects[2].valueURI.should.equal('http://id.loc.gov/authorities/subjects/sh85070361')

	})

	it('extractDivision', function () {
		var xmlDoc = mmsUtils.returnXmlNode(xml2)
		var divsions = mmsUtils.extractDivision(xmlDoc)

		divsions[0].should.equal('JWS')

	})

	it('extractNotes', function () {

		var xmlDoc = mmsUtils.returnXmlNode(xml1)
		var notes = mmsUtils.extractNotes(xmlDoc)

		notes[0].type.should.equal('content')
		notes[0].text.should.equal('Drexel 5856.')

	})

	it('extractTitles', function () {
		var xmlDoc = mmsUtils.returnXmlNode(xml3)
		var titles = mmsUtils.extractTitles(xmlDoc)
		titles[0].title.should.equal('Paris-comique; journal illustré.')
		titles[0].lang.should.equal('fre')
		titles[2].subTitle.should.equal('Paris-comique;')
		titles[2].primary.should.equal(false)
	})

	it('extractLanguage', function () {
		var xmlDoc = mmsUtils.returnXmlNode(xml3)
		var languges = mmsUtils.extractLanguage(xmlDoc)
		languges[0].should.equal('http://id.loc.gov/vocabulary/iso639-2/fre')
	})

	it('extractDates', function () {
		var xmlDoc = mmsUtils.returnXmlNode(xml4)
		var dates = mmsUtils.extractDates(xmlDoc)		

		dates[0].field.should.equal('copyrightDate')
		dates[0].type.should.equal('w3cdtf')
		dates[0].point.should.equal('start')
		dates[0].keyDate.should.equal('yes')
	})


	it('extractAbstracts', function () {
		var xmlDoc = mmsUtils.returnXmlNode(xml5)
		var abstracts = mmsUtils.extractAbstracts(xmlDoc)
		abstracts[0].should.equal("Visual materials, including over 100,000 photographs, 5,000 set and costume designs for opera, and the Joseph Muller Collection of 6,000 fine prints of musicians' portraits from the 15th through the mid-20th centuries, provide rich documentation for all aspects of music, past and present.")
	})

	it('extractGenres', function () {
		var xmlDoc = mmsUtils.returnXmlNode(xml2)
		var genres = mmsUtils.extractGenres(xmlDoc)

		genres[0].authority.should.equal("lctgm")
		genres[0].valueURI.should.equal("http://id.loc.gov/vocabulary/graphicMaterials/tgm003185")
		genres[0].text.should.equal("Documents")


	})

	it('extractCollectionAndContainer', function () {
		var xmlDoc = mmsUtils.returnXmlNode(xml6)
		var collectionAndContainer = mmsUtils.extractCollectionAndContainer(xmlDoc)


		collectionAndContainer.parents[0].should.equal("caf53850-7a74-0132-1b13-58d385a7b928")
		collectionAndContainer.collection.should.equal("9ccb18b0-7a74-0132-a7b1-58d385a7b928")
		collectionAndContainer.container.should.equal("caf53850-7a74-0132-1b13-58d385a7b928")

		//it is a collection
		var xmlDoc = mmsUtils.returnXmlNode(xml4)
		var collectionAndContainer = mmsUtils.extractCollectionAndContainer(xmlDoc)

		collectionAndContainer.collection.should.equal(false)

	})

	it('extractCapture', function () {

		var results = mmsUtils.extractCapture(capture1)

		results.mmsDb.should.equal(5131049)
		results.imageId.should.equal("swope_631831")
		results.itemMmsDb.should.equal(4952600)
		results.itemUuid.should.equal('f89e0600-cf1f-0132-931b-58d385a7bbd0')
		results.name.should.equal("Actors (L-R) Roy Dotrice & Chris Sarandon in a scene fr. the American Shakespeare Theatre's production of the play \"Henry IV Part 1.\" (Stratford)")
		results.collectionMmsDb.should.equal(25790)
		results.containerMmsDb.should.equal(293115)
		results.notesOrder.length.should.equal(0)
		results.notesProcessing.length.should.equal(0)
		results.relationshipContent.should.equal("isReproductionOf")
		results.relationshipName.should.equal("single image")
		results.uuid.should.equal("14fae4d0-cf20-0132-72d3-58d385a7bbd0")
		results.workOrders.length.should.equal(0)


	})




})