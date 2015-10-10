"use strict"
var assert = require('assert')
var should = require('should')
var archivesUtils = require("../lib/archives_utils.js");


var collectionJson = {
    "id": 206,
    "title": "Alexander Hamilton papers",
    "origination": [
        {
            "id": 375,
            "term": "Hamilton, Alexander, 1757-1804",
            "type": "persname",
            "source": "naf",
            "function": "origination",
            "role": "creator",
            "controlaccess": false,
            "questionable": false,
            "value": "Hamilton, Alexander, 1757-1804"
        }
    ],
    "org_unit_id": 1,
    "date_statement": "1775-1804",
    "extent_statement": ".25 linear feet (1 box)",
    "linear_feet": 0.25,
    "keydate": "1775",
    "identifier_value": "1297",
    "identifier_type": "local_mss",
    "bnumber": "b12361313",
    "call_number": "MssCol 1297",
    "max_depth": 3,
    "series_count": 0,
    "active": true,
    "created_at": "2013-04-01T14:58:51Z",
    "updated_at": "2015-03-31T21:29:20Z",
    "date_processed": 2015,
    "component_layout_id": 2,
    "has_digital": 0,
    "fully_digitized": 0,
    "type": "Collection",
    "org_unit_name": "Manuscripts and Archives Division",
    "org_unit_name_short": "Manuscripts and Archives Division",
    "org_unit_code": "MSS",
    "unitid": [
        {
            "value": "1297",
            "type": "local_mss"
        },
        {
            "value": "b12361313",
            "type": "local_b"
        },
        {
            "value": "33433087858829",
            "type": "local_barcode"
        },
        {
            "value": "MssCol 1297",
            "type": "local_call"
        }
    ],
    "unitdate": [
        {
            "type": "inclusive",
            "value": "1775-1804"
        }
    ],
    "date_inclusive_start": 1775,
    "date_inclusive_end": 1804,
    "dates_index": [
        1775,
        1776,
        1777,
        1778,
        1779,
        1780,
        1781,
        1782,
        1783,
        1784,
        1785,
        1786,
        1787,
        1788,
        1789,
        1790,
        1791,
        1792,
        1793,
        1794,
        1795,
        1796,
        1797,
        1798,
        1799,
        1800,
        1801,
        1802,
        1803,
        1804
    ],
    "date_start": "1775",
    "date_end": "1804",
    "unittitle": [
        {
            "value": "Alexander Hamilton papers"
        }
    ],
    "physdesc": [
        {
            "format": "structured",
            "physdesc_components": [
                {
                    "name": "extent",
                    "value": ".25 linear feet",
                    "unit": "linear feet"
                },
                {
                    "name": "extent",
                    "value": "1 box",
                    "unit": "containers"
                }
            ],
            "supress_display": true
        }
    ],
    "repository": [
        {
            "id": "MSS",
            "value": "Manuscripts and Archives Division"
        }
    ],
    "abstract": [
        {
            "value": "Alexander Hamilton (1754-1804) was a Founding Father, soldier, lawyer and statesman. He served as the first United States Secretary of the Treasury from 1789 to 1795. The Alexander Hamilton papers, dated 1775-1804, primarily consist of letters and documents either written or signed by Alexander Hamilton, and pertain to his career as a soldier, lawyer, statesman and United States Secretary of the Treasury. Autograph letters, drafts and copies of letters sent by Hamilton concern his Revolutionary War service, chiefly as an aide-de-camp to General George Washington; his legal practice in New York; and financial and political matters. Notable items include Hamilton’s letters to President Washington, dated 1796, concerning the writing of Washington’s Farewell Address to the nation, with a draft of the Address written by Hamilton for Washington’s consideration. Documents include his 1782 appointment as Receiver of Continental Taxes in New York, legal documents relating to his law practice and personal estate, and legal notes and other items in his hand. Treasury Department letters are chiefly manuscript or printed circular letters which are not in Hamilton’s handwriting but bear his autograph signature."
        }
    ],
    "prefercite": [
        {
            "value": "<p>Alexander Hamilton papers, Manuscripts and Archives Division, The New York Public Library</p>"
        }
    ],
    "bioghist": [
        {
            "value": "<p>Alexander Hamilton (1754-1804) was a Founding Father, soldier, lawyer and statesman. He served as the first United States Secretary of the Treasury from 1789 to 1795. Born in the West Indies, Hamilton came to the American colonies to attend school, graduating from King’s College (Columbia University) in 1774. He fought as an American military officer during the Revolutionary War and was General George Washington’s aide-de-camp prior to his resignation from the Army in 1782. In that same year he established his law practice in New York City and was appointed Receiver of Continental Taxes for the State of New York. Hamilton represented the State at the Constitutional Convention of 1787, and played a key role in supporting the adoption of the United States Constitution as co-author of The Federalist Papers with John Jay and James Madison. Hamilton was also instrumental in shaping the country’s financial system. In 1789, President Washington appointed Hamilton as the first United States Secretary of the Treasury. He resigned in 1795, returning to his law practice in New York. In 1780 he married Elizabeth Schuyler (1757-1854), daughter of General Philip Schuyler. Hamilton was mortally wounded in a duel with Aaron Burr on July 11, 1804.</p>"
        }
    ],
    "custodhist": [
        {
            "value": "<p>The bulk of the Alexander Hamilton papers are comprised of documents transferred from the Ford collection and the Thomas Addis Emmet collection. The Ford Collection was compiled by Gordon L. Ford, business manager of the New York Tribune from 1873 to 1881 and collector of documents pertaining to early American history. Ford's collection was later purchased by J. Pierpont Morgan and portions of it were donated to The New York Public Library in 1899. The Emmet Collection was collected by Dr. Thomas Addis Emmet, a collector of early American history manuscripts. His collection was later purchased by John S. Kennedy and donated to The New York Public Library in 1896. Various other gifts and purchases are also included.</p>"
        }
    ],
    "scopecontent": [
        {
            "value": "<p>The Alexander Hamilton papers, dated 1775-1804, primarily consist of letters and documents either written or signed by Alexander Hamilton, and pertain to his career as a soldier, lawyer, statesman and United States Secretary of the Treasury. It is a synthetic collection of largely autograph material, combining gifts and purchases from various sources.</p> <p>Autograph letters, drafts and copies of letters sent by Hamilton concern his Revolutionary War service, chiefly as an aide-de-camp to General George Washington; his law practice in New York; and financial and political matters. Notable items include Hamilton’s letters to President Washington, dated 1796, concerning the writing of Washington’s Farewell Address to the nation. His letter of 1796 August 10 encloses a draft of the Address, written by Hamilton for Washington’s consideration. One personal letter to his wife Elizabeth Hamilton dated 1803 gives instructions for property improvements at their home, The Grange. Documents include his 1782 appointment as Receiver of Continental Taxes in New York, legal documents relating to his law practice and personal estate, and legal notes and other items in his hand.</p> <p>Treasury Department letters are chiefly manuscript or printed circular letters which are not in Hamilton’s handwriting but bear his autograph signature. Most are addressed to Collectors of Customs and concern customs and shipping regulations, the apportionment or collection of federal monies, and banking matters. Many are addressed to Jedediah Huntington, Collector of Customs at New London, Connecticut. Also included are a few signed receipts for drafts from Customs officers, a signed decision on a Customs case, and a clipped signature.</p>"
        }
    ],
    "acqinfo": [
        {
            "value": "<p>Various gifts and purchases, 1896-1948</p>"
        }
    ],
    "processinfo": [
        {
            "type": "processing",
            "value": "<p>Compiled by <span class=\"name\">Casey Babcock</span>, <span class=\"date\">2015</span></p>"
        }
    ],
    "note": [
        {
            "type": "sponsor",
            "value": "Digitization was made possible by a lead gift from The Polonsky Foundation."
        }
    ],
    "sponsor": [
        {
            "value": "Digitization was made possible by a lead gift from The Polonsky Foundation."
        }
    ],
    "dsc_type": [
        "combined"
    ],
    "relatedmaterial": [
        {
            "value": "<p>The Jerome Robbins Dance Division, New York Public Library for the Performing Arts also holds Artur Michel Letters, (S) *MGZMD 84 and Scrapbook: Articles from <span class=\"title\">Aufbau</span> on microfilm, *ZBD-654 no. 1.</p>"
        }
    ],
    "langmaterial_code": [
        "ger",
        "eng",
        "fre",
        "ita",
        "spa",
        "cze"
    ],
    "langmaterial": [
        {
            "value": "The majority of the collection contains materials in German, but there are some items in English, French, Italian, Spanish, and Czech"
        }
    ],    
    "standard_access_note": "Advance notice required.",
    "origination_term": [
        {
            "id": 375,
            "term": "Hamilton, Alexander, 1757-1804",
            "type": "persname",
            "source": "naf",
            "function": "origination",
            "role": "creator",
            "controlaccess": false,
            "questionable": false
        }
    ],
    "controlaccess": {
        "subject": [
            {
                "id": 164907,
                "term": "Customs administration -- United States",
                "type": "topic",
                "source": "lcsh",
                "controlaccess": true,
                "questionable": false
            },
            {
                "id": 161736,
                "term": "Finance, public -- United States",
                "type": "topic",
                "source": "lcsh",
                "controlaccess": true,
                "questionable": false
            }
        ],
        "occupation": [
            {
                "id": 20255,
                "term": "Lawyers",
                "type": "topic",
                "source": "lcsh",
                "function": "occupation",
                "controlaccess": true,
                "questionable": false
            },
            {
                "id": 147303,
                "term": "Soldiers",
                "type": "topic",
                "source": "lcsh",
                "function": "occupation",
                "controlaccess": true,
                "questionable": false
            },
            {
                "id": 32967,
                "term": "Statesmen",
                "type": "topic",
                "source": "lcsh",
                "function": "occupation",
                "controlaccess": true,
                "questionable": false
            }
        ],
        "genreform": [
            {
                "id": 4318,
                "term": "Legal documents",
                "type": "genreform",
                "source": "aat",
                "controlaccess": true,
                "questionable": false
            }
        ],
        "geogname": [
            {
                "id": 157810,
                "term": "United States -- History -- Revolution, 1775-1783",
                "type": "geogname",
                "source": "naf",
                "controlaccess": true,
                "questionable": false
            },
            {
                "id": 164908,
                "term": "United States -- Politics and government -- 1789-1815",
                "type": "geogname",
                "source": "naf",
                "controlaccess": true,
                "questionable": false
            }
        ],
        "name": [
            {
                "id": 375,
                "term": "Hamilton, Alexander, 1757-1804",
                "type": "persname",
                "source": "naf",
                "role": "subject",
                "controlaccess": true,
                "questionable": false
            },
            {
                "id": 164903,
                "term": "Hamilton, Elizabeth Schuyler, 1757-1854",
                "type": "persname",
                "source": "naf",
                "controlaccess": true,
                "questionable": false
            },
            {
                "id": 157809,
                "term": "Huntington, Jedediah, 1743-1818 -- recipient",
                "type": "persname",
                "source": "naf",
                "controlaccess": true,
                "questionable": false
            },
            {
                "id": 164904,
                "term": "Jay, John, 1745-1829 -- recipient",
                "type": "persname",
                "source": "naf",
                "controlaccess": true,
                "questionable": false
            },
            {
                "id": 164902,
                "term": "Washington, George, 1732-1799 -- Farewell address",
                "type": "persname",
                "source": "naf",
                "role": "subject",
                "controlaccess": true,
                "questionable": false
            },
            {
                "id": 164906,
                "term": "Washington, George, 1732-1799 -- recipient",
                "type": "persname",
                "source": "naf",
                "controlaccess": true,
                "questionable": false
            },
            {
                "id": 164901,
                "term": "United States -- Department of the Treasury -- Office of the Secretary",
                "type": "corpname",
                "source": "naf",
                "role": "subject",
                "controlaccess": true,
                "questionable": false
            }
        ]
    },
    "total_children": 3,
    "total_components": 44
}



