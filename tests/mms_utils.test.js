"use strict"
var assert = require('assert')
var should = require('should')
var mmsUtils = require("../lib/mms_utils.js");

var r1 = {"id":27636,"type":"Collection","uuid":"c13bad20-c606-012f-3b99-58d385a7bc34","solr_doc_hash":{"type":"collection","mms_id":27636,"uuid":"c13bad20-c606-012f-3b99-58d385a7bc34","mms_name":"Airs, overtures and other pieces for the harpsichord","ingested":false,"org_unit_name_short":"Music Division","org_unit_code":"MUS","mms_org_unit_id":"10007","desc_md_status":"approved","title":[" Airs, overtures and other pieces for the harpsichord"],"title_sort":[" Airs, overtures and other pieces for the harpsichord"],"title_primary":[true],"title_supplied":[true],"title_lang":[""],"title_script":[""],"title_type":[""],"title_authority":["",""],"title_uri":[""],"title_authority_record_id":[],"identifier_local_hades":["1959739"],"identifier_idx_local_hades":["1959739"],"identifier_local_bnumber":["b11513780"],"identifier_idx_local_bnumber":["b11513780"],"identifier_local_catnyp":["b2545250"],"identifier_idx_local_catnyp":["b2545250"],"identifier_local_other":["NYPG91-C7064"],"identifier_idx_local_other":["NYPG91-C7064"],"typeofResource":["notated music"],"typeofResource_primary":[false],"typeofResource_manuscript":[false],"typeofResource_collection":[false],"date_text":["17--"],"date_text_type":["dateIssued"],"date_text_index":[0],"date_year_index":[],"date_index":[],"name":["Handel, George Frideric (1685-1759)","Rimbault, Edward F. (Edward Francis) (1816-1876)","Wesley, Charles (1757-1834)","Smith, John Christopher (1683-1763)"],"name_primary":[true,false,false,false],"name_type":["personal","personal","personal","personal"],"name_authority":["naf","naf","naf","naf"],"name_uri":["","","",""],"name_role":["cmp","fmo","fmo","mcp"],"name_authority_record_id":["","","",""],"name_display_form":["","","",""],"name_affiliation":["","","",""],"name_description":["","","",""],"physicalDescription_form":[""],"physicalDescription_form_authority":[""],"physicalDescription_form_valueURI":[],"physicalDescription_form_authorityRecordId":[],"physicalDescription_extent":["110 p. of ms. music."],"physicalDescription_note":[""],"physicalDescription_note_type":[""],"subject":["Harpsichord music","Harpsichord music, Arranged"],"subject_idx":[],"subject_type":["topic","topic"],"subject_authority":["lcsh","lcsh"],"subject_uri":[null,null],"note":["Drexel 5856.","In the autograph of John Christopher Smith ; with autograph notes by Charles Wesley and Dr. Rimbault.","Microfilmed: *ZB-2332"],"note_type":["content","content","content"],"location_repository":["nn"],"location_division":["Music Division"],"location_shelflocator":[],"identifier_local_call":["Drexel 5856"],"identifier_idx_local_call":["Drexel 5856"]},"full_xml":"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<mods xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns=\"http://www.loc.gov/mods/v3\" version=\"3.4\" xsi:schemaLocation=\"http://www.loc.gov/mods/v3 http://www.loc.gov/standards/mods/v3/mods-3-4.xsd\">\n  <titleInfo usage=\"primary\" supplied=\"no\">\n    <title>Airs, overtures and other pieces for the harpsichord</title>\n  </titleInfo>\n  <name type=\"personal\" authority=\"naf\" valueURI=\"\" usage=\"primary\">\n    <namePart>Handel, George Frideric (1685-1759)</namePart>\n    <role>\n      <roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/cmp\" authority=\"marcrelator\" type=\"code\">cmp</roleTerm>\n      <roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/cmp\" authority=\"marcrelator\" type=\"text\">Composer</roleTerm>\n    </role>\n  </name>\n  <name type=\"personal\" authority=\"naf\" valueURI=\"\">\n    <namePart>Rimbault, Edward F. (Edward Francis) (1816-1876)</namePart>\n    <role>\n      <roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/fmo\" authority=\"marcrelator\" type=\"code\">fmo</roleTerm>\n      <roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/fmo\" authority=\"marcrelator\" type=\"text\">Former owner</roleTerm>\n    </role>\n  </name>\n  <name type=\"personal\" authority=\"naf\" valueURI=\"\">\n    <namePart>Wesley, Charles (1757-1834)</namePart>\n    <role>\n      <roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/fmo\" authority=\"marcrelator\" type=\"code\">fmo</roleTerm>\n      <roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/fmo\" authority=\"marcrelator\" type=\"text\">Former owner</roleTerm>\n    </role>\n  </name>\n  <name type=\"personal\" authority=\"naf\" valueURI=\"\">\n    <namePart>Smith, John Christopher (1683-1763)</namePart>\n    <role>\n      <roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/mcp\" authority=\"marcrelator\" type=\"code\">mcp</roleTerm>\n      <roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/mcp\" authority=\"marcrelator\" type=\"text\">Music copyist</roleTerm>\n    </role>\n  </name>\n  <typeOfResource>notated music</typeOfResource>\n  <originInfo>\n    <dateIssued>17--</dateIssued>\n  </originInfo>\n  <physicalDescription>\n    <extent>110 p. of ms. music.</extent>\n  </physicalDescription>\n  <note type=\"content\">Drexel 5856.</note>\n  <note type=\"content\">In the autograph of John Christopher Smith ; with autograph notes by Charles Wesley and Dr. Rimbault.</note>\n  <note type=\"content\">Microfilmed: *ZB-2332</note>\n  <subject>\n    <topic authority=\"lcsh\">Harpsichord music</topic>\n  </subject>\n  <subject>\n    <topic authority=\"lcsh\">Harpsichord music, Arranged</topic>\n  </subject>\n  <identifier type=\"local_hades\" displayLabel=\"Hades struc ID (legacy)\">1959739</identifier>\n  <identifier type=\"local_bnumber\" displayLabel=\"NYPL catalog ID (B-number)\">b11513780</identifier>\n  <identifier type=\"local_catnyp\" displayLabel=\"CATNYP ID (legacy)\">b2545250</identifier>\n  <identifier type=\"local_other\" displayLabel=\"RLIN/OCLC\">NYPG91-C7064</identifier>\n  <location>\n    <physicalLocation type=\"division\">Music Division</physicalLocation>\n    <shelfLocator>Drexel 5856</shelfLocator>\n    <physicalLocation type=\"division_short_name\">Music Division</physicalLocation>\n    <physicalLocation type=\"code\">MUS</physicalLocation>\n  </location>\n  <identifier type=\"uuid\">c13bad20-c606-012f-3b99-58d385a7bc34</identifier>\n</mods>\n","desc_xml":"<mods version=\"3.4\" schemaLocation=\"http://uri.nypl.org/schema/nypl_mods http://uri.nypl.org/schema/nypl_mods\"><titleInfo ID=\"titleInfo_0\" usage=\"primary\" supplied=\"no\"><title>Airs, overtures and other pieces for the harpsichord</title></titleInfo><name ID=\"name_0\" type=\"personal\" authority=\"naf\" valueURI=\"\" usage=\"primary\" authorityRecordId=\"\"><namePart>Handel, George Frideric (1685-1759)</namePart><affiliation/><role><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/cmp\" authority=\"marcrelator\" type=\"code\">cmp</roleTerm><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/cmp\" authority=\"marcrelator\" type=\"text\">Composer</roleTerm></role></name><name ID=\"name_1\" type=\"personal\" authority=\"naf\" valueURI=\"\" authorityRecordId=\"\"><namePart>Rimbault, Edward F. (Edward Francis) (1816-1876)</namePart><affiliation/><role><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/fmo\" authority=\"marcrelator\" type=\"code\">fmo</roleTerm><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/fmo\" authority=\"marcrelator\" type=\"text\">Former owner</roleTerm></role></name><name ID=\"name_2\" type=\"personal\" authority=\"naf\" valueURI=\"\" authorityRecordId=\"\"><namePart>Wesley, Charles (1757-1834)</namePart><affiliation/><role><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/fmo\" authority=\"marcrelator\" type=\"code\">fmo</roleTerm><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/fmo\" authority=\"marcrelator\" type=\"text\">Former owner</roleTerm></role></name><name ID=\"name_3\" type=\"personal\" authority=\"naf\" valueURI=\"\" authorityRecordId=\"\"><namePart>Smith, John Christopher (1683-1763)</namePart><affiliation/><role><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/mcp\" authority=\"marcrelator\" type=\"code\">mcp</roleTerm><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/mcp\" authority=\"marcrelator\" type=\"text\">Music copyist</roleTerm></role></name><typeOfResource ID=\"typeOfResource_0\">notated music</typeOfResource><originInfo ID=\"originInfo_0\"><dateIssued>17--</dateIssued></originInfo><note ID=\"note_0\" type=\"content\">Drexel 5856.</note><note ID=\"note_1\" type=\"content\">In the autograph of John Christopher Smith ; with autograph notes by Charles Wesley and Dr. Rimbault.</note><note ID=\"note_2\" type=\"content\">Microfilmed: *ZB-2332</note><subject ID=\"subject_0\"><topic authority=\"lcsh\">Harpsichord music</topic></subject><subject ID=\"subject_1\"><topic authority=\"lcsh\">Harpsichord music, Arranged</topic></subject><identifier ID=\"identifier_0\" type=\"local_hades\" displayLabel=\"Hades struc ID (legacy)\">1959739</identifier><identifier ID=\"identifier_1\" type=\"local_bnumber\" displayLabel=\"NYPL catalog ID (B-number)\">b11513780</identifier><identifier ID=\"identifier_2\" type=\"local_catnyp\" displayLabel=\"CATNYP ID (legacy)\">b2545250</identifier><identifier ID=\"identifier_3\" type=\"local_other\" displayLabel=\"RLIN/OCLC\">NYPG91-C7064</identifier><location ID=\"location_0\"><physicalLocation type=\"division\">Music Division</physicalLocation><shelfLocator>Drexel 5856</shelfLocator></location><physicalDescription ID=\"physicalDescription_0\"><extent>110 p. of ms. music.</extent></physicalDescription></mods>","created":"2012-08-11 13:20:21 -0400"}


