import { Document, Model, Schema, model } from 'mongoose';
import { DiscordUserDoc } from './discordUser';
import { debug } from '../Log';

export type FeedbackType = 'bug' | 'suggestion' | 'other';

export enum FeedbackStatus {
    OPEN = 'open',
    SOLVED = 'solved',
    IN_PROGRESS = 'in_progress',
    REJECTED = 'rejected',
    DUPLICATE = 'duplicate'
}

export interface FeedbackDoc extends Document {
    creator: DiscordUserDoc['_id'];
    type: FeedbackType;
    description: string;
    status: `${FeedbackStatus}`;
}

export interface FeedbackPopulated extends FeedbackDoc {
    creator: DiscordUserDoc;
}

interface FeedbackModel extends Model<FeedbackDoc> { }

const feedbackSchema = new Schema<FeedbackDoc, FeedbackModel>({
    creator: { type: Schema.Types.ObjectId, ref: 'DiscordUsers', required: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, required: true, default: 'open' },
});

const feedbackModel = model<FeedbackDoc, FeedbackModel>('Feedback', feedbackSchema);

export async function createFeedback(creator: DiscordUserDoc, type: FeedbackType, description: string): Promise<FeedbackPopulated> {
    debug(`Creating ${type} feedback`);

    return await feedbackModel.create({ creator, type, description }) as FeedbackPopulated;
}

export async function setFeedbackStatus(id: string, status: FeedbackStatus): Promise<void> {
    debug(`Updating feedback status to ${status}`);

    // TODO: Check if the status is valid

    const document = await feedbackModel.findByIdAndUpdate(id, { status });

    // TODO: Notify the creator of the feedback about the status change
}

export default feedbackModel;
