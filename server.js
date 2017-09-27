'use strict';

// Load config from .env file.
require('dotenv').config();

// Determine the port we'll listen on.
const port = (process.env.PORT) ? process.env.PORT : 80;

// Check all required env vars are present.
if( !process.env.TWITTER_CONSUMER_KEY ) { console.error( 'Missing Environment Variable', 'TWITTER_CONSUMER_KEY' ); process.exit(); }
if( !process.env.TWITTER_CONSUMER_SECRET ) { console.error( 'Missing Environment Variable', 'TWITTER_CONSUMER_SECRET' ); process.exit(); }
if( !process.env.TWITTER_ACCESS_TOKEN_KEY ) { console.error( 'Missing Environment Variable', 'TWITTER_ACCESS_TOKEN_KEY' ); process.exit(); }
if( !process.env.TWITTER_ACCESS_TOKEN_SECRET ) { console.error( 'Missing Environment Variable', 'TWITTER_ACCESS_TOKEN_SECRET' ); process.exit(); }
if( !process.env.GITHUB_ACCESS_TOKEN ) { console.error( 'Missing Environment Variable', 'GITHUB_ACCESS_TOKEN' ); process.exit(); }

// Load dependencies.
const crypto = require('crypto');
const express = require('express');
const app = express();
const ghks = require('ghks');
const twitter = require('twitter');
const twitterClient = new twitter({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

/*!
 * /lookup/
 * Does a lookup for the given t.co referrer.
 */
app.get( '/lookup/', (req, res) => {

	// Always send CORS headers
	res.header( 'Access-Control-Allow-Origin', '*' );
	res.header( 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept' );

	if( ! req.query.referrer ) return res.json( {status: 'error'} );

	if( ! (req.query.referrer.indexOf( 't.co/' ) > -1) ) return res.json( {status: 'error'} ); // TODO: Better validation.

	let twitterShortlink = req.query.referrer.split( 't.co/' )[1];
	let cacheKey = crypto.createHash( 'md5' ).update( twitterShortlink ).digest( 'hex' ).toString();

	// Check if we have data for this referrer cached already.
	if( cache.get( cacheKey ) ) {

		// Send the cached response.
		return res.json( {
			status: 'ok', 
			cacheHit: 1,
			referrer: req.query.referrer, 
			tweeter: cache.get( cacheKey )
		} );
	}else {

		twitterClient.get( 'search/tweets', {q: req.query.referrer}, function(error, tweets, resp) {

			// Do some sanity checking on Twitter's response.
			if( error || !tweets ) return res.json( {status: 'error', error: 'twitter_error', message: error} );
			if( tweets.statuses.length == 0 ) return res.json( {status: 'error', error: 'twitter_error', message: 'No tweets found.' } );

			// Always look at the oldest tweet.
			let tweet = tweets.statuses.slice(-1)[0];

			// If this is a retweet, find the parent tweet.
			if( tweet.retweeted_status ) tweet = tweet.retweeted_status;

			// Build our response.
			let apiResponse = {
				status: 'ok',
				cacheHit: 0,
				referrer: req.query.referrer,
				tweeter: {
					id: tweet.user.id_str,
					screen_name: tweet.user.screen_name,
				}
			};

			// Write to the cache.
			cache.set( cacheKey, apiResponse.tweeter );
			
			// Trigger a manual cache push to ensure it's copied up.
			cache.push();

			// Send our response.
			res.json( apiResponse );
		} );
	};
} );

// Setup the persistent cache in a GitHub gist.
const cache = new ghks( {
	name: 'twitlytics_cache',
	token: process.env.GITHUB_ACCESS_TOKEN
} );

// Init the cache.
cache.init().then( function() {

	// Start listening!
	console.info( '🐤 Twitlytics is listening on port ' + port );
	app.listen( port );
} ).catch( function( error ) { console.error( 'Failed to init cache', error ); process.exit(); } );
