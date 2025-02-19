import { Request, Response } from "express";
import { getStatistics } from "../models/statistic";

export async function getStatistic(req: Request<{}, any, {}, {key: string, global: string, from: string, to: string}>, res: Response) {
    const key = req.query.key;
    const global = req.query.global === 'true';
    const from = req.query.from ? new Date(req.query.from) : undefined;
    const to = req.query.to ? new Date(req.query.to) : undefined;

    const statDocs = await getStatistics({ key, global, from, to });
    const publicData = statDocs.map((stat) => {
        return {
            global: stat.global,
            key: stat.key,
            user: stat.user,
            createdAt: stat.createdAt,
        };
    });

    res.status(200).json(publicData);
}
