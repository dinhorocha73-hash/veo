export type Resolution = '720p' | '1080p';
export type AspectRatio = '16:9' | '9:16';

export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  createdAt: number;
}

export interface VideoOperationStatus {
  done: boolean;
  progress?: number;
  error?: string;
  videoUri?: string;
}

/**
 * Define AIStudio and Window extensions in the global scope to ensure they merge 
 * correctly with the environment's pre-configured objects and avoid type mismatch errors.
 */
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Remove readonly to ensure the declaration matches the pre-configured global interface
    aistudio: AIStudio;
  }
}