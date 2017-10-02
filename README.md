![Twitlytics](https://github.com/SimonJThompson/twitlytics-server/raw/master/twitlytics.png)

A simple NodeJS API which receives a t.co referrer link, and traces it back to the user and tweet.

## Setup

Setting up your own installation of Twitlytics is easy.

### (Required) Create a Twitter App

Head over to [apps.twitter.com](https://apps.twitter.com/) and create a Twitter app. You need this so you can authenticate with the Twitter API and send requests.

Once created, go to "Keys and Access Tokens" and make a note of the Consumer Key (API Secret) and the Consumer Secret (API Secret). You'll also need to generate an Access Token and Access Token and secret.

### (Required) Create a GitHub Access Token

To allow it to run on platforms like Heroku with no persistent disk, twitlytics-server uses GitHub Gists for persistent storage.

Create or login to your GitHub account, and head to your [Personal access tokens](https://github.com/settings/tokens). Generate a new token with a description of
something like "twitlytics" and be sure to click the checkbox to enable the `gist` scope. Make a note of the key that's generated!


### (Option 1 - Easiest) Heroku

The quickest way to get started is to use Heroku. Click the button below, and their UI will walk you through the setup and will prompt you for the Twitter and GitHub details from the previous steps.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/SimonJThompson/twitlytics-server/tree/master)

### (Option 2) Self-Hosted

Assuming you've got an internet-facing server with Node.JS installed already, the basics of setup are;

1. `git clone` this repository to your server
2. Install the dependencies by running `npm install`
3. Create a file named `.env` in the newly created directory with the following, being sure to replace each `{SETTING}`

```
TWITTER_CONSUMER_KEY={YOUR_CONSUMER_KEY}
TWITTER_CONSUMER_SECRET={YOUR_CONSUMER_SECRET}
TWITTER_ACCESS_TOKEN_KEY={YOUR_ACCESS_TOKEN_KEY}
TWITTER_ACCESS_TOKEN_SECRET={YOUR_ACCESS_TOKEN_SECRET}
GITHUB_ACCESS_TOKEN={YOUR_GITHUB_ACCESS_TOKEN}
```

4. Start the server with `npm start`. Ideally you'll want to use something like [Forever](https://github.com/foreverjs/forever) or [pm2](https://github.com/Unitech/pm2) to keep it running
