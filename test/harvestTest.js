/* eslint no-unused-expressions:0 */
'use strict';

var chai = require( 'chai' );
var expect = chai.expect;
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
      expect( storedBasket ).to.be.an( 'object' );
      expect( storedBasket ).to.include.keys( 'head', 'tags', 'versions' );

      // Test Tags
      expect( storedBasket.tags ).to.be.an( 'object' );
      expect( _.keys( storedBasket.tags ) ).to.have.length( 1 );

      // Test Versions
      expect( storedBasket.versions ).to.be.an( 'object' );
      expect( _.keys( storedBasket.versions ) ).to.have.length( 1 );

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
      expect( storedBasket ).to.be.an( 'object' );
      expect( storedBasket ).to.include.keys( 'head', 'tags', 'versions' );

      // Test Tags
      expect( storedBasket.tags ).to.be.an( 'object' );
      expect( _.keys( storedBasket.tags ) ).to.have.length( 2 );

      // Test Versions
      expect( storedBasket.versions ).to.be.an( 'object' );
      expect( _.keys( storedBasket.versions ) ).to.have.length( 2 );

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
      expect( storedBasket.createdAt ).to.be.a( 'string' );

      // and it is parseable into a date object
      var createdAtDateObject = Date.parse( storedBasket.createdAt );
      expect( createdAtDateObject ).to.be.ok;
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
      expect( storedBasket.searchableKeys ).to.be.an( 'object' );
      expect( _.keys( storedBasket.searchableKeys ) ).to.have.length( 4 );
      done();

    } );

    it( 'Harvest should throw an error if invalid sharedBasket is sent in', function( done ) {
      var requestedBasket = {};

      expect( Harvest.createBasket.bind( Harvest, requestedBasket ) ).to.throw( 'Invalid Shared Basket' );

      done();

    } );

  } );

  describe( '#saveBasket', function() {
    it( 'Harvest should return a new Stored Basket with correct additions and subtractions when both a shared and a stored basket are passed in', function( done ) {

      var storedBasket = loadTestResource( './fixtures/storedBasketWithParkAndAgent' );
      var requestedBasket = loadTestResource( './fixtures/sharedBasketWithAgentAndPartyComposition' );

      Harvest.saveBasket( requestedBasket, storedBasket );
      var version = storedBasket.tags[requestedBasket.tag];
      var updatedVersion = storedBasket.versions[version];

      expect( updatedVersion['+'] ).to.include.keys( 'adults', 'children', 'infants' );
      expect( updatedVersion['-'] ).to.include( 'park' );
      done();

    } );


    it( 'Harvest should throw an error if invalid sharedBasket is passed in', function( done ) {

      var storedBasket = loadTestResource( './fixtures/storedBasketWithParkAndAgent' );
      var requestedBasket = {};

      expect( Harvest.saveBasket.bind( Harvest, requestedBasket, storedBasket ) ).to.throw( 'Invalid Shared Basket' );

      done();

    } );

    it( 'Harvest should throw an error if invalid storedBasket is passed in', function( done ) {

      var storedBasket = {};
      var requestedBasket = loadTestResource( './fixtures/sharedBasketWithAgentAndPartyComposition' );

      expect( Harvest.saveBasket.bind( Harvest, requestedBasket, storedBasket ) ).to.throw( 'Invalid Stored Basket' );

      done();

    } );
  } );

  describe( '#addVersion', function() {
    it( 'Harvest should return a new Stored Basket when a stored basket is passed in with a new tag', function( done ) {

      var storedBasket = loadTestResource( './fixtures/storedBasketWithParkAndAgent' );
      var parentVersionHash = storedBasket.tags[storedBasket.head];
      var originalKeysLength = _.keys( storedBasket.versions ).length;

      Harvest.addVersion( storedBasket, parentVersionHash, 'availability' );

      expect( storedBasket.tags ).to.include.keys( 'availability' );
      expect( _.keys( storedBasket.versions ) ).to.have.length( originalKeysLength + 1 );

      done();

    } );

    it( 'Harvest should throw an error if a non-existent parent version is passed in', function( done ) {

      var storedBasket = loadTestResource( './fixtures/storedBasketWithParkAndAgent' );
      var parentVersionHash = 'missing';

      expect( Harvest.addVersion.bind( Harvest, storedBasket, parentVersionHash, 'availability' ) ).to.throw( '"missing" is not a valid version hash in this basket' );

      done();

    } );

    it( 'Harvest should throw an error if invalid storedBasket is passed in', function( done ) {

      var storedBasket = {};
      var parentVersionHash = 'xxxx';

      expect( Harvest.addVersion.bind( Harvest, storedBasket, parentVersionHash, 'availability' ) ).to.throw( 'Invalid Stored Basket' );

      done();

    } );

    it( 'Harvest should throw an error if no parentVersionHash is passed in', function( done ) {

      var storedBasket = loadTestResource( './fixtures/storedBasketWithParkAndAgent' );

      expect( Harvest.addVersion.bind( Harvest, storedBasket ) ).to.throw( TypeError, 'previousVersionHash must be a string' );

      done();

    } );

    it( 'Harvest should throw a type error if no tag is passed in', function( done ) {

      var storedBasket = loadTestResource( './fixtures/storedBasketWithParkAndAgent' );
      var parentVersionHash = storedBasket.tags[storedBasket.head];

      expect( Harvest.addVersion.bind( Harvest, storedBasket, parentVersionHash ) ).to.throw( TypeError, 'Tag must be a string' );

      done();

    } );
  } );

  describe( '#getSharedBasket', function() {
    it( 'Harvest should return a shared basket when passed a valid stored basket', function( done ) {

      var storedBasket = _.clone( loadTestResource( './fixtures/storedBasketWithParkAndAgent' ) );
      var tag = storedBasket.head;
      var sharedBasket = Harvest.getSharedBasket( storedBasket, tag );

      expect( sharedBasket ).to.deep.equal( loadTestResource( './fixtures/sharedBasketWithParkAndAgent' ) );

      done();

    } );

    it( 'Harvest should return the head version of a stored basket if a tag is not passed in', function( done ) {

      var storedBasket = loadTestResource( './fixtures/storedBasketWithParkAndAgent' );
      var sharedBasket = Harvest.getSharedBasket( storedBasket );

      expect( sharedBasket ).to.deep.equal( loadTestResource( './fixtures/sharedBasketWithParkAndAgent' ) );

      done();

    } );

    it( 'Harvest should correctly deal with additions and subtractions between versions', function( done ) {

      var storedBasket = loadTestResource( './fixtures/storedBasketWithAdditionsAndSubtractions' );
      var sharedBasket = Harvest.getSharedBasket( storedBasket );

      expect( sharedBasket ).to.deep.equal( loadTestResource( './fixtures/sharedBasketWithAdditionsAndSubtractions' ) );

      done();

    } );

    it( 'Harvest should throw an error if invalid storedBasket is passed in', function( done ) {

      var storedBasket = {};
      var tag = 'xxxx';

      expect( Harvest.getSharedBasket.bind( Harvest, storedBasket, tag ) ).to.throw( 'Invalid Stored Basket' );

      done();

    } );

    it( 'Harvest should throw an error if a non-existent tag is passed in', function( done ) {

      var storedBasket = loadTestResource( './fixtures/storedBasketWithParkAndAgent' );
      var tag = 'missing';

      expect( Harvest.getSharedBasket.bind( Harvest, storedBasket, tag ) ).to.throw( '"missing" is not a valid tag in this basket' );

      done();

    } );

  } );

} );
