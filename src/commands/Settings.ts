import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, MessageFlags } from "discord.js";
import { Command, ReplyType } from '../InteractionEssentials';
import { debug } from "../Log";
import { QuotePrivacy } from "../models/botUser";
import Colors from "../Colors";

export const Settings: Command = {
    name: "settings",
    description: "Change your settings.",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "view",
            description: "View your settings.",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "change",
            description: "Change your settings.",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "quote_privacy",
                    description: "Change who can see your quotes.",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "privacy",
                            description: "Who can see your quotes.",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            choices: [
                                {
                                    name: "Public",
                                    value: "public"
                                },
                                {
                                    name: "Private",
                                    value: "private"
                                },
                                {
                                    name: "Two-way (only people you follow can see your quotes)",
                                    value: "two-way"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ],
    subcommands: {
        view: {
            run: async (client, interaction, botUser) => {
                debug("Settings view subcommand called");

                const embedBuiler = new EmbedBuilder()
                    .setColor(Colors.SETTINGS_EMBED)
                    .setTitle("Settings")
                    .addFields({
                        name: "Quote Privacy",
                        value: botUser.settings.quote_privacy,
                        inline: true
                    });

                return {
                    replyType: ReplyType.Reply,
                    embeds: [embedBuiler],
                    flags: MessageFlags.Ephemeral,
                };
            }
        },
        change: {
            subcommands: {
                quote_privacy: {
                    run: async (client, interaction, botUser) => {
                        debug("Settings change quote-privacy subcommand called");

                        const privacy = interaction.options.getString("privacy", true);
                        botUser.settings.quote_privacy = privacy as QuotePrivacy;
                        botUser.markModified("settings");
                        await botUser.save();

                        return {
                            replyType: ReplyType.Reply,
                            content: "Your quote privacy has been updated.",
                            flags: MessageFlags.Ephemeral,
                        };
                    }
                }
            }
        }
    },
};
