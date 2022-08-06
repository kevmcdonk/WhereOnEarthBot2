import { DailyChallengeEntry } from "./dailyChallengeEntry";

 export enum DailyChallengeStatus
 {
     NotSet,
     Choosing,
     Guessing,
     Completed
 }

export interface DailyChallenge {
  id: string;
  objType: string;
  text: string;
  photoUrl: string;
  extractedLocation: string;
  longitude: number;
  latitude: number;
  publishedTime: Date;
  entries: DailyChallengeEntry[];
  serializedEntries: string;
  resultSet: boolean;
  winnerGuess: string;
  winnerName: string;
  distanceToEntry: number;
  currentStatus: DailyChallengeStatus;
  serializableCurrentStatus: string;
}