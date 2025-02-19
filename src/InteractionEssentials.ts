import { ChatInputApplicationCommandData, ChatInputCommandInteraction, Client, CommandInteraction, ComponentType, InteractionReplyOptions, MessageComponentInteraction } from "discord.js";
import { Failure } from "./Failure";
import { Dict } from "./Essentials";
import { BotUserDoc } from './models/botUser';

export enum ReplyType {
    Reply,
    FollowUp,
    Update,
}

export type CommandHandler = (client: Client, interaction: ChatInputCommandInteraction, botUser: BotUserDoc) => Promise<Response | Failure>;
export interface Subcommand {
    run?: CommandHandler;
    subcommands?: Dict<Subcommand>;
}

export interface Command extends ChatInputApplicationCommandData {
    run?: (client: Client, interaction: CommandInteraction, botUser: BotUserDoc) => Promise<Response | Failure>;
    subcommands?: Dict<Subcommand>;
}

export type ComponentHandler<InteractionType> = (client: Client, interaction: InteractionType, botUser: BotUserDoc, data: string[]) => Promise<Response | Failure>;
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
