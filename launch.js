'use strict';

var Harvest = require( './lib/harvest.js' );
var util = require( 'util' );

var requestedBasket;
var storedBasket;
var sharedBasket;

function printData( basketRequested, basketStored, basketShared ) {
  console.log( 'The new passed down data is ', basketRequested );
  console.log( 'The Stored Data is', util.inspect( basketStored, false, null ) );
  console.log( 'The returned Data is', basketShared );
  console.log( '' );
}

console.log( '##################' );
console.log( 'Harvest Simulation' );
console.log( '##################' );

console.log( '' );

console.log( 'Level 1 - Generating a basket' );
console.log( '#############################' );

console.log( '' );
console.log( 'A customer has requested a page with an engine on it and needs a basket to store their needs' );
console.log( '' );

requestedBasket = {
  id: null,
  version: null,
  tag: 'engine',
  data: {
    park: 'PB',
    agent: 'PDP01'
  }
};

storedBasket = Harvest.createBasket( requestedBasket );
sharedBasket = Harvest.getSharedBasket( storedBasket, 'engine' );
printData( requestedBasket, storedBasket, sharedBasket );

console.log( 'Level 2 - Selecting Stuff on Engine ready for an availability page' );
console.log( '##################################################################' );

console.log( '' );
console.log( 'The customer has filled out the engine, with some info.' );
console.log( '' );

// New External Data adds a bit of information
requestedBasket = {
  id: null,
  version: sharedBasket.version,
  tag: 'engine',
  data: {
    agent: 'PDP01',
    adults: 1,
    children: 2,
    infants: 0
  }
};

Harvest.saveBasket( requestedBasket, storedBasket );
sharedBasket = Harvest.getSharedBasket( storedBasket, 'engine' );
printData( requestedBasket, storedBasket, sharedBasket );

console.log( 'Level 3 - Availability Generation' );
console.log( '#################################' );

console.log( '' );
console.log( 'The customer has landed on the availability page - we need a new version of the basket.' );
console.log( '' );

Harvest.addVersion( storedBasket, sharedBasket.version, 'availability' );
sharedBasket = Harvest.getSharedBasket( storedBasket, 'availability' );

printData( requestedBasket, storedBasket, sharedBasket );
