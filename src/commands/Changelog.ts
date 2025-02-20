import { ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { Command, ReplyType, Response } from "../InteractionEssentials";
import { debug } from "../Log";
import { octokit } from "../Octokit";
import Colors from "../Colors";
import { getConfig } from "../Config";

var cachedReleases: any[] = [];
var lastFetch: number = 0;

export const Changelog: Command = {
    name: "changelog",
    description: "What's new in the latest version?",
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction, botUser, discordUser) => {
        debug("Changelog command called");
        const releases = await getReleases();
        return releaseMessage(releases, 0, ReplyType.Reply);
    },
};

async function fetchReleases() {
    debug("Fetching releases");
    const response = await octokit.rest.repos.listReleases({
        owner: getConfig().github_repo_owner,
        repo: getConfig().github_repo_name,
    });
    lastFetch = Date.now();
    cachedReleases = response.data;
    cachedReleases.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
}

export async function getReleases() {
    debug("Getting releases");
    if (Date.now() - lastFetch > getConfig().changelog_fetch_delay * 1000)
        await fetchReleases();
    return cachedReleases;
}

function generateReleaseInfo(release: any): string {
    debug("Generating release info");
    const sections = release.body
        .replaceAll('\r', '')
        .replaceAll(/(?<=\n\s*)\*\s+/g, '• ')
        .split(/\n{2}(?=#)/);

    const infoStart = `# ${release.name}\n`;
    const infoEnd = "\n\n[View on GitHub](" + release.html_url + ")";
    let maxSectionLength = 2048 - 2 - infoStart.length - infoStart.length;
    let infoMain = "";
    for (let section of sections) {
        section += "\n";
        if (maxSectionLength < section.length) break;
        maxSectionLength -= section.length;
        infoMain += section;
    }

    return infoStart + infoMain.trim() + infoEnd;
}

export function releaseMessage(releases: any[], page: number, replyType: ReplyType): Response {
    debug("Creating release message");
    const release = releases[page];
    const releaseInfo = generateReleaseInfo(release);

    const embed = new EmbedBuilder()
        .setColor(Colors.CHANGELOG_EMBED)
        .setAuthor({ name: release.author.login, url: release.author.html_url, iconURL: release.author.avatar_url })
        .setDescription(releaseInfo)
        .setFooter({ text: release.tag_name })
        .setTimestamp(new Date(release.published_at));

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`changelog_list;page;-Infinity`)
                .setEmoji("⏪")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === 0),
            new ButtonBuilder()
                .setCustomId(`changelog_list;page;${page - 1}`)
                .setEmoji("◀️")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === 0),
            new ButtonBuilder()
                .setCustomId(`changelog_list;page;${page + 1}`)
                .setEmoji("▶️")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === releases.length - 1),
            new ButtonBuilder()
                .setCustomId(`changelog_list;page;Infinity`)
                .setEmoji("⏩")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === releases.length - 1),
            new ButtonBuilder()
                .setCustomId(`changelog_list;page;${page}`)
                .setEmoji("🔄")
                .setStyle(ButtonStyle.Secondary),
        );

    return {
        replyType,
        embeds: [embed],
        components: [actionRow]
    };
}
