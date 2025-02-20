import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, MessageFlags } from "discord.js";
import { Command, ReplyType, Response } from "../InteractionEssentials";
import { debug, error, logToDiscord } from "../Log";
import { QuoteListPopulated, createQuoteList, getQuoteListQuery } from '../models/quoteList';
import { parseDate, splitArrayIntoChunks } from "../Essentials";
import { RawDiscordUser } from "../models/discordUser";
import { QuotePopulatedCreatorAuthors, createQuote, getQuoteByToken } from "../models/quote";
import Colors from "../Colors";
import { Types } from "mongoose";

const MAX_CONVERSATION_LENGTH = 5;
export const QUOTE_PAGE_SIZE = 15;

export const Quote: Command = {
    name: "quote",
    description: "Add, remove, or list quotes.",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "add",
            description: "Add a quote.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "quote",
                    description: "The quote to add.",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: "author",
                    description: "The author of the quote.",
                    type: ApplicationCommandOptionType.User,
                    required: false,
                },
                {
                    name: "non-discord-author",
                    description: "The author of the quote if they are not on discord.",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: "context",
                    description: "The context of the quote.",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: "quote-2",
                    description: "The second quote to add. (For conversations)",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: "author-2",
                    description: "The author of the second quote. (For conversations)",
                    type: ApplicationCommandOptionType.User,
                    required: false,
                },
                {
                    name: "non-discord-author-2",
                    description: "The author of the second quote if they are not on discord. (For conversations)",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: "quote-3",
                    description: "The third quote to add. (For conversations)",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: "author-3",
                    description: "The author of the third quote. (For conversations)",
                    type: ApplicationCommandOptionType.User,
                    required: false,
                },
                {
                    name: "non-discord-author-3",
                    description: "The author of the third quote if they are not on discord. (For conversations)",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: "quote-4",
                    description: "The fourth quote to add. (For conversations)",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: "author-4",
                    description: "The author of the fourth quote. (For conversations)",
                    type: ApplicationCommandOptionType.User,
                    required: false,
                },
                {
                    name: "non-discord-author-4",
                    description: "The author of the fourth quote if they are not on discord. (For conversations)",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: "quote-5",
                    description: "The fifth quote to add. (For conversations)",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: "author-5",
                    description: "The author of the fifth quote. (For conversations)",
                    type: ApplicationCommandOptionType.User,
                    required: false,
                },
                {
                    name: "non-discord-author-5",
                    description: "The author of the fifth quote if they are not on discord. (For conversations)",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
            ],
        },
        {
            name: "remove",
            description: "Remove a quote.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "quote-token",
                    description: "The quote to remove.",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
        {
            name: "list",
            description: "List all quotes.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "content",
                    description: "The content query to filter quotes by.",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: "discord-author",
                    description: "The discord author of the quotes to list.",
                    type: ApplicationCommandOptionType.User,
                    required: false,
                },
                {
                    name: "author-name",
                    description: "The name of the author of the quotes to list.",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: "context",
                    description: "The context query to filter quotes by.",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: "creator",
                    description: "The creator of the quotes to list.",
                    type: ApplicationCommandOptionType.User,
                    required: false,
                },
                {
                    name: "creator-name",
                    description: "The name of the creator of the quotes to list.",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: "date",
                    description: "The date query to filter quotes by.",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: "date-range",
                    description: "The range in days of the date query. (Default: 3)",
                    type: ApplicationCommandOptionType.Integer,
                    required: false,
                }
            ],
        },
        {
            name: "context",
            description: "Get the context of a quote.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "quote-token",
                    description: "The quote to get the context of.",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
        {
            name: "info",
            description: "Get info about a quote.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "quote-token",
                    description: "The quote to get info about.",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
    ],
    subcommands: {
        add: {
            run: async (client, interaction, botUser, discordUser) => {
                debug("Quote add subcommand called");

                const context: string | undefined = interaction.options.getString("context", false) ?? undefined;
                let quotes: string[] = [];
                let authors: RawDiscordUser[] = [];
                debug("Getting quote and author options")
                for (let i = 1; i <= MAX_CONVERSATION_LENGTH; i++) {
                    let optionSuffix;
                    if (i === 1) {
                        optionSuffix = "";
                    } else {
                        optionSuffix = "-" + i.toString();
                    }

                    const quote = interaction.options.getString(`quote${optionSuffix}`, false);
                    if (quote === null) {
                        for (let j = i + 1; j <= MAX_CONVERSATION_LENGTH; j++) {
                            if (interaction.options.getString(`quote-${j}`, false) !== null) {
                                return {
                                    replyType: ReplyType.Reply,
                                    flags: MessageFlags.Ephemeral,
                                    content: `You defined quote ${j} but the quotes ${i} to ${j - 1} are missing.`,
                                };
                            }
                        }
                        break;
                    }

                    const discordAuthor = interaction.options.getUser(`author${optionSuffix}`, false);
                    const nonDiscordAuthor = interaction.options.getString(`non-discord-author${optionSuffix}`, false);
                    if (discordAuthor === null && nonDiscordAuthor === null) {
                        return {
                            replyType: ReplyType.Reply,
                            flags: MessageFlags.Ephemeral,
                            content: `Quote ${i} is missing an author.`,
                        };
                    }
                    if (discordAuthor !== null && nonDiscordAuthor !== null) {
                        return {
                            replyType: ReplyType.Reply,
                            flags: MessageFlags.Ephemeral,
                            content: `Quote ${i} can only have a discord or a non-discord author not both.`,
                        };
                    }

                    quotes.push(quote);
                    if (discordAuthor !== null) {
                        authors.push(discordAuthor);
                    } else {
                        authors.push(nonDiscordAuthor!);
                    }
                }

                await createQuote(botUser, discordUser, quotes, authors, context);

                return {
                    replyType: ReplyType.Reply,
                    flags: MessageFlags.Ephemeral,
                    content: "Your quote was added.",
                };
            },
        },
        remove: {
            run: async (client, interaction, botUser, discordUser) => {
                debug("Quote remove subcommand called");

                const token = interaction.options.getString("quote-token", true);
                const document = await getQuoteByToken(botUser, token);
                if (document === null) {
                    return {
                        replyType: ReplyType.Reply,
                        flags: MessageFlags.Ephemeral,
                        content: "Quote not found.",
                    };
                }

                if (document.creator.userId !== interaction.user.id) { // && !hasPermission(interaction.member, PermissionsBitField.Flags.ManageMessages)
                    return {
                        replyType: ReplyType.Reply,
                        flags: MessageFlags.Ephemeral,
                        content: "You do not have permission to remove this quote.",
                    };
                }

                await document.deleteOne();
                return {
                    replyType: ReplyType.Reply,
                    flags: MessageFlags.Ephemeral,
                    content: "Quote removed.",
                };
            },
        },
        list: {
            run: async (client, interaction, botUser, discordUser) => {
                debug("Quote list subcommand called");

                const content = interaction.options.getString("content", false) ?? undefined;
                const authorUser = interaction.options.getUser("discord-author", false) ?? undefined;
                const authorName = interaction.options.getString("author-name", false) ?? undefined;
                const context = interaction.options.getString("context", false) ?? undefined;
                const creatorUser = interaction.options.getUser("creator", false) ?? undefined;
                const creatorName = interaction.options.getString("creator-name", false) ?? undefined;
                const dateString = interaction.options.getString("date", false) ?? undefined;
                const dateRange = interaction.options.getInteger("date-range", false) ?? undefined;

                if (authorUser !== undefined && authorName !== undefined) {
                    return {
                        replyType: ReplyType.Reply,
                        flags: MessageFlags.Ephemeral,
                        content: "You cannot specify both an author and an author name.",
                    };
                }
                if (creatorUser !== undefined && creatorName !== undefined) {
                    return {
                        replyType: ReplyType.Reply,
                        flags: MessageFlags.Ephemeral,
                        content: "You cannot specify both a creator and a creator name.",
                    };
                }

                const author = authorUser ?? authorName;
                const creator = creatorUser ?? creatorName;

                const date = parseDate(dateString);
                if (dateString !== undefined && date === undefined) {
                    return {
                        replyType: ReplyType.Reply,
                        flags: MessageFlags.Ephemeral,
                        content: "Invalid date format. The correct format is YYYY-MM-DD.",
                    };
                }

                const [list, quotes] = await createQuoteList(botUser, content, author, context, creator, date, dateRange);
                return await quoteListMessage(list, quotes, client, 0, ReplyType.Reply);
            },
        },
        context: {
            run: async (client, interaction, botUser, discordUser) => {
                debug("Quote context subcommand called");

                const token = interaction.options.getString("quote-token", true);
                const document = await getQuoteByToken(botUser, token);
                if (document === null) {
                    return {
                        replyType: ReplyType.Reply,
                        flags: MessageFlags.Ephemeral,
                        content: "Quote not found.",
                    };
                }

                const embedBuilder = new EmbedBuilder()
                    .setColor(Colors.QUOTE_CONTEXT_EMBED)
                    .setTitle(`Quote Context (Token: \`${document.token}\`)`)
                    .setDescription(document.context ?? "No context provided.");

                return {
                    replyType: ReplyType.Reply,
                    flags: MessageFlags.Ephemeral,
                    embeds: [embedBuilder],
                };
            },
        },
        info: {
            run: async (client, interaction, botUser, discordUser) => {
                debug("Quote context subcommand called");

                const token = interaction.options.getString("quote-token", true);
                const document = await getQuoteByToken(botUser, token);
                if (document === null) {
                    return {
                        replyType: ReplyType.Reply,
                        flags: MessageFlags.Ephemeral,
                        content: "Quote not found.",
                    };
                }
                if (document.creator.userId === undefined) {
                    return {
                        replyType: ReplyType.Reply,
                        flags: MessageFlags.Ephemeral,
                        content: "This quote has no creator.",
                    };
                }

                let infoText = "";
                for (let i = 0; i < document.statements.length; i++) {
                    const statement = document.statements[i];
                    const author = document.authors[i];
                    infoText += `"${statement}" - ${author.name}\n`;
                }
                infoText += `\n**Context:** ${document.context ?? "No context provided."}`;
                infoText += `\n**Created at:** ${document.createdAt.toUTCString()}`;

                const creatorObject = client.users.cache.get(document.creator.userId)

                const embedBuilder = new EmbedBuilder()
                    .setColor(Colors.QUOTE_INFO_EMBED)
                    .setTitle(`Quote Info (Token: \`${document.token}\`)`)
                    .setDescription(infoText)
                    .setAuthor({ name: document.creator.name, iconURL: creatorObject?.displayAvatarURL() })

                return {
                    replyType: ReplyType.Reply,
                    flags: MessageFlags.Ephemeral,
                    embeds: [embedBuilder],
                };
            },
        }
    },
};

