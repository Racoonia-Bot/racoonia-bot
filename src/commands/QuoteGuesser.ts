import { ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, StringSelectMenuBuilder } from "discord.js";
import { Command, ReplyType, Response } from "../InteractionEssentials";
import { debug } from "../Log";
import quoteGuesserModel, { createQuoteGuesserGame, QuoteGuesserDoc, randomQuote } from "../models/quoteGuesser";
import { shuffleArray } from "../Essentials";
import { BotUserDoc } from "../models/botUser";
import Colors from "../Colors";

export const QuoteGuesser: Command = {
    name: "quote_guesser",
    description: "Play the quote guesser game.",
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction, botUser, discordUser) => {
        debug("QuoteGuesser command called");
        return await newRound(botUser);
    },
};

export async function newRound(botUser: BotUserDoc, document?: QuoteGuesserDoc): Promise<Response>{
    debug("Starting new round");

    const [quote, authors, correctAuthor] = await randomQuote(botUser, document?.usedQuotes);
    if (quote === undefined) {
        return {
            replyType: ReplyType.Reply,
            content: "No quotes left to guess",
            flags: MessageFlags.Ephemeral,
        };
    }
    if (correctAuthor === undefined) {
        return {
            replyType: ReplyType.Reply,
            flags: MessageFlags.Ephemeral,
            content: "Quote author not found",
        };
    }
    if (authors === undefined) {
        return {
            replyType: ReplyType.Reply,
            flags: MessageFlags.Ephemeral,
            content: "No authors found",
        };
    }
    if (document === undefined) {
        document = await createQuoteGuesserGame(quote, authors, correctAuthor);
    } else {
        document.currentQuote = quote;
        document.usedQuotes.push(quote._id);
        document.choices = authors;
        document.correctAuthor = correctAuthor;
        document.answers.clear();
        await document.save();
    }

    return quoteGuesserMessage(document, quote.statements[0], ReplyType.Reply);
}

export async function finishRound(id: string) {
    debug("Finishing round");

    const document = await quoteGuesserModel
        .findById(id)
        .exec() as QuoteGuesserDoc | null;
    if (document === null) {
        return; // Game not found
    }
}

export function quoteGuesserMessage(document: QuoteGuesserDoc, quote: string, replyType: ReplyType): Response {
    debug("Creating quote guesser message");

    const id = document._id;
    const round = document.usedQuotes.length;
    const choices = document.choices;
    const correctAuthor = document.correctAuthor;
    const answerCount = document.answers.size;

    let answersText = "No one answered yet";
    if (answerCount > 0) {
        answersText = `${answerCount} ${answerCount === 1 ? "person has" : "people have"} answered`;
    }

    const embedBuilder = new EmbedBuilder()
        .setColor(Colors.QUOTE_GUESSER_EMBED)
        .setAuthor({ name: `Quote Guesser - Round ${round}` })
        .setTitle("Who said this quote?")
        .setDescription(`"${quote}" - ???`)
        .setFooter({ text: answersText });

    const buttonRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`quote_guesser_button;finish;${id}`)
                .setLabel("Finish Round")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`quote_guesser_button;end;${id}`)
                .setLabel("End Game")
                .setStyle(ButtonStyle.Danger),
        ) as ActionRowBuilder<ButtonBuilder>;

    // Shuffle authors and add the correct author
    const options = shuffleArray<string>(choices).slice(0, 24);
    options.splice(Math.floor(Math.random() * options.length), 0, correctAuthor);
    const optionObjects = options.map((name) => ({ value: name, label: name }));

    const selectionRow = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`quote_guesser_answer;${id}`)
                .setPlaceholder("Select the correct answer")
                .addOptions(optionObjects)
                .setMinValues(1)
                .setMaxValues(1),
        ) as ActionRowBuilder<StringSelectMenuBuilder>;

    return {
        replyType,
        embeds: [embedBuilder],
        components: [selectionRow, buttonRow],
    }
}
