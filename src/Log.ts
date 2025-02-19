import { Client, EmbedBuilder } from "discord.js";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from "fs";
import { createGzip } from "zlib";
import Colors from "./Colors";
import { getConfig } from "./Config";

const format = {
    Reset: "\x1b[0m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",

    FgBlack: "\x1b[30m",
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgBlue: "\x1b[34m",
    FgMagenta: "\x1b[35m",
    FgCyan: "\x1b[36m",
    FgWhite: "\x1b[37m",
    FgGray: "\x1b[90m",

    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m",
    BgGray: "\x1b[100m",
};

const folderPath = "./logs";
const latestPath = `${folderPath}/latest.txt`;

export function debug(message: string, force = false): EmbedBuilder {
    if (getConfig().debug === true || force === true) {
        log("[DEBUG]  ", message, format.FgGray);
    }
    return new EmbedBuilder()
        .setTitle("Debug")
        .setDescription(message)
        .setColor(Colors.LOG_DEBUG);
}

export function info(message: string): EmbedBuilder {
    log("[INFO]   ", message, format.FgWhite);
    return new EmbedBuilder()
        .setTitle("Info")
        .setDescription(message)
        .setColor(Colors.LOG_INFO);
}

export function success(message: string): EmbedBuilder {
    log("[SUCCESS]", message, format.FgGreen);
    return new EmbedBuilder()
        .setTitle("Success")
        .setDescription(message)
        .setColor(Colors.LOG_SUCCESS);
}

export function warn(message: string): EmbedBuilder {
    log("[WARN]   ", message, format.FgYellow);
    return new EmbedBuilder()
        .setTitle("Warn")
        .setDescription(message)
        .setColor(Colors.LOG_WARN);
}

export function error(message: string, error?: Error): EmbedBuilder {
    if (error) {
        log("[ERROR]  ", `${message}\n${error.stack}`, format.FgRed);
    } else {
        log("[ERROR]  ", message, format.FgRed);
    }
    const embed = new EmbedBuilder().setColor(Colors.LOG_ERROR);

    if (error) {
        embed.setTitle(message);
        embed.setDescription(`\`\`\`${error.stack}\n\`\`\``);
    } else {
        embed.setTitle("Error");
        embed.setDescription(message);
    }

    return embed;
}

export async function logToDiscord(client: Client, embed: EmbedBuilder) {
    if (getConfig().log_to_discord === false) return;

    const channel = await client.channels.fetch(getConfig().log_channel);
    if (channel && channel.isSendable()) {
        channel.send({
            content: "<@&" + getConfig().log_role + ">",
            embeds: [embed],
        });
    }
}

function log(prefix: string, message: string, color = "", doSave = true) {
    const localTime = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });
    console.log(color, localTime, prefix, message, format.Reset);

    if (doSave) {
        const msg = `${localTime} ${prefix} ${message}`;
        save(msg);
    }
}

function save(message: string): void {
    writeFileSync(latestPath, `${message}\n`, { flag: "a" });
}

export async function setupLog(): Promise<void> {
    existsSync(folderPath) || mkdirSync(folderPath);

    // Delete old logs
    if (getConfig().keep_logs >= 0) {
        let files = readdirSync(folderPath)
            .filter((file) => file.endsWith(".gz"))
            .sort()
        if (getConfig().keep_logs !== 0) {
            files = files.slice(0, -getConfig().keep_logs);
        }
        await Promise.all(files.map(async (file) => unlinkSync(`${folderPath}/${file}`)));
    }

    // Compress the latest file if it exists
    if (existsSync(latestPath) && getConfig().keep_logs !== 0) {
        const targetPath = `${folderPath}/${new Date().toISOString()}.txt.gz`.replace(/:/g, "-");

        return new Promise<void>((resolve, reject) => {
            createReadStream(latestPath)
                .pipe(createGzip() as any)
                .pipe(createWriteStream(targetPath))
                .on("finish", () => {
                    createWriteStream(latestPath).write("");
                    resolve();
                });
        });
    } else {
        writeFileSync(latestPath, "");
    }
}
