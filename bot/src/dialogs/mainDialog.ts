// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { TimexProperty } from '@microsoft/recognizers-text-data-types-timex-expression';

import { Activity, Attachment, AttachmentLayoutTypes, CardFactory, HeroCard, InputHints, MessageFactory, StatePropertyAccessor, TurnContext } from 'botbuilder';

import {
    ComponentDialog,
    DialogSet,
    DialogState,
    DialogTurnResult,
    DialogTurnStatus,
    TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import { ChallengeGuesserDialog } from './ChallengeGuesserDialog';
import { getDailyChallenge, getDailyChallengeTeamInfo, saveDailyChallengeTeamInfo, saveDailyChallengeImage, getLatestInfo } from '../services/cosmosService'
import { GetRandomLocation } from '../services/googleMapService';
import { getBingImageUrl } from '../services/bingImageService';
import { getResultCardAttachment } from '../helpers/attachmentsHelper';
import { DailyChallenge } from '../models/dailyChallenge';
import { DailyChallengeTeam } from '../models/dailyChallengeTeam';
import { DailyChallengeInfo, ImageSource } from '../models/dailyChallengeInfo';
import { DailyChallengeImage } from '../models/dailyChallengeImage';

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';

export class MainDialog extends ComponentDialog {

    constructor(challengeGuesserDialog: ChallengeGuesserDialog) {
        super('MainDialog');

        // Define the main dialog and its related components.
        // This is a sample "book a flight" dialog.
        this.addDialog(new TextPrompt('TextPrompt'))
            .addDialog(challengeGuesserDialog)
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a DialogContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {TurnContext} context
     */
    public async run(context: TurnContext, accessor: StatePropertyAccessor<DialogState>) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     * Currently, this expects a booking request, like "book me a flight from Paris to Berlin on march 22"
     * Note that the sample LUIS model will only recognize Paris, Berlin, New York and London as airport cities.
     */
    private async introStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        //TODO: Check Cosmos connection correct
        const dailyChallenge: DailyChallenge = await getDailyChallenge();
        const teamInfo: DailyChallengeTeam = await getDailyChallengeTeamInfo();

        if (dailyChallenge.photoUrl == null) {
            const activity = stepContext.context.activity;
            if (teamInfo.channelData == null) {
                teamInfo.channelData = activity.channelData;
            }
            const teamsChannelData = teamInfo.channelData;

            const channelId = teamsChannelData.channel.id;
            const tenantId = teamsChannelData.tenant.id;
            const myBotId = activity.recipient.id;
            const teamId = teamsChannelData.team.id;
            const teamName = teamsChannelData.team.name;

            const dailyChallengeTeam: DailyChallengeTeam = {
                serviceUrl: activity.serviceUrl,
                teamId: teamId,
                teamName: teamName,
                tenantId: tenantId,
                installerName: 'Automatic',
                botId: myBotId,
                channelId: channelId,
                channelData: teamsChannelData,
                objType: 'DailyChallengeTeam'
            }

            await saveDailyChallengeTeamInfo(dailyChallengeTeam);

            let attachment: Attachment = null;
            let reply = MessageFactory.attachment(attachment);

            let info: DailyChallengeInfo = await getLatestInfo(dailyChallenge);

            if (info.currentSource == ImageSource.Google) {
                attachment = await this.GetGoogleImageChoiceAttachment();
                //TelemetryClient.TrackTrace("Loaded Google image", Severity.Information, null);
            }
            else {
                // TelemetryClient.TrackTrace("Current source is Bing so get the latest image", Severity.Information, null);
                const imageIndex = info.currentImageIndex;
                attachment = await this.GetBingImageChoiceAttachment(imageIndex);
                //TelemetryClient.TrackTrace("Loaded Bing image", Severity.Information, null);
            }

            reply.attachments.push(attachment);
            //TelemetryClient.TrackTrace("Sending image reply", Severity.Information, null);
            return await stepContext.prompt('TextPrompt', { prompt: reply });
        }
        else {
            if (!dailyChallenge.resultSet) {
                // Pass on the check results message from the proactive controller if set
                let options = null;
                if (stepContext != null && stepContext.options != null) {
                    options = stepContext.options;

                }
                return await stepContext.replaceDialog('ChallengeGuesserDialog', options);
            }
            else {
                let winningReply = getResultCardAttachment(dailyChallenge.winnerName, dailyChallenge.photoUrl, dailyChallenge.winnerGuess, dailyChallenge.distanceToEntry.toString(), dailyChallenge.extractedLocation, dailyChallenge.text);
                await stepContext.context.sendActivity(winningReply);
                return await stepContext.endDialog();
            }
        }
    }

    /**
     * Second step in the waterfall.
     */
    private async actStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way.`;
        await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);

        return await stepContext.next();
    }

    /**
     * This is the final step in the main waterfall dialog.
     * It wraps up the sample "book a flight" interaction with a simple confirmation.
     */
    private async finalStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        // If the child dialog ("bookingDialog") was cancelled or the user failed to confirm, the Result here will be null.
        if (stepContext.result) {
            const result = stepContext.result;
            // Now we have all the booking details.

            const msg = `Finishing up`;
            await stepContext.context.sendActivity(msg);
        }

        // Restart the main dialog waterfall with a different message the second time around
        return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' });
    }

    private async GetGoogleImageChoiceAttachment(): Promise<Attachment> {
        let heroCard: Attachment = null;

        try {
            let image: DailyChallengeImage = await GetRandomLocation();
            await saveDailyChallengeImage(image);

            heroCard = CardFactory.heroCard(
                "Today's Daily Challenge",
                "Click to choose the image for today or try another image.",
                //subtitle: image.imageRegion,
                [], // = new List<CardImage> { new CardImage(image.Url) },
                [] /* = new List<CardAction> {
                            new CardAction(ActionTypes.ImBack, "Choose image", value: "Choose image"),
                            new CardAction(ActionTypes.ImBack, "Try another Google image", value: "Try another image"),
                            new CardAction(ActionTypes.ImBack, "Switch to Bing", value: "Switch to Bing")
                        }*/
            );
        }
        catch (exp) {
            if (exp.Message == "Sorry, couldn't find a suitable image. Try again shortly.") {
                heroCard = CardFactory.heroCard(
                    "Today's Daily Challenge",
                    "After trying 50 different locations, Google couldn't find a suitable image.",
                    [],
                    [], /* = new List<CardAction> {
                            new CardAction(ActionTypes.ImBack, "Try another Google image", value: "Try another image"),
                            new CardAction(ActionTypes.ImBack, "Switch to Bing", value: "Switch to Bing")
                        }*/
                );
            }
            else if (exp.Message == "Over Google query limit") {
                const heroCard: Attachment = CardFactory.heroCard(
                    "Today's Daily Challenge",
                    "The Google Maps Search Service is on a low level and has exceeeded it's usage. Please wait a few minutes and try again or switch to Bing.",
                    [],
                    [],/* = new List<CardAction> {
                            new CardAction(ActionTypes.ImBack, "Try another Google image", value: "Try another image"),
                            new CardAction(ActionTypes.ImBack, "Switch to Bing", value: "Switch to Bing")
                        }*/
                );
            }
            else {
                throw exp;
            }
        }

        return heroCard;
    }


    private async GetBingImageChoiceAttachment(imageIndex: number): Promise<Attachment> {
        let heroCard: Attachment = null;

        try {
            let image: DailyChallengeImage = await getBingImageUrl(imageIndex.toString());
            await saveDailyChallengeImage(image);


            heroCard = CardFactory.heroCard(
                "Today's Daily Challenge",
                image.imageRegion + " - Click to choose the image for today or try another image.",
                [], // = new List<CardImage> { new CardImage(image.Url) },
                [] /* new List<CardAction> {
                    new CardAction(ActionTypes.ImBack, "Choose image", value: "Choose image"),
                    new CardAction(ActionTypes.ImBack, "Try another image", value: "Try another image"),
                    new CardAction(ActionTypes.ImBack, "Switch to Google", value: "Switch to Google")
                }
                    }*/
            );
        }
        catch (exp) {
            if (exp.Message == "Sorry, couldn't find a suitable image. Try again shortly.") {
                heroCard = CardFactory.heroCard(
                    "Today's Daily Challenge",
                    "After trying 50 different locations, Google couldn't find a suitable image.",
                    [],
                    [], /* = new List<CardAction> {
                        new CardAction(ActionTypes.ImBack, "Try another Google image", value: "Try another image"),
                        new CardAction(ActionTypes.ImBack, "Switch to Bing", value: "Switch to Bing")
                    }*/
                );
            }
            else {
                throw exp;
            }
        }

        return heroCard;
    }
}



/*

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.BotBuilderSamples;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Recognizers.Text.DataTypes.TimexExpression;
using WhereOnEarthBot.Models;
using WhereOnEarthBot.Services;
using System.Collections.Generic;
using WhereOnEarthBot.Helpers;


namespace Microsoft.BotBuilderSamples.Dialogs
{
    public class MainDialog : LogoutDialog
    {
        protected readonly IConfiguration Configuration;
        protected readonly ILogger Logger;
        private TableService tableService;

        public MainDialog(IConfiguration configuration, ILogger<MainDialog> logger, IBotTelemetryClient telemetryClient)
            : base(nameof(MainDialog), configuration["ConnectionName"])
        {
            Configuration = configuration;
            Logger = logger;
            TelemetryClient = telemetryClient;

            AddDialog(new OAuthPrompt(
                nameof(OAuthPrompt),
                new OAuthPromptSettings
                {
                    ConnectionName = ConnectionName,
                    Text = "Please login",
                    Title = "Login",
                    Timeout = 300000, // User has 5 minutes to login
                }));

            AddDialog(new TextPrompt(nameof(TextPrompt))
            {
                TelemetryClient = telemetryClient,
            });
            AddDialog(new ChallengeGuesserDialog(nameof(ChallengeGuesserDialog), configuration, logger, telemetryClient)
            {
                TelemetryClient = telemetryClient,
            });
            AddDialog(new WaterfallDialog(nameof(WaterfallDialog), new WaterfallStep[]
            {
                IntroStepAsync,
                ActStepAsync,
                FinalStepAsync
            })
            {
                TelemetryClient = telemetryClient,
            });

            // The initial child Dialog to run.
            InitialDialogId = nameof(WaterfallDialog);

            tableService = new TableService(Configuration["DailyChallengeTableConnectionString"], Configuration["DailyChallengeTableName"]);
        }

        private async Task<DialogTurnResult> IntroStepAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            T
        }

        private async Task<DialogTurnResult> ActStepAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            var command = stepContext.Result.ToString();

            if (command.ToLower().Contains("choose image"))
            {
                int imageIndex = await GetImageIndex(stepContext);
                BingImageService imageService = new BingImageService();
                DailyChallengeImage image = await tableService.getDailyChallengeImage();
                BingMapService mapService = new BingMapService(Configuration["BingMapsAPI"]);
                Logger.LogInformation("Image Text: " + image.ImageText);
                DailyChallengeEntry challengeEntry = await mapService.GetLocationDetails(image.ImageText, Logger);

                if (challengeEntry == null)
                {
                    Logger.LogError("Unable to retrieve details of image");
                    throw new Exception("Unable to retrieve details from Google");
                }
                Logger.LogInformation("Image Response: " + challengeEntry.imageResponse);
                Logger.LogInformation("Longitude: " + challengeEntry.longitude);
                Logger.LogInformation("Latitude: " + challengeEntry.latitude);
                Logger.LogInformation("Latitude: " + challengeEntry.distanceFrom);

                var dailyChallenge = await tableService.GetDailyChallenge();

                dailyChallenge.photoUrl = image.Url;
                dailyChallenge.text = image.ImageText;
                dailyChallenge.latitude = challengeEntry.latitude;
                dailyChallenge.longitude = challengeEntry.longitude;
                dailyChallenge.extractedLocation = challengeEntry.imageResponse;
                dailyChallenge.entries = new List<DailyChallengeEntry>();
                dailyChallenge.publishedTime = DateTime.Now;
                dailyChallenge.currentStatus = DailyChallengeStatus.Guessing;
                await tableService.SaveDailyChallenge(dailyChallenge);

                IMessageActivity reply = MessageFactory.Attachment(new List<Attachment>());

                reply.Attachments.Add(AttachmentHelper.ImageChosen(dailyChallenge.photoUrl));
                var activity = (Activity)reply;
                
                await stepContext.Context.SendActivityAsync((Activity)reply);
                return await stepContext.EndDialogAsync(cancellationToken);
                //return await stepContext.ReplaceDialogAsync(nameof(ChallengeGuesserDialog), promptOptions, cancellationToken);
            }
            else if (command.ToLower().Contains("try another image"))
            {
                int imageIndex = await IncrementAndReturnImageIndex();
            }

            else if (command.ToLower().Contains("switch to google"))
            {
                try
                {
                    var reply = MessageFactory.Attachment(new List<Attachment>());
                    var attachment = await GetGoogleImageChoiceAttachment();
                    await UpdateImageSource(ImageSource.Google);
                    reply.Attachments.Add(attachment);
                }
                catch(Exception exp)
                {
                    Logger.LogError(exp, $"Could not set Google Image: {exp.Message} - {exp.StackTrace}", null);
                    throw exp;
                }
            }
            else if (command.ToLower().Contains("switch to bing"))
            {

                var reply = MessageFactory.Attachment(new List<Attachment>());
                int imageIndex = await GetImageIndex(stepContext);
                await UpdateImageSource(ImageSource.Bing);
                var attachment = await GetBingImageChoiceAttachment(imageIndex);
                // reply.AttachmentLayout = AttachmentLayoutTypes.Carousel;
                reply.Attachments.Add(attachment);
            }
            else
            {
                await stepContext.Context.SendActivityAsync(MessageFactory.Text("Sorry, not sure about that"), cancellationToken);
            }

            return await stepContext.BeginDialogAsync(nameof(MainDialog), null, cancellationToken);
        }

        private async Task<DialogTurnResult> FinalStepAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            return await stepContext.EndDialogAsync(cancellationToken: cancellationToken);
        }

        private async Task<Attachment> GetBingImageChoiceAttachment(int imageIndex)
        {
            BingImageService imageService = new BingImageService();
            DailyChallengeImage image = imageService.GetBingImageUrl(imageIndex);
            await tableService.SaveDailyChallengeImage(image);

            var heroCard = new HeroCard
            {
                Title = "Today's Daily Challenge",
                Subtitle = image.ImageRegion,
                Text = "Click to choose the image for today or try another image.",
                Images = new List<CardImage> { new CardImage(image.Url) },
                Buttons = new List<CardAction> {
                        new CardAction(ActionTypes.ImBack, "Choose image", value: "Choose image"),
                        new CardAction(ActionTypes.ImBack, "Try another image", value: "Try another image"),
                        new CardAction(ActionTypes.ImBack, "Switch to Google", value: "Switch to Google")
                    }
            };

            return heroCard.ToAttachment();
        }

        

        private async Task<Attachment> GetDailyChallengeImageAttachment()
        {
            DailyChallengeImage image = await tableService.getDailyChallengeImage();

            var heroCard = new HeroCard
            {
                Title = "Today's Daily Challenge",
                Subtitle = image.ImageRegion,
                Images = new List<CardImage> { new CardImage(image.Url) }
            };

            return heroCard.ToAttachment();
        }

        private async Task<DailyChallengeInfo> GetInfo(WaterfallStepContext context)
        {
            DailyChallengeInfo info = await tableService.GetLatestInfo();
            return info;
        }

        private async Task<int> GetImageIndex(WaterfallStepContext context)
        {
            DailyChallengeInfo info = await tableService.GetLatestInfo();
            return info.currentImageIndex;
        }

        private async Task<ImageSource> GetImageSource(WaterfallStepContext context)
        {
            DailyChallengeInfo info = await tableService.GetLatestInfo();
            return info.currentSource;
        }

        private async Task<DialogTurnResult> CommandStepAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            stepContext.Values["command"] = stepContext.Result;

            // Call the prompt again because we need the token. The reasons for this are:
            // 1. If the user is already logged in we do not need to store the token locally in the bot and worry
            // about refreshing it. We can always just call the prompt again to get the token.
            // 2. We never know how long it will take a user to respond. By the time the
            // user responds the token may have expired. The user would then be prompted to login again.
            //
            // There is no reason to store the token locally in the bot because we can always just call
            // the OAuth prompt to get the token or get a new token if needed.
            return await stepContext.BeginDialogAsync(nameof(OAuthPrompt), null, cancellationToken);
        }

        private async Task<int> IncrementAndReturnImageIndex()
        {
            DailyChallengeInfo info = await tableService.GetLatestInfo();
            info.currentImageIndex++;

            if (info.currentImageIndex > 7)
            {
                info.currentImageIndex = 0;
            }

            await tableService.SaveLatestInfo(info);

            return info.currentImageIndex;
        }

        private async Task<ImageSource> UpdateImageSource(ImageSource imageSource)
        {
            DailyChallengeInfo info = await tableService.GetLatestInfo();
            info.currentSource = imageSource;

            await tableService.SaveLatestInfo(info);

            return info.currentSource;
        }

        private async Task UpdateDailyChallengeImage(DailyChallengeImage image)
        {            
            await tableService.SaveDailyChallengeImage(image);

            return;
        }
    }
}

*/