var xml1 = r1.full_xml
/*
 
 xml1 

<?xml version="1.0" encoding="UTF-8"?>
<mods xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.loc.gov/mods/v3" version="3.4" xsi:schemaLocation="http://www.loc.gov/mods/v3 http://www.loc.gov/standards/mods/v3/mods-3-4.xsd">
  <titleInfo usage="primary" supplied="no">
    <title>Airs, overtures and other pieces for the harpsichord</title>
  </titleInfo>
  <name type="personal" authority="naf" valueURI="" usage="primary">
    <namePart>Handel, George Frideric (1685-1759)</namePart>
    <role>
      <roleTerm valueURI="http://id.loc.gov/vocabulary/relators/cmp" authority="marcrelator" type="code">cmp</roleTerm>
      <roleTerm valueURI="http://id.loc.gov/vocabulary/relators/cmp" authority="marcrelator" type="text">Composer</roleTerm>
    </role>
  </name>
  <name type="personal" authority="naf" valueURI="">
    <namePart>Rimbault, Edward F. (Edward Francis) (1816-1876)</namePart>
    <role>
      <roleTerm valueURI="http://id.loc.gov/vocabulary/relators/fmo" authority="marcrelator" type="code">fmo</roleTerm>
      <roleTerm valueURI="http://id.loc.gov/vocabulary/relators/fmo" authority="marcrelator" type="text">Former owner</roleTerm>
    </role>
  </name>
  <name type="personal" authority="naf" valueURI="">
    <namePart>Wesley, Charles (1757-1834)</namePart>
    <role>
      <roleTerm valueURI="http://id.loc.gov/vocabulary/relators/fmo" authority="marcrelator" type="code">fmo</roleTerm>
      <roleTerm valueURI="http://id.loc.gov/vocabulary/relators/fmo" authority="marcrelator" type="text">Former owner</roleTerm>
    </role>
  </name>
  <name type="personal" authority="naf" valueURI="">
    <namePart>Smith, John Christopher (1683-1763)</namePart>
    <role>
      <roleTerm valueURI="http://id.loc.gov/vocabulary/relators/mcp" authority="marcrelator" type="code">mcp</roleTerm>
      <roleTerm valueURI="http://id.loc.gov/vocabulary/relators/mcp" authority="marcrelator" type="text">Music copyist</roleTerm>
    </role>
  </name>
  <typeOfResource>notated music</typeOfResource>
  <originInfo>
    <dateIssued>17--</dateIssued>
  </originInfo>
  <physicalDescription>
    <extent>110 p. of ms. music.</extent>
  </physicalDescription>
  <note type="content">Drexel 5856.</note>
  <note type="content">In the autograph of John Christopher Smith ; with autograph notes by Charles Wesley and Dr. Rimbault.</note>
  <note type="content">Microfilmed: *ZB-2332</note>
  <subject>
    <topic authority="lcsh">Harpsichord music</topic>
  </subject>
  <subject>
    <topic authority="lcsh">Harpsichord music, Arranged</topic>
  </subject>
  <identifier type="local_hades" displayLabel="Hades struc ID (legacy)">1959739</identifier>
  <identifier type="local_bnumber" displayLabel="NYPL catalog ID (B-number)">b11513780</identifier>
  <identifier type="local_catnyp" displayLabel="CATNYP ID (legacy)">b2545250</identifier>
  <identifier type="local_other" displayLabel="RLIN/OCLC">NYPG91-C7064</identifier>
  <location>
    <physicalLocation type="division">Music Division</physicalLocation>
    <shelfLocator>Drexel 5856</shelfLocator>
    <physicalLocation type="division_short_name">Music Division</physicalLocation>
    <physicalLocation type="code">MUS</physicalLocation>
  </location>
  <identifier type="uuid">c13bad20-c606-012f-3b99-58d385a7bc34</identifier>
</mods>
*/

