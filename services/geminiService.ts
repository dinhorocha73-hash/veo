
import { GoogleGenAI } from "@google/genai";
import { Resolution, AspectRatio } from "../types";

export interface ImagePayload {
  imageBytes: string;
  mimeType: string;
}

export const generateVeoVideo = async (
  prompt: string,
  config: { resolution: Resolution; aspectRatio: AspectRatio },
  image?: ImagePayload
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || 'Animate this image with natural motion',
      image: image ? {
        imageBytes: image.imageBytes,
        mimeType: image.mimeType
      } : undefined,
      config: {
        numberOfVideos: 1,
        resolution: config.resolution,
        aspectRatio: config.aspectRatio
      }
    });

    return operation;
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_RESET_REQUIRED");
    }
    throw error;
  }
};

export const getOperationStatus = async (operation: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return await ai.operations.getVideosOperation({ operation });
};

export const fetchVideoBlobUrl = async (uri: string): Promise<string> => {
  const response = await fetch(`${uri}&key=${process.env.API_KEY}`);
  if (!response.ok) throw new Error("Failed to fetch video content");
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
