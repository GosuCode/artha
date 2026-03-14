import mongoose, { Schema, Document } from 'mongoose';
import type { MarketSignal } from '../types.js';

const ArticleSchema = new Schema({
    headline: { type: String, required: true },
    source: { type: String, required: true },
    url: { type: String, required: true },
    content: { type: String, required: true },
    category: {
        type: String,
        enum: ['Policy', 'Dividend', 'Macro', 'General'],
        required: true
    },
    sentimentScore: { type: Number, required: true },
    impactWeight: { type: Number, required: true },
    publishedAt: { type: Date }
});

const MarketSignalSchema = new Schema({
    timestamp: { type: Date, default: Date.now, index: true },
    overallScore: { type: Number, required: true },
    nepseIndexAtTime: { type: Number, required: true },
    articles: [ArticleSchema],
    summary: { type: String, required: true }
});

export interface MarketSignalDocument extends MarketSignal, Document {
    _id: any;
}

export const MarketSignalModel = mongoose.model<MarketSignalDocument>('MarketSignal', MarketSignalSchema);
