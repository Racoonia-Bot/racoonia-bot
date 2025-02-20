import { Document, Model, Schema, Types, model } from 'mongoose';
import { ApiUserDoc } from './apiUser';
import { debug } from '../Log';

export enum BotUserType {
    GUILD = 'guild',
    USER = 'user',
}

export enum QuotePrivacy {
    PUBLIC = 'public',
    PRIVATE = 'private',
    TWO_WAY = 'two-way',
}

export type BotUserSettings = {
    quote_privacy: QuotePrivacy;
}

export const DEFAULT_BOT_USER_SETTINGS: BotUserSettings = {
    quote_privacy: QuotePrivacy.PRIVATE,
}

export interface BotUserDoc extends Document {
    id: string; // Discord user id or guild id
    type: BotUserType;
    settings: BotUserSettings;
    following: BotUserDoc['_id'][];
    name: string;
    memberCount: number;
    apiUser?: ApiUserDoc['_id'];
}

export interface BotUserPopulated extends BotUserDoc {
    apiUser?: ApiUserDoc;
}

interface BotUserModel extends Model<BotUserDoc> { }

const botUserSchema = new Schema<BotUserDoc, BotUserModel>({
    id: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    name: { type: String, required: true },
    memberCount: { type: Number, required: true },
    settings: { type: Object, required: true, default: DEFAULT_BOT_USER_SETTINGS },
    following:{ type: [{ type: Schema.Types.ObjectId, ref: 'BotUsers' }], required: true, default: []},
    apiUser: { type: String },
});

const botUserModel = model<BotUserDoc, BotUserModel>('BotUsers', botUserSchema);

export async function updateBotUser(id: string, type: BotUserType, name: string, memberCount: number): Promise<BotUserDoc> {
    debug(`Updating bot user ${name} (${type}) <${id}>`);

    const document = await botUserModel
        .findOne({ id, type })
        .exec() as BotUserDoc | null;

    if (document === null) {
        return await botUserModel.create({ id, type, name, memberCount });
    }

    document.name = name;
    document.memberCount = memberCount;
    return await document.save();
}

export async function getAccessableConnections(botUser: BotUserDoc): Promise<BotUserDoc['_id'][]> {
    const connections = [botUser._id];
    for (let user of botUser.following as BotUserDoc[] | string[]) {
        if (typeof user === 'string') {
            throw new Error("BotUser.following should be populated");
        }

        if (user.settings === undefined) {
            user = await botUserModel
                .findById(user._id)
                .populate('settings')
                .exec() as BotUserDoc;
        }

        if (user.settings.quote_privacy === QuotePrivacy.PRIVATE) continue;
        if (user.settings.quote_privacy === QuotePrivacy.TWO_WAY) {
            const following = user.following as Types.ObjectId[];
            if (!following.some((id) => id.equals(botUser._id as Types.ObjectId))) continue;
        };
        connections.push(user._id);
    }

    return connections;
}

export default botUserModel;
