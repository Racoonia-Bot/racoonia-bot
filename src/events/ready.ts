import { EventListener } from "../EventListeners";
import { Commands } from "../Interactions";
import { debug, error, info, success } from "../Log";
import mongoose from "mongoose";
import followMenuModel from "../models/followMenu";
import quoteGuesserModel from "../models/quoteGuesser";
import quoteListModel from "../models/quoteList";
import { Model } from 'mongoose';
import statisticModel from "../models/statistic";
import { getConfig } from "../Config";

export const Ready: EventListener = {
    start: (client) =>{
        client.once("ready", async () => {
            debug("Ready event triggered");

            if (client.user === null || client.application === null) {
                error("Ready event triggered but client or application is not available");
                return;
            }

            info("Setting up database...");
            await mongoose.connect(getConfig().mongo_uri || "", {
                dbName: getConfig().database_name
            });
            success("Database connected");

            info("Clearing old database entries...");
            await clearOldEntries();

            info("Registering commands...");
            await client.application.commands.set(Commands);
            debug("Registered commands: (" + Commands.map((command) => command.name).join(", ") + ")");

            info("Setting activity...");
            client.user.setActivity({
                name: "/donate",
            });

            success(`${client.user.tag} is online`);

            statisticModel.create({
                global: true,
                key: "bot.event.ready",
            });
        });
    }
}

export async function clearOldEntries() {
    const models = [
        followMenuModel,
        quoteGuesserModel,
        quoteListModel
    ] as Model<any>[];

    for (const model of models) {
        await model.deleteMany({ updatedAt: { $lt: new Date(Date.now() - (getConfig().database_expiration * 24 * 60 * 60 * 1000)) } });
    }
}
