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
import { getDailyChallengeImage } from "./cosmosService";

const bingMapsKey = process.env.BING_MAPS_KEY || "<Bing Maps Key>";

export async function GetLocationDetails(locationQueryText:string)
        {
            var map = new Microsoft.Maps.Map('#MyMap', {
                credentials: 'Your Bing Maps Key'    
            });
            
            Microsoft.Maps.loadModule('Microsoft.Maps.Search', () => {
                var searchManager = new Microsoft.Maps.Search.SearchManager(map);
                searchManager.geocode({
                    bounds: map.getBounds(),
                    where: 'somewhere',
                    callback: (answer, userData) => {
                        map.setView({ bounds: answer.results[0].bestView });
                        map.entities.push(new Microsoft.Maps.Pushpin(answer.results[0].location));
                    }
                });
            });
/*

            using BingMapsRESTToolkit;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using WhereOnEarthBot.Models;

namespace WhereOnEarthBot.Services
{
    public class BingMapService
    {
        public string BingMapsKey;

        public BingMapService(string bingMapsKey)
        {
            BingMapsKey = bingMapsKey;
        }

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
    }
}
*/
        }