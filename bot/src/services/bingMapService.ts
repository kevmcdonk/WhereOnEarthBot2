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

            public async Task<DailyChallengeEntry> GetLocationDetails(string locationQueryText, ILogger logger)
        {
            try
            {
                //Create a request.
                var request = new GeocodeRequest()
                {
                    Query = locationQueryText,
                    IncludeIso2 = true,
                    IncludeNeighborhood = true,
                    MaxResults = 25,
                    BingMapsKey = BingMapsKey
                };

                //Process the request by using the ServiceManager.
                var response = await request.Execute();

                if (response != null &&
                    response.ResourceSets != null &&
                    response.ResourceSets.Length > 0 &&
                    response.ResourceSets[0].Resources != null &&
                    response.ResourceSets[0].Resources.Length > 0)
                {
                    var locationResult = response.ResourceSets[0].Resources[0] as BingMapsRESTToolkit.Location;
                    DailyChallengeEntry entry = new DailyChallengeEntry()
                    {
                        imageResponse = locationResult.Name,
                        longitude = float.Parse(locationResult.Point.Coordinates[0].ToString()),
                        latitude = float.Parse(locationResult.Point.Coordinates[1].ToString())
                    };

                    return entry;
                }
                throw new Exception("Location not found");
            }
            catch (Exception exp)
            {
                logger.LogError("Error retrieving image: " + exp.Message + ":::" + exp.StackTrace);
                Console.WriteLine("Grrr error: " + exp.Message);
                return null;
            }
        }
*/
        }