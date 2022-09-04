//using Microsoft.Bot.Schema.Teams;
/*import {
  CommandMessage,
  TeamsFxBotCommandHandler,
  TriggerPatterns,
  MessageBuilder,
} from "@microsoft/teamsfx";
*/
import { TeamsChannelData } from 'botbuilder';

//TODO: sort out TeamsChannelData need
export interface DailyChallengeTeam {
  serviceUrl: string;
  objType: string;
  teamId: string
  teamName: string;
  tenantId: string;
  installerName: string;
  botId: string;
  channelId: string;
  channelData: TeamsChannelData;
  //channelDataSerialized: string;
}
