import api from "./api";
import { ScannedInvoice, Product, getProductRecommendations as sharedGetRecommendations, searchProductsByImage as sharedSearchByImage } from "@repo/shared-kernel";

const apiKey = process.env.API_KEY || "";

export const parseInvoiceWithGemini = async (file: File): Promise<ScannedInvoice> => {
  const formData = new FormData();
  formData.append('invoice', file);

  try {
    const response = await api.post('/api/purchases/extraction/purchase-invoice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      return response.data.data as ScannedInvoice;
    } else {
      throw new Error(response.data.message || "Failed to parse invoice data.");
    }
  } catch (error: any) {
    console.error("Failed to parse Gemini response via backend", error);
    throw new Error(error.response?.data?.message || "Failed to parse invoice data.");
  }
};

export const getProductRecommendations = async (query: string, products: Product[]) => {
  return sharedGetRecommendations(apiKey, query, products);
};

export const searchProductsByImage = async (imageFile: File, products: Product[]) => {
  return sharedSearchByImage(apiKey, imageFile, products);
};
