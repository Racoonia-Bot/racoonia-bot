import { debug } from "../Log";
import { Component, ReplyType } from '../InteractionEssentials';
import { ButtonInteraction, ComponentType } from "discord.js";
import { getReleases, releaseMessage } from "../commands/Changelog";
import { clamp } from "../Essentials";

export const ChangelogList: Component<ButtonInteraction> = {
    name: "changelog_list",
    type: ComponentType.Button,
    subcomponents: {
        page: {
            run: async (client, interaction, botUser, discordUser, data) => {
                debug("Changelog page button pressed");
                const releases = await getReleases();
                const page = clamp(parseFloat(data[0]), 0, releases.length - 1);
                return releaseMessage(releases, page, ReplyType.Update);
            },
        }
    }
};
