import { ApplicationCommandOptionType, ApplicationCommandType, MessageFlags } from "discord.js";
import { Command, ReplyType } from '../InteractionEssentials';
import { debug } from "../Log";
import { addWord, removeWord, getWords, RemoveWordResult } from "../models/codename";
import { RemoveWordFailure } from "../Failure";

export const Codenames: Command = {
    name: "codenames",
    description: "Add words to the codenames wordpack",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "add",
            description: "Add a word to the codenames wordpack",
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "word",
                    description: "The word to add",
                    required: true,
                },
            ],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "remove",
            description: "Remove a word from the codenames wordpack",
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "word",
                    description: "The word to remove",
                    required: true,
                },
            ],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "wordpack",
            description: "Get the codenames wordpack",
        }
    ],
    subcommands: {
        add: {
            run: async (client, interaction, botUser, discordUser) => {
                debug("Codenames add subcommand called");

                const word = interaction.options.getString("word", true);
                const document = await addWord(botUser, discordUser, word);
                if (document === undefined) {
                    return {
                        replyType: ReplyType.Reply,
                        flags: MessageFlags.Ephemeral,
                        content: `Word "${word}" already exists in the codenames wordpack`,
                    };
                }

                return {
                    replyType: ReplyType.Reply,
                    content: `Added word "${word}" to the codenames wordpack`,
                    flags: MessageFlags.Ephemeral,
                };
            }
        },
        remove: {
            run: async (client, interaction, botUser, discordUser) => {
                debug("Codenames remove subcommand called");

                const word = interaction.options.getString("word", true);
                const removeSuccess = await removeWord(botUser, word, interaction.inGuild(), interaction.user);
                switch (removeSuccess) {
                    case RemoveWordResult.NotFound: {
                        return {
                            replyType: ReplyType.Reply,
                            flags: MessageFlags.Ephemeral,
                            content: `Word "${word}" not found in the codenames wordpack`,
                        };
                    }
                    case RemoveWordResult.NotCreator: {
                        return {
                            replyType: ReplyType.Reply,
                            flags: MessageFlags.Ephemeral,
                            content: `You do not have permission to remove word "${word}" from the codenames wordpack`,
                        };
                    }
                    case RemoveWordResult.Success: {
                        return {
                            replyType: ReplyType.Reply,
                            flags: MessageFlags.Ephemeral,
                            content: `Removed word "${word}" from the codenames wordpack`,
                        };
                    }
                    default: {
                        return new RemoveWordFailure();
                    }
                }
            }
        },
        wordpack: {
            run: async (client, interaction, botUser, discordUser) => {
                debug("Codenames wordpack subcommand called");

                const codenames = await getWords(botUser);
                const words = codenames.map((codename) => codename.word);
                if (words.length === 0) {
                    return {
                        replyType: ReplyType.Reply,
                        flags: MessageFlags.Ephemeral,
                        content: "No words found in the codenames wordpack",
                    };
                }
                const buffer = Buffer.from(words.join("\n"), "utf-8");

                return {
                    replyType: ReplyType.Reply,
                    files: [{
                        name: "wordpack.txt",
                        attachment: buffer,
                    }],
                };
            },
        }
    }
};
