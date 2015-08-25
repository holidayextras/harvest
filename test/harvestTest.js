/*jshint -W030 */
'use strict';

var should;
should = require( 'chai' ).should();
var Harvest = require( '../lib/harvest' );
var _ = require( 'lodash' );

// Stop the Tests from interfering with each other by returning clones of the fixtures
function loadTestResource( location ) {
	return _.cloneDeep( require( location ) );
}

describe( 'LIB: Harvest', function() {

	describe( '#createBasket', function() {
		it( 'Harvest should return a basket with 1 tag and 1 version when no initial tag is passed in', function( done ) {
			var requestedBasket = {
				id: null,
				version: null,
				tag: null,
				data: {
					park: 'PB',
					agent: 'PDP01'
				}
			};

			var storedBasket = Harvest.createBasket( requestedBasket );

			// Test overall structure
			storedBasket.should.be.an( 'object' );
			storedBasket.should.include.keys( 'head', 'tags', 'versions' );

			// Test Tags
			storedBasket.tags.should.be.an( 'object' );
			_.keys( storedBasket.tags ).should.have.length( 1 );

			// Test Versions
			storedBasket.versions.should.be.an( 'object' );
			_.keys( storedBasket.versions ).should.have.length( 1 );

			done();

		} );

		it( 'Harvest should return a basket with 2 tags and 2 versions when an initial tag is passed in', function( done ) {
			var requestedBasket = {
				id: null,
				version: null,
				tag: 'engine',
				data: {
					park: 'PB',
					agent: 'PDP01'
				}
			};

			var storedBasket = Harvest.createBasket( requestedBasket );

			// Test overall structure
			storedBasket.should.be.an( 'object' );
			storedBasket.should.include.keys( 'head', 'tags', 'versions' );

			// Test Tags
			storedBasket.tags.should.be.an( 'object' );
			_.keys( storedBasket.tags ).should.have.length( 2 );

			// Test Versions
			storedBasket.versions.should.be.an( 'object' );
			_.keys( storedBasket.versions ).should.have.length( 2 );

			done();

		} );

		it( 'Harvest should return a basket with a creation timestamp', function( done ) {
			var requestedBasket = {
				id: null,
				version: null,
				tag: 'engine',
				data: {}
			};

			// Check that this date is stored as a string
			var storedBasket = Harvest.createBasket( requestedBasket );
			storedBasket.createdAt.should.be.a( 'string' );

			// and it is parseable into a date object
			var createdAtDateObject = Date.parse( storedBasket.createdAt );
			createdAtDateObject.should.be.ok;
			done();

		} );

		it( 'Harvest should return a basket with searchable elements', function( done ) {
			var requestedBasket = {
				id: null,
				version: null,
				tag: 'engine',
				data: {
					brand: 'PB',
					customer: {},
					orderId: '5XXXXXX',
					pin: '3333',
					notSearchableKey: 'notSearchableValue'
				}
			};

			// Above we have 4 things that can be searched and one that can't - ensure that we get 4 keys searchable
			var storedBasket = Harvest.createBasket( requestedBasket );
			storedBasket.searchableKeys.should.be.an( 'object' );
			_.keys( storedBasket.searchableKeys ).should.have.length( 4 );
			done();

		} );

		it( 'Harvest should throw an error if invalid sharedBasket is sent in', function( done ) {
			var requestedBasket = {};

			Harvest.createBasket.bind( Harvest, requestedBasket ).should.throw( 'Invalid Shared Basket' );

			done();

		} );

	} );

	describe( '#saveBasket', function() {
		it( 'Harvest should return a new Stored Basket with correct additions and subtractions when both a shared and a stored basket are passed in', function( done ) {

			var storedBasket = loadTestResource( './fixtures/storedBasketWithParkAndAgent.json' );
			var requestedBasket = loadTestResource( './fixtures/sharedBasketWithAgentAndPartyComposition.json' );

			Harvest.saveBasket( requestedBasket, storedBasket );
			var version = storedBasket.tags[requestedBasket.tag];
			var updatedVersion = storedBasket.versions[version];

			updatedVersion['+'].should.include.keys( 'adults', 'children', 'infants' );
			updatedVersion['-'].should.include( 'park' );
			done();

		} );


		it( 'Harvest should throw an error if invalid sharedBasket is passed in', function( done ) {

			var storedBasket =  loadTestResource( './fixtures/storedBasketWithParkAndAgent.json' );
			var requestedBasket = {};

			Harvest.saveBasket.bind( Harvest, requestedBasket, storedBasket ).should.throw( 'Invalid Shared Basket' );

			done();

		} );

		it( 'Harvest should throw an error if invalid storedBasket is passed in', function( done ) {

			var storedBasket = {};
			var requestedBasket = loadTestResource( './fixtures/sharedBasketWithAgentAndPartyComposition.json' );

			Harvest.saveBasket.bind( Harvest, requestedBasket, storedBasket ).should.throw( 'Invalid Stored Basket' );

			done();

		} );
	} );

	describe( '#addVersion', function() {
		it( 'Harvest should return a new Stored Basket when a stored basket is passed in with a new tag', function( done ) {

			var storedBasket = loadTestResource( './fixtures/storedBasketWithParkAndAgent.json' );
			var parentVersionHash = storedBasket.tags[storedBasket.head];
			var originalKeysLength = _.keys( storedBasket.versions ).length;

			Harvest.addVersion( storedBasket, parentVersionHash, 'availability' );

			storedBasket.tags.should.include.keys( 'availability' );
			_.keys( storedBasket.versions ).should.have.length( originalKeysLength + 1 );

			done();

		} );

		it( 'Harvest should throw an error if a non-existent parent version is passed in', function( done ) {

			var storedBasket = loadTestResource( './fixtures/storedBasketWithParkAndAgent.json' );
			var parentVersionHash = 'missing';

			Harvest.addVersion.bind( Harvest, storedBasket, parentVersionHash, 'availability' ).should.throw( '"missing" is not a valid version hash in this basket' );

			done();

		} );

		it( 'Harvest should throw an error if invalid storedBasket is passed in', function( done ) {

			var storedBasket = {};
			var parentVersionHash = 'xxxx';

			Harvest.addVersion.bind( Harvest, storedBasket, parentVersionHash, 'availability' ).should.throw( 'Invalid Stored Basket' );

			done();

		} );

		it( 'Harvest should throw an error if no parentVersionHash is passed in', function( done ) {

			var storedBasket = loadTestResource( './fixtures/storedBasketWithParkAndAgent.json' );

			Harvest.addVersion.bind( Harvest, storedBasket ).should.throw( TypeError, 'previousVersionHash must be a string' );

			done();

		} );

		it( 'Harvest should throw a type error if no tag is passed in', function( done ) {

			var storedBasket = loadTestResource( './fixtures/storedBasketWithParkAndAgent.json' );
			var parentVersionHash = storedBasket.tags[storedBasket.head];

			Harvest.addVersion.bind( Harvest, storedBasket, parentVersionHash ).should.throw( TypeError, 'Tag must be a string' );

			done();

		} );
	} );

	describe( '#getSharedBasket', function() {
		it( 'Harvest should return a shared basket when passed a valid stored basket', function( done ) {

			var storedBasket = _.clone( loadTestResource( './fixtures/storedBasketWithParkAndAgent.json' ) );
			var tag = storedBasket.head;
			var sharedBasket = Harvest.getSharedBasket( storedBasket, tag );

			sharedBasket.should.deep.equal( loadTestResource( './fixtures/sharedBasketWithParkAndAgent.json' ) );

			done();

		} );

		it( 'Harvest should return the head version of a stored basket if a tag is not passed in', function( done ) {

			var storedBasket = loadTestResource( './fixtures/storedBasketWithParkAndAgent.json' );
			var sharedBasket = Harvest.getSharedBasket( storedBasket );

			sharedBasket.should.deep.equal( loadTestResource( './fixtures/sharedBasketWithParkAndAgent.json' ) );

			done();

		} );

		it( 'Harvest should correctly deal with additions and subtractions between versions', function( done ) {

			var storedBasket = loadTestResource( './fixtures/storedBasketWithAdditionsAndSubtractions.json' );
			var sharedBasket = Harvest.getSharedBasket( storedBasket );

			sharedBasket.should.deep.equal( loadTestResource( './fixtures/sharedBasketWithAdditionsAndSubtractions.json' ) );

			done();

		} );

		it( 'Harvest should throw an error if invalid storedBasket is passed in', function( done ) {

			var storedBasket = {};
			var tag = 'xxxx';

			Harvest.getSharedBasket.bind( Harvest, storedBasket, tag ).should.throw( 'Invalid Stored Basket' );

			done();

		} );

		it( 'Harvest should throw an error if a non-existent tag is passed in', function( done ) {

			var storedBasket = loadTestResource( './fixtures/storedBasketWithParkAndAgent.json' );
			var tag = 'missing';

			Harvest.getSharedBasket.bind( Harvest, storedBasket, tag ).should.throw( '"missing" is not a valid tag in this basket' );

			done();

		} );

	} );

} );