import { Client } from "discord.js";
import { Ready } from "./events/ready";
import { InteractionCreate } from "./events/interactionCreate";

export const Listeners: EventListener[] = [Ready, InteractionCreate];

export interface EventListener {
    start: (client: Client) => void;
}
