import * as dotenv from "dotenv";
dotenv.config();

import { UsernamePasswordCredential } from "@azure/identity";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Container, Containers, CosmosClient } from "@azure/cosmos";
// import { handleError, finish, logStep } from "./Shared/handleError";
import { v4 as uuidv4 } from "uuid";
import { DailyChallenge, DailyChallengeStatus } from "../models/dailyChallenge";
import { DailyChallengeEntriesStatus } from "../models/dailyChallengeEntriesStatus";
import { DailyChallengeInfo, ImageSource } from "../models/dailyChallengeInfo";
import { DailyChallengeImage } from "../models/dailyChallengeImage";
import { DailyChallengeTeam } from "../models/dailyChallengeTeam";
import { info } from "console";

const key = process.env.COSMOS_KEY || "<cosmos key>";
const endpoint = process.env.COSMOS_ENDPOINT || "<cosmos endpoint>";
const containerId = process.env.COSMOS_CONTAINER || "<cosmos container>";
const databaseId = process.env.COSMOS_DATABASE || "<cosmos database>";

function getContainer() {
    const client = new CosmosClient({
        endpoint,
        key: key
    });

    return client.database(databaseId).container(containerId);
}

export async function getDailyChallenge(): Promise<DailyChallenge> {

    const container = getContainer();
    const id: string = new Date().toDateString();

    // await client.databases.readAll({}).fetchAll();

    const query: string = "select * from c where c.id='" + id + "'";
    const dailyChallenges = await container.items.query(query).fetchAll();

    let dailyChallenge: DailyChallenge;

    if (dailyChallenges.resources.length = 0) {
        dailyChallenge = {
            id: id,
            text: "",
            entries: [],
            publishedTime: new Date(),
            resultSet: false,
            photoUrl: "",
            extractedLocation: "",
            longitude: 0,
            latitude: 0,
            winnerName: "",
            winnerGuess: "",
            currentStatus: DailyChallengeStatus.NotSet,
            distanceToEntry: -1,
            serializableCurrentStatus: "",
            serializedEntries: "",
            objType: "DailyChallenge"
        };
    }
    else {
        dailyChallenge = dailyChallenges.resources[0];
    }
    /*
    if (dailyChallenge.entries == null)
    {
        if (dailyChallenge.SerializedEntries == null)
        {
            dailyChallenge.entries = new List<DailyChallengeEntry>();
        }
        else
        {
            dailyChallenge.entries = JsonConvert.DeserializeObject< List<DailyChallengeEntry>>(dailyChallenge.SerializedEntries);
        }
    }*/
    if (dailyChallenge.publishedTime == null) {
        dailyChallenge.publishedTime = new Date();
    }

    return dailyChallenge;
}

export async function saveDailyChallenge(dailyChallenge: DailyChallenge) {
    const container = getContainer();
    dailyChallenge.id = new Date().toDateString();
    if (dailyChallenge.entries == null) {
        dailyChallenge.entries = [];
    }
    if (dailyChallenge.publishedTime == null) {
        dailyChallenge.publishedTime = new Date();
    }
    //dailyChallenge.SerializedEntries = JsonConvert.SerializeObject(dailyChallenge.entries);
    //dailyChallenge.serializableCurrentStatus = dailyChallenge.currentStatus.ToString();
    await container.items.upsert(dailyChallenge);
}

export async function getLatestInfo(dailyChallenge: DailyChallenge): Promise<DailyChallengeInfo> {
    const container = getContainer();

    const id: string = new Date().toDateString();

    const query: string = "select * from c where c.id='DailyChallengeInfo'";
    const dailyChallengeInfos = await container.items.query(query).fetchAll();

    let dailyChallengeInfo: DailyChallengeInfo;
    if (dailyChallengeInfos.resources.length = 0) {
        const basicUsers = [{
            id: "1",
            username: "Admin",
            objType: "DailyChallengeUser"
        }];
        dailyChallengeInfo = {
            currentImageIndex: 0,
            currentSource: ImageSource.Bing,
            serializableImageSource: "",
            users: basicUsers,
            serializedUsers: "",
            objType: "DailyChallengeInfo"
        }
        container.items.upsert(dailyChallengeInfo);
    }

    return dailyChallengeInfo;
}

export async function saveLatestInfo(info: DailyChallengeInfo) {
    if (info.users == null) {
        info.users = [];
    }
    //info.SerializedUsers = "";
    const container = getContainer();
    container.items.upsert(info);
}

export async function saveDailyChallengeImage(image: DailyChallengeImage) {
    const container = getContainer();
    image.objType = "DailyChallengeImage";
    container.items.upsert(image);
}

export async function getDailyChallengeImage() {
    const container = getContainer();

    const id: string = new Date().toDateString();

    const query: string = "select * from c where c.objType='DailyChallengeImage'";
    const dailyChallengeImages = await container.items.query(query).fetchAll();

    let dailyChallengeImage: DailyChallengeImage;
    if (dailyChallengeImages.resources.length = 0) {
        dailyChallengeImage = {
            imageRegion: "",
            imageText: "",
            latitude: 0,
            longitude: 0,
            url: "",
            objType: "DailyChallengeImage"
        }
        container.items.upsert(dailyChallengeImage);
    }

    return info;
}

export async function saveDailyChallengeTeamInfo(team: DailyChallengeTeam) {
    const container = getContainer();
    team.objType = "DailyChallengeTeam";
    container.items.upsert(team);
}

export async function getDailyChallengeTeamInfo(): Promise<DailyChallengeTeam> {
    const container = getContainer();

    const id: string = new Date().toDateString();

    const query: string = "select * from c where c.objType='DailyChallengeTeam'";
    const dailyChallengeTeams = await container.items.query(query).fetchAll();

    let dailyChallengeTeam: DailyChallengeTeam;
    if (dailyChallengeTeams.resources.length = 0) {
        dailyChallengeTeam = {
            botId: "",
            channelId: "",
            installerName: "",
            serviceUrl: "",
            teamId: "",
            teamName: "",
            tenantId: "",
            channelData: null,
            objType: "DailyChallengeTeam"
        }
        container.items.upsert(dailyChallengeTeam);
    }

    return dailyChallengeTeam;
}
