import ky from "ky-universal"
import { FormData } from "formdata-node"

const GET_STATION_DATA_ENDPOINT = `api/getstationsdata`

interface DashboardData {
	time_utc: number
	Pressure?: number
	AbsolutePressure?: number
	pressure_trend?: string
	Temperature?: number
	Humidity?: number
	min_temp?: number
	max_temp?: number
	date_max_temp?: number
	date_min_temp?: number
	temp_trend?: string
  Rain?: number
  sum_rain_1?: number
  sum_rain_24?: number
  WindStrength?: number
  WindAngle?: number
  GustStrength?: number
  GustAngle?: number
  max_wind_str?: number
  max_wind_angle?: number
  date_max_wind_str?: number
}

interface Module {
	_id: string
	type: string
	data_type: Array<string>
	reachable: boolean
	last_message?: number
	last_seen?: number
	dashboard_data: DashboardData
}

export interface Station extends Module {
	station_name: string
	last_status_store: number
	favorite: boolean
	place: {
		altitude: number
		city: string
		country: string
		timezone: string
		location: [number, number]
	}
	read_only: boolean
	modules: Module[]
}

export class NetatmoAPI {
  private token?: string
  private refreshToken?: string
  private client

  constructor(
    private readonly username: string,
    private readonly password: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {
    this.client = ky.extend({
      credentials: undefined,
      prefixUrl: `https://api.netatmo.com/`,
      hooks: {
        afterResponse: [
          async (request, _options, response) => {
            if (response.status === 401) {

              await this.performRefreshToken()
              request.headers.set(`Authorization`, this.token ? `Bearer ${this.token}` : ``)

              return ky(request)
            }

            return response
          }
        ]
      }
    })
  }

  private login() {
    return this.getToken({
      username: this.username,
      password: this.password,
      grant_type: `password`,
    })
  }

  private performRefreshToken() {
    return this.getToken({
      grant_type: `refresh_token`,
      refresh_token: this.refreshToken,
    })
  }

  private async getToken(credentials: Record<string, string>) {
    const form = new FormData()
    for (const [key, value] of Object.entries(credentials)) {
      form.append(key, value)
    }
    form.append(`client_id`, this.clientId)
    form.append(`client_secret`, this.clientSecret)
    form.append(`scope`, `read_station read_thermostat`)

    const res = await ky(`https://api.netatmo.com/oauth2/token`, {
      method: `POST`,
      // @ts-ignore
      body: form,
      credentials: undefined,
    })
    
    if (res.status === 200) {
      const data = await res.json()
      // @ts-ignore
      this.token = data.access_token
      // @ts-ignore
      this.refreshToken = data.refresh_token
    }
  }

  async getFavoriteStationData(): Promise<Station[]> {
    // @ts-ignore
    const { body } = await this.request(GET_STATION_DATA_ENDPOINT, { get_favorites: true })

    return body.devices
  }

  private async request(endpoint: string, searchParams: any) {
    if (!this.token) {
      await this.login()
    }
    const res = await this.client(endpoint, {
      headers: {
        Authorization: this.token ? `Bearer ${this.token}` : ``,
      },
      searchParams
    })

    return res.json()
  }
}

export const massageOutput = (input: Station[]) => {
	return input.map(station => {
		const d = station.dashboard_data
		const tempHumidityModule = station.modules.find(m => m.type === "NAModule1")
		const windModule = station.modules.find(m => m.type === "NAModule2")
		const rainModule = station.modules.find(m => m.type === "NAModule3")

		return {
			station_name: station.station_name,
			last_status_store: station.last_status_store,
			place: station.place,
			pressure: {
				value: d?.Pressure ?? undefined,
				trend: d?.pressure_trend ?? undefined,
			},
			...(tempHumidityModule && {
				temperature: {
					value: tempHumidityModule.dashboard_data?.Temperature ?? undefined,
					min: tempHumidityModule.dashboard_data?.min_temp ?? undefined,
					max: tempHumidityModule.dashboard_data?.max_temp ?? undefined,
					trend: tempHumidityModule.dashboard_data?.temp_trend ?? undefined,
				},
				humidity: {
					value: tempHumidityModule.dashboard_data?.Humidity ?? undefined,
				}
			}),
			...(windModule && {
				wind: {
					strength: windModule.dashboard_data?.WindStrength ?? undefined,
					angle: windModule.dashboard_data?.WindAngle ?? undefined,
					gust: {
						strength: windModule.dashboard_data?.GustStrength ?? undefined,
						angle: windModule.dashboard_data?.GustAngle ?? undefined,
					},
					max_strength: windModule.dashboard_data?.max_wind_str ?? undefined,
					max_angle: windModule.dashboard_data?.max_wind_angle ?? undefined,
				}
			}),
			...(rainModule && {
				rain: {
					value: rainModule.dashboard_data?.Rain ?? undefined,
					sum_1: rainModule.dashboard_data?.sum_rain_1 ?? undefined,
					sum_24: rainModule.dashboard_data?.sum_rain_24 ?? undefined,
				}
			})
		}
	})
}