function quoteListButtons(listId: Types.ObjectId, page: number, lastPage: boolean): ActionRowBuilder<ButtonBuilder> {
    debug("Creating quote list buttons");

    const idString = listId.toString();
    const actionRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`quote_list;page;${idString};-Infinity`)
                .setEmoji('⏪')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page <= 0),
            new ButtonBuilder()
                .setCustomId(`quote_list;page;${idString};${page - 1}`)
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page <= 0),
            new ButtonBuilder()
                .setCustomId(`quote_list;page;${idString};${page + 1}`)
                .setEmoji('▶️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(lastPage),
            new ButtonBuilder()
                .setCustomId(`quote_list;page;${idString};Infinity`)
                .setEmoji('⏩')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(lastPage),
            new ButtonBuilder()
                .setCustomId(`quote_list;page;${idString};${page}`)
                .setEmoji('🔄')
                .setStyle(ButtonStyle.Secondary)
        );

    return actionRow;
}

export async function quoteListMessage(list: QuoteListPopulated, quotes: QuotePopulatedCreatorAuthors[], client: Client, page: number, replyType: ReplyType): Promise<Response> {
    debug("Creating quote list message");

    const lastPage = page >= quotes.length / QUOTE_PAGE_SIZE - 1;
    const actionRow = quoteListButtons(list._id as Types.ObjectId, page, lastPage);

    if (quotes.length === 0) {
        const notFoundEmbed = new EmbedBuilder()
            .setColor(Colors.QUOTE_GUESSER_EMBED)
            .setTitle("Quotes")
            .setDescription("No quotes found.");

        return {
            replyType,
            embeds: [notFoundEmbed],
            components: [actionRow],
        };
    }

    const query = getQuoteListQuery(list);
    const quoteChunks = splitArrayIntoChunks(quotes.reverse(), QUOTE_PAGE_SIZE);
    const pageQuotes = quoteChunks[page];

    let embedDescription = `Showing ${pageQuotes.length} quotes`;
    if (query !== "") {
        embedDescription += ` matching:\n${query}`;
    }

    debug("Creating quote embed fields");
    const embedFields = await Promise.all(pageQuotes.map((quote) => quoteEmbedField(quote, client)));

    const embedBuilder = new EmbedBuilder()
        .setColor(Colors.QUOTE_GUESSER_EMBED)
        .setTitle(`Quotes (Page ${page + 1}/${quoteChunks.length})`)
        .setDescription(embedDescription)
        .addFields(embedFields);

    return {
        replyType,
        embeds: [embedBuilder],
        components: [actionRow],
    };
}

async function quoteEmbedField(quote: QuotePopulatedCreatorAuthors, client: Client) {
    if (quote.authors.length !== quote.statements.length) {
        logToDiscord(client, error(`Quote ${quote.token} has a mismatch between the number of authors and statements or can't be populated correctly.`));
        return {
            name: "Error",
            value: "An error occurred while formatting this quote",
            inline: false,
        }
    }
    let description = "";
    for (let i = 0; i < quote.statements.length; i++) {
        const statement = quote.statements[i];
        const author = quote.authors[i];
        if (author.name === null) {
            description += `"${statement}" - ???\n`;
            continue;
        }
        description += `"${statement}" - ${author.name}\n`;
    }
    return {
        name: `Created by ${quote.creator.name} (Token: \`${quote.token}\`)`,
        value: description,
        inline: false,
    }
}
