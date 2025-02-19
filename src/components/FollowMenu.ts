import { debug } from "../Log";
import { Component, ReplyType } from '../InteractionEssentials';
import { ButtonInteraction, ComponentType, MessageFlags } from "discord.js";
import followMenuModel, { FollowMenuDoc } from "../models/followMenu";
import { followMenuMessage } from "../commands/Connections";
import botUserModel, { BotUserDoc } from "../models/botUser";
import { Types } from "mongoose";

export const FollowMenu: Component<ButtonInteraction> = {
    name: "follow_menu",
    type: ComponentType.Button,
    subcomponents: {
        page: {
            run: async (client, interaction, botUser, data) => {
                debug("FollowMenu page button pressed");

                const document = await followMenuModel
                    .findById(data[0])
                    .exec() as FollowMenuDoc | null;

                if (document) {
                    const page = parseInt(data[1]);
                    const [embed, actionRow] = await followMenuMessage(botUser, document, page);

                    return {
                        replyType: ReplyType.Update,
                        embeds: [embed],
                        components: [actionRow],
                    };
                }

                return {
                    replyType: ReplyType.Update,
                    content: "This follow menu has expired",
                    embeds: [],
                    components: [],
                    flags: MessageFlags.Ephemeral,
                };
            },
        },
        follow: {
            run: async (client, interaction, botUser, data) => {
                debug("FollowMenu follow button pressed");
                const targetDocument = await botUserModel
                    .findById(data[0])
                    .exec() as BotUserDoc | null;

                let responseContent = "Could not find the user or server you were looking for";
                const following = botUser.following as Types.ObjectId[];
                if (targetDocument) {
                    responseContent = `Successfully followed **${targetDocument.name}**`;
                    if (!following.some((id) => id.equals(targetDocument._id as Types.ObjectId))) {
                        botUser.following.push(targetDocument._id);
                    }
                    await botUser.save();
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
