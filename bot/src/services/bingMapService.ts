// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
/// <reference path="types/MicrosoftMaps/Microsoft.Maps.All.d.ts" />
import { DailyChallenge, DailyChallengeStatus } from "../models/dailyChallenge";
import { DailyChallengeEntriesStatus } from "../models/dailyChallengeEntriesStatus";
import { DailyChallengeInfo, ImageSource } from "../models/dailyChallengeInfo";
import { DailyChallengeImage } from "../models/dailyChallengeImage";
import { DailyChallengeTeam } from "../models/dailyChallengeTeam";
import { info } from "console";
import { BasicAuthProvider, createApiClient, TeamsFx } from "@microsoft/teamsfx";
import { getDailyChallengeImage } from "./cosmosService";
import { DailyChallengeEntry } from '../models/dailyChallengeEntry';
import fetch from 'node-fetch';
import 'bingmaps';

const bingMapsKey = process.env.BING_MAPS_KEY || "<Bing Maps Key>";
const openAIBase = process.env["AZURE_OPENAI_SERVICE"];
const openAIAPIKey = process.env["AZURE_OPENAI_KEY"];
const openAIDeployment = process.env["AZURE_OPENAI_CHATGPT_DEPLOYMENT"];


export async function GetLocationDetails(locationQueryText:string): Promise<DailyChallengeEntry>
{
  let prompt = 'Show me the longitude, latitude and location name (as imageResponse) for "Meldon Hill, Dartmoor National Park, Devon"\nReturn the results in a JSON schema that looks like {id: string;objType: string;userId: string;userName: string;imageResponse: string;longitude: number;latitude: number;distanceFrom: number;challengeDate: Date;fromId: string;fromName: string;serviceUrl: string;channelId: string;conversationId: string;}';
  let openAIUrl = `https://${openAIBase}.openai.azure.com/openai/deployments/${openAIDeployment}/completions?api-version=2022-12-01`;
  const res = await fetch(openAIUrl, {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-key": openAIAPIKey
    },

    //make sure to serialize your JSON body
    body: JSON.stringify({
      //engine: "deployment",
      prompt: prompt,
      max_tokens: 32,
      n: 1,
      stop: ["\n"]
    })
  });

  const completion = await res.json();

  return {
    id: '',
    objType: 'DailyChallengeEntry',
    userId: '',
    userName: '',
    imageResponse: '',
    longitude: 0,
    latitude: 0,
    distanceFrom: 0,
    challengeDate: new Date(2023,1,1),
    fromId: '',
    fromName: completion.toString(),
    serviceUrl: '',
    channelId: '',
    conversationId: '',
  }
}