// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// import { handleError, finish, logStep } from "./Shared/handleError";

import { CardFactory, CardImage } from "botbuilder";

export function getResultCardAttachment(
    winningUserName: string, imageUrl: string, winningEntry: string, winningDistance: string, actualAnswer: string, originalText: string
) {

    return CardFactory.heroCard(
        "We have a winner!",
        `Congratulations ${winningUserName}! The winning guess was ${winningEntry} which was ${winningDistance} km from the real answer of ${actualAnswer} (${originalText})`,
        CardFactory.images([imageUrl]),
        []
    );
}

export function getAwaitingGuesses(
    userCount: number, imageUrl: string, usersWithEntryCount: number, userName: string, guessLocation: string
) {

    return CardFactory.heroCard(
        `Thanks ${userName}`,
        `I'm saving your guess as ${guessLocation}. "Still more results from users to come - ${usersWithEntryCount} users have entered out of the ${userCount} in this channel.`,
        CardFactory.images([imageUrl]),
        []
    );
}

export function getReminder(
    imageUrl: string
) {

    return CardFactory.heroCard(
        `Don't forget to get your guess in`,
        `There's just 3 1/2 hours remaining (depending on my maths!)`,
        CardFactory.images([imageUrl]),
        []
    );
}

export function getImageChosen(
    imageUrl: string
) {

    return CardFactory.heroCard(
        `The image has been chosen`,
        `Time to get your guesses in. Reply with @WhereOnEarthBot and your guess. Results will come in when everyone has added a guess or at 16:00. Good luck!`,
        CardFactory.images([imageUrl]),
        []
    );
}