/**
 * Welcome to Cloudflare Workers!
 *
 * - Run `wrangler dev src/cloudflare-worker.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/cloudflare-worker.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { NetatmoAPI, massageOutput } from "./netatmo-api"

const formatJSON = (obj: Record<string, any>, pretty: boolean) => JSON.stringify(obj, null, pretty ? 2 : 0)

const generateJSONResponse = (obj: Record<string, any>, pretty: boolean) => {
	return new Response(formatJSON(obj, pretty), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'Access-Control-Allow-Origin': '*'
		}
	})
}

export interface Env {
	USERNAME: string
	PASSWORD: string
	CLIENT_ID: string
	CLIENT_SECRET: string
}

export default {
	async fetch(
		_request: Request,
		env: Env,
		_ctx: ExecutionContext
	): Promise<Response> {
		const api = new NetatmoAPI(env.USERNAME, env.PASSWORD, env.CLIENT_ID, env.CLIENT_SECRET)
		const devices = await api.getFavoriteStationData()

		return generateJSONResponse(massageOutput(devices), false);
	},
}
