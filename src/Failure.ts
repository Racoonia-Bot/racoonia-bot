import { Client, EmbedBuilder, MessageFlags } from "discord.js";
import { localize } from "./Localization";
import { ReplyType, Response } from "./InteractionEssentials";
import { error, logToDiscord } from "./Log";
import Colors from "./Colors";

export class Failure {
    type: string;
    localizationKey: string;
    error?: Error;

    constructor(error?: Error) {
        this.type = "general";
        this.localizationKey = "failure.general";
        this.error = error;
    }

    localizedString(language: string): string {
        return localize(this.localizationKey, language);
    }

    discordEmbed(language: string): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle("Failure")
            .setDescription(this.localizedString(language))
            .setColor(Colors.FAILURE_EMBED);
    }

    statKey() {
        return `failure.${this.type}`;
    }

    response(language: string): Response {
        return {
            replyType: ReplyType.Reply,
            flags: MessageFlags.Ephemeral,
            embeds: [this.discordEmbed(language)]
        };
    }

    toString(): string {
        return `${this.type}: ${this.localizedString("en")}`;
    }

    log(client?: Client): void {
        const embed = error(`${this.type}: ${this.localizedString("en")}`, this.error);
        if (client) {
            logToDiscord(client, embed);
        }
    }
}

export class CommandNotFoundFailure extends Failure {
    constructor(error?: any) {
        super(error);
        this.type = "commandNotFound";
        this.localizationKey = "failure.command_not_found";
    }
}

export class ComponentNotFoundFailure extends Failure {
    constructor(error?: any) {
        super(error);
        this.type = "componentNotFound";
        this.localizationKey = "failure.component_not_found";
    }
}

export class SubcommandNotFoundFailure extends Failure {
    constructor(error?: any) {
        super(error);
        this.type = "subcommandNotFound";
        this.localizationKey = "failure.subcommand_not_found";
    }
}

export class SubcomponentNotFoundFailure extends Failure {
    constructor(error?: any) {
        super(error);
        this.type = "subcomponentNotFound";
        this.localizationKey = "failure.subcomponent_not_found";
    }
}

export class UnknownComponentTypeFailure extends Failure {
    constructor(error?: any) {
        super(error);
        this.type = "unknownComponentType";
        this.localizationKey = "failure.unknown_component_type";
    }
}

export class FeatureNotImplementedFailure extends Failure {
    constructor(error?: any) {
        super(error);
        this.type = "featureNotImplemented";
        this.localizationKey = "failure.feature_not_implemented";
    }
}

export class BotUserNotFoundFailure extends Failure {
    constructor(error?: any) {
        super(error);
        this.type = "botUserNotFound";
        this.localizationKey = "failure.bot_user_not_found";
    }
}

export class IsChatInputCommandFailure extends Failure {
    constructor(error?: any) {
        super(error);
        this.type = "isChatInputCommandFailure";
        this.localizationKey = "failure.is_chat_input_command";
    }
}

export class SubcommandExecutionFailure extends Failure {
    constructor(error?: any) {
        super(error);
        this.type = "subcommandExecutionFailure";
        this.localizationKey = "failure.subcommand_execution";
    }
}

export class SubcomponentExecutionFailure extends Failure {
    constructor(error?: any) {
        super(error);
        this.type = "subcomponentExecutionFailure";
        this.localizationKey = "failure.subcomponent_execution";
    }
}

export class SlashCommandExecutionFailure extends Failure {
    constructor(error?: any) {
        super(error);
        this.type = "slashCommandExecutionFailure";
        this.localizationKey = "failure.slash_command_execution";
    }
}

export class MessageComponentExecutionFailure extends Failure {
    constructor(error?: any) {
        super(error);
        this.type = "messageComponentExecutionFailure";
        this.localizationKey = "failure.message_component_execution";
    }
}

export class UnknownFollowMenuDataFailure extends Failure {
    constructor(error?: any) {
        super(error);
        this.type = "unknownFollowMenuDataFailure";
        this.localizationKey = "failure.unknown_follow_menu_data";
    }
}

export class CommandFormatFailure extends Failure {
    constructor(error?: any) {
        super(error);
        this.type = "commandFormatFailure";
        this.localizationKey = "failure.command_format";
    }
}
