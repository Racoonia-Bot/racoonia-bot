import { Document, Model, Schema, model } from 'mongoose';
import { BotUserDoc } from './botUser';
import { debug } from '../Log';
import _ from 'lodash';

export type StatisticFilter = {
    global?: boolean;
    userId?: string;
    from?: Date;
    to?: Date;
    key?: string;
}

export interface StatisticDoc extends Document {
    global: boolean;
    key: string;
    user?: BotUserDoc['_id'];

    createdAt: Date;
    updatedAt: Date;
}

interface StatisticModel extends Model<StatisticDoc> { }

const statisticSchema = new Schema<StatisticDoc, StatisticModel>({
    global: { type: Boolean, required: true },
    key: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'BotUser' },
}, { timestamps: true });

const statisticModel = model<StatisticDoc, StatisticModel>('Statistics', statisticSchema);

export async function getStatistics(filter?: StatisticFilter): Promise<StatisticDoc[]> {
    debug("Getting statistics")

    const query: {
        global?: boolean;
        user?: BotUserDoc['_id'];
        createdAt?: {
            $gte?: Date;
            $lte?: Date;
        };
        key?: RegExp;
    } = { };

    if (filter?.global !== undefined) {
        query['global'] = filter.global;
    }
    if (filter?.userId !== undefined) {
        query['user'] = filter.userId;
    }
    if (filter?.from !== undefined || filter?.to !== undefined) {
        query['createdAt'] = { };
        if (filter?.from !== undefined) {
            query['createdAt']['$gte'] = filter.from;
        }
        if (filter?.to !== undefined) {
            query['createdAt']['$lte'] = filter.to;
        }
    }
    if (filter?.key !== undefined) {
        const safeKey = _.escapeRegExp(filter.key);
        query['key'] = new RegExp("^" + safeKey);
    }
    if (filter?.userId !== undefined) {
        query['user'] = filter.userId;
    }

    return await statisticModel
        .find(query)
        .exec() as StatisticDoc[];
}

export async function getGlobalStatistics(filter?: StatisticFilter) {
    debug("Getting global statistics")

    return await getStatistics({ ...filter, global: true });
}

export async function getUserStatistics(user: string, filter?: StatisticFilter) {
    debug("Getting user statistics")

    return await getStatistics({ ...filter, userId: user });
}

export default statisticModel;
