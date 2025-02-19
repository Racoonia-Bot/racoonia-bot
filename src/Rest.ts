import express from 'express';
import cors from 'cors';
import { deleteFeedback, getFeedback, listFeedback, updateFeedbackStatus } from './api/Feedback';
import { getStatistic } from './api/Stats';
import { success } from './Log';
import { Server } from 'http';
import { getConfig } from './Config';

// * Setup

const app = express();
app.use(express.json());
app.use(cors());

// * Routes

// Feedback
app.get('/feedback', listFeedback);
app.get('/feedback/:id', getFeedback);
app.delete('/feedback/:id', deleteFeedback);
app.post('/feedback/:id/status', updateFeedbackStatus);

// Stats
app.get('/stats', getStatistic);

// * Start

export function setupRestApi(): Server {
    return app.listen(getConfig().api_port, () => {
        success(`API listening on port ${getConfig().api_port}`);
    });
}
