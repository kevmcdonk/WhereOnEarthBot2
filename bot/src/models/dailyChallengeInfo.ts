import { DailyChallengeUser } from "./dailyChallengeUser";

export enum ImageSource
{
    Bing,
    Google
}

export interface DailyChallengeInfo {
  id: string;
  objType: string;
  currentImageIndex: number;
  currentSource: ImageSource;
  serializableImageSource: string;
  users: DailyChallengeUser[];
  serializedUsers: string;
}