var r2 = {"id":29612,"type":"Collection","uuid":"d00ff8a0-c625-012f-0c79-58d385a7bc34","solr_doc_hash":{"type":"collection","mms_id":29612,"uuid":"d00ff8a0-c625-012f-0c79-58d385a7bc34","mms_name":"Bat Ye'or and David Littman papers, 1961-","ingested":false,"org_unit_name_short":"Dorot Jewish Division","org_unit_code":"JWS","mms_org_unit_id":"10023","desc_md_status":"draft","title":[" Bat Ye'or and David Littman papers, 1961-"],"title_sort":[" Bat Ye'or and David Littman papers, 1961-"],"title_primary":[true],"title_supplied":[false],"title_lang":[""],"title_script":[""],"title_type":[""],"title_authority":["",""],"title_uri":[""],"title_authority_record_id":[],"identifier_local_hades":["2051837"],"identifier_idx_local_hades":["2051837"],"identifier_local_other":["191804298"],"identifier_idx_local_other":["191804298"],"identifier_local_bnumber":["b16779704"],"identifier_idx_local_bnumber":["b16779704"],"identifier_local_catnyp":["b8943236"],"identifier_idx_local_catnyp":["b8943236"],"identifier_local_mss":["19869"],"identifier_idx_local_mss":["19869"],"typeofResource":["text"],"typeofResource_primary":[false],"typeofResource_manuscript":[false],"typeofResource_collection":[true],"date":["1961-01-01T12:00:00Z"],"date_year":[1961],"date_point":["start"],"date_type":["dateCreated"],"date_qualifier":[""],"date_index":[0],"date_year_index":[0],"name":["Bat Ye\u02bcor","Littman, David, 1933-"],"name_primary":[false,false],"name_type":["personal","personal"],"name_authority":["naf","naf"],"name_uri":["","http://id.loc.gov/authorities/names/n91093114"],"name_role":["col","aut"],"name_authority_record_id":["","n91093114"],"name_display_form":["",""],"name_affiliation":["",""],"name_description":["",""],"genre":["Documents"],"genre_primary":[false],"genre_authority":["lctgm"],"genre_uri":["http://id.loc.gov/vocabulary/graphicMaterials/tgm003185"],"genre_authority_record_id":["tgm003185"],"physicalDescription_form":[""],"physicalDescription_form_authority":[""],"physicalDescription_form_valueURI":[],"physicalDescription_form_authorityRecordId":[],"physicalDescription_extent":["38 linear feet (146 boxes)."],"physicalDescription_note":[""],"physicalDescription_note_type":[""],"subject":["Littman, David, 1933-","Bat Ye\u02bcor","Jews","Islamic countries","World Organization of Jews from Arab Countries"],"subject_idx":[],"subject_type":["name","name","topic","geographic","name"],"subject_authority":["naf","naf","lcsh","lcsh","naf"],"subject_uri":["","","http://id.loc.gov/authorities/subjects/sh85070361","http://id.loc.gov/authorities/subjects/sh85068436",""],"note":["Collection consists of drafts and proofs of books, articles, lectures and pamphlets by Bat Ye'or, and related documents; statements of David Littman at the United Nations Commission on Human Rights; and correspondence of Bat Ye'or and David Littman. Principal correspondents include Andr\u00e9 Chouraqui, Jacques Ellul, Oriana Fallaci, Sir Martin Gilbert, Archduke Otto von Habsburg, YehoshafatHarkabi, H.Z. Hirschberg, Teddy Kollek, John Laffin, Albert Memmi and Robert Wistrich.","Collection consists of drafts and proofs of books, articles, lectures and pamphlets by Bat Ye'or, and related documents; statements of David Littman at the United Nations Commission on Human Rights; and correspondence of Bat Ye'or and David Littman. Principal correspondents include Andr\u00e9 Chouraqui, Jacques Ellul, Oriana Fallaci, Sir Martin Gilbert, Archduke Otto von Habsburg, YehoshafatHarkabi, H.Z. Hirschberg, Teddy Kollek, John Laffin, Albert Memmi and Robert Wistrich.","Gisele Orebi Littman is the author (as Bat Ye'or since 1974) of numerous books, the most influential among them being: The dhimmi: Jews and Christians under Islam; The decline of Eastern Christianity under Islam: from jihad to dhimmitude; Islam and Dhimmitude: where civilizations collide; and Eurabia: the Euro-Arab axis. She is responsible for the currency enjoyed by the terms dhimmitude and Eurabia in the political discourse at the start of the 21st century. David Littman is the author of a number of articles about Jews in Islamic countries in the 19th century. With Yehoshafat Harkabi, he published (as D.F. Green): Arab theologians on Jews and Israel. His role in Operation Mural, a covert operation conducted by the Mossad in Casablanca, March 16-July 24, 1961, to enable the clandestine emigration of Moroccan Jewish children to Israel on the pretext of providing holidays and health care in Switzerland, is the subject of the documentary film titled \"Operation Mural: Casablanca 1961,\" produced in Israel in 2007. Since 1985, he has been an NGO representative at the United Nations Commission on Human Rights in Geneva, serving as spokesman at various times for the World Union for Progressive Judaism (1985-1991 and 2001- ), International Fellowship of Reconciliation (1991-1994), World Federalist Movement (1994-1997), and the Association for World Education (1997- )."],"note_type":["content","content","content"],"location_repository":["nn"],"location_division":["JWS"],"location_shelflocator":[],"identifier_local_call":["**P (Bat Ye'or and David Littman Papers)"],"identifier_idx_local_call":["**P (Bat Ye'or and David Littman Papers)"]},"full_xml":"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<mods xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns=\"http://www.loc.gov/mods/v3\" version=\"3.4\" xsi:schemaLocation=\"http://www.loc.gov/mods/v3 http://www.loc.gov/standards/mods/v3/mods-3-4.xsd\">\n  <titleInfo type=\"\" authority=\"\" usage=\"primary\" lang=\"\" script=\"\">\n    <title>Bat Ye'or and David Littman papers, 1961-</title>\n  </titleInfo>\n  <name type=\"personal\" authority=\"naf\" valueURI=\"\">\n    <namePart>Bat Ye\u02bcor</namePart>\n    <role>\n      <roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/col\" authority=\"marcrelator\" type=\"code\">col</roleTerm>\n      <roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/col\" authority=\"marcrelator\" type=\"text\">Collector</roleTerm>\n    </role>\n  </name>\n  <name type=\"personal\" authority=\"naf\" valueURI=\"http://id.loc.gov/authorities/names/n91093114\">\n    <namePart>Littman, David, 1933-</namePart>\n    <role>\n      <roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/aut\" authority=\"marcrelator\" type=\"code\">aut</roleTerm>\n      <roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/aut\" authority=\"marcrelator\" type=\"text\">Author</roleTerm>\n    </role>\n  </name>\n  <typeOfResource collection=\"yes\">text</typeOfResource>\n  <genre authority=\"lctgm\" valueURI=\"http://id.loc.gov/vocabulary/graphicMaterials/tgm003185\">Documents</genre>\n  <originInfo>\n    <dateCreated encoding=\"w3cdtf\" point=\"start\">1961</dateCreated>\n  </originInfo>\n  <physicalDescription>\n    <extent>38 linear feet (146 boxes).</extent>\n  </physicalDescription>\n  <note type=\"content\">Collection consists of drafts and proofs of books, articles, lectures and pamphlets by Bat Ye'or, and related documents; statements of David Littman at the United Nations Commission on Human Rights; and correspondence of Bat Ye'or and David Littman. Principal correspondents include Andr\u00e9 Chouraqui, Jacques Ellul, Oriana Fallaci, Sir Martin Gilbert, Archduke Otto von Habsburg, YehoshafatHarkabi, H.Z. Hirschberg, Teddy Kollek, John Laffin, Albert Memmi and Robert Wistrich.</note>\n  <note type=\"content\">Gisele Orebi Littman is the author (as Bat Ye'or since 1974) of numerous books, the most influential among them being: The dhimmi: Jews and Christians under Islam; The decline of Eastern Christianity under Islam: from jihad to dhimmitude; Islam and Dhimmitude: where civilizations collide; and Eurabia: the Euro-Arab axis. She is responsible for the currency enjoyed by the terms dhimmitude and Eurabia in the political discourse at the start of the 21st century. David Littman is the author of a number of articles about Jews in Islamic countries in the 19th century. With Yehoshafat Harkabi, he published (as D.F. Green): Arab theologians on Jews and Israel. His role in Operation Mural, a covert operation conducted by the Mossad in Casablanca, March 16-July 24, 1961, to enable the clandestine emigration of Moroccan Jewish children to Israel on the pretext of providing holidays and health care in Switzerland, is the subject of the documentary film titled \"Operation Mural: Casablanca 1961,\" produced in Israel in 2007. Since 1985, he has been an NGO representative at the United Nations Commission on Human Rights in Geneva, serving as spokesman at various times for the World Union for Progressive Judaism (1985-1991 and 2001- ), International Fellowship of Reconciliation (1991-1994), World Federalist Movement (1994-1997), and the Association for World Education (1997- ).</note>\n  <subject>\n    <name type=\"personal\" authority=\"naf\" valueURI=\"\">\n      <namePart>Littman, David, 1933-</namePart>\n    </name>\n  </subject>\n  <subject>\n    <name type=\"personal\" authority=\"naf\" valueURI=\"\">\n      <namePart>Bat Ye\u02bcor</namePart>\n    </name>\n  </subject>\n  <subject>\n    <topic authority=\"lcsh\" valueURI=\"http://id.loc.gov/authorities/subjects/sh85070361\">Jews</topic>\n    <geographic authority=\"lcsh\" valueURI=\"http://id.loc.gov/authorities/subjects/sh85068436\">Islamic countries</geographic>\n  </subject>\n  <subject>\n    <name type=\"corporate\" authority=\"naf\" valueURI=\"\">\n      <namePart>World Organization of Jews from Arab Countries</namePart>\n    </name>\n  </subject>\n  <identifier type=\"local_hades\" displayLabel=\"Hades struc ID (legacy)\">2051837</identifier>\n  <identifier type=\"local_other\" displayLabel=\"RLIN/OCLC\">191804298</identifier>\n  <identifier type=\"local_bnumber\" displayLabel=\"NYPL catalog ID (B-number)\">b16779704</identifier>\n  <identifier type=\"local_catnyp\" displayLabel=\"CATNYP ID (legacy)\">b8943236</identifier>\n  <identifier type=\"local_mss\" displayLabel=\"MSS Unit ID\">19869</identifier>\n  <location>\n    <physicalLocation authority=\"marcorg\" type=\"repository\">nn</physicalLocation>\n    <physicalLocation type=\"division\">Dorot Jewish Division</physicalLocation>\n    <shelfLocator>**P (Bat Ye'or and David Littman Papers)</shelfLocator>\n    <physicalLocation type=\"division_short_name\">Dorot Jewish Division</physicalLocation>\n    <physicalLocation type=\"code\">JWS</physicalLocation>\n  </location>\n  <identifier type=\"uuid\">d00ff8a0-c625-012f-0c79-58d385a7bc34</identifier>\n</mods>\n","desc_xml":"<mods version=\"3.4\" schemaLocation=\"http://uri.nypl.org/schema/nypl_mods http://uri.nypl.org/schema/nypl_mods\"><titleInfo ID=\"titleInfo_0\" type=\"\" authority=\"\" usage=\"primary\" lang=\"\" script=\"\"><nonSort/><title>Bat Ye&apos;or and David Littman papers, 1961-</title><partNumber/><subTitle/><partName/></titleInfo><name ID=\"name_0\" type=\"personal\" authority=\"naf\" valueURI=\"\"><namePart>Bat Ye\u02bcor</namePart><affiliation/><role><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/col\" authority=\"marcrelator\" type=\"code\">col</roleTerm><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/col\" authority=\"marcrelator\" type=\"text\">Collector</roleTerm></role></name><name ID=\"name_1\" type=\"personal\" authority=\"naf\" valueURI=\"http://id.loc.gov/authorities/names/n91093114\" authorityRecordId=\"n91093114\"><namePart>Littman, David, 1933-</namePart><affiliation/><role><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/aut\" authority=\"marcrelator\" type=\"code\">aut</roleTerm><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/aut\" authority=\"marcrelator\" type=\"text\">Author</roleTerm></role></name><typeOfResource ID=\"typeOfResource_0\" collection=\"yes\">text</typeOfResource><genre ID=\"genre_0\" authority=\"lctgm\" valueURI=\"http://id.loc.gov/vocabulary/graphicMaterials/tgm003185\" authorityRecordId=\"tgm003185\">Documents</genre><originInfo ID=\"originInfo_0\"><dateCreated encoding=\"w3cdtf\" point=\"start\">1961</dateCreated><publisher/><edition/><issuance/></originInfo><note ID=\"note_0\" type=\"content\">Collection consists of drafts and proofs of books, articles, lectures and pamphlets by Bat Ye&apos;or, and related documents; statements of David Littman at the United Nations Commission on Human Rights; and correspondence of Bat Ye&apos;or and David Littman. Principal correspondents include Andr\u00e9 Chouraqui, Jacques Ellul, Oriana Fallaci, Sir Martin Gilbert, Archduke Otto von Habsburg, YehoshafatHarkabi, H.Z. Hirschberg, Teddy Kollek, John Laffin, Albert Memmi and Robert Wistrich.</note><note ID=\"note_1\" type=\"content\">Collection consists of drafts and proofs of books, articles, lectures and pamphlets by Bat Ye&apos;or, and related documents; statements of David Littman at the United Nations Commission on Human Rights; and correspondence of Bat Ye&apos;or and David Littman. Principal correspondents include Andr\u00e9 Chouraqui, Jacques Ellul, Oriana Fallaci, Sir Martin Gilbert, Archduke Otto von Habsburg, YehoshafatHarkabi, H.Z. Hirschberg, Teddy Kollek, John Laffin, Albert Memmi and Robert Wistrich.</note><note ID=\"note_2\" type=\"content\">Gisele Orebi Littman is the author (as Bat Ye&apos;or since 1974) of numerous books, the most influential among them being: The dhimmi: Jews and Christians under Islam; The decline of Eastern Christianity under Islam: from jihad to dhimmitude; Islam and Dhimmitude: where civilizations collide; and Eurabia: the Euro-Arab axis. She is responsible for the currency enjoyed by the terms dhimmitude and Eurabia in the political discourse at the start of the 21st century. David Littman is the author of a number of articles about Jews in Islamic countries in the 19th century. With Yehoshafat Harkabi, he published (as D.F. Green): Arab theologians on Jews and Israel. His role in Operation Mural, a covert operation conducted by the Mossad in Casablanca, March 16-July 24, 1961, to enable the clandestine emigration of Moroccan Jewish children to Israel on the pretext of providing holidays and health care in Switzerland, is the subject of the documentary film titled &quot;Operation Mural: Casablanca 1961,&quot; produced in Israel in 2007. Since 1985, he has been an NGO representative at the United Nations Commission on Human Rights in Geneva, serving as spokesman at various times for the World Union for Progressive Judaism (1985-1991 and 2001- ), International Fellowship of Reconciliation (1991-1994), World Federalist Movement (1994-1997), and the Association for World Education (1997- ).</note><subject ID=\"subject_0\"><name type=\"personal\" authority=\"naf\" valueURI=\"\"><namePart>Littman, David, 1933-</namePart></name></subject><subject ID=\"subject_1\"><name type=\"personal\" authority=\"naf\" valueURI=\"\"><namePart>Bat Ye\u02bcor</namePart></name></subject><subject ID=\"subject_2\"><topic authority=\"lcsh\" valueURI=\"http://id.loc.gov/authorities/subjects/sh85070361\" authorityRecordId=\"sh85070361\">Jews</topic><geographic authority=\"lcsh\" valueURI=\"http://id.loc.gov/authorities/subjects/sh85068436\" authorityRecordId=\"sh85068436\">Islamic countries</geographic><cartographics/></subject><subject ID=\"subject_3\"><name type=\"corporate\" authority=\"naf\" valueURI=\"\"><namePart>World Organization of Jews from Arab Countries</namePart></name></subject><identifier ID=\"identifier_0\" type=\"local_hades\" displayLabel=\"Hades struc ID (legacy)\">2051837</identifier><identifier ID=\"identifier_1\" type=\"local_other\" displayLabel=\"RLIN/OCLC\">191804298</identifier><identifier ID=\"identifier_2\" type=\"local_bnumber\" displayLabel=\"NYPL catalog ID (B-number)\">b16779704</identifier><identifier ID=\"identifier_3\" type=\"local_catnyp\" displayLabel=\"CATNYP ID (legacy)\">b8943236</identifier><identifier ID=\"identifier_4\" type=\"local_mss\" displayLabel=\"MSS Unit ID\">19869</identifier><location ID=\"location_0\"><physicalLocation authority=\"marcorg\" type=\"repository\">nn</physicalLocation><physicalLocation type=\"division\">JWS</physicalLocation><shelfLocator>**P (Bat Ye&apos;or and David Littman Papers)</shelfLocator></location><physicalDescription ID=\"physicalDescription_0\"><extent>38 linear feet (146 boxes).</extent></physicalDescription></mods>","created":"2012-08-11 17:02:41 -0400"}
var xml2 = r2.full_xml

