'use strict';

// Load config from .env file.
require('dotenv').config();

if( !process.env.TWITTER_CONSUMER_KEY ) { console.error( 'Missing Environment Variable', 'TWITTER_CONSUMER_KEY' ); process.exit(); }
if( !process.env.TWITTER_CONSUMER_SECRET ) { console.error( 'Missing Environment Variable', 'TWITTER_CONSUMER_SECRET' ); process.exit(); }
if( !process.env.TWITTER_ACCESS_TOKEN_KEY ) { console.error( 'Missing Environment Variable', 'TWITTER_ACCESS_TOKEN_KEY' ); process.exit(); }
if( !process.env.TWITTER_ACCESS_TOKEN_SECRET ) { console.error( 'Missing Environment Variable', 'TWITTER_ACCESS_TOKEN_SECRET' ); process.exit(); }

// Load dependencies.
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const app = express();
const twitter = require('twitter');
const twitterClient = new twitter({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// Ensure the cache directory exists.
if( !fs.existsSync( './cache/' ) ) fs.mkdirSync( './cache/' );

/*!
 * /lookup/
 * Does a lookup for the given t.co referrer.
 */
app.get( '/lookup/', (req, res) => {

	// Always send CORS headers
	res.header( 'Access-Control-Allow-Origin', '*' );
	res.header( 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept' );

	if( ! req.query.referrer ) return res.json( {status: 'error'} );

	// Build the cache file name based on the md5 of the referrer.
	let cacheFile = crypto.createHash( 'md5' ).update( req.query.referrer ).digest( 'hex' ).toString() + '.json';

	// Check if we have data for this referrer cached already.
	if( fs.existsSync( 'cache/' + cacheFile ) ) {

		// Send the cached response.
		return res.json( JSON.parse( fs.readFileSync( 'cache/' + cacheFile ).toString() ) );
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
				referrer: req.query.referrer,
				tweet: {
					id: tweet.id_str,
					text: tweet.text
				},
				tweeter: {
					id: tweet.user.id_str,
					name: tweet.user.name,
					screen_name: tweet.user.screen_name,
					followers: tweet.user.followers_count,
					verified: tweet.user.verified
				}
			};

			// Write to the cache.
			fs.writeFileSync( './cache/' + cacheFile, JSON.stringify(apiResponse) );

			// Send our response.
			res.json( apiResponse );
		} );
	};
} );

// Start listening!
const port = (process.env.PORT) ? process.env.PORT : 80;
console.info( '🐤 Twitlytics is listening on port ' + port );
app.listen( port );
