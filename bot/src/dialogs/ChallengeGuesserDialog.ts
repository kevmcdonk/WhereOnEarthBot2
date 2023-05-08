// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { TimexProperty } from "@microsoft/recognizers-text-data-types-timex-expression";

import {
  CardFactory,
  InputHints,
  MessageFactory,
  StatePropertyAccessor,
  TurnContext,
} from "botbuilder";

import {
  AttachmentPrompt,
  ComponentDialog,
  DialogSet,
  DialogState,
  DialogTurnResult,
  DialogTurnStatus,
  PromptOptions,
  TextPrompt,
  WaterfallDialog,
  WaterfallStepContext,
} from "botbuilder-dialogs";
import {  } from "botbuilder-dialogs-adaptive";
import { ConnectorClient, MicrosoftAppCredentials } from "botframework-connector";
import { DailyChallenge, DailyChallengeStatus } from "../models/dailyChallenge";
import { DailyChallengeImage } from "../models/dailyChallengeImage";
import { DailyChallengeEntry } from "../models/dailyChallengeEntry";
import { DailyChallengeEntriesStatus } from "../models/dailyChallengeEntriesStatus";
import { DailyChallengeInfo, ImageSource } from "../models/dailyChallengeInfo";
import { DailyChallengeUser } from "../models/dailyChallengeUser";
import {
  getDailyChallenge,
  getDailyChallengeTeamInfo,
  saveDailyChallengeTeamInfo,
  saveDailyChallengeImage,
  getLatestInfo,
  getDailyChallengeImage,
  saveDailyChallenge,
} from "../services/cosmosService";
import { GetLocationDetails } from '../services/bingMapService';
import { GetDistanceFromResult } from '../helpers/DistanceMeasureHelper';
import { getAwaitingGuesses } from '../helpers/attachmentsHelper';
import { ConversationsGetConversationMembersResponse } from "botframework-connector/lib/connectorApi/models";
const moment = require("moment");

const MAIN_WATERFALL_DIALOG = "mainWaterfallDialog";

