export interface CustomerFeedback {
    id: string;
    customerId: string;
    branchId: string;
    rating: number; // 0-10
    comment?: string;
    npsCategory: 'PROMOTER' | 'PASSIVE' | 'DETRACTOR';
    sentiment: {
        score: number; // -1 to 1
        label: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
        tags: ('STAFF' | 'PRICING' | 'QUALITY' | 'DELAY' | 'CLEANLINESS')[];
    };
    status: 'NEW' | 'REVIEWED' | 'ESCALATED' | 'RESOLVED';
    isEscalated: boolean;
    createdAt: string;
}

export interface FeedbackConfig {
    isEnabled: boolean;
    autoEscalation: {
        minRating: number; // e.g. 3
        keywords: string[]; // e.g. ['fraud', 'rude']
    };
    reputationManagement: {
        askGoogleReview: boolean;
        promoterThreshold: number; // e.g. 9
    };
}
