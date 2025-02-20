import { Component, ReplyType } from '../InteractionEssentials';
import { ComponentType, StringSelectMenuInteraction } from "discord.js";
import quoteGuesserModel, { QuoteGuesserPopulatedCurrentQuote } from "../models/quoteGuesser";
import { quoteGuesserMessage } from "../commands/QuoteGuesser";
import { SubcomponentExecutionFailure } from "../Failure";
import { GAME_NOT_FOUND } from './QuoteGuesserButton';

export const QuoteGuesserAnswer: Component<StringSelectMenuInteraction> = {
    name: "quote_guesser_answer",
    type: ComponentType.StringSelect,
    run: async (client, interaction, botUser, discordUser, data) => {
        if (!interaction.isStringSelectMenu()) {
            return new SubcomponentExecutionFailure();
        }

        const gameDocument = await quoteGuesserModel
            .findById(data[0])
            .populate("currentQuote")
            .exec() as QuoteGuesserPopulatedCurrentQuote | null;
        if (gameDocument === null) {
            return GAME_NOT_FOUND;
        }

        const answer = interaction.values[0];
        gameDocument.answers.set(encodeURIComponent(interaction.user.id), answer);
        gameDocument.save();

        return quoteGuesserMessage(gameDocument, gameDocument.currentQuote.statements[0], ReplyType.Update);
    },
};
