import "dotenv/config"
// @ts-ignore
import { NetatmoAPI, massageOutput } from "./src/netatmo-api.ts"

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const USERNAME = process.env.USERNAME
const PASSWORD = process.env.PASSWORD

const api = new NetatmoAPI(USERNAME, PASSWORD, CLIENT_ID, CLIENT_SECRET)

async function run() {
  const devices = await api.getFavoriteStationData()
  const output = massageOutput(devices)

  console.log(JSON.stringify(output, null, 2))
}

run()