/*

  xml2

<?xml version="1.0" encoding="UTF-8"?>
<mods xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.loc.gov/mods/v3" version="3.4" xsi:schemaLocation="http://www.loc.gov/mods/v3 http://www.loc.gov/standards/mods/v3/mods-3-4.xsd">
  <titleInfo type="" authority="" usage="primary" lang="" script="">
    <title>Bat Ye'or and David Littman papers, 1961-</title>
  </titleInfo>
  <name type="personal" authority="naf" valueURI="">
    <namePart>Bat Yeʼor</namePart>
    <role>
      <roleTerm valueURI="http://id.loc.gov/vocabulary/relators/col" authority="marcrelator" type="code">col</roleTerm>
      <roleTerm valueURI="http://id.loc.gov/vocabulary/relators/col" authority="marcrelator" type="text">Collector</roleTerm>
    </role>
  </name>
  <name type="personal" authority="naf" valueURI="http://id.loc.gov/authorities/names/n91093114">
    <namePart>Littman, David, 1933-</namePart>
    <role>
      <roleTerm valueURI="http://id.loc.gov/vocabulary/relators/aut" authority="marcrelator" type="code">aut</roleTerm>
      <roleTerm valueURI="http://id.loc.gov/vocabulary/relators/aut" authority="marcrelator" type="text">Author</roleTerm>
    </role>
  </name>
  <typeOfResource collection="yes">text</typeOfResource>
  <genre authority="lctgm" valueURI="http://id.loc.gov/vocabulary/graphicMaterials/tgm003185">Documents</genre>
  <originInfo>
    <dateCreated encoding="w3cdtf" point="start">1961</dateCreated>
  </originInfo>
  <physicalDescription>
    <extent>38 linear feet (146 boxes).</extent>
  </physicalDescription>
  <note type="content">Collection consists of drafts and proofs of books, articles, lectures and pamphlets by Bat Ye'or, and related documents; statements of David Littman at the United Nations Commission on Human Rights; and correspondence of Bat Ye'or and David Littman. Principal correspondents include André Chouraqui, Jacques Ellul, Oriana Fallaci, Sir Martin Gilbert, Archduke Otto von Habsburg, YehoshafatHarkabi, H.Z. Hirschberg, Teddy Kollek, John Laffin, Albert Memmi and Robert Wistrich.</note>
  <note type="content">Gisele Orebi Littman is the author (as Bat Ye'or since 1974) of numerous books, the most influential among them being: The dhimmi: Jews and Christians under Islam; The decline of Eastern Christianity under Islam: from jihad to dhimmitude; Islam and Dhimmitude: where civilizations collide; and Eurabia: the Euro-Arab axis. She is responsible for the currency enjoyed by the terms dhimmitude and Eurabia in the political discourse at the start of the 21st century. David Littman is the author of a number of articles about Jews in Islamic countries in the 19th century. With Yehoshafat Harkabi, he published (as D.F. Green): Arab theologians on Jews and Israel. His role in Operation Mural, a covert operation conducted by the Mossad in Casablanca, March 16-July 24, 1961, to enable the clandestine emigration of Moroccan Jewish children to Israel on the pretext of providing holidays and health care in Switzerland, is the subject of the documentary film titled "Operation Mural: Casablanca 1961," produced in Israel in 2007. Since 1985, he has been an NGO representative at the United Nations Commission on Human Rights in Geneva, serving as spokesman at various times for the World Union for Progressive Judaism (1985-1991 and 2001- ), International Fellowship of Reconciliation (1991-1994), World Federalist Movement (1994-1997), and the Association for World Education (1997- ).</note>
  <subject>
    <name type="personal" authority="naf" valueURI="">
      <namePart>Littman, David, 1933-</namePart>
    </name>
  </subject>
  <subject>
    <name type="personal" authority="naf" valueURI="">
      <namePart>Bat Yeʼor</namePart>
    </name>
  </subject>
  <subject>
    <topic authority="lcsh" valueURI="http://id.loc.gov/authorities/subjects/sh85070361">Jews</topic>
    <geographic authority="lcsh" valueURI="http://id.loc.gov/authorities/subjects/sh85068436">Islamic countries</geographic>
  </subject>
  <subject>
    <name type="corporate" authority="naf" valueURI="">
      <namePart>World Organization of Jews from Arab Countries</namePart>
    </name>
  </subject>
  <identifier type="local_hades" displayLabel="Hades struc ID (legacy)">2051837</identifier>
  <identifier type="local_other" displayLabel="RLIN/OCLC">191804298</identifier>
  <identifier type="local_bnumber" displayLabel="NYPL catalog ID (B-number)">b16779704</identifier>
  <identifier type="local_catnyp" displayLabel="CATNYP ID (legacy)">b8943236</identifier>
  <identifier type="local_mss" displayLabel="MSS Unit ID">19869</identifier>
  <location>
    <physicalLocation authority="marcorg" type="repository">nn</physicalLocation>
    <physicalLocation type="division">Dorot Jewish Division</physicalLocation>
    <shelfLocator>**P (Bat Ye'or and David Littman Papers)</shelfLocator>
    <physicalLocation type="division_short_name">Dorot Jewish Division</physicalLocation>
    <physicalLocation type="code">JWS</physicalLocation>
  </location>
  <identifier type="uuid">d00ff8a0-c625-012f-0c79-58d385a7bc34</identifier>
</mods>
*/


