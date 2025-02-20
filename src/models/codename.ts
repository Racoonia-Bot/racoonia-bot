import { Document, Model, Schema, model } from 'mongoose';
import { BotUserDoc, getAccessableConnections } from './botUser';
import { DiscordUserDoc } from './discordUser';
import { User } from 'discord.js';
import { debug } from '../Log';

export interface CodenameDoc extends Document {
    user: BotUserDoc['_id'];
    creator: DiscordUserDoc['_id'];
    word: string;
    word_lower: string;
}

export interface CodenamePopulated extends CodenameDoc {
    user: BotUserDoc;
    creator: DiscordUserDoc;
}

export interface CodenamePopulatedCreator extends CodenameDoc {
    creator: DiscordUserDoc;
}

interface CodenameModel extends Model<CodenameDoc> { }

const codenameSchema = new Schema<CodenameDoc, CodenameModel>({
    user: { type: Schema.Types.ObjectId, ref: 'BotUsers', required: true },
    creator: { type: Schema.Types.ObjectId, ref: 'DiscordUsers', required: true },
    word: { type: String, required: true },
    word_lower: { type: String, required: true },
});

codenameSchema.index({ user: 1, word: 1 }, { unique: true });

const codenameModel = model<CodenameDoc, CodenameModel>('Codenames', codenameSchema);

export async function getWords(botUser: BotUserDoc): Promise<CodenameDoc[]> {
    debug(`Getting codenames words for bot user ${botUser.name}`);

    const targets = await getAccessableConnections(botUser);

    return await codenameModel
        .find({ user: { $in: targets } })
        .exec() as CodenameDoc[];
}

export enum RemoveWordResult {
    Success,
    NotFound,
    NotCreator
}

export async function removeWord(botUser: BotUserDoc, word: string, inGuild: boolean, remover: User): Promise<RemoveWordResult> {
    debug(`Getting codename word ${word} for bot user ${botUser.name}`);
    const targets = await getAccessableConnections(botUser);
    const documents = await codenameModel
        .find({ user: { $in: targets }, word_lower: word.toLowerCase() })
        .populate('creator')
        .exec() as CodenamePopulatedCreator[];
    if (documents.length === 0) {
        return RemoveWordResult.NotFound;
    }

    let deleted = RemoveWordResult.NotCreator;
    for (const document of documents) {
        if (!inGuild) {
            codenameModel
                .findByIdAndDelete(document._id)
                .exec();
            deleted = RemoveWordResult.Success;
        } else if (document.creator.userId === remover.id){
            codenameModel
                .findByIdAndDelete(document._id)
                .exec();
            deleted = RemoveWordResult.Success;
        }
    }

    return deleted;
}

export async function addWord(botUser: BotUserDoc, creator: DiscordUserDoc, word: string): Promise<CodenamePopulated | undefined> {
    debug(`Adding codename word ${word} for bot user ${botUser.name}`);

    const word_lower = word.toLowerCase();
    const existing = await codenameModel
        .findOne({ user: botUser._id, word_lower })
        .exec() as CodenameDoc | null;
    if (existing) {
        return undefined;
    }
    return await codenameModel.create({ user: botUser, creator, word, word_lower }) as CodenamePopulated;
}

export default codenameModel;
