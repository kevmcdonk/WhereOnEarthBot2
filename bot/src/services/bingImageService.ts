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

const key = process.env.COSMOS_KEY || "<cosmos key>";
const endpoint = process.env.COSMOS_ENDPOINT || "<cosmos endpoint>";
const containerId = process.env.COSMOS_CONTAINER || "<cosmos container>";
const databaseId = process.env.COSMOS_DATABASE || "<cosmos database>";

export function getImageCodeById(id: number) {
    switch (id.toString())
    {
        case "0":
            return "en-UK";
        case "1":
            return "de-DE";
        case "2":
            return "en-AU";
        case "3":
            return "en-CA";
        case "4":
            return "en-NZ";
        case "5":
            return "en-US";
        case "6":
            return "ja-JP";
        case "7":
            return "zh-CN";
        default:
            return "en-UK";
    }
}

export async function getBingImageUrlById(id:number) {
    return getBingImageUrl(getImageCodeById(id));
}

export async function getBingImageUrl(locationCode:string)
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
            const response = await bingAPIClient.get("?format=js&idx=0&n=1&mkt=" + locationCode);

            let returnedImage: DailyChallengeImage;
            //returnedImage.
/*

            HttpClient client = new HttpClient();
            HttpResponseMessage response = client.GetAsync("http://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=" + locationCode).Result;
            string responseText = response.Content.ReadAsStringAsync().Result;
            dynamic bingImageResponse = JObject.Parse(responseText);

            var cultInfo = System.Globalization.CultureInfo.GetCultureInfo(locationCode);
            DailyChallengeImage bingImage = new DailyChallengeImage()
            {
                Url = "https://www.bing.com" + bingImageResponse.images[0].url,
                ImageText = bingImageResponse.images[0].copyright,
                ImageRegion = cultInfo.DisplayName
            };

            return bingImage;
*/
        }