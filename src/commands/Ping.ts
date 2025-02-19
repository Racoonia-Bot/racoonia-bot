import { ApplicationCommandType, EmbedBuilder, MessageFlags } from "discord.js";
import { Command, ReplyType } from "../InteractionEssentials";
import { debug } from "../Log";
import Colors from "../Colors";

export const Ping: Command = {
    name: "ping",
    description: "A ping command",
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction, botUser) => {
        debug("Ping command called");

        const latency = Math.abs(Date.now() - interaction.createdTimestamp);
        const apiLatency = client.ws.ping;

        const latencySuffix = getLatencySuffix(latency);
        const apiLatencySuffix = getLatencySuffix(apiLatency);

        const embed = new EmbedBuilder()
            .setColor(Colors.PING_EMBED)
            .addFields(
                {
                    name: ":stopwatch: Latency",
                    value: `${latency}ms ${latencySuffix}`,
                },
                {
                    name: ":heartbeat: API Latency",
                    value: apiLatency < 0
                        ? "Couldn't be calculated"
                        : `${apiLatency}ms ${apiLatencySuffix}`,
                }
            );

        return {
            replyType: ReplyType.Reply,
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
        };
    },
};

function getLatencySuffix(latency: number): string {
    debug(`Getting latency suffix for ${latency}`);

    // Special cases:
    switch (latency) {
        case 69:
            return "(Nice)";
        case 420:
            return "(Blaze it)";
        case 0:
            return "(Who's your ISP?)";
    }

    // Ranges:
    if (latency < 0) {
        return "(How?)";
    }
    if (latency > 10000) {
        return "(Are you on a potato?)";
    }
    if (latency > 1000) {
        return "(That's pretty bad)";
    }

    // Default:
    return "";
}
