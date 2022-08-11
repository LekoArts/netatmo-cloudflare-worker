# netatmo-cloudflare-worker

A Cloudflare Worker to access the [Netatmo](https://www.netatmo.com/) API and output the information of the "Favorite" devices.

## Setup

1. Create an account: https://auth.netatmo.com/en-gb/access/login
1. Create an app: https://dev.netatmo.com/apps/createanapp#form
1. Copy `client_id` and `client_secret` to env vars
1. Go to https://weathermap.netatmo.com/ and mark stations as your "Favorite"

## Using

Locally you have two options:

1. Run `npm run cli`
1. Run `npm run wrangler` (You have to have `wrangler` globally installed and your Cloudflare worker setup. You'll also need to change `wrangler.toml`)

## Required Env Vars

- `USERNAME`
- `PASSWORD`
- `CLIENT_ID`
- `CLIENT_SECRET`