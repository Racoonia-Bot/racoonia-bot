import { Octokit } from "@octokit/rest";
import { getConfig } from "./Config";
import { debug, error, warn } from "./Log";

export const octokit = new Octokit({
    auth: getConfig().github_token,
    userAgent: getConfig().github_repo_name,
    log: {
        debug: debug,
        info: debug,
        warn: warn,
        error: error
    }
});
