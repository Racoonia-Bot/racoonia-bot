import { Document, Model, Schema, model } from 'mongoose';
import { BotUserDoc } from './botUser';

export interface FollowMenuDoc extends Document {
    targets: BotUserDoc['_id'][];
    extendedSearch: boolean;

    createdAt: Date;
    updatedAt: Date;
}

export interface FollowMenuPopulated extends FollowMenuDoc {
    targets: BotUserDoc[];
}

interface FollowMenuModel extends Model<FollowMenuDoc> { }

const followMenuSchema = new Schema<FollowMenuDoc, FollowMenuModel>({
    targets: { type: [{ type: Schema.Types.ObjectId, ref: 'BotUsers' }], required: true, default: [] },
    extendedSearch: { type: Boolean, required: true },
}, { timestamps: true });

const followMenuModel = model<FollowMenuDoc, FollowMenuModel>('FollowMenus', followMenuSchema);

export default followMenuModel;
