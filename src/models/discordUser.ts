import { User } from 'discord.js';
import { Document, Model, Schema, model } from 'mongoose';
import { debug } from '../Log';

export type DiscordUserType = 'discord' | 'legacy' | 'non-discord';
export type RawDiscordUser = User | string;

export function getDiscordUserData(user: User): { name: string, type: DiscordUserType } {
    const type = user.discriminator === '0' ? 'discord' : 'legacy';
    const name = type === 'discord' ? user.username : `${user.username}#${user.discriminator}`;
    return { name, type };
}

export type DiscordUserSettings = { }

export const DEFAULT_DISCORD_USER_SETTINGS: DiscordUserSettings = { }

export interface DiscordUserDoc extends Document {
    name: string; // username, username#discriminator, or non discord name
    type: DiscordUserType;
    settings: DiscordUserSettings
    userId?: string;
}

interface DiscordUserModel extends Model<DiscordUserDoc> { }

const discordUserSchema = new Schema<DiscordUserDoc, DiscordUserModel>({
    type: { type: String, required: true },
    name: { type: String, required: true },
    settings: { type: Object, required: true, default: DEFAULT_DISCORD_USER_SETTINGS },
    userId: { type: String },
});

discordUserSchema.index({ name: 1, type: 1 }, { unique: true });

const discordUserModel = model<DiscordUserDoc, DiscordUserModel>('DiscordUsers', discordUserSchema);

export async function getOrCreateDiscordUser(username: string, type: DiscordUserType, id?: string): Promise<DiscordUserDoc> {
    debug(`Getting or creating discord user ${username} (${type})`);

    let document: DiscordUserDoc | null;
    if (type === 'discord' || type === 'legacy') {
        if (id === undefined) {
            throw new Error('Discord user type requires id');
        }
        document = await discordUserModel
            .findOne({
                userId: id,
                $or: [
                    { type: 'discord' },
                    { type: 'legacy' },
                ],
            })
            .exec() as DiscordUserDoc | null;
    } else if (type === 'non-discord') {
        document = await discordUserModel
            .findOne({ name: username, type: type })
            .exec() as DiscordUserDoc | null;
    } else {
        throw new Error(`Unknown discord user type: ${type}`);
    }

    // Migration from legacy to discord
    if (type == 'discord' && document?.type == 'legacy') {
        document.type = 'discord';
        document.name = username;
        await document.save();
    }

    if (document === null) {
        return await discordUserModel.create({ type: type, userId: id, name: username });
    }
    return document;
}

export default discordUserModel;
