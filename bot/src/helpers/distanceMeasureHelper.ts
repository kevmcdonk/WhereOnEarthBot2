// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// import { handleError, finish, logStep } from "./Shared/handleError";

import { CardFactory, CardImage } from "botbuilder";

export function GetDistanceFromResult(
  guessLatitude: number,
  guessLongitude: number,
  actualLatitude: number,
  actualLongitude: number
) {
  const magic: number = Math.PI / 180;
  const radius_km: number = 6367.4445;
  const distanceFromResult: number =
    Math.acos(
      Math.sin(guessLongitude * magic) * Math.sin(actualLongitude * magic) +
        Math.cos(guessLongitude * magic) *
          Math.cos(actualLongitude * magic) *
          Math.cos(guessLatitude * magic - actualLatitude * magic)
    ) * radius_km;

  return distanceFromResult;
}
