import { DailyChallengeUser } from "./dailyChallengeUser";

enum ImageSource
{
    Bing,
    Google
}

export interface DailyChallengeInfo {
  currentImageIndex: number;
  currentSource: ImageSource;
  serializableImageSource: string;
  users: DailyChallengeUser[];
  serializedUsers: string;
}
