import { copyFileSync, existsSync, readFileSync } from "fs";
import * as yaml from 'js-yaml';

export type Config = {
    debug: boolean;
    api_port: number;
    do_update_check: boolean;
    update_check_cron: string;
    log_channel: string;
    log_role: string;
    database_name: string;
    log_to_discord: boolean;
    database_expiration: number;
    github_repo_owner: string;
    github_repo_name: string;
    changelog_fetch_delay: number;
    keep_logs: number;
    mongo_uri: string;
    discord_token: string;
    github_token: string;
}

export function loadConfig(): Config {
    if (!existsSync("meta/config.yml")) {
        if (!existsSync("meta/config.yml.template")) {
            throw new Error("meta/config.yml.template does not exist");
        }
        copyFileSync("meta/config.yml.template", "meta/config.yml");
    }
    return yaml.load(readFileSync("meta/config.yml", "utf8")) as Config;
}

const config = loadConfig();

function safeParseInt(value: string | undefined): number | undefined {
    if (value === undefined) return undefined;
    try {
        return parseInt(value);
    } catch (e) {
        return undefined;
    }
}

function parseBoolean(value: string | undefined): boolean | undefined {
    if (value === undefined) return undefined;
    return value === "true";
}

function getEnvConfig(): Partial<Config> {
    return Object.fromEntries(
        Object.entries({
            debug: parseBoolean(process.env.DEBUG),
            api_port: safeParseInt(process.env.API_PORT),
            do_update_check: parseBoolean(process.env.DO_UPDATE_CHECK),
            update_check_cron: process.env.UPDATE_CHECK_CRON,
            log_channel: process.env.LOG_CHANNEL,
            log_role: process.env.LOG_ROLE,
            database_name: process.env.DATABASE_NAME,
            log_to_discord: parseBoolean(process.env.LOG_TO_DISCORD),
            database_expiration: safeParseInt(process.env.DATABASE_EXPIRATION),
            github_repo_owner: process.env.GITHUB_REPO_OWNER,
            github_repo_name: process.env.GITHUB_REPO_NAME,
            changelog_fetch_delay: safeParseInt(process.env.CHANGELOG_FETCH_DELAY),
            keep_logs: safeParseInt(process.env.KEEP_LOGS),
            mongo_uri: process.env.MONGO_URI,
            discord_token: process.env.DISCORD_TOKEN,
            github_token: process.env.GITHUB_TOKEN
        }).filter(([k, v]) => v !== undefined)
    );
}

export function getConfig(): Config {
    return {
        ...config,
        ...getEnvConfig()
    };
}