var r3 = {"id":40869,"type":"Collection","uuid":"a8857120-d765-0130-b561-58d385a7b928","solr_doc_hash":{"type":"collection","mms_id":40869,"uuid":"a8857120-d765-0130-b561-58d385a7b928","mms_name":"Paris-comique; journal illustr\u00c3\u00a9.","ingested":false,"org_unit_name_short":"General Research Division","org_unit_code":"GRD","mms_org_unit_id":10021,"digitization_approved":null,"desc_md_status":"draft","title":[" Paris-comique; journal illustr\u00c3\u00a9.","Image; journal hebdomadaire illustr\u00c3\u00a9 (subtitle varies): v. 1-2, no. 27 (June 6, 1867-July 5, 1868)","Image; Paris-comique; v. 2, no. 28-52 (July 12-Dec. 27, 1868)"],"title_sort":[" Paris-comique; journal illustr\u00c3\u00a9.","Image; journal hebdomadaire illustr\u00c3\u00a9 (subtitle varies): v. 1-2, no. 27 (June 6, 1867-July 5, 1868)","Image; Paris-comique; v. 2, no. 28-52 (July 12-Dec. 27, 1868)"],"title_primary":[true,false,false],"title_supplied":[false,true,false],"title_lang":["fre","",""],"title_script":["","",""],"title_type":["","",""],"title_authority":["","","","","",""],"title_uri":["","",""],"title_authority_record_id":[],"identifier_local_bnumber":["b15301448"],"identifier_idx_local_bnumber":["b15301448"],"identifier_local_catnyp":["b6972628"],"identifier_idx_local_catnyp":["b6972628"],"identifier_local_other":["48620130"],"identifier_idx_local_other":["48620130"],"date":["1868-06-06T12:00:00Z","1870-09-10T12:00:00Z"],"date_year":[1868,1870],"date_point":["start","end"],"date_type":["dateIssued","dateIssued"],"date_qualifier":["",""],"date_index":[0,0],"date_year_index":[0,0],"name":["Tronsens, Charles, b. 1830"],"name_primary":[false],"name_type":["personal"],"name_authority":["local"],"name_uri":[""],"name_role":["edt"],"name_authority_record_id":[""],"name_display_form":[""],"name_affiliation":[""],"name_description":[""],"language":["fre"],"script":[""],"physicalDescription_form":[""],"physicalDescription_form_authority":[""],"physicalDescription_form_valueURI":[],"physicalDescription_form_authorityRecordId":[],"physicalDescription_extent":["v. illus. (part col.) 42 cm."],"physicalDescription_note":[""],"physicalDescription_note_type":[null],"subject":["French wit and humor, Pictorial","Caricatures and cartoons--Periodicals","French periodicals"],"subject_idx":[],"subject_type":["topic","topic","topic"],"subject_authority":["lcsh","lcsh","lcsh"],"subject_uri":["http://id.loc.gov/authorities/subjects/sh85051915","http://id.loc.gov/authorities/subjects/sh2009118436","http://id.loc.gov/authorities/subjects/sh85051889"],"note":["Edited by Carlo Gripp (pseud. of Charles Tronsens).","Weekly","Ceased publication."],"note_type":["statement of responsibility","","numbering"],"location_repository":["nn"],"location_division":["GRD"],"location_shelflocator":[],"identifier_local_call":["*DX+ (Paris-comique)"],"identifier_idx_local_call":["*DX+ (Paris-comique)"]},"full_xml":"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<mods xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns=\"http://www.loc.gov/mods/v3\" version=\"3.4\" xsi:schemaLocation=\"http://www.loc.gov/mods/v3 http://www.loc.gov/standards/mods/v3/mods-3-4.xsd\">\n  <titleInfo type=\"\" authority=\"\" usage=\"primary\" lang=\"fre\" script=\"\">\n    <title>Paris-comique; journal illustr\u00e9.</title>\n  </titleInfo>\n  <titleInfo type=\"\" authority=\"\" supplied=\"yes\" lang=\"\" script=\"\">\n    <title>Paris-comique; journal illustr\u00e9.</title>\n    <subTitle>journal hebdomadaire illustr\u00e9 (subtitle varies) </subTitle>\n    <partName>v. 1-2, no. 27 (June 6, 1867-July 5, 1868)</partName>\n  </titleInfo>\n  <titleInfo type=\"\" authority=\"\" lang=\"\" script=\"\">\n    <title>Paris-comique; journal illustr\u00e9.</title>\n    <subTitle>Paris-comique;</subTitle>\n    <partName>v. 2, no. 28-52 (July 12-Dec. 27, 1868)</partName>\n  </titleInfo>\n  <name type=\"personal\" authority=\"local\" valueURI=\"\">\n    <namePart>Tronsens, Charles, b. 1830</namePart>\n    <role>\n      <roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/edt\" authority=\"marcrelator\" type=\"code\">edt</roleTerm>\n      <roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/edt\" authority=\"marcrelator\" type=\"text\">Editor</roleTerm>\n    </role>\n  </name>\n  <originInfo>\n    <dateIssued encoding=\"w3cdtf\" point=\"start\">1868-06-06</dateIssued>\n    <dateIssued encoding=\"w3cdtf\" point=\"end\">1870-09-10</dateIssued>\n    <place>\n      <placeTerm type=\"text\">Paris</placeTerm>\n    </place>\n    <issuance>serial</issuance>\n  </originInfo>\n  <language objectPart=\"\">\n    <languageTerm authority=\"iso639-2b\" valueURI=\"http://id.loc.gov/vocabulary/iso639-2/fre\" type=\"code\">fre</languageTerm>\n    <languageTerm authority=\"iso639-2b\" valueURI=\"http://id.loc.gov/vocabulary/iso639-2/fre\" type=\"text\">French</languageTerm>\n  </language>\n  <physicalDescription>\n    <extent>v. illus. (part col.) 42 cm.</extent>\n  </physicalDescription>\n  <note type=\"statement of responsibility\">Edited by Carlo Gripp (pseud. of Charles Tronsens).</note>\n  <note type=\"\">Weekly</note>\n  <note type=\"numbering\">Ceased publication.</note>\n  <subject>\n    <topic authority=\"lcsh\" valueURI=\"http://id.loc.gov/authorities/subjects/sh85051915\">French wit and humor, Pictorial</topic>\n  </subject>\n  <subject>\n    <topic authority=\"lcsh\" valueURI=\"http://id.loc.gov/authorities/subjects/sh2009118436\">Caricatures and cartoons--Periodicals</topic>\n  </subject>\n  <subject>\n    <topic authority=\"lcsh\" valueURI=\"http://id.loc.gov/authorities/subjects/sh85051889\">French periodicals</topic>\n  </subject>\n  <identifier type=\"local_bnumber\" displayLabel=\"NYPL catalog ID (B-number)\">b15301448</identifier>\n  <identifier type=\"local_catnyp\" displayLabel=\"CATNYP ID (legacy)\">b6972628</identifier>\n  <identifier type=\"local_other\" displayLabel=\"Other local Identifier\">48620130</identifier>\n  <location>\n    <physicalLocation authority=\"marcorg\" type=\"repository\">nn</physicalLocation>\n    <physicalLocation type=\"division\">General Research Division</physicalLocation>\n    <shelfLocator>*DX+ (Paris-comique)</shelfLocator>\n    <physicalLocation type=\"division_short_name\">General Research Division</physicalLocation>\n    <physicalLocation type=\"code\">GRD</physicalLocation>\n  </location>\n  <identifier type=\"uuid\">a8857120-d765-0130-b561-58d385a7b928</identifier>\n</mods>\n","desc_xml":"<mods xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns=\"http://uri.nypl.org/schema/nypl_mods\" version=\"3.4\" xsi:schemaLocation=\"http://uri.nypl.org/schema/nypl_mods http://uri.nypl.org/schema/nypl_mods\"><titleInfo ID=\"titleInfo_0\" type=\"\" authority=\"\" usage=\"primary\" lang=\"fre\" script=\"\"><nonSort/><title>Paris-comique; journal illustr\u00e9.</title><partNumber/><subTitle/><partName/></titleInfo><titleInfo ID=\"titleInfo_1\" type=\"\" authority=\"\" supplied=\"yes\" lang=\"\" script=\"\"><nonSort/><title>Image;</title><partNumber/><subTitle>journal hebdomadaire illustr\u00e9 (subtitle varies) </subTitle><partName>v. 1-2, no. 27 (June 6, 1867-July 5, 1868)</partName></titleInfo><titleInfo ID=\"titleInfo_2\" type=\"\" authority=\"\" lang=\"\" script=\"\"><nonSort/><title>Image;</title><partNumber/><subTitle>Paris-comique;</subTitle><partName>v. 2, no. 28-52 (July 12-Dec. 27, 1868)</partName></titleInfo><name ID=\"name_0\" type=\"personal\" authority=\"local\" valueURI=\"\"><namePart>Tronsens, Charles, b. 1830</namePart><affiliation/><role><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/edt\" authority=\"marcrelator\" type=\"code\">edt</roleTerm><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/edt\" authority=\"marcrelator\" type=\"text\">Editor</roleTerm></role></name><originInfo ID=\"originInfo_0\"><dateIssued encoding=\"w3cdtf\" point=\"start\">1868-06-06</dateIssued><dateIssued encoding=\"w3cdtf\" point=\"end\">1870-09-10</dateIssued><place><placeTerm type=\"text\">Paris</placeTerm></place><publisher/><edition/><issuance>serial</issuance></originInfo><language ID=\"language_0\" objectPart=\"\"><languageTerm authority=\"iso639-2b\" valueURI=\"http://id.loc.gov/vocabulary/iso639-2/fre\" type=\"code\">fre</languageTerm><languageTerm authority=\"iso639-2b\" valueURI=\"http://id.loc.gov/vocabulary/iso639-2/fre\" type=\"text\">French</languageTerm></language><physicalDescription ID=\"physicalDescription_0\"><form authority=\"\" valueURI=\"\" authorityRecordId=\"\"/><extent>v. illus. (part col.) 42 cm.</extent><note/></physicalDescription><note ID=\"note_0\" type=\"statement of responsibility\">Edited by Carlo Gripp (pseud. of Charles Tronsens).</note><note ID=\"note_1\" type=\"\">Weekly</note><note ID=\"note_2\" type=\"numbering\">Ceased publication.</note><subject ID=\"subject_0\"><topic authority=\"lcsh\" valueURI=\"http://id.loc.gov/authorities/subjects/sh85051915\" authorityRecordId=\"sh85051915\">French wit and humor, Pictorial</topic></subject><subject ID=\"subject_1\"><topic authority=\"lcsh\" valueURI=\"http://id.loc.gov/authorities/subjects/sh2009118436\" authorityRecordId=\"sh2009118436\">Caricatures and cartoons--Periodicals</topic></subject><subject ID=\"subject_2\"><topic authority=\"lcsh\" valueURI=\"http://id.loc.gov/authorities/subjects/sh85051889\" authorityRecordId=\"sh85051889\">French periodicals</topic></subject><identifier ID=\"identifier_0\" type=\"local_bnumber\" displayLabel=\"NYPL catalog ID (B-number)\">b15301448</identifier><identifier ID=\"identifier_1\" type=\"local_catnyp\" displayLabel=\"CATNYP ID (legacy)\">b6972628</identifier><identifier ID=\"identifier_2\" type=\"local_other\" displayLabel=\"Other local Identifier\">48620130</identifier><location ID=\"location_0\"><physicalLocation authority=\"marcorg\" type=\"repository\">nn</physicalLocation><physicalLocation type=\"division\">GRD</physicalLocation><shelfLocator>*DX+ (Paris-comique)</shelfLocator></location></mods>","created":"2013-07-25 10:37:30 -0400"}

