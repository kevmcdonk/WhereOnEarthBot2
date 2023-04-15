/**
 * Adaptive Card data model. Properties can be referenced in an adaptive card via the `${var}`
 * Adaptive Card syntax.
 */

export interface DailyChallengeImage {
  id: string;
  objType: string;
  url: string;
  imageText: string;
  imageRegion: string;
  longitude: number;
  latitude: number;  
}
