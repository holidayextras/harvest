/* eslint no-use-before-define:0 */
'use strict';

( function() {

  // The use of crypto and underscore needs to be evaluated when harvest is also going to be used client-side
  // as these libraries could increase loading times for a simple function.
  var _ = require( 'lodash' );
  var crypto = require( 'crypto' );

  var harvest = {};

  // Keys that we can use outside of versions
  // As this is expected to be used clientside as well it doesn't make any sense to download config from transformer so declare them here.
  var searchableKeys = [
    'brand',
    'customer',
    'orderId',
    'pin'
  ];

  /**
   * Create a basket with some initial data
   *
   * @param  {Object} sharedBasket - the shared representation of the basket with some initial data stored
   * @return {Object} storedBasket - the stored representation of the basket
   */
  harvest.createBasket = function( sharedBasket ) {

    if ( !_isValidSharedBasket( sharedBasket ) ) {
      throw new TypeError( 'Invalid Shared Basket' );
    }

    // We always start a basket with an 'initial version' - information known about the basket before creation
    var initialTag = 'initial';
    var storedBasket = {
      head: initialTag,
      tags: {},
      versions: {}
    };

    var initialVersionKey = _generateVersionKey();
    storedBasket.tags.initial = initialVersionKey;
    storedBasket.versions[initialVersionKey] = {
      base: null,
      tag: initialTag,
      createdAt: new Date().toISOString(),
      '+': sharedBasket.data,
      '-': []
    };

    // If we have asked for a specific version (based on tag) then we want to create that as a child based on the initial version
    if ( sharedBasket.tag ) {
      var versionKey = _generateVersionKey();
      storedBasket.tags[sharedBasket.tag] = versionKey;
      storedBasket.versions[versionKey] = {
        base: initialVersionKey,
        tag: sharedBasket.tag,
        createdAt: new Date().toISOString(),
        '+': {},
        '-': []
      };
    }
    // if we have passed in id, lets assign it to our basket
    if ( sharedBasket.id) {
      storedBasket._id = sharedBasket.id;
    }
    // Ex tract the keys that we can use to search baskets.
    storedBasket.searchableKeys = _extractSearchableInformation( sharedBasket );

    // Timestamp to show when basket was created
    storedBasket.createdAt = ( new Date() ).toISOString();

    return storedBasket;
  };

  /**
   * Update the stored representation of a basket based on an updated version of the sharedBasket
   *
   * @param  {Object} sharedBasket - the shared representation of the basket with some initial data stored
   * @param  {Object} storedBasket - the previously stored representation of the basket - this will be updated by reference
   * @return {undefined}
   */
  harvest.saveBasket = function( sharedBasket, storedBasket ) {

    if ( !_isValidSharedBasket( sharedBasket ) ) {
      throw new TypeError( 'Invalid Shared Basket' );
    }

    if ( !_isValidStoredBasket( storedBasket ) ) {
      throw new TypeError( 'Invalid Stored Basket' );
    }

    // Get the version from the tag that has been passed in
    var version = storedBasket.tags[sharedBasket.tag];

    // Get the version of the parent
    var parentVersion = storedBasket.versions[version].base;

    // Using the 'base' of this version calculate what was previously shared.
    var previouslySharedBasket = _buildBasketFromVersion( storedBasket, parentVersion );

    // Work out what has been added between the previous version of the basket and this one.
    var additions = {};
    _.each( sharedBasket.data, function( value, key ) {
      if ( !_.isEqual( value, previouslySharedBasket[key] ) ) {
        additions[key] = value;
      }
    } );

    // Then do the same for what has been removed from the new version of the basket.
    var subtractions = [];
    _.each( previouslySharedBasket, function( value, key ) {
      if ( _.isUndefined( sharedBasket.data[key] ) ) {
        subtractions.push( key );
      }
    } );

    // Extract the keys that we can use to search baskets.
    storedBasket.searchableKeys = _extractSearchableInformation( sharedBasket );

    // Attach the additions and subtractions to this version of the object.
    storedBasket.versions[version]['+'] = additions;
    storedBasket.versions[version]['-'] = subtractions;
  };

  /**
   * Add a new version to the basket
   *
   * @param  {Object} storedBasket - the stored representation of the basket - this will be updated by reference
   * @param  {String} previousVersionHash - the hash string representing the previous version of the basket
   * @param  {String} tag - the tag that we store the new version under
   * @return {undefined}
   */
  harvest.addVersion = function( storedBasket, previousVersionHash, tag ) {

    if ( !_isValidStoredBasket( storedBasket ) ) {
      throw new TypeError( 'Invalid Stored Basket' );
    }

    if ( !_.isString( previousVersionHash ) ) {
      throw new TypeError( 'previousVersionHash must be a string' );
    }

    if ( !_.isString( tag ) ) {
      throw new TypeError( 'Tag must be a string' );
    }

    if ( _.isUndefined( storedBasket.versions[previousVersionHash] ) ) {
      throw new Error( '"' + previousVersionHash + '" is not a valid version hash in this basket' );
    }

    // Lets create a new empty version with a new hash, linking to the previous version
    var versionKey = _generateVersionKey();
    storedBasket.versions[versionKey] = {
      base: previousVersionHash,
      tag: tag,
      createdAt: new Date().toISOString(),
      '+': {},
      '-': []
    };

    // Add the new tag and advance the head to point to that tag
    storedBasket.tags[tag] = versionKey;
    storedBasket.head = tag;
  };

  /**
   * Get the shared representation of the basket from the stored basket and a specific tag
   *
   * @param  {Object} storedBasket - the stored representation of the basket
   * @param  {String} tag - represents the version of the basket that we want. If not passed in get HEAD version
   * @return {Object} the shared representation of the basket
   */
  harvest.getSharedBasket = function( storedBasket, tag ) {

    if ( !_isValidStoredBasket( storedBasket ) ) {
      throw new TypeError( 'Invalid Stored Basket' );
    }

    if ( _.isUndefined( tag ) ) {
      tag = storedBasket.head;
    }

    if ( _.isUndefined( storedBasket.tags[tag] ) ) {
      throw new Error( '"' + tag + '" is not a valid tag in this basket' );
    }

    return {
      id: storedBasket._id,
      rev: storedBasket._rev,
      version: storedBasket.tags[tag],
      tag: tag,
      createdAt: storedBasket.createdAt,
      data: _buildBasketFromTag( storedBasket, tag ),
      meta: {
        tags: storedBasket.tags
      }
    };
  };

  // Private functions

  // Verifies that a stored basket has a head, a versions object and a tags object
  function _isValidStoredBasket( storedBasket ) {
    return ( _.isObject( storedBasket ) && _.isObject( storedBasket.tags ) && _.isObject( storedBasket.versions ) && _.isString( storedBasket.head ) );
  }

  // Verifies that a shared basket has is an object with a data object
  function _isValidSharedBasket( sharedBasket ) {
    return ( _.isObject( sharedBasket ) && _.isObject( sharedBasket.data ) );
  }

  // Generate a unique 8 character key that can be used for this version of the basket
  function _generateVersionKey() {
    return crypto.randomBytes( 4 ).toString( 'hex' );
  }

  // Build the data of the basket based on the value of the tag
  function _buildBasketFromTag( storedBasket, tag ) {
    return _buildBasketFromVersion( storedBasket, storedBasket.tags[tag] );
  }

  // Build the data of the basket based on the value of the version
  function _buildBasketFromVersion( storedBasket, versionHash ) {

    var version = storedBasket.versions[versionHash];

    if ( !version.base ) {
      // If this is the original version then just return what was originally added and break the recursion
      return version['+'];
    }

    // If this version has a parent version that it is 'based' on then recursivly call down to that version.
    // (need to clone so we aren't manipulating the original data)
    var extractedData = _.clone( _buildBasketFromVersion( storedBasket, version.base ) );

    // add the data from this version to that from the parent(s)
    var data = _.extend( extractedData, version['+'] );

    // remove anything that this versions deletes
    _.each( version['-'], function( key ) {
      delete data[key];
    } );

    return data;
  }

  // From the shared baskest extract the information that we want to use in queries to search baskets
  function _extractSearchableInformation( sharedBasket ) {
    var foundKeys = {};
    _.each( searchableKeys, function( searchableKey ) {
      if ( !_.isUndefined( sharedBasket.data[searchableKey] ) ) {
        foundKeys[searchableKey] = sharedBasket.data[searchableKey];
      }
    } );
    return foundKeys;
  }

  exports = module.exports = harvest;

}() );
