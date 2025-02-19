import { Document, Model, Schema, model } from 'mongoose';
import { BotUserDoc } from './botUser';

type ApiPermission = {
    permission: string;
    environment?: BotUserDoc;
}

export interface ApiUserDoc extends Document {
    token: string;
    permissions: ApiPermission[];
}

interface ApiUserModel extends Model<ApiUserDoc> { }

const apiUserSchema = new Schema<ApiUserDoc, ApiUserModel>({
    token: { type: String, required: true, unique: true },
    permissions: { type: [Object], required: true},
});

const apiUserModel = model<ApiUserDoc, ApiUserModel>('ApiUsers', apiUserSchema);

export default apiUserModel;
