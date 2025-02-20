import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } from "discord.js";
import { Command, ReplyType } from "../InteractionEssentials";
import { debug } from "../Log";
import botUserModel, { BotUserDoc, BotUserType } from "../models/botUser";
import followMenuModel, { FollowMenuDoc, FollowMenuPopulated } from "../models/followMenu";
import Colors from "../Colors";
import { Types } from "mongoose";

const TYPE_DISPLAY = {
    [BotUserType.USER]: "User",
    [BotUserType.GUILD]: "Server"
};

export const Connections: Command = {
    name: "connections",
    description: "Manage connections to other users and guilds",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "follow",
            description: "Follow a user or guild",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "name",
                    description: "The name of the user or guild",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "type",
                    description: "The target type",
                    type: ApplicationCommandOptionType.String,
                    choices: [
                        {
                            name: "User",
                            value: "user"
                        },
                        {
                            name: "Server",
                            value: "guild"
                        }
                    ],
                    required: true
                }
            ]
        },
        {
            name: "list",
            description: "List all connected users and guilds",
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    subcommands: {
        follow: {
            run: async (client, interaction, botUser, discordUser) => {
                debug("Follow subcommand called");

                const name = interaction.options.getString("name", true);
                const type = interaction.options.getString("type", true) as BotUserType;

                let targets = await botUserModel
                    .find({ name, type })
                    .exec() as BotUserDoc[];
                removeSelfFromTargets(targets, botUser);
                const extendedSearch = targets.length === 0;

                if (extendedSearch) {
                    targets = await botUserModel
                        .find({ name: { $regex: new RegExp(name, "i") }})
                        .exec() as BotUserDoc[];
                    removeSelfFromTargets(targets, botUser);
                    if (targets.length === 0) {
                        return {
                            content: "No user or guild found with that name and type",
                            flags: MessageFlags.Ephemeral,
                            replyType: ReplyType.Reply
                        }
                    }
                }

                const document = await followMenuModel.create({ targets, extendedSearch }) as FollowMenuPopulated;
                const [embed, actionRow] = await followMenuMessage(botUser, document);
                return {
                    embeds: [embed],
                    components: [actionRow],
                    replyType: ReplyType.Reply
                };
            },
        },
        list: {
            run: async (client, interaction, botUser, discordUser) => {
                debug("List subcommand called");

                const [embed, actionRow] = await connectionListMessage(botUser, 0);
                return {
                    embeds: [embed],
                    components: [actionRow],
                    replyType: ReplyType.Reply
                };
            }
        }
    }
};

export async function connectionListMessage(botUser: BotUserDoc, page: number): Promise<[EmbedBuilder, ActionRowBuilder<ButtonBuilder>]> {
    debug("Creating connection list message");

    let targetId = "";
    let embedBuilder = new EmbedBuilder()
        .setColor(Colors.CONNECTIONS_EMBED);

    if (botUser.following.length === 0) {
        embedBuilder.setTitle("Not following any users or servers")
    } else {
        embedBuilder.setAuthor({ name: `Following ${botUser.following.length} user${botUser.following.length === 1 ? "" : "s"}` })
        const target = await botUserModel
            .findById(botUser.following[page])
            .exec() as BotUserDoc | null;

        if (target === null) {
            embedBuilder.setTitle("Unknown user or server");
            embedBuilder.setDescription("The data for this user or server could not be found");
        } else {
            targetId = (target._id as Types.ObjectId).toString();
            embedBuilder.setTitle(target.name);
            let targetDescription = `Type: ${TYPE_DISPLAY[target.type]}`;
            if (target.type === BotUserType.GUILD) {
                targetDescription += `\nMember count: ${target.memberCount}`;
            }
            embedBuilder.setDescription(targetDescription);
        }
    }

    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`connection_list;page;${page - 1}`)
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === 0),
            new ButtonBuilder()
                .setCustomId(`connection_list;page;${page + 1}`)
                .setEmoji('▶️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page >= botUser.following.length - 1),
            new ButtonBuilder()
                .setCustomId(`connection_list;unfollow;${targetId}`)
                .setLabel("Unfollow")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(targetId === "")
        ) as ActionRowBuilder<ButtonBuilder>;

    return [embedBuilder, actionRow];
}

export async function followMenuMessage(botUser: BotUserDoc, document: FollowMenuDoc, page = 0): Promise<[EmbedBuilder, ActionRowBuilder<ButtonBuilder>]> {
    debug("Creating follow menu message");

    const targets = document.targets as BotUserDoc[];
    const targetId = targets[page]._id as Types.ObjectId;
    const target = await botUserModel
        .findById(targetId)
        .exec() as BotUserDoc | null;
    const following = botUser.following as Types.ObjectId[];
    const followed = following.some((id) => id.equals(targetId));

    const embedBuilder = new EmbedBuilder()
        .setColor(Colors.CONNECTIONS_EMBED)
        .setAuthor({
            name: `Found ${document.targets.length} matching target ${document.targets.length === 1 ? "" : "s"}`,
        });

    if (target === null) {
        embedBuilder.setTitle("Unknown user or server");
        embedBuilder.setDescription("The data for this user or server could not be found");
    } else {
        embedBuilder.setTitle(target.name + (followed ? " (followed)" : ""));
        let targetDescription = `Type: ${TYPE_DISPLAY[target.type]}`;
        if (target.type === BotUserType.GUILD) {
            targetDescription += `\nMember count: ${target.memberCount}`;
        }
        embedBuilder.setDescription(targetDescription);
    }

    if (document.extendedSearch) {
        embedBuilder.setFooter({
            text: "No exact matches found, showing similar results."
        })
    }

    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`follow_menu;page;${document._id};${page - 1}`)
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === 0),
            new ButtonBuilder()
                .setCustomId(`follow_menu;page;${document._id};${page + 1}`)
                .setEmoji('▶️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === document.targets.length - 1),
            new ButtonBuilder()
                .setCustomId(`follow_menu;follow;${targetId.toString()}`)
                .setLabel("Follow")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(target === null || followed)
        ) as ActionRowBuilder<ButtonBuilder>;

    return [embedBuilder, actionRow];
}

function removeSelfFromTargets(targets: BotUserDoc[], botUser: BotUserDoc): BotUserDoc[] {
    debug("Removing self from targets");

    const indexOfSelf = targets.map(t => t.id).indexOf(botUser.id);
    if (indexOfSelf > -1) {
        targets.splice(indexOfSelf, 1);
    }
    return targets;
}