var xml3 = r3.full_xml
/*
<?xml version="1.0" encoding="UTF-8"?>
<mods xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.loc.gov/mods/v3" version="3.4" xsi:schemaLocation="http://www.loc.gov/mods/v3 http://www.loc.gov/standards/mods/v3/mods-3-4.xsd">
  <titleInfo type="" authority="" usage="primary" lang="fre" script="">
    <title>Paris-comique; journal illustré.</title>
  </titleInfo>
  <titleInfo type="" authority="" supplied="yes" lang="" script="">
    <title>Paris-comique; journal illustré.</title>
    <subTitle>journal hebdomadaire illustré (subtitle varies) </subTitle>
    <partName>v. 1-2, no. 27 (June 6, 1867-July 5, 1868)</partName>
  </titleInfo>
  <titleInfo type="" authority="" lang="" script="">
    <title>Paris-comique; journal illustré.</title>
    <subTitle>Paris-comique;</subTitle>
    <partName>v. 2, no. 28-52 (July 12-Dec. 27, 1868)</partName>
  </titleInfo>
  <name type="personal" authority="local" valueURI="">
    <namePart>Tronsens, Charles, b. 1830</namePart>
    <role>
      <roleTerm valueURI="http://id.loc.gov/vocabulary/relators/edt" authority="marcrelator" type="code">edt</roleTerm>
      <roleTerm valueURI="http://id.loc.gov/vocabulary/relators/edt" authority="marcrelator" type="text">Editor</roleTerm>
    </role>
  </name>
  <originInfo>
    <dateIssued encoding="w3cdtf" point="start">1868-06-06</dateIssued>
    <dateIssued encoding="w3cdtf" point="end">1870-09-10</dateIssued>
    <place>
      <placeTerm type="text">Paris</placeTerm>
    </place>
    <issuance>serial</issuance>
  </originInfo>
  <language objectPart="">
    <languageTerm authority="iso639-2b" valueURI="http://id.loc.gov/vocabulary/iso639-2/fre" type="code">fre</languageTerm>
    <languageTerm authority="iso639-2b" valueURI="http://id.loc.gov/vocabulary/iso639-2/fre" type="text">French</languageTerm>
  </language>
  <physicalDescription>
    <extent>v. illus. (part col.) 42 cm.</extent>
  </physicalDescription>
  <note type="statement of responsibility">Edited by Carlo Gripp (pseud. of Charles Tronsens).</note>
  <note type="">Weekly</note>
  <note type="numbering">Ceased publication.</note>
  <subject>
    <topic authority="lcsh" valueURI="http://id.loc.gov/authorities/subjects/sh85051915">French wit and humor, Pictorial</topic>
  </subject>
  <subject>
    <topic authority="lcsh" valueURI="http://id.loc.gov/authorities/subjects/sh2009118436">Caricatures and cartoons--Periodicals</topic>
  </subject>
  <subject>
    <topic authority="lcsh" valueURI="http://id.loc.gov/authorities/subjects/sh85051889">French periodicals</topic>
  </subject>
  <identifier type="local_bnumber" displayLabel="NYPL catalog ID (B-number)">b15301448</identifier>
  <identifier type="local_catnyp" displayLabel="CATNYP ID (legacy)">b6972628</identifier>
  <identifier type="local_other" displayLabel="Other local Identifier">48620130</identifier>
  <location>
    <physicalLocation authority="marcorg" type="repository">nn</physicalLocation>
    <physicalLocation type="division">General Research Division</physicalLocation>
    <shelfLocator>*DX+ (Paris-comique)</shelfLocator>
    <physicalLocation type="division_short_name">General Research Division</physicalLocation>
    <physicalLocation type="code">GRD</physicalLocation>
  </location>
  <identifier type="uuid">a8857120-d765-0130-b561-58d385a7b928</identifier>
</mods>
*/

var r4 = {"id":39667,"type":"Collection","uuid":"9d0f5d40-c6c3-012f-689b-58d385a7bc34","solr_doc_hash":{"type":"collection","mms_id":39667,"uuid":"9d0f5d40-c6c3-012f-689b-58d385a7bc34","mms_name":"Histoire naturelle, generale et particuliere des crustaces et des insectes. Ouvrage faisant suite aux oeuvres de Leclerc de Buffon, et partie du cours complet d'histoire naturelle redige par C.S. Sonnini ... par P.A. Latreille ...","ingested":false,"org_unit_name_short":"General Research Division","org_unit_code":"GRD","mms_org_unit_id":10021,"digitization_approved":null,"desc_md_status":"approved","title":[" Histoire naturelle, generale et particuliere des crustaces et des insectes. Ouvrage faisant suite aux oeuvres de Leclerc de Buffon, et partie du cours complet d'histoire naturelle redige par C.S. Sonnini ... par P.A. Latreille ..."],"title_sort":[" Histoire naturelle, generale et particuliere des crustaces et des insectes. Ouvrage faisant suite aux oeuvres de Leclerc de Buffon, et partie du cours complet d'histoire naturelle redige par C.S. Sonnini ... par P.A. Latreille ..."],"title_primary":[true],"title_supplied":[true],"title_lang":["fre"],"title_script":[""],"title_type":[""],"title_authority":["",""],"title_uri":[""],"title_authority_record_id":[],"identifier_local_hades":["108717"],"identifier_idx_local_hades":["108717"],"identifier_local_catnyp":["b5103570"],"identifier_idx_local_catnyp":["b5103570"],"identifier_local_other":["38523617"],"identifier_idx_local_other":["38523617"],"identifier_local_bnumber":["b13545129"],"identifier_idx_local_bnumber":["b13545129"],"identifier_local_hades_collection":["183"],"identifier_idx_local_hades_collection":["183"],"typeofResource":["still image"],"typeofResource_primary":[false],"typeofResource_manuscript":[false],"typeofResource_collection":[false],"date":["1802-01-01T12:00:00Z","1805-01-01T12:00:00Z"],"date_year":[1802,1805],"date_point":["start","end"],"date_type":["copyrightDate","copyrightDate"],"date_qualifier":["",""],"date_index":[0,0],"date_year_index":[0,0],"name":["Latreille, P. A. (Pierre Andr\u00c3\u00a9) (1762-1833)"],"name_primary":[false],"name_type":["personal"],"name_authority":["naf"],"name_uri":[""],"name_role":["aut"],"name_authority_record_id":[""],"name_display_form":[""],"name_affiliation":[""],"name_description":[""],"genre":["Etchings"],"genre_primary":[false],"genre_authority":["lctgm"],"genre_uri":["http://id.loc.gov/vocabulary/graphicMaterials/tgm003666"],"genre_authority_record_id":["tgm003666"],"note":["Volume 13 missing, image records limbo'ed January 08"],"note_type":["admin"],"location_repository":["nn"],"location_division":[],"location_shelflocator":[],"identifier_local_call":["QI (Latreille, P. A. Histoire naturelle)"],"identifier_idx_local_call":["QI (Latreille, P. A. Histoire naturelle)"]},"full_xml":"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<mods xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns=\"http://www.loc.gov/mods/v3\" version=\"3.4\" xsi:schemaLocation=\"http://www.loc.gov/mods/v3 http://www.loc.gov/standards/mods/v3/mods-3-4.xsd\">\n  <titleInfo type=\"\" authority=\"\" usage=\"primary\" supplied=\"yes\" lang=\"fre\" script=\"\">\n    <title>Histoire naturelle, generale et particuliere des crustaces et des insectes. Ouvrage faisant suite aux oeuvres de Leclerc de Buffon, et partie du cours complet d'histoire naturelle redige par C.S. Sonnini ... par P.A. Latreille ...</title>\n  </titleInfo>\n  <name type=\"personal\" authority=\"naf\" valueURI=\"\">\n    <namePart>Latreille, P. A. (Pierre Andr\u00e9) (1762-1833)</namePart>\n    <role>\n      <roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/aut\" authority=\"marcrelator\" type=\"code\">aut</roleTerm>\n      <roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/aut\" authority=\"marcrelator\" type=\"text\">Author</roleTerm>\n    </role>\n  </name>\n  <typeOfResource>still image</typeOfResource>\n  <genre authority=\"lctgm\" valueURI=\"http://id.loc.gov/vocabulary/graphicMaterials/tgm003666\">Etchings</genre>\n  <originInfo>\n    <copyrightDate encoding=\"w3cdtf\" point=\"start\" keyDate=\"yes\">1802</copyrightDate>\n    <copyrightDate encoding=\"w3cdtf\" point=\"end\">1805</copyrightDate>\n    <place>\n      <placeTerm type=\"text\">Paris</placeTerm>\n    </place>\n    <publisher>F. Dufart, an x-an xiii</publisher>\n  </originInfo>\n  <note type=\"admin\">Volume 13 missing, image records limbo'ed January 08</note>\n  <identifier type=\"local_hades\" displayLabel=\"Hades struc ID (legacy)\">108717</identifier>\n  <identifier type=\"local_catnyp\" displayLabel=\"CATNYP ID (legacy)\">b5103570</identifier>\n  <identifier type=\"local_other\" displayLabel=\"RLIN/OCLC\">38523617</identifier>\n  <identifier type=\"local_bnumber\" displayLabel=\"NYPL catalog ID (B-number)\">b13545129</identifier>\n  <identifier type=\"local_hades_collection\" displayLabel=\"Hades Collection Guide ID (legacy)\">183</identifier>\n  <location>\n    <physicalLocation authority=\"marcorg\" type=\"repository\">nn</physicalLocation>\n    <shelfLocator>QI (Latreille, P. A. Histoire naturelle)</shelfLocator>\n  </location>\n  <identifier type=\"uuid\">9d0f5d40-c6c3-012f-689b-58d385a7bc34</identifier>\n</mods>\n","desc_xml":"<mods xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns=\"http://uri.nypl.org/schema/nypl_mods\" version=\"3.4\" xsi:schemaLocation=\"http://uri.nypl.org/schema/nypl_mods http://uri.nypl.org/schema/nypl_mods\"><titleInfo ID=\"titleInfo_0\" type=\"\" authority=\"\" usage=\"primary\" supplied=\"yes\" lang=\"fre\" script=\"\"><nonSort/><title>Histoire naturelle, generale et particuliere des crustaces et des insectes. Ouvrage faisant suite aux oeuvres de Leclerc de Buffon, et partie du cours complet d&apos;histoire naturelle redige par C.S. Sonnini ... par P.A. Latreille ...</title><partNumber/><subTitle/><partName/></titleInfo><name ID=\"name_0\" type=\"personal\" authority=\"naf\" valueURI=\"\"><namePart>Latreille, P. A. (Pierre Andr\u00e9) (1762-1833)</namePart><affiliation/><role><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/aut\" authority=\"marcrelator\" type=\"code\">aut</roleTerm><roleTerm valueURI=\"http://id.loc.gov/vocabulary/relators/aut\" authority=\"marcrelator\" type=\"text\">Author</roleTerm></role></name><typeOfResource ID=\"typeOfResource_0\">still image</typeOfResource><genre ID=\"genre_0\" authority=\"lctgm\" valueURI=\"http://id.loc.gov/vocabulary/graphicMaterials/tgm003666\" authorityRecordId=\"tgm003666\">Etchings</genre><originInfo ID=\"originInfo_0\"><copyrightDate encoding=\"w3cdtf\" point=\"start\" keyDate=\"yes\">1802</copyrightDate><copyrightDate encoding=\"w3cdtf\" point=\"end\">1805</copyrightDate><place><placeTerm type=\"text\">Paris</placeTerm></place><publisher>F. Dufart, an x-an xiii</publisher><edition/><issuance/></originInfo><note ID=\"note_0\" type=\"admin\">Volume 13 missing, image records limbo&apos;ed January 08</note><identifier ID=\"identifier_0\" type=\"local_hades\" displayLabel=\"Hades struc ID (legacy)\">108717</identifier><identifier ID=\"identifier_1\" type=\"local_catnyp\" displayLabel=\"CATNYP ID (legacy)\">b5103570</identifier><identifier ID=\"identifier_2\" type=\"local_other\" displayLabel=\"RLIN/OCLC\">38523617</identifier><identifier ID=\"identifier_3\" type=\"local_bnumber\" displayLabel=\"NYPL catalog ID (B-number)\">b13545129</identifier><identifier ID=\"identifier_4\" type=\"local_hades_collection\" displayLabel=\"Hades Collection Guide ID (legacy)\">183</identifier><location ID=\"location_0\"><physicalLocation authority=\"marcorg\" type=\"repository\">nn</physicalLocation><physicalLocation type=\"division\"/><shelfLocator>QI (Latreille, P. A. Histoire naturelle)</shelfLocator></location></mods>","created":"2012-08-12 11:52:16 -0400"}

