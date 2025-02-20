import { Document, Model, Schema, model } from 'mongoose';
import { BotUserDoc, getAccessableConnections } from './botUser';
import { DiscordUserDoc, RawDiscordUser, getDiscordUserData, getOrCreateDiscordUser } from './discordUser';
import { User } from 'discord.js';
import { approximateEqual, generateToken } from '../Essentials';
import { debug } from '../Log';

const QUOTE_DATE_RANGE = 259200000; // 3 days in milliseconds

type QuoteQuery = {
    user: BotUserDoc['_id'];
    creator?: DiscordUserDoc['_id'];
    authors?: DiscordUserDoc['_id'];
}

export interface QuoteDoc extends Document {
    token: string;
    user: BotUserDoc['_id'];
    creator: DiscordUserDoc['_id'];
    isConversation: boolean;
    statements: string[];
    authors: DiscordUserDoc['_id'][];
    context?: string;

    createdAt: Date;
    updatedAt: Date;
}

export interface QuotePopulated extends QuoteDoc {
    user: BotUserDoc;
    creator: DiscordUserDoc;
    authors: DiscordUserDoc[];
}

export interface QuotePopulatedCreatorAuthors extends QuoteDoc {
    creator: DiscordUserDoc;
    authors: DiscordUserDoc[];
}

interface QuoteModel extends Model<QuoteDoc> { }

const quoteSchema = new Schema<QuoteDoc, QuoteModel>({
    token: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'BotUsers', required: true },
    creator: { type: Schema.Types.ObjectId, ref: 'DiscordUsers', required: true },
    statements: { type: [String], required: true },
    isConversation: { type: Boolean, required: true },
    authors: [{ type: Schema.Types.ObjectId, ref: 'DiscordUsers', required: true }],
    context: { type: String, required: false }
}, { timestamps: true });

const quoteModel = model<QuoteDoc, QuoteModel>('Quotes', quoteSchema);

export async function createQuote(botUser: BotUserDoc, creatorUser: User, statements: string[], authors: RawDiscordUser[], context?: string): Promise<QuotePopulated> {
    debug("Creating quote entry")

    const token = generateToken();
    const creatorData = getDiscordUserData(creatorUser);
    const creator = await getOrCreateDiscordUser(creatorData.name, creatorData.type, creatorUser.id);
    const authorDocs: DiscordUserDoc[] = [];
    for (const author of authors) {
        if (typeof author === 'string') {
            const authorUser = await getOrCreateDiscordUser(author, 'non-discord');
            authorDocs.push(authorUser);
        } else {
            const authorData = getDiscordUserData(author);
            const authorUser = await getOrCreateDiscordUser(authorData.name, authorData.type, author.id);
            authorDocs.push(authorUser);
        }
    }
    const isConversation = statements.length > 1;

    return await quoteModel.create({ token, user: botUser, creator, isConversation, statements, authors: authorDocs, context }) as QuotePopulated;
}

export async function getQuotes(botUser: BotUserDoc, content?: string, author?: DiscordUserDoc, context?: string, creator?: DiscordUserDoc, date?: Date, dateRange?: number): Promise<QuotePopulated[]> {
    debug(`Getting quotes for bot user ${botUser.id}`);

    const targets = await getAccessableConnections(botUser);

    let query: QuoteQuery = { user: { $in: targets } };
    if (author) {
        query.authors = author._id;
    }
    if (creator) {
        query.creator = creator._id;
    }

    let quotes = await quoteModel
        .find(query)
        .populate('user')
        .populate("creator")
        .populate("authors")
        .exec() as QuotePopulated[];
    quotes = quotes.filter(quote => {
        if (content !== undefined) {
            let found = false;
            for (const statement of quote.statements) {
                if (statement.includes(content)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }
        if (context !== undefined && quote.context && !quote.context.includes(context)) {
            return false;
        }
        if (date !== undefined && !approximateEqual(quote.createdAt.getTime(), date.getTime(), dateRange ?? QUOTE_DATE_RANGE)){
            return false;
        }
        return true;
    });

    return quotes;
}

export async function getQuoteByToken(botUser: BotUserDoc, token: string): Promise<QuotePopulated | null> {
    debug(`Getting quote ${token} for bot user ${botUser.id}`);

    const document = await quoteModel
        .findOne({ user: botUser._id, token: token })
        .populate('user')
        .populate('creator')
        .populate('authors')
        .exec() as QuotePopulated | null;
    return document;
}

export default quoteModel;
