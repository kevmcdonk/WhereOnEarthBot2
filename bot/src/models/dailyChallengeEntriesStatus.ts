/**
 * Adaptive Card data model. Properties can be referenced in an adaptive card via the `${var}`
 * Adaptive Card syntax.
 */

export interface DailyChallengeEntriesStatus {
  id: string;
  objType: string;
  allResultsReceived: boolean;
  usersWithEntryCount: number;
  userCount: number;
}
