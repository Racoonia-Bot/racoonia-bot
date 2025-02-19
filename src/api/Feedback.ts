import { Request, Response } from "express";
import { ObjectId } from "mongoose";
import feedbackModel, { FeedbackDoc, FeedbackPopulated, FeedbackStatus, setFeedbackStatus } from "../models/feedback";

export async function listFeedback(req: Request<{}>, res: Response) {
    const feedbackDocs = await feedbackModel.find() as FeedbackDoc[];
    const feedbackList = feedbackDocs.map((feedback) => {
        const id = feedback._id as ObjectId;
        return id.toString();
    });
    res.status(200).json(feedbackList);
}

export async function getFeedback(req: Request<{id: string}>, res: Response) {
    const feedbackDoc = await feedbackModel.findById(req.params.id).populate("creator") as FeedbackPopulated | null;
    if (!feedbackDoc) return;
    res.status(200).json({
        creator: feedbackDoc.creator.name,
        type: feedbackDoc.type,
        description: feedbackDoc.description,
        status: feedbackDoc.status,
    });
}

export async function deleteFeedback(req: Request<{id: string}>, res: Response) {
    res.status(501).send("Not implemented");
}

export async function updateFeedbackStatus(req: Request<{id: string}>, res: Response) {
    setFeedbackStatus(req.params.id, req.body.status as FeedbackStatus);
}