var xml4 = r4.full_xml
/*
 
 xml4

<?xml version="1.0" encoding="UTF-8"?>
<mods xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.loc.gov/mods/v3" version="3.4" xsi:schemaLocation="http://www.loc.gov/mods/v3 http://www.loc.gov/standards/mods/v3/mods-3-4.xsd">
  <titleInfo type="" authority="" usage="primary" supplied="yes" lang="fre" script="">
    <title>Histoire naturelle, generale et particuliere des crustaces et des insectes. Ouvrage faisant suite aux oeuvres de Leclerc de Buffon, et partie du cours complet d'histoire naturelle redige par C.S. Sonnini ... par P.A. Latreille ...</title>
  </titleInfo>
  <name type="personal" authority="naf" valueURI="">
    <namePart>Latreille, P. A. (Pierre André) (1762-1833)</namePart>
    <role>
      <roleTerm valueURI="http://id.loc.gov/vocabulary/relators/aut" authority="marcrelator" type="code">aut</roleTerm>
      <roleTerm valueURI="http://id.loc.gov/vocabulary/relators/aut" authority="marcrelator" type="text">Author</roleTerm>
    </role>
  </name>
  <typeOfResource>still image</typeOfResource>
  <genre authority="lctgm" valueURI="http://id.loc.gov/vocabulary/graphicMaterials/tgm003666">Etchings</genre>
  <originInfo>
    <copyrightDate encoding="w3cdtf" point="start" keyDate="yes">1802</copyrightDate>
    <copyrightDate encoding="w3cdtf" point="end">1805</copyrightDate>
    <place>
      <placeTerm type="text">Paris</placeTerm>
    </place>
    <publisher>F. Dufart, an x-an xiii</publisher>
  </originInfo>
  <note type="admin">Volume 13 missing, image records limbo'ed January 08</note>
  <identifier type="local_hades" displayLabel="Hades struc ID (legacy)">108717</identifier>
  <identifier type="local_catnyp" displayLabel="CATNYP ID (legacy)">b5103570</identifier>
  <identifier type="local_other" displayLabel="RLIN/OCLC">38523617</identifier>
  <identifier type="local_bnumber" displayLabel="NYPL catalog ID (B-number)">b13545129</identifier>
  <identifier type="local_hades_collection" displayLabel="Hades Collection Guide ID (legacy)">183</identifier>
  <location>
    <physicalLocation authority="marcorg" type="repository">nn</physicalLocation>
    <shelfLocator>QI (Latreille, P. A. Histoire naturelle)</shelfLocator>
  </location>
  <identifier type="uuid">9d0f5d40-c6c3-012f-689b-58d385a7bc34</identifier>
</mods>
*/

var r5 = {"id":39739,"type":"Collection","uuid":"1507fe00-c6ca-012f-dcff-58d385a7bc34","solr_doc_hash":{"type":"collection","mms_id":39739,"uuid":"1507fe00-c6ca-012f-dcff-58d385a7bc34","mms_name":"Music Division Iconography Collection","ingested":false,"org_unit_name_short":"Music Division","org_unit_code":"MUS","mms_org_unit_id":"10007","desc_md_status":"approved","title":[" Music Division Iconography Collection"],"title_sort":[" Music Division Iconography Collection"],"title_primary":[true],"title_supplied":[true],"title_lang":["eng"],"title_script":[""],"title_type":[""],"title_authority":["",""],"title_uri":[""],"title_authority_record_id":[],"identifier_local_hades":["750235"],"identifier_idx_local_hades":["750235"],"typeofResource":["still image"],"typeofResource_primary":[false],"typeofResource_manuscript":[false],"typeofResource_collection":[true],"genre":["Portraits"],"genre_primary":[false],"genre_authority":["lctgm"],"genre_uri":["http://id.loc.gov/vocabulary/graphicMaterials/tgm008085"],"genre_authority_record_id":["tgm008085"],"abstract":["Visual materials, including over 100,000 photographs, 5,000 set and costume designs for opera, and the Joseph Muller Collection of 6,000 fine prints of musicians' portraits from the 15th through the mid-20th centuries, provide rich documentation for all aspects of music, past and present."],"abstract_type":[true],"abstract_displayLabel":[""],"location_repository":["nn"],"location_division":["MUS"],"location_shelflocator":[],"identifier_local_call":["M-Icon"],"identifier_idx_local_call":["M-Icon"]},"full_xml":"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<mods xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns=\"http://www.loc.gov/mods/v3\" version=\"3.4\" xsi:schemaLocation=\"http://www.loc.gov/mods/v3 http://www.loc.gov/standards/mods/v3/mods-3-4.xsd\">\n  <titleInfo type=\"\" authority=\"\" usage=\"primary\" supplied=\"yes\" lang=\"eng\" script=\"\">\n    <title>Music Division Iconography Collection</title>\n  </titleInfo>\n  <typeOfResource collection=\"yes\">still image</typeOfResource>\n  <genre authority=\"lctgm\" valueURI=\"http://id.loc.gov/vocabulary/graphicMaterials/tgm008085\">Portraits</genre>\n  <abstract type=\"\" displayLabel=\"\">Visual materials, including over 100,000 photographs, 5,000 set and costume designs for opera, and the Joseph Muller Collection of 6,000 fine prints of musicians' portraits from the 15th through the mid-20th centuries, provide rich documentation for all aspects of music, past and present.</abstract>\n  <identifier type=\"local_hades\" displayLabel=\"Hades struc ID (legacy)\">750235</identifier>\n  <location>\n    <physicalLocation authority=\"marcorg\" type=\"repository\">nn</physicalLocation>\n    <physicalLocation type=\"division\">Music Division</physicalLocation>\n    <shelfLocator>M-Icon</shelfLocator>\n    <physicalLocation type=\"division_short_name\">Music Division</physicalLocation>\n    <physicalLocation type=\"code\">MUS</physicalLocation>\n  </location>\n  <identifier type=\"uuid\">1507fe00-c6ca-012f-dcff-58d385a7bc34</identifier>\n</mods>\n","desc_xml":"<mods version=\"3.4\" schemaLocation=\"http://uri.nypl.org/schema/nypl_mods http://uri.nypl.org/schema/nypl_mods\"><titleInfo ID=\"titleInfo_0\" type=\"\" authority=\"\" usage=\"primary\" supplied=\"yes\" lang=\"eng\" script=\"\"><nonSort/><title>Music Division Iconography Collection</title><partNumber/><subTitle/><partName/></titleInfo><typeOfResource ID=\"typeOfResource_0\" collection=\"yes\">still image</typeOfResource><genre ID=\"genre_0\" authority=\"lctgm\" valueURI=\"http://id.loc.gov/vocabulary/graphicMaterials/tgm008085\" authorityRecordId=\"tgm008085\">Portraits</genre><abstract ID=\"abstract_0\" type=\"\" displayLabel=\"\">Visual materials, including over 100,000 photographs, 5,000 set and costume designs for opera, and the Joseph Muller Collection of 6,000 fine prints of musicians&apos; portraits from the 15th through the mid-20th centuries, provide rich documentation for all aspects of music, past and present.</abstract><identifier ID=\"identifier_0\" type=\"local_hades\" displayLabel=\"Hades struc ID (legacy)\">750235</identifier><location ID=\"location_0\"><physicalLocation authority=\"marcorg\" type=\"repository\">nn</physicalLocation><physicalLocation type=\"division\">MUS</physicalLocation><shelfLocator>M-Icon</shelfLocator></location></mods>","created":"2012-08-12 12:38:34 -0400"}

var xml5 = r5.full_xml

