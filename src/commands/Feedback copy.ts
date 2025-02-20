import { ApplicationCommandOptionType, ApplicationCommandType, MessageFlags } from "discord.js";
import { Command, ReplyType } from "../InteractionEssentials";
import { debug } from "../Log";
import { IsChatInputCommandFailure } from "../Failure";
import { FeedbackType, createFeedback } from "../models/feedback";

export const Feedback: Command = {
    name: "feedback",
    description: "Send feedback to the bot developer",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: "type",
            description: "The type of feedback",
            required: true,
            choices: [
                {
                    name: "Bug",
                    value: "bug",
                },
                {
                    name: "Suggestion",
                    value: "suggestion",
                },
                {
                    name: "Other",
                    value: "other",
                },
            ],
        },
        {
            type: ApplicationCommandOptionType.String,
            name: "description",
            description: "The description of your feedback",
            required: true,
        }
    ],
    run: async (client, interaction, botUser) => {
        debug("Feedback command called");

        if (!interaction.isChatInputCommand()) {
            return new IsChatInputCommandFailure();
        }

        const feedbackType = interaction.options.getString("type", true) as FeedbackType;
        const feedbackDescription = interaction.options.getString("description", true);
        await createFeedback(interaction.user, feedbackType, feedbackDescription);

        return {
            replyType: ReplyType.Reply,
            content: "Thank you for your feedback!",
            flags: MessageFlags.Ephemeral,
        }
    },
};
