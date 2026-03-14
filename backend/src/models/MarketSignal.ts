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
    sector: {
        type: String,
        enum: [
            'Banking', 'Development Bank', 'Finance', 'Hotels & Tourism',
            'Hydropower', 'Investment', 'Life Insurance', 'Manufacturing & Processing',
            'Microfinance', 'Mutual Fund', 'Non Life Insurance', 'Others', 'Trading', 'Market-wide'
        ],
        required: true
    },
    sentimentScore: { type: Number, required: true },
    impactWeight: { type: Number, required: true },
    publishedAt: { type: Date },
    sectorConfidence: { type: Number },
    reasoning: { type: String },
    tickers: [{ type: String }],
    companies: [{ type: String }],
    clusterKey: { type: String },
    modelUsed: { type: String }
});

const MarketSignalSchema = new Schema({
    timestamp: { type: Date, default: Date.now, index: true },
    overallScore: { type: Number, required: true },
    nepseIndexAtTime: { type: Number, required: true },
    articles: [ArticleSchema],
    summary: { type: String, required: true },
    confidence: { type: Number }
});

export interface MarketSignalDocument extends MarketSignal, Document {
    _id: any;
}

export const MarketSignalModel = mongoose.model<MarketSignalDocument>('MarketSignal', MarketSignalSchema);
