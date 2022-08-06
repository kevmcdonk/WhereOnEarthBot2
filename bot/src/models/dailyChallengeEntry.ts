
export interface DailyChallengeEntry {
  id: string;
  objType: string;
  userId: string;
  userName: string;
  imageResponse: string;
  longitude: number;
  latitude: number;
  distanceFrom: number;
  challengeDate: Date;
  fromId: string;
  fromName: string;
  serviceUrl: string;
  channelId: string;
  conversationId: string;
}
