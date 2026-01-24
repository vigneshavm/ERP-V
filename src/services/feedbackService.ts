import { CustomerFeedback, FeedbackConfig } from "../types/tenant";

export const FeedbackService = {
    /**
     * Calculates NPS category based on 0-10 rating
     */
    getNPSCategory: (rating: number): 'PROMOTER' | 'PASSIVE' | 'DETRACTOR' => {
        if (rating >= 9) return 'PROMOTER';
        if (rating >= 7) return 'PASSIVE';
        return 'DETRACTOR';
    },

    /**
     * AI-driven sentiment analysis (Mock implementation)
     */
    analyzeSentiment: async (comment: string): Promise<CustomerFeedback['sentiment']> => {
        const lowerComment = comment.toLowerCase();

        // Tags identification
        const tags: ('STAFF' | 'PRICING' | 'QUALITY' | 'DELAY' | 'CLEANLINESS')[] = [];
        if (lowerComment.includes('staff') || lowerComment.includes('behavior')) tags.push('STAFF');
        if (lowerComment.includes('price') || lowerComment.includes('expensive')) tags.push('PRICING');
        if (lowerComment.includes('quality') || lowerComment.includes('material')) tags.push('QUALITY');
        if (lowerComment.includes('delay') || lowerComment.includes('slow')) tags.push('DELAY');
        if (lowerComment.includes('clean') || lowerComment.includes('messy')) tags.push('CLEANLINESS');

        // Score logic
        let score = 0;
        if (lowerComment.includes('good') || lowerComment.includes('great') || lowerComment.includes('excellent')) score = 0.8;
        if (lowerComment.includes('bad') || lowerComment.includes('worst') || lowerComment.includes('angry')) score = -0.9;

        return {
            score,
            label: score > 0 ? 'POSITIVE' : score < 0 ? 'NEGATIVE' : 'NEUTRAL',
            tags
        };
    },

    /**
     * Checks for escalation triggers
     */
    checkEscalation: (feedback: CustomerFeedback, config: FeedbackConfig): boolean => {
        if (!config.isEnabled) return false;

        // Trigger on low rating
        if (feedback.rating <= config.autoEscalation.minRating) return true;

        // Trigger on dangerous keywords
        const comment = feedback.comment?.toLowerCase() || '';
        if (config.autoEscalation.keywords.some(k => comment.includes(k.toLowerCase()))) return true;

        // Trigger on negative sentiment
        if (feedback.sentiment.label === 'NEGATIVE' && feedback.sentiment.score < -0.5) return true;

        return false;
    },

    /**
     * Utility to calculate NPS score for a collection of feedback
     */
    calculateNPSScore: (feedbacks: CustomerFeedback[]): number => {
        if (feedbacks.length === 0) return 0;
        const total = feedbacks.length;
        const promoters = feedbacks.filter(f => f.npsCategory === 'PROMOTER').length;
        const detractors = feedbacks.filter(f => f.npsCategory === 'DETRACTOR').length;

        return Math.round(((promoters - detractors) / total) * 100);
    },

    /**
     * Logic for promoters: Prompt for Google Review
     */
    shouldAskForGoogleReview: (feedback: CustomerFeedback, config: FeedbackConfig): boolean => {
        return (
            config.reputationManagement.askGoogleReview &&
            feedback.rating >= config.reputationManagement.promoterThreshold
        );
    }
};