describe('archivesUtils', function () {



	it('should parse a archive record into identfiers used to match', function () {

		var r = archivesUtils.extractIds(collectionJson)	

		r.title.should.equal('Alexander Hamilton papers')
		r.mssDb.should.equal(206)
		r.mss.should.equal(1297)
		r.bNumber.should.equal('b12361313')
		r.callNumber.should.equal('MssCol 1297')
		r.barcode.should.equal(33433087858829)


	})

	it('should parse a archive record into agents', function () {

		var r = archivesUtils.extractAgents(collectionJson)	
		r[0].id.should.equal(375)
		r[0].namePart.should.equal("Hamilton, Alexander, 1757-1804")
		r[0].type.should.equal("persname")
		r[0].authority.should.equal("naf")
		r[0].role.should.equal("creator")
		r[0].valueURI.should.equal(false)

		r[2].id.should.equal(164903)
		r[2].namePart.should.equal("Hamilton, Elizabeth Schuyler, 1757-1854")
		r[2].type.should.equal("persname")
		r[2].authority.should.equal("naf")
		r[2].role.should.equal("contributor")
		r[2].valueURI.should.equal(true)




	})

	it('should parse a archive record subjects', function () {

		var r = archivesUtils.extractSubjects(collectionJson)	

		r[0].id.should.equal(164907)
		r[0].text.should.equal("Customs administration -- United States")
		r[0].type.should.equal("topic")
		r[0].nameType.should.equal("subject")
		r[0].authority.should.equal("lcsh")
		r[0].valueURI.should.equal(false)



	})

	it('should parse a archive record notes', function () {

		var r = archivesUtils.extractNotes(collectionJson)	

		r[0].type.should.equal('bioghist')
		r[0].text.should.equal('<p>Alexander Hamilton (1754-1804) was a Founding Father, soldier, lawyer and statesman. He served as the first United States Secretary of the Treasury from 1789 to 1795. Born in the West Indies, Hamilton came to the American colonies to attend school, graduating from King’s College (Columbia University) in 1774. He fought as an American military officer during the Revolutionary War and was General George Washington’s aide-de-camp prior to his resignation from the Army in 1782. In that same year he established his law practice in New York City and was appointed Receiver of Continental Taxes for the State of New York. Hamilton represented the State at the Constitutional Convention of 1787, and played a key role in supporting the adoption of the United States Constitution as co-author of The Federalist Papers with John Jay and James Madison. Hamilton was also instrumental in shaping the country’s financial system. In 1789, President Washington appointed Hamilton as the first United States Secretary of the Treasury. He resigned in 1795, returning to his law practice in New York. In 1780 he married Elizabeth Schuyler (1757-1854), daughter of General Philip Schuyler. Hamilton was mortally wounded in a duel with Aaron Burr on July 11, 1804.</p>')


	})

	it('should parse a archive lang', function () {

		var r = archivesUtils.extractLanguage(collectionJson)	
		r[0].should.equal('ger')

	})

	it('should parse a archive dates', function () {

		var r = archivesUtils.extractDates(collectionJson)	
		r[0].point.should.equal('start')
		r[0].value.should.equal(1775)
	})

	it('should parse a archive abstract', function () {

		var r = archivesUtils.extractAbstracts(collectionJson)	
		r[0].should.equal("Alexander Hamilton (1754-1804) was a Founding Father, soldier, lawyer and statesman. He served as the first United States Secretary of the Treasury from 1789 to 1795. The Alexander Hamilton papers, dated 1775-1804, primarily consist of letters and documents either written or signed by Alexander Hamilton, and pertain to his career as a soldier, lawyer, statesman and United States Secretary of the Treasury. Autograph letters, drafts and copies of letters sent by Hamilton concern his Revolutionary War service, chiefly as an aide-de-camp to General George Washington; his legal practice in New York; and financial and political matters. Notable items include Hamilton’s letters to President Washington, dated 1796, concerning the writing of Washington’s Farewell Address to the nation, with a draft of the Address written by Hamilton for Washington’s consideration. Documents include his 1782 appointment as Receiver of Continental Taxes in New York, legal documents relating to his law practice and personal estate, and legal notes and other items in his hand. Treasury Department letters are chiefly manuscript or printed circular letters which are not in Hamilton’s handwriting but bear his autograph signature.")

	})



})


