import { ChatInputApplicationCommandData, ChatInputCommandInteraction, Client, CommandInteraction, ComponentType, InteractionReplyOptions, MessageComponentInteraction } from "discord.js";
import { Failure } from "./Failure";
import { Dict } from "./Essentials";
import { BotUserDoc } from './models/botUser';
import { DiscordUserDoc } from "./models/discordUser";

export enum ReplyType {
    Reply,
    FollowUp,
    Update,
}

export type CommandHandler = (client: Client, interaction: ChatInputCommandInteraction, botUser: BotUserDoc, discordUser: DiscordUserDoc) => Promise<Response | Failure>;
export interface Subcommand {
    run?: CommandHandler;
    subcommands?: Dict<Subcommand>;
}

export interface Command extends ChatInputApplicationCommandData {
    run?: (client: Client, interaction: CommandInteraction, botUser: BotUserDoc, discordUser: DiscordUserDoc) => Promise<Response | Failure>;
    subcommands?: Dict<Subcommand>;
}

export type ComponentHandler<InteractionType> = (client: Client, interaction: InteractionType, botUser: BotUserDoc, discordUser: DiscordUserDoc, data: string[]) => Promise<Response | Failure>;
export interface Subcomponent<InteractionType>{
    run?: ComponentHandler<InteractionType>;
    subcomponents?: Dict<Subcomponent<InteractionType>>;
}

export interface Component<InteractionType = MessageComponentInteraction> {
    name: string;
    type: ComponentType;
    run?: ComponentHandler<InteractionType>;
    subcomponents?: Dict<Subcomponent<InteractionType>>;
}

export interface Response extends InteractionReplyOptions {
    replyType: ReplyType;
}
