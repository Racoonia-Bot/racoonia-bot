import { debug, error, logToDiscord } from "../Log";
import { EventListener } from "../EventListeners";
import { BotUserDoc, BotUserType, updateBotUser } from "../models/botUser";
import { CommandFormatFailure, CommandNotFoundFailure, ComponentNotFoundFailure, Failure, MessageComponentExecutionFailure, SlashCommandExecutionFailure } from "../Failure";
import statisticModel from "../models/statistic";
import { ButtonInteraction, Client, CommandInteraction, ComponentType, InteractionEditReplyOptions, InteractionUpdateOptions, MessageComponentInteraction } from "discord.js";
import { Commands, Components } from "../Interactions";
import { ReplyType, Response } from "../InteractionEssentials";
import { DiscordUserDoc, getDiscordUserData, getOrCreateDiscordUser } from "../models/discordUser";

export const InteractionCreate: EventListener = {
    start: (client) => {
        client.on("interactionCreate", async (interaction) => {
            debug("Interaction event triggered");

            let botUser: BotUserDoc;
            if (interaction.inGuild()) {
                botUser = await updateBotUser(interaction.guildId!, BotUserType.GUILD, interaction.guild!.name, interaction.guild!.memberCount);
            } else {
                botUser = await updateBotUser(interaction.user.id, BotUserType.USER, interaction.user.username, 0);
            }

            const discordUserData = getDiscordUserData(interaction.user);
            const discordUser = await getOrCreateDiscordUser(discordUserData.name, discordUserData.type, discordUserData.id);

            let result: [Response, string] | Failure;
            if (interaction.isCommand()) {
                result = await handleSlashCommand(client, interaction, botUser, discordUser);
            } else if (interaction.isMessageComponent()) {
                result = await handleMessageComponent(client, interaction, botUser, discordUser);
            } else {
                logToDiscord(client, error("Unknown interaction type"));
                return;
            }

            let statKey: string;
            if (result instanceof Failure) {
                result.log(client);
                statKey = result.statKey();
                replyToInteraction(interaction, result);
            } else {
                statKey = result[1];
                replyToInteraction(interaction, result[0]);
            }

            statisticModel.create({
                global: false,
                key: statKey,
                user: botUser._id,
            });
        });
    }
}

async function handleSlashCommand(client: Client, interaction: CommandInteraction, botUser: BotUserDoc, discordUser: DiscordUserDoc): Promise<[Response, string] | Failure> {
    debug("Slash command interaction recieved");

    let statKey = "bot.event.interaction.command";

    debug(`Getting command ${interaction.commandName}`);
    const commandHandler = Commands.find((command) => command.name === interaction.commandName);

    if (!commandHandler) {
        logToDiscord(client, error(`Command ${interaction.commandName} not found`));
        return new CommandNotFoundFailure();
    }

    statKey += `.${commandHandler.name}`;

    if (commandHandler.run) {
        try {
            const result = await commandHandler.run(client, interaction, botUser, discordUser);
            if (result instanceof Failure) {
                return result;
            } else {
                return [result, statKey];
            }
        } catch (err) {
            return new SlashCommandExecutionFailure(err);
        }
    }

    if (!interaction.isChatInputCommand()) {
        return new CommandFormatFailure();
    }

    let firstSubcommand = interaction.options.getSubcommandGroup(false);
    let secondSubcommand = interaction.options.getSubcommand(false);
    if (!firstSubcommand) {
        if (!secondSubcommand) {
            return new CommandFormatFailure();
        }

        firstSubcommand = secondSubcommand;
        secondSubcommand = null;
    }

    if (!commandHandler.subcommands) {
        return new CommandFormatFailure();
    }
    if (!commandHandler.subcommands[firstSubcommand]) {
        return new CommandFormatFailure();
    }

    let subcommandHandler = commandHandler.subcommands[firstSubcommand];
    statKey += `.${firstSubcommand}`;

    if (secondSubcommand) {
        if (!subcommandHandler.subcommands) {
            return new CommandFormatFailure();
        }
        if (!subcommandHandler.subcommands[secondSubcommand]) {
            return new CommandFormatFailure();
        }

        subcommandHandler = subcommandHandler.subcommands[secondSubcommand];
        statKey += `.${secondSubcommand}`;
    }

    if (!subcommandHandler.run) {
        return new CommandFormatFailure();
    }

    try {
        const result = await subcommandHandler.run(client, interaction, botUser, discordUser);
        if (result instanceof Failure) {
            return result;
        } else {
            return [result, statKey];
        }
    } catch (err) {
        return new SlashCommandExecutionFailure(err);
    }
}

async function handleMessageComponent(client: Client, interaction: MessageComponentInteraction, botUser: BotUserDoc, discordUser: DiscordUserDoc): Promise<[Response, string] | Failure> {
    debug("Message component interaction recieved");

    let statKey = "bot.event.interaction.component";

    const componentData = interaction.customId.split(";");

    const componentName = componentData.shift();
    debug(`Getting component ${componentName}`);
    const component = Components.find((c) => c.name === componentName);

    if (!component) {
        logToDiscord(client, error(`Component ${componentName} not found`));
        return new ComponentNotFoundFailure();
    }

    statKey += `.${component.name}`;

    let handler = component.run;
    let subcomponents = component.subcomponents;
    while (subcomponents && componentData.length > 0) {
        const subcomponent = subcomponents[componentData[0]];
        if (!subcomponent) {
            break;
        }

        handler = subcomponent.run;
        subcomponents = subcomponent.subcomponents;
        statKey += `.${componentData.shift()}`;
    }

    if (!handler) {
        return new ComponentNotFoundFailure();
    }

    try {
        let result: Response | Failure;
        switch (component.type) {
            case ComponentType.Button:
                result = await handler(client, interaction as ButtonInteraction, botUser, discordUser, componentData);
                break;
            default:
                result = await handler(client, interaction, botUser, discordUser, componentData);
                break;
        }
        if (result instanceof Failure) {
            return result;
        } else {
            return [result, statKey];
        }
    } catch (err) {
        return new MessageComponentExecutionFailure(err);
    }
}

function replyToInteraction(interaction: CommandInteraction | MessageComponentInteraction, result: Response | Failure) {
    debug("Replying to interaction");

    if (result instanceof Failure) {
        interaction.reply(result.response("en"));
        return;
    }

    switch (result.replyType) {
        case ReplyType.Reply:
            interaction.reply(result);
            return;
        case ReplyType.FollowUp:
            interaction.reply(result);
            return;
        case ReplyType.Update:
            if (interaction.isMessageComponent() ) {
                interaction.update(result as InteractionUpdateOptions);
            } else {
                interaction.editReply(result as InteractionEditReplyOptions);
            }
            return;
    }
}