export class ChallengeGuesserDialog extends ComponentDialog {
  constructor() {
    super("ChallengeGuesserDialog");
    console.log("ChallengeGuesserDialog Constructor");
    // Define the main dialog and its related components.
    // This is a sample "book a flight" dialog.
    this.addDialog(new TextPrompt("TextPrompt"))
      .addDialog(new AttachmentPrompt("AttachmentPrompt"))
      .addDialog(
        new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
          this.introStep.bind(this),
          this.actStep.bind(this),
          this.finalStep.bind(this),
        ])
      );

    this.initialDialogId = MAIN_WATERFALL_DIALOG;
  }

  /**
   * The run method handles the incoming activity (in the form of a DialogContext) and passes it through the dialog system.
   * If no dialog is active, it will start the default dialog.
   * @param {TurnContext} context
   */
  public async run(
    context: TurnContext,
    accessor: StatePropertyAccessor<DialogState>
  ) {
    console.log("ChallengeGuesserDialog run");
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
  private async introStep(
    stepContext: WaterfallStepContext
  ): Promise<DialogTurnResult> {
    console.log("ChallengeGuesserDialog introStep");
    var dailyChallenge = await getDailyChallenge();
    var info = await getLatestInfo(dailyChallenge);
    // TODO: add all entries to see if everyone in the Team has guessed
    let messageText = null;
    if (stepContext != null && stepContext.result != null) {
      messageText = stepContext.result.ToString();
    } else if (
      stepContext != null &&
      stepContext.context != null &&
      stepContext.context.activity != null &&
      stepContext.context.activity.text != null
    ) {
      messageText = stepContext.context.activity.text;
    } else if (stepContext != null && stepContext.options != null) {
      let options: PromptOptions = stepContext.options;
      messageText = options.prompt.toString(); //.text;
    }

    if (messageText != null) {
      if (messageText.toLowerCase().indexOf("check results") > 0) {
        //await CheckResults(stepContext, cancellationToken, dailyChallenge, info);
        return await stepContext.endDialog();
      }

      var userEntries = dailyChallenge.entries.flatMap(
        (e) => e.userName == stepContext.context.activity.from.name
      );
      if (userEntries != null && userEntries.length > 0) {
        const didntUnderstandMessageText = `Sorry ${stepContext.context.activity.from.name}, we already have a result from you. Time for the next person.`;
        await stepContext.context.sendActivity(
          didntUnderstandMessageText,
          didntUnderstandMessageText,
          InputHints.IgnoringInput
        );
        return await stepContext.endDialog();
      }
      return await stepContext.next(messageText);
    }

    const heroCard = CardFactory.heroCard(
      "The image has been chosen",
      `Reply with @WhereOnEarthBot and your guess. Results will come in when everyone has added a guess or at 16:00. Good luck!`,
      //subtitle: image.imageRegion,
      [], // = new List<CardImage> { new CardImage(image.Url) },
      [] /* = new List<CardAction> {
                                new CardAction(ActionTypes.ImBack, "Choose image", value: "Choose image"),
                                new CardAction(ActionTypes.ImBack, "Try another Google image", value: "Try another image"),
                                new CardAction(ActionTypes.ImBack, "Switch to Bing", value: "Switch to Bing")
                            }*/
    );

    let reply = MessageFactory.attachment(heroCard);

    await stepContext.context.sendActivity(reply);
    return stepContext.endDialog();
  }

  /**
   * Second step in the waterall.  This will use LUIS to attempt to extract the origin, destination and travel dates.
   * Then, it hands off to the bookingDialog child dialog to collect any remaining details.
   */
  private async actStep(
    stepContext: WaterfallStepContext
  ): Promise<DialogTurnResult> {
    console.log("ChallengeGuesserDialog actStep");

    //BingMapService mapService = new BingMapService(Configuration["BingMapsAPI"]);

            const guessText = stepContext.result.toString();
            let dailyChallenge = await getDailyChallenge();
            let info = await getLatestInfo(dailyChallenge);

            if (guessText.toLowerCase().indexOf("check results") > 0)
            {   
                await this.CheckResults(stepContext, dailyChallenge, info);
                return await stepContext.endDialog();
            }
            else
            {
                console.log(`Checking for guess: ${guessText}`);
                try
                {
                    let entry: DailyChallengeEntry = await GetLocationDetails(guessText);
                    if (entry == null)
                    {
                        var locationSplit = stepContext.result.toString().Split(' ');
                        if (locationSplit.Length > 1)
                        {
                            var searchText = guessText.Substring(guessText.IndexOf(' '));
                            entry = await GetLocationDetails(searchText);
                        }
                    }

                    if (entry == null)
                    {
                        await stepContext.context.sendActivity(`Sorry, bing maps couldn't identify the location '${stepContext.result.toString()}'. Please try again.`);
                        return await stepContext.endDialog();
                    }
                    else
                    {
                        if (dailyChallenge.entries != null)
                        {
                            const matchingEntries = dailyChallenge.entries.find(e => e.imageResponse == entry.imageResponse);
                            if (matchingEntries != null)
                            {
                                await stepContext.context.sendActivity(`Sorry, someone has beaten you to suggesting '${stepContext.result.toString()}'. Please try again.`);
                                // This line caused a bit of a meltdown so changing to end dialogue
                                //return await stepContext.BeginDialogAsync(nameof(ChallengeGuesserDialog), null, cancellationToken);
                                return await stepContext.endDialog();
                            }
                        }
                        
                        const distanceFromResult = GetDistanceFromResult(entry.latitude, entry.longitude, dailyChallenge.latitude, dailyChallenge.longitude);

                        entry.distanceFrom = distanceFromResult;
                        entry.userName = stepContext.context.activity.from.name;
                        entry.userId = stepContext.context.activity.from.id;
                        dailyChallenge.entries.push(entry);
                        
                        await saveDailyChallenge(dailyChallenge);

                        
                        const currentStatus: DailyChallengeEntriesStatus = await this.CheckWhetherAllEntriesReceived(stepContext, dailyChallenge, info);
                        let reply = MessageFactory.attachment(getAwaitingGuesses(currentStatus.userCount, dailyChallenge.photoUrl, currentStatus.usersWithEntryCount, entry.userName, entry.imageResponse));

                        await stepContext.context.sendActivity(reply);
                        return await stepContext.endDialog();
                    }
                }
                catch(exp)
                {
                    console.log(`Error loading results: ${exp.Message} ${exp.StackTrace}`);
                    throw exp;
                }
            }
    return await stepContext.next();
  }

  /**
   * Shows a warning if the requested From or To cities are recognized as entities but they are not in the Airport entity list.
   * In some cases LUIS will recognize the From and To composite entities as a valid cities but the From and To Airport values
   * will be empty if those entity values can't be mapped to a canonical item in the Airport.
   */
  /*
    private async showWarningForUnsupportedCities(context, fromEntities, toEntities) {
        const unsupportedCities = [];
        if (fromEntities.from && !fromEntities.airport) {
            unsupportedCities.push(fromEntities.from);
        }

        if (toEntities.to && !toEntities.airport) {
            unsupportedCities.push(toEntities.to);
        }

        if (unsupportedCities.length) {
            const messageText = `Sorry but the following airports are not supported: ${ unsupportedCities.join(', ') }`;
            await context.sendActivity(messageText, messageText, InputHints.IgnoringInput);
        }
    }
    */

  /**
   * This is the final step in the main waterfall dialog.
   * It wraps up the sample "book a flight" interaction with a simple confirmation.
   */
  private async finalStep(
    stepContext: WaterfallStepContext
  ): Promise<DialogTurnResult> {
    console.log("finalStep");
    //return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' });
    return await stepContext.endDialog();
  }

  private async CheckWhetherAllEntriesReceived(stepContext: WaterfallStepContext, dailyChallenge: DailyChallenge, info: DailyChallengeInfo)
        {
            try
            {
                // Fill in the "standard" properties for BotMessageReceived
                // and add our own property.
                console.log("Checking whether all entries received");
                const currentStatus: DailyChallengeEntriesStatus = 
                {
                    id: '',
                    objType: 'DailyChallengeEntriesStatus',
                    allResultsReceived: false,
                    userCount: 0,
                    usersWithEntryCount: 0
                };
                
                let todayEntries = dailyChallenge.entries;
                if (info.users == null)
                {
                    info.users = [];
                }
                let challengeUsers = [];

                var microsoftAppId = process.env["MicrosoftAppId"];
                var microsoftAppPassword = process.env["MicrosoftAppPassword"];
                const creds = new MicrosoftAppCredentials(microsoftAppId, microsoftAppPassword);
                const connector = new ConnectorClient(creds);
                const response: ConversationsGetConversationMembersResponse = await connector.conversations.getConversationMembers(stepContext.context.activity.conversation.id);
                
                response.forEach(user => {
                    challengeUsers.push({
                        id: user.id,
                        username: user.name
                    });
                });

                const userCount = challengeUsers.length;
                let usersWithEntryCount = 0;

                challengeUsers.forEach(user => {
                    if (todayEntries.find(matchingItem => matchingItem.userName == user.username) != null)
                    {
                        usersWithEntryCount++;
                    }
                });
                
                if (usersWithEntryCount >= userCount)
                {
                    currentStatus.allResultsReceived = true;
                }

                currentStatus.userCount = userCount;
                currentStatus.usersWithEntryCount = usersWithEntryCount;
                return currentStatus;
            }
            catch(exp)
            {
                console.log(`Error checking whether all entries received: ${exp.Message} - ${exp.StackTrace}`);
                throw exp;
            }
        }

  private async CheckResults(
    stepContext: WaterfallStepContext,
    dailyChallenge: DailyChallenge,
    info: DailyChallengeInfo
  ) {
    let todayEntries = dailyChallenge.entries;

    let currentWinningUser = "";
    let currentWinningEntry = "";
    let currentWinningDistance: number = Number.MAX_VALUE;

    todayEntries.forEach((entry) => {
      if (entry.distanceFrom < currentWinningDistance) {
        currentWinningUser = entry.userName;
        currentWinningEntry = entry.imageResponse;
        currentWinningDistance = entry.distanceFrom;
      }
    });

    try {
      const image: DailyChallengeImage = await getDailyChallengeImage();

      dailyChallenge.distanceToEntry = currentWinningDistance;
      dailyChallenge.winnerName = currentWinningUser;
      dailyChallenge.winnerGuess = currentWinningEntry;
      dailyChallenge.resultSet = true;

      await saveDailyChallenge(dailyChallenge);

      const heroCard = CardFactory.heroCard(
        `We have a winner! Congratulations ${currentWinningUser}`,
        `The winning guess was ${currentWinningEntry} which was ${currentWinningDistance} km from the real answer of NEEDTOSETTHIS (PLACETEXT)`,
        [],
        [] // Images = new List<CardImage> { new CardImage(imageUrl) }
      );

      let reply = MessageFactory.attachment(heroCard);

      await stepContext.context.sendActivity(reply);
      return stepContext.endDialog();
    } catch (exp) {
      console.log("Error checking results: " + exp.Message);
    }
    return;
  }
}