/*
<?xml version="1.0" encoding="UTF-8"?>
<mods xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.loc.gov/mods/v3" version="3.4" xsi:schemaLocation="http://www.loc.gov/mods/v3 http://www.loc.gov/standards/mods/v3/mods-3-4.xsd">
  <titleInfo type="" authority="" usage="primary" supplied="yes" lang="eng" script="">
    <title>Music Division Iconography Collection</title>
  </titleInfo>
  <typeOfResource collection="yes">still image</typeOfResource>
  <genre authority="lctgm" valueURI="http://id.loc.gov/vocabulary/graphicMaterials/tgm008085">Portraits</genre>
  <abstract type="" displayLabel="">Visual materials, including over 100,000 photographs, 5,000 set and costume designs for opera, and the Joseph Muller Collection of 6,000 fine prints of musicians' portraits from the 15th through the mid-20th centuries, provide rich documentation for all aspects of music, past and present.</abstract>
  <identifier type="local_hades" displayLabel="Hades struc ID (legacy)">750235</identifier>
  <location>
    <physicalLocation authority="marcorg" type="repository">nn</physicalLocation>
    <physicalLocation type="division">Music Division</physicalLocation>
    <shelfLocator>M-Icon</shelfLocator>
    <physicalLocation type="division_short_name">Music Division</physicalLocation>
    <physicalLocation type="code">MUS</physicalLocation>
  </location>
  <identifier type="uuid">1507fe00-c6ca-012f-dcff-58d385a7bc34</identifier>
</mods>
*/

var r6 = {"id":301100,"type":"Container","uuid":"b687a850-8dea-0132-33d8-58d385a7b928","solr_doc_hash":{},"full_xml":"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<mods xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns=\"http://www.loc.gov/mods/v3\" version=\"3.4\" xsi:schemaLocation=\"http://www.loc.gov/mods/v3 http://www.loc.gov/standards/mods/v3/mods-3-4.xsd\">\n  <titleInfo type=\"\" authority=\"\" usage=\"primary\" lang=\"\" script=\"\">\n    <title>James Madison papers</title>\n  </titleInfo>\n  <titleInfo type=\"\" authority=\"\" usage=\"primary\" lang=\"\" script=\"\">\n    <title>James Madison correspondence</title>\n  </titleInfo>\n  <titleInfo supplied=\"yes\" usage=\"primary\">\n    <title>1812</title>\n  </titleInfo>\n  <titleInfo type=\"\" authority=\"\" usage=\"primary\" lang=\"\" script=\"\">\n    <title>Letters from Samuel Fulton</title>\n  </titleInfo>\n  <name type=\"personal\" authority=\"naf\" valueURI=\"\">\n    <namePart>Madison, James, 1751-1836</namePart>\n  </name>\n  <typeOfResource collection=\"yes\">text</typeOfResource>\n  <originInfo>\n    <dateCreated>1812</dateCreated>\n  </originInfo>\n  <language usage=\"primary\" objectPart=\"\">\n    <languageTerm authority=\"iso639-2b\" valueURI=\"http://id.loc.gov/vocabulary/iso639-2/eng\" type=\"code\">eng</languageTerm>\n    <languageTerm authority=\"iso639-2b\" valueURI=\"http://id.loc.gov/vocabulary/iso639-2/eng\" type=\"text\">English</languageTerm>\n  </language>\n  <identifier type=\"local_archives_ead\" displayLabel=\"Archives EAD ID\">2025750</identifier>\n  <location>\n    <physicalLocation authority=\"marcorg\" type=\"repository\">nn</physicalLocation>\n    <physicalLocation type=\"division\">Manuscripts and Archives Division</physicalLocation>\n    <shelfLocator>MssCol 1833</shelfLocator>\n    <physicalLocation type=\"division_short_name\">Manuscripts and Archives Division</physicalLocation>\n    <physicalLocation type=\"code\">MSS</physicalLocation>\n  </location>\n  <genre authority=\"lctgm\" valueURI=\"http://id.loc.gov/vocabulary/graphicMaterials/tgm002590\">Correspondence</genre>\n  <identifier type=\"uuid\">b687a850-8dea-0132-33d8-58d385a7b928</identifier>\n  <relatedItem type=\"host\">\n    <titleInfo>\n      <title>1812</title>\n    </titleInfo>\n    <identifier type=\"uuid\">caf53850-7a74-0132-1b13-58d385a7b928</identifier>\n    <identifier type=\"local_archives_ead\">242762 local_other</identifier>\n    <relatedItem type=\"host\">\n      <titleInfo>\n        <title>James Madison correspondence</title>\n      </titleInfo>\n      <identifier type=\"uuid\">a1b97610-7a74-0132-58fd-58d385a7b928</identifier>\n      <identifier type=\"local_archives_ead\">237157 local_other</identifier>\n      <relatedItem type=\"host\">\n        <titleInfo>\n          <title>James Madison papers</title>\n        </titleInfo>\n        <identifier type=\"uuid\">9ccb18b0-7a74-0132-a7b1-58d385a7b928</identifier>\n        <identifier type=\"local_mss\">1833 local_bnumber</identifier>\n      </relatedItem>\n    </relatedItem>\n  </relatedItem>\n</mods>\n","desc_xml":"<mods xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns=\"http://uri.nypl.org/schema/nypl_mods\" version=\"3.4\" xsi:schemaLocation=\"http://uri.nypl.org/schema/nypl_mods http://uri.nypl.org/schema/nypl_mods\"><titleInfo ID=\"titleInfo_0\" type=\"\" authority=\"\" usage=\"primary\" lang=\"\" script=\"\"><nonSort/><title>Letters from Samuel Fulton</title><partNumber/><subTitle/><partName/></titleInfo><identifier ID=\"identifier_0\" type=\"local_archives_ead\" displayLabel=\"Archives EAD ID\">2025750</identifier></mods>","created":"2015-02-03 10:53:26 -0500"}
var xml6 = r6.full_xml

/*
<?xml version="1.0" encoding="UTF-8"?>
<mods xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.loc.gov/mods/v3" version="3.4" xsi:schemaLocation="http://www.loc.gov/mods/v3 http://www.loc.gov/standards/mods/v3/mods-3-4.xsd">
  <titleInfo type="" authority="" usage="primary" lang="" script="">
    <title>James Madison papers</title>
  </titleInfo>
  <titleInfo type="" authority="" usage="primary" lang="" script="">
    <title>James Madison correspondence</title>
  </titleInfo>
  <titleInfo supplied="yes" usage="primary">
    <title>1812</title>
  </titleInfo>
  <titleInfo type="" authority="" usage="primary" lang="" script="">
    <title>Letters from Samuel Fulton</title>
  </titleInfo>
  <name type="personal" authority="naf" valueURI="">
    <namePart>Madison, James, 1751-1836</namePart>
  </name>
  <typeOfResource collection="yes">text</typeOfResource>
  <originInfo>
    <dateCreated>1812</dateCreated>
  </originInfo>
  <language usage="primary" objectPart="">
    <languageTerm authority="iso639-2b" valueURI="http://id.loc.gov/vocabulary/iso639-2/eng" type="code">eng</languageTerm>
    <languageTerm authority="iso639-2b" valueURI="http://id.loc.gov/vocabulary/iso639-2/eng" type="text">English</languageTerm>
  </language>
  <identifier type="local_archives_ead" displayLabel="Archives EAD ID">2025750</identifier>
  <location>
    <physicalLocation authority="marcorg" type="repository">nn</physicalLocation>
    <physicalLocation type="division">Manuscripts and Archives Division</physicalLocation>
    <shelfLocator>MssCol 1833</shelfLocator>
    <physicalLocation type="division_short_name">Manuscripts and Archives Division</physicalLocation>
    <physicalLocation type="code">MSS</physicalLocation>
  </location>
  <genre authority="lctgm" valueURI="http://id.loc.gov/vocabulary/graphicMaterials/tgm002590">Correspondence</genre>
  <identifier type="uuid">b687a850-8dea-0132-33d8-58d385a7b928</identifier>
  <relatedItem type="host">
    <titleInfo>
      <title>1812</title>
    </titleInfo>
    <identifier type="uuid">caf53850-7a74-0132-1b13-58d385a7b928</identifier>
    <identifier type="local_archives_ead">242762 local_other</identifier>
    <relatedItem type="host">
      <titleInfo>
        <title>James Madison correspondence</title>
      </titleInfo>
      <identifier type="uuid">a1b97610-7a74-0132-58fd-58d385a7b928</identifier>
      <identifier type="local_archives_ead">237157 local_other</identifier>
      <relatedItem type="host">
        <titleInfo>
          <title>James Madison papers</title>
        </titleInfo>
        <identifier type="uuid">9ccb18b0-7a74-0132-a7b1-58d385a7b928</identifier>
        <identifier type="local_mss">1833 local_bnumber</identifier>
      </relatedItem>
    </relatedItem>
  </relatedItem>
</mods>
*/


var capture1 = {"id":5131049,"type":"Capture","uuid":"14fae4d0-cf20-0132-72d3-58d385a7bbd0","item":{"item":{"active":true,"captures_being_added":null,"collection_id":25790,"container_id":293115,"created_at":"2015-04-27T11:29:12-04:00","created_by_id":10112,"id":4952600,"ingested":false,"is_deletable":true,"name":"Actors (L-R) Roy Dotrice & Chris Sarandon in a scene fr. the American Shakespeare Theatre's production of the play \"Henry IV Part 1.\" (Stratford)","org_unit_id":10000,"relationship_id":null,"sib_seq":14,"updated_at":"2015-04-27T11:29:12-04:00","updated_by_id":10112,"uuid":"f89e0600-cf1f-0132-931b-58d385a7bbd0"}},"relationship":{"relationship":{"content_relationship":"isReproductionOf","created_at":"2012-07-16T15:21:24-04:00","id":10016,"name":"single image","sib_seq":16,"structural_relationship":null,"updated_at":"2013-05-01T21:51:49-04:00"}},"status":{"status":{"created_at":"2012-07-01T20:00:00-04:00","handle":"captured","id":10041,"label":"Captured","updated_at":"2012-07-01T20:00:00-04:00"}},"processing_notes":[],"identifiers":[{"identifier":{"created_at":"2015-04-27T11:29:13-04:00","id":4751771,"identifiable_id":5131049,"identifiable_type":"Capture","identifier_type":"image_id","identifier_value":"swope_631831","updated_at":"2015-04-27T11:29:13-04:00"}}],"ordered_records":[],"work_orders":[],"api_import":null,"tech_mds":[],"in_dc":false,"image_id":"swope_631831"}




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