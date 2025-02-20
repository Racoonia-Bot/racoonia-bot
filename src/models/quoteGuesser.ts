import { Document, Model, Schema, model } from 'mongoose';
import { generateToken, onlyUnique } from '../Essentials';
import quoteModel, { QuoteDoc, QuotePopulated } from './quote';
import { debug } from '../Log';
import { DiscordUserDoc } from './discordUser';
import { BotUserDoc, getAccessableConnections } from './botUser';

export interface QuoteGuesserDoc extends Document {
    token: string;
    usedQuotes: QuoteDoc["_id"][];
    currentQuote: QuoteDoc["_id"];
    scores: Map<string, number>;
    answers: Map<string, string>;
    choices: string[];
    correctAuthor: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface QuoteGuesserPopulated extends QuoteGuesserDoc {
    usedQuotes: QuoteDoc[];
    currentQuote: QuoteDoc;
}

export interface QuoteGuesserPopulatedCurrentQuote extends QuoteGuesserDoc {
    currentQuote: QuoteDoc;
}

interface QuoteGuesserModel extends Model<QuoteGuesserDoc> { }

const quoteGuesserSchema = new Schema<QuoteGuesserDoc, QuoteGuesserModel>({
    token: { type: String, required: true },
    usedQuotes: [{ type: Schema.Types.ObjectId, ref: 'Quotes', required: true }],
    currentQuote: { type: Schema.Types.ObjectId, ref: 'Quotes', required: true },
    scores: { type: Map, of: Number, required: true },
    answers: { type: Map, of: String, required: true },
    choices: { type: [String], required: true },
    correctAuthor: { type: String, required: true }
}, { timestamps: true});

const quoteGuesserModel = model<QuoteGuesserDoc, QuoteGuesserModel>('QuoteGuesser', quoteGuesserSchema);

export async function createQuoteGuesserGame(firstQuote: QuoteDoc, choices: string[], correctAuthor: string): Promise<QuoteGuesserPopulated> {
    debug("Creating quote guesser game")

    const token = generateToken();
    return quoteGuesserModel.create({ token, usedQuotes: [firstQuote], currentQuote: firstQuote, scores: {}, answers: {}, choices, correctAuthor }) as Promise<QuoteGuesserPopulated>;
}

export async function randomQuote(botUser: BotUserDoc, exclude: QuoteDoc['_id'][] = []): Promise<[QuoteDoc?, string[]?, string?]> {
    debug(`Getting random quote for bot user ${botUser.id}`);

    const targets = await getAccessableConnections(botUser);

    const query = { _id: { $nin: exclude }, user: { $in: targets }, isConversation: false,  };
    const documentCount = await quoteModel
        .countDocuments(query)
        .exec();
    const randomIndex = Math.floor(Math.random() * documentCount);
    const quote = await quoteModel
        .findOne(query)
        .skip(randomIndex)
        .populate('user')
        .populate('creator')
        .populate('authors')
        .exec() as QuotePopulated | null;

    if (!quote) return [];

    const correctAuthor = quote.authors[0].name;

    const authorCollections = await quoteModel
        .find({ user: { $in: targets } })
        .populate('authors')
        .select('authors')
        .exec();
    let authors = [];
    for (const collection of authorCollections) {
        for (const author of collection.authors as DiscordUserDoc[]) {
            if (author.name === correctAuthor) continue;
            authors.push(author.name);
        }
    }
    authors = authors.filter(onlyUnique);

    return [quote, authors, correctAuthor];
}

export default quoteGuesserModel;
