import { Product } from "../types";

export const getProductRecommendations = async (apiKey: string, query: string, products: Product[]) => {
    // Basic mock implementation for now to unblock build
    return {
        recommendationText: `Based on your query "${query}", I recommend these products.`,
        recommendedIds: products.slice(0, 3).map(p => p.id)
    };
};

export const searchProductsByImage = async (apiKey: string, imageFile: File, products: Product[]) => {
    // Basic mock implementation for now to unblock build
    return products.slice(0, 2).map(p => p.id);
};
