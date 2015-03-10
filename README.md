# harvest

[![Build Status](https://travis-ci.org/holidayextras/harvest.svg?branch=master)](https://travis-ci.org/holidayextras/harvest)

## About

Harvest is a basket management system that translates baskets between 2 representations -a shared basket can have its data manipulated and a stored basket is a versioned object that can then be persisted to a document store.

It is designed to work with complementary modules that will be able to persist the stored basket representation on both the server and client.

## Getting Started

If you want to work on this repo you will need to install the dependencies
```
$ npm install
```

To include Harvest and to create an initial stored basket use the following code

```
var Harvest = require( 'harvest' );

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
```

## Basket Representations

### Shared Baskets

These baskets contain small bits of metadata. The id is linked to where this basket is stored on the document store. The version and the tag are the current version of the data being manipulated and will be used both set and get the saved basket representation.

The basket’s data is stored under the data node and can be added and removed freely.

```
{
	id: 'unknown',
	version: '9bd14f98',
	tag: 'availability',
	data: {
		brand: 'PB',
		park: 'Paultons',
		agent: 'PDP01',
		adults: 1,
		children: 2,
		infants: 0
	}
}
```

### Stored Baskets

These baskets contain the representation of a basket that can be persisted 

```
{
	head: 'availability',
	tags: {
		initial: '9d3f76e0',
		engine: '1ae35058',
		availability: '9bd14f98'
	},
	versions: {
		'9d3f76e0': {
			base: null,
			tag: 'initial',
			createdAt: '2014-11-27T13:31:18.085Z',
			'+': {
				park: 'Paultons',
				brand: 'PB',
				agent: 'PDP01'
			},
			'-': []
		},
		'1ae35058’: {
			base: '9d3f76e0',
			tag: 'engine',
			createdAt: '2014-11-27T13:31:18.094Z',
		'+': {
					adults: 1,
					children: 2,
					infants: 0
		},
		'-': [
					'park'
			]
		},
		'9bd14f98': {
			base: '1ae35058',
			tag: 'availability',
			createdAt: '2014-11-27T13:45:56.143Z',
			'+': {},
			'-': []
		}
	},
	searchableKeys: {
		brand: 'PB',
	},
	createdAt: '2015-02-02T14:49:43.881Z'
}
```

Each new version is stored under a randomly generated hash. The base node indicated what the parent of this version is, with the oldest version having null as base. The ‘+’ indicates what is added in this version and the ‘-‘ what is subtracted.

This basket also stores tags that relate to versions and the head links to the most recent tag.

For searches on baskets using Map Reduce functions in Couch, some keys are declared as _searchable_ and stored in a searchableKeys object.

## Public Functions

###createBasket()

Call this function with a shared basket like above to create an initial saved version of the basket. This will set up the tags and versions of the basket, creating an initial version by default that will represent the information known before the shared basket that is created.

If a tag is also passed in a second version will be generated under that tag that will inherit the data from the initial version.

The newly created saved basket will be returned.

###saveBasket()

Call this function with a shared basket and a stored basket and the stored basket will be updated with data from the shared basket. This function will pick up the differences on the current version of the basket to its parent and store what has been added and removed from the basket.

The updated saved basket will be returned from this function.

###addVersion()

Call this function with a shared basket, the version that you want to base a new version on and the tag that you want to assign to this version.

This will create a new version on the stored basket with no current additions and subtractions.

This will return back an updated saved basket with the new version included.

###getSharedBasket()

Call this function with a saved basket and a tag to return a shared basket based on that tag.

## Contributing

Code is linted by '.jshintrc' and checked against the coding style guide 'shortbreaks.jscs.json'. We also use Mocha to test our code, to run all of this use ` $ grunt test `.

## License
Copyright (c) 2015 Shortbreaks
Licensed under the MIT license.