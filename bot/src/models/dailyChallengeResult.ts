/**
 * Adaptive Card data model. Properties can be referenced in an adaptive card via the `${var}`
 * Adaptive Card syntax.
 */

export interface DailyChallengeResult {
  id: string;
  objType: string;
  winnerGuess: string
  winnerName: string;
  publishedTime: Date;
  distanceToEntry: number;
  actualLocation: string;
  actualLocationText: string;
  actualLocationImageUrl: string;
}
