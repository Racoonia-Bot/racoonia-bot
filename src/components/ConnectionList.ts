import { debug } from "../Log";
import { Component, ReplyType } from '../InteractionEssentials';
import { ButtonInteraction, ComponentType, MessageFlags } from "discord.js";
import botUserModel, { BotUserDoc } from "../models/botUser";
import { connectionListMessage } from "../commands/Connections";
import { Types } from "mongoose";

export const ConnectionList: Component<ButtonInteraction> = {
    name: "connection_list",
    type: ComponentType.Button,
    subcomponents: {
        page: {
            run: async (client, interaction, botUser, discordUser, data) => {
                debug("ConnectionList page button pressed");

                const page = parseInt(data[0]);
                const [embed, actionRow] = await connectionListMessage(botUser, page);

                return {
                    replyType: ReplyType.Update,
                    embeds: [embed],
                    components: [actionRow],
                };
            },
        },
        unfollow: {
            run: async (client, interaction, botUser, discordUser, data) => {
                debug("ConnectionList unfollow button pressed");

                const targetId = data[0];
                const document = await botUserModel
                    .findById(targetId)
                    .exec() as BotUserDoc | null;

                let responseContent = "";
                const following = botUser.following as Types.ObjectId[];
                if (document === null) {
                    responseContent = "Unknown user or server";
                } else if (!following.some((id) => id.equals(document._id as Types.ObjectId))){
                    responseContent = `You are not following ${document.name}`;
                } else {
                    botUser.following = following.filter((id) => id.toString() !== targetId);
                    await botUser.save();
                    responseContent = `Successfully unfollowed ${document.name}`;
                }

                return {
                    replyType: ReplyType.Update,
                    content: responseContent,
                    embeds: [],
                    components: [],
                    flags: MessageFlags.Ephemeral,
                };
            }
        }
    },
};