/*
private async Task<DialogTurnResult> IntroStepAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            DailyChallenge dailyChallenge = await tableService.GetDailyChallenge();
            DailyChallengeInfo info = await tableService.GetLatestInfo();
            DailyChallengeEntriesStatus currentStatus = await CheckWhetherAllEntriesReceived(stepContext, cancellationToken, dailyChallenge, info);

            if (currentStatus.allResultsReceived)
            {
                await CheckResults(stepContext, cancellationToken, dailyChallenge, info);
                return await stepContext.EndDialogAsync(cancellationToken);
            }
            else
            {
                string messageText = null;
                if (stepContext != null && stepContext.Result != null)
                {
                    messageText = stepContext.Result.ToString();
                }
                else if (stepContext != null && stepContext.Context != null && stepContext.Context.Activity != null && stepContext.Context.Activity.Text != null)
                {
                    messageText = stepContext.Context.Activity.Text;
                }
                else if (stepContext != null && stepContext.Options != null)
                {
                    PromptOptions options = (PromptOptions)stepContext.Options;
                    messageText = options.Prompt.Text;
                }
                if (messageText != null)
                {
                    if (messageText.ToLower().Contains("check results"))
                    {
                        await CheckResults(stepContext, cancellationToken, dailyChallenge, info);
                        return await stepContext.EndDialogAsync(cancellationToken);
                    }

                    var userEntries = dailyChallenge.entries.FindAll(e => e.userName == stepContext.Context.Activity.From.Name);
                    if (userEntries != null && userEntries.Count > 0)
                    {
                        IMessageActivity beginReply = MessageFactory.Text($"Sorry {stepContext.Context.Activity.From.Name}, we already have a result from you. Time for the next person.");
                        PromptOptions beginOptions = new PromptOptions()
                        {
                            Prompt = (Activity)beginReply
                        };
                        return await stepContext.PromptAsync(nameof(TextPrompt), beginOptions, cancellationToken);
                    }
                    return await stepContext.NextAsync(messageText);
                }

                IMessageActivity reply = MessageFactory.Attachment(new List<Attachment>());
                reply.Attachments.Add(AttachmentHelper.ImageChosen(dailyChallenge.photoUrl));
                PromptOptions promptOptions = new PromptOptions
                {
                    Prompt = (Activity)reply,

                };
                return await stepContext.PromptAsync(nameof(TextPrompt), promptOptions, cancellationToken);
            }
        }

        private async Task<DialogTurnResult> ActStepAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            BingMapService mapService = new BingMapService(Configuration["BingMapsAPI"]);

            string guessText = stepContext.Result.ToString();
            DailyChallengeInfo info = await tableService.GetLatestInfo();

            if (guessText.ToLower().Contains("check results"))
            {
                DailyChallenge dailyChallenge = await tableService.GetDailyChallenge();
                
                await CheckResults(stepContext, cancellationToken, dailyChallenge, info);
                return await stepContext.EndDialogAsync(cancellationToken);
            }
            else
            {
                TelemetryClient.TrackTrace("Checking for guess: " + guessText, Severity.Information, null);
                try
                {
                    DailyChallengeEntry entry = await mapService.GetLocationDetails(guessText, Logger);
                    if (entry == null)
                    {
                        var locationSplit = stepContext.Result.ToString().Split(' ');
                        if (locationSplit.Length > 1)
                        {
                            var searchText = guessText.Substring(guessText.IndexOf(' '));
                            entry = await mapService.GetLocationDetails(searchText, Logger);
                        }
                    }

                    if (entry == null)
                    {
                        await stepContext.Context.SendActivityAsync(MessageFactory.Text($"Sorry, bing maps couldn't identify the location '{stepContext.Result.ToString()}'. Please try again."), cancellationToken);
                        return await stepContext.EndDialogAsync();
                    }
                    else
                    {
                        DailyChallenge dailyChallenge = await tableService.GetDailyChallenge();
                        if (dailyChallenge.entries != null)
                        {
                            var matchingEntries = dailyChallenge.entries.Where<DailyChallengeEntry>(e => e.imageResponse == entry.imageResponse);
                            if (matchingEntries.Count() > 0)
                            {
                                await stepContext.Context.SendActivityAsync(MessageFactory.Text($"Sorry, someone has beaten you to suggesting '{stepContext.Result.ToString()}'. Please try again."), cancellationToken);
                                // This line caused a bit of a meltdown so changing to end dialogue
                                //return await stepContext.BeginDialogAsync(nameof(ChallengeGuesserDialog), null, cancellationToken);
                                return await stepContext.EndDialogAsync();
                            }
                        }
                        
                        double distanceFromResult = DistanceMeasureHelper.GetDistanceFromResult(entry.latitude, entry.longitude, dailyChallenge.latitude, dailyChallenge.longitude);

                        entry.distanceFrom = distanceFromResult;
                        entry.userName = stepContext.Context.Activity.From.Name;
                        entry.userId = stepContext.Context.Activity.From.Id;
                        dailyChallenge.entries.Add(entry);
                        
                        await tableService.SaveDailyChallenge(dailyChallenge);

                        IMessageActivity reply = MessageFactory.Attachment(new List<Attachment>());
                        DailyChallengeEntriesStatus currentStatus = await CheckWhetherAllEntriesReceived(stepContext, cancellationToken, dailyChallenge, info);
                        reply.Attachments.Add(AttachmentHelper.AwaitingGuesses(currentStatus.userCount, dailyChallenge.photoUrl, currentStatus.usersWithEntryCount, entry.userName, entry.imageResponse));

                        await stepContext.Context.SendActivityAsync((Activity)reply);
                        return await stepContext.EndDialogAsync(null, cancellationToken);
                    }
                }
                catch(Exception exp)
                {
                    TelemetryClient.TrackTrace("Error loading results: " + exp.Message + exp.StackTrace, Severity.Error, null);
                    throw exp;
                }
            }
        }

        private async Task<DailyChallengeEntriesStatus> CheckWhetherAllEntriesReceived(WaterfallStepContext stepContext, CancellationToken cancellationToken, DailyChallenge dailyChallenge, DailyChallengeInfo info)
        {
            try
            {
                // Fill in the "standard" properties for BotMessageReceived
                // and add our own property.
                Logger.LogInformation("Checking whether all entries received");
                DailyChallengeEntriesStatus currentStatus = new DailyChallengeEntriesStatus()
                {
                    allResultsReceived = false
                };
                
                List<DailyChallengeEntry> todayEntries = dailyChallenge.entries;
                if (info.users == null)
                {
                    info.users = new List<DailyChallengeUser>();
                }
                List<DailyChallengeUser> challengeUsers = new List<DailyChallengeUser>();

                var microsoftAppId = Configuration["MicrosoftAppId"];
                var microsoftAppPassword = Configuration["MicrosoftAppPassword"];

                var connector = new ConnectorClient(new Uri(stepContext.Context.Activity.ServiceUrl), microsoftAppId, microsoftAppPassword);
                var response = await connector.Conversations.GetConversationMembersWithHttpMessagesAsync(stepContext.Context.Activity.Conversation.Id);
                //var response = (await connectorClient.Conversations.GetConversationMembersAsync());
                foreach (var user in response.Body)
                {
                    challengeUsers.Add(new DailyChallengeUser()
                    {
                        id = user.Id,
                        username = user.Name
                    });
                }

                int userCount = challengeUsers.Count;
                int usersWithEntryCount = 0;

                foreach (var user in challengeUsers)
                {
                    if (todayEntries.Exists(matchingItem => matchingItem.userName == user.username))
                    {
                        usersWithEntryCount++;
                    }
                }
                
                if (usersWithEntryCount >= userCount)
                {
                    currentStatus.allResultsReceived = true;
                }

                currentStatus.userCount = userCount;
                currentStatus.usersWithEntryCount = usersWithEntryCount;
                return currentStatus;
            }
            catch(Exception exp)
            {
                Logger.LogError(exp, $"Error checking whether all entries received: {exp.Message} - {exp.StackTrace}", null);
                throw exp;
            }
        }

        private async Task CheckResults(WaterfallStepContext stepContext, CancellationToken cancellationToken, DailyChallenge dailyChallenge, DailyChallengeInfo info)
        {
           List<DailyChallengeEntry> todayEntries = dailyChallenge.entries;

            string currentWinningUser = "";
            string currentWinningEntry = "";
            double currentWinningDistance = double.MaxValue;
           

            foreach (var entry in todayEntries)
            {
                if (entry.distanceFrom < currentWinningDistance)
                {
                    currentWinningUser = entry.userName;
                    currentWinningEntry = entry.imageResponse;
                    currentWinningDistance = entry.distanceFrom;
                }
            }
            try
            {
                DailyChallengeImage image = await tableService.getDailyChallengeImage();

                dailyChallenge.distanceToEntry = currentWinningDistance;
                dailyChallenge.winnerName = currentWinningUser;
                dailyChallenge.winnerGuess = currentWinningEntry;
                dailyChallenge.resultSet = true;

                await tableService.SaveDailyChallenge(dailyChallenge);
                IMessageActivity reply = MessageFactory.Attachment(new List<Attachment>());
                
                reply.Attachments.Add(AttachmentHelper.ResultCardAttachment(currentWinningUser.ToString(), image.Url, currentWinningEntry, currentWinningDistance.ToString("#.##"), dailyChallenge.extractedLocation, dailyChallenge.text));
                await stepContext.Context.SendActivityAsync(reply);
            }
            catch (Exception exp)
            {
                Console.WriteLine("Error checking results: " + exp.Message);
            }
            return;
        }

        private async Task<DialogTurnResult> FinalStepAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            return await stepContext.EndDialogAsync(cancellationToken: cancellationToken);
        }
        */
