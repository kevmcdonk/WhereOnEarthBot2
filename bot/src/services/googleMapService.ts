// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// import { handleError, finish, logStep } from "./Shared/handleError";
import { DailyChallenge, DailyChallengeStatus } from "../models/dailyChallenge";
import { DailyChallengeEntriesStatus } from "../models/dailyChallengeEntriesStatus";
import { DailyChallengeInfo, ImageSource } from "../models/dailyChallengeInfo";
import { DailyChallengeImage } from "../models/dailyChallengeImage";
import { DailyChallengeTeam } from "../models/dailyChallengeTeam";
import { info } from "console";
import { BasicAuthProvider, createApiClient, TeamsFx } from "@microsoft/teamsfx";

const key = process.env.COSMOS_KEY || "<cosmos key>";
const endpoint = process.env.COSMOS_ENDPOINT || "<cosmos endpoint>";
const containerId = process.env.COSMOS_CONTAINER || "<cosmos container>";
const databaseId = process.env.COSMOS_DATABASE || "<cosmos database>";

export async function GetLocationDetails(locationQueryText:string)
        {
            const teamsfx = new TeamsFx();
            const teamsFx = new TeamsFx();
            // Initialize a new axios instance to call bingAPI
            const authProvider = new BasicAuthProvider(
              teamsFx.getConfig("TEAMSFX_API_BINGAPI_USERNAME"),
              teamsFx.getConfig("TEAMSFX_API_BINGAPI_PASSWORD")
            );
            const bingAPIClient = createApiClient(
              teamsFx.getConfig("TEAMSFX_API_BINGAPI_ENDPOINT"),
              authProvider
            );
            const response = await bingAPIClient.get("?format=js&idx=0&n=1&mkt=");

/*

            private HttpClient Client { get; set; }
        private HttpClient GeocodeClient { get; set; }
        public string AppSecret;
        //public static string GeocodeAppSecret = Configuration["GoogleGeocodeAPI"]; // App Key

        public GoogleMapService(string googleMapsAPI)
        {
            AppSecret = googleMapsAPI;
            Client = new HttpClient();
            Client.BaseAddress = new Uri("https://maps.googleapis.com/maps/api/");
        }

        public async Task<DailyChallengeImage> GetRandomLocation()
        {
                Random rnd = new Random();
                double latitude = rnd.Next(-70000, 70000);
                latitude = latitude / 1000;
                double longitude = rnd.Next(-180000, 180000);
                longitude = longitude / 1000;

                MapResponse placesResponse = await this.SearchPlaces(latitude, longitude);
                
                if(placesResponse.Status == "OVER_QUERY_LIMIT")
                {
                    throw new Exception("Over Google query limit");
                }

                int iterationCount = 0;
                int maxCount = 50;
                bool validResponse = false;
                while (iterationCount < maxCount && !validResponse)
                {
                    foreach (var place in placesResponse.Places)
                        {
                            if (place.Photos != null && place.Photos.Count > 0)
                            {
                                validResponse = true;
                                break;
                            }
                        }

                    if (!validResponse)
                    {
                        rnd = new Random();
                        latitude = rnd.Next(-70000, 70000);
                        latitude = latitude / 1000;
                        longitude = rnd.Next(-180000, 180000);
                        longitude = longitude / 1000;
                        placesResponse = await this.SearchPlaces(latitude, longitude);
                    }
                    iterationCount++;
                }

                if (iterationCount > maxCount || placesResponse.Places.Count == 0)
                {
                    throw new Exception("Sorry, couldn't find a suitable image. Try again shortly.");
                }

                DailyChallengeImage image = new DailyChallengeImage()
                {
                    ImageRegion = "Google",
                    ImageText = placesResponse.Places[0].Name,
                    Longitutde = float.Parse(placesResponse.Places[0].Geo.Location.Longitude.ToString()),
                    Latitude = float.Parse(placesResponse.Places[0].Geo.Location.Latitude.ToString()),
                    Url = $"https://maps.googleapis.com/maps/api/place/photo?maxwidth=2000&photoreference={placesResponse.Places[0].Photos[0].PhotoReference}&key={AppSecret}"
                };

                return image;
        }

        /// <summary>
        /// Locale search near specified co-ordinates.
        /// </summary>
        /// <param name="latitude">Latitude of user.</param>
        /// <param name="longitude">Longitude of user.</param>
        /// <param name="query">Search query</param>
        public async Task<MapResponse> SearchPlaces(double latitude, double longitude)
        {
            try
            {
                var resp = await Client.GetAsync(String.Format("place/nearbysearch/json?key={0}&location={1},{2}&radius=50000", AppSecret, latitude, longitude));
                //&rankby=prominence
                if (resp.IsSuccessStatusCode)
                {
                    string content = await resp.Content.ReadAsStringAsync();
                    return JsonConvert.DeserializeObject(content, typeof(MapResponse)) as MapResponse;
                }
                else
                {
                    return null;
                }
            }
            catch
            {
                return null;
            }
        }
*/
        }