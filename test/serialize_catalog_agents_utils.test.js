var should = require('should')
var serialize = require("../lib/serialize_catalog_agents_utils.js")




describe('serialize agent catalog', function () {

	it('new agent with viaf', function () {

		var scAgent = 	{ nameLocal: 'Gmelin, Hermann, 1900-1958.',
						  relator: false,
						  type: 'personal',
						  contributor: false,
						  nameLc: 'Gmelin, Hermann, 1900-1958',
						  nameViaf: 'Gmelin, Hermann, 1900-1958',
						  viaf: 25360128 
						}
		
		var viaf = { _id: 25360128,
					  sourceCount: 9,
					  type: 'Personal',
					  hasLc: true,
					  hasDbn: true,
					  lcId: 'n85380073',
					  gettyId: '555',
					  wikidataId: 'Q1277151',
					  lcTerm: 'Gmelin, Hermann, 1900-1958',
					  dnbTerm: 'Gmelin, Hermann, 1900-1958',
					  viafTerm: 'Gmelin, Hermann, 1900-1958',
					  birth: '1900-08-08',
					  death: '1958-11-07',
					  dbpediaId: false,
					  normalized: [ 'gmelin hermann 1900 1958' ] 
					}

		var registryAgent = false


		var newAgent = serialize.mergeScAgentViafRegistryAgent(scAgent,viaf,registryAgent)

		newAgent.viaf.should.equal(25360128)
		newAgent.registry.should.equal(false)
		newAgent.nameControled.should.equal('Gmelin, Hermann, 1900-1958')
		newAgent.wikidata.should.equal('Q1277151')
		newAgent.lcId.should.equal('n85380073')
		newAgent.gettyId.should.equal(555)
		newAgent.dbpedia.should.equal(false)
		newAgent.birth.should.equal('1900-08-08')
		newAgent.death.should.equal('1958-11-07')
		newAgent.type.should.equal('personal')
		newAgent.source.should.equal(false)
		newAgent.usecount.should.equal(0)
		newAgent.nameNormalized[0].should.equal( 'gmelin hermann 1900 1958' )

	})
	
	it('new agent with out viaf', function () {

		var scAgent = 	{ nameLocal: 'Gmelin, Hermann',
						  relator: false,
						  type: 'personal',
						  contributor: false,
						  nameLc: '',
						  nameViaf: false,
						  viaf: false 
						}
		
		var viaf = false

		var registryAgent = false

		var newAgent = serialize.mergeScAgentViafRegistryAgent(scAgent,viaf,registryAgent)

		newAgent.viaf.should.equal(false)
		newAgent.registry.should.equal(false)
		newAgent.nameControled.should.equal('Gmelin, Hermann')
		newAgent.wikidata.should.equal(false)
		newAgent.lcId.should.equal(false)
		newAgent.gettyId.should.equal(false)
		newAgent.dbpedia.should.equal(false)
		newAgent.birth.should.equal(false)
		newAgent.death.should.equal(false)
		newAgent.type.should.equal('personal')
		newAgent.source.should.equal(false)
		newAgent.usecount.should.equal(0)
		newAgent.nameNormalized[0].should.equal( 'gmelin hermann' )


	})
	
	it('new agent with unmatched viaf', function () {

		var scAgent = 	{ nameLocal: 'Gmelin, Hermann',
						  relator: false,
						  type: 'personal',
						  contributor: false,
						  nameLc: '',
						  nameViaf: false,
						  viaf: 123456789 
						}
		
		var viaf = false

		var registryAgent = false

		var newAgent = serialize.mergeScAgentViafRegistryAgent(scAgent,viaf,registryAgent)

		newAgent.viaf.should.equal(123456789)
		newAgent.registry.should.equal(false)
		newAgent.nameControled.should.equal('Gmelin, Hermann')
		newAgent.wikidata.should.equal(false)
		newAgent.lcId.should.equal(false)
		newAgent.gettyId.should.equal(false)
		newAgent.dbpedia.should.equal(false)
		newAgent.birth.should.equal(false)
		newAgent.death.should.equal(false)
		newAgent.type.should.equal('personal')
		newAgent.source.should.equal(false)
		newAgent.usecount.should.equal(0)
		newAgent.nameNormalized[0].should.equal( 'gmelin hermann' )


	})

	it('matched viaf-less agent with viaf', function () {

		var scAgent = 	{ nameLocal: 'Gmelin, Hermann',
						  relator: false,
						  type: 'personal',
						  contributor: false,
						  nameLc: '',
						  nameViaf: false,
						  viaf: 123456789 
						}
		
		
		var viaf = { _id: 25360128,
					  sourceCount: 9,
					  type: 'Personal',
					  hasLc: true,
					  hasDbn: true,
					  lcId: 'n85380073',
					  gettyId: '555',
					  wikidataId: 'Q1277151',
					  lcTerm: 'Gmelin, Hermann, 1900-1958',
					  dnbTerm: 'Gmelin, Hermann, 1900-1958',
					  viafTerm: 'Gmelin, Hermann, 1900-1958',
					  birth: '1900-08-08',
					  death: '1958-11-07',
					  dbpediaId: false,
					  normalized: [ 'gmelin hermann 1900 1958' ] 
					}

		var registryAgent = { viaf: false,
							  registry: false,
							  nameControled: 'Gmelin, Hermann, 1900-1958',
							  wikidata: false,
							  lcId: false,
							  gettyId: 555,
							  dbpedia: false,
							  birth: false,
							  death: false,
							  type: 'personal',
							  source: false,
							  usecount: 1,
							  nameNormalized: [ 'gmelin hermann 1900 1958' ] 
							}

		var newAgent = serialize.mergeScAgentViafRegistryAgent(scAgent,viaf,registryAgent)

		newAgent.viaf.should.equal(25360128)
		newAgent.registry.should.equal(false)
		newAgent.nameControled.should.equal('Gmelin, Hermann, 1900-1958')
		newAgent.wikidata.should.equal('Q1277151')
		newAgent.lcId.should.equal('n85380073')
		newAgent.gettyId.should.equal(555)
		newAgent.dbpedia.should.equal(false)
		newAgent.birth.should.equal('1900-08-08')
		newAgent.death.should.equal('1958-11-07')
		newAgent.type.should.equal('personal')
		newAgent.source.should.equal(false)
		newAgent.usecount.should.equal(1)
		newAgent.nameNormalized[0].should.equal( 'gmelin hermann 1900 1958' )


	})


	it('matched agent with differnt local name', function () {

		var scAgent = 	{ nameLocal: 'Gmelin, Hermann Dude',
						  relator: false,
						  type: 'personal',
						  contributor: false,
						  nameLc: '',
						  nameViaf: false,
						  viaf: 123456789 
						}
		
		
		var viaf = false					

		var registryAgent = { viaf: 25360128,
							  registry: false,
							  nameControled: 'Gmelin, Hermann, 1900-1958',
							  wikidata: 'Q1277151',
							  lcId: 'n85380073',
							  gettyId: 555,
							  dbpedia: false,
							  birth: '1900-08-08',
							  death: '1958-11-07',
							  type: 'personal',
							  source: false,
							  usecount: 1,
							  nameNormalized: [ 'gmelin hermann 1900 1958' ] 
							}

		var newAgent = serialize.mergeScAgentViafRegistryAgent(scAgent,viaf,registryAgent)

		newAgent.viaf.should.equal(25360128)
		newAgent.registry.should.equal(false)
		newAgent.nameControled.should.equal('Gmelin, Hermann, 1900-1958')
		newAgent.wikidata.should.equal('Q1277151')
		newAgent.lcId.should.equal('n85380073')
		newAgent.gettyId.should.equal(555)
		newAgent.dbpedia.should.equal(false)
		newAgent.birth.should.equal('1900-08-08')
		newAgent.death.should.equal('1958-11-07')
		newAgent.type.should.equal('personal')
		newAgent.source.should.equal(false)
		newAgent.usecount.should.equal(1)
		newAgent.nameNormalized[0].should.equal( 'gmelin hermann 1900 1958' )
		newAgent.nameNormalized[1].should.equal( 'gmelin hermann dude' )

	})
	
	it('matched viaf-less agent with local only', function () {

		var scAgent = 	{ nameLocal: 'Gmelin, Hermann dude',
						  relator: false,
						  type: 'personal',
						  contributor: false,
						  nameLc: '',
						  nameViaf: false,
						  viaf: 123456789 
						}
		
		
		var viaf = false

		var registryAgent = { viaf: false,
							  registry: false,
							  nameControled: 'Gmelin, Hermann, 1900-1958',
							  wikidata: false,
							  lcId: false,
							  gettyId: false,
							  dbpedia: false,
							  birth: false,
							  death: false,
							  type: 'personal',
							  source: false,
							  usecount: 1,
							  nameNormalized: [ 'gmelin hermann 1900 1958' ] 
							}

		var newAgent = serialize.mergeScAgentViafRegistryAgent(scAgent,viaf,registryAgent)

		newAgent.viaf.should.equal(false)
		newAgent.registry.should.equal(false)
		newAgent.nameControled.should.equal('Gmelin, Hermann, 1900-1958')
		newAgent.wikidata.should.equal(false)
		newAgent.lcId.should.equal(false)
		newAgent.gettyId.should.equal(false)
		newAgent.dbpedia.should.equal(false)
		newAgent.birth.should.equal(false)
		newAgent.death.should.equal(false)
		newAgent.type.should.equal('personal')
		newAgent.source.should.equal(false)
		newAgent.usecount.should.equal(1)
		newAgent.nameNormalized[0].should.equal( 'gmelin hermann 1900 1958' )
		newAgent.nameNormalized[1].should.equal( 'gmelin hermann dude' )


	})

})