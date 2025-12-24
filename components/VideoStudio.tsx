
import React, { useState, useRef, useCallback } from 'react';
import { 
  Wand2, Sparkles, Film, Clock, Download, 
  Trash2, Play, Info, AlertCircle, RefreshCw,
  Monitor, Smartphone, Image as ImageIcon, X, Upload, ExternalLink
} from 'lucide-react';
import { generateVeoVideo, getOperationStatus, fetchVideoBlobUrl, ImagePayload } from '../services/geminiService';
import { GeneratedVideo, Resolution, AspectRatio } from '../types';

interface Props {
  onKeyReset: () => void;
}

const EXAMPLE_PROMPTS = [
  "A majestic dragon flying over a crystalline lake at sunrise",
  "Macro shot of a tiny astronaut exploring a garden of giant mushrooms",
  "Cyberpunk street scene in Neo-Tokyo with flying cars",
  "Slow motion ink drops colliding in water"
];

const VideoStudio: React.FC<Props> = ({ onKeyReset }) => {
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<Resolution>('720p');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [history, setHistory] = useState<GeneratedVideo[]>([]);
  const [error, setError] = useState<{ message: string; isQuota: boolean } | null>(null);
  const [selectedImage, setSelectedImage] = useState<{file: File, preview: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError({ message: 'Please select a valid image file.', isQuota: false });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage({
          file,
          preview: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const startGeneration = async () => {
    if (!prompt.trim() && !selectedImage) {
      setError({ message: "Please provide at least a prompt or an image.", isQuota: false });
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setStatusMessage('Preparing cinematic assets...');
    
    try {
      let imagePayload: ImagePayload | undefined;
      if (selectedImage) {
        const base64Data = await fileToBase64(selectedImage.file);
        imagePayload = {
          imageBytes: base64Data,
          mimeType: selectedImage.file.type
        };
      }

      let operation = await generateVeoVideo(prompt, { resolution, aspectRatio }, imagePayload);
      setStatusMessage('Model is dreaming... this may take a few minutes.');

      while (!operation.done) {
        const stage = Math.random();
        if (stage < 0.2) setStatusMessage('Analyzing source image details...');
        else if (stage < 0.4) setStatusMessage('Interpolating motion vectors...');
        else if (stage < 0.6) setStatusMessage('Rendering physics and light rays...');
        else if (stage < 0.8) setStatusMessage('Refining temporal consistency...');
        else setStatusMessage('Applying final color grading...');

        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await getOperationStatus(operation);
      }

      // Check for server-side errors in the operation itself
      if (operation.error) {
        throw new Error(operation.error.message || "The video generation failed on the server.");
      }

      if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        setStatusMessage('Finalizing download link...');
        const videoUri = operation.response.generatedVideos[0].video.uri;
        const blobUrl = await fetchVideoBlobUrl(videoUri);
        
        const newVideo: GeneratedVideo = {
          id: Date.now().toString(),
          url: blobUrl,
          prompt: prompt || 'Image-to-Video Generation',
          resolution,
          aspectRatio,
          createdAt: Date.now()
        };
        
        setHistory(prev => [newVideo, ...prev]);
        setPrompt('');
        clearImage();
      } else {
        throw new Error("Video generation completed but no video content was returned. This might be a temporary API issue.");
      }
    } catch (err: any) {
      console.error("Studio Generation Error Details:", err);
      
      let rawMsg = err.message || '';
      let cleanMsg = rawMsg;

      // Try to parse JSON errors from the API
      try {
        const parsed = JSON.parse(rawMsg);
        if (parsed.error?.message) cleanMsg = parsed.error.message;
      } catch (e) {}

      const isQuotaError = cleanMsg.includes("RESOURCE_EXHAUSTED") || cleanMsg.includes("429") || cleanMsg.toLowerCase().includes("quota");

      if (rawMsg === "API_KEY_RESET_REQUIRED") {
        setError(null);
        onKeyReset();
        return;
      } 
      
      if (isQuotaError) {
        setError({
          message: "You've exceeded your current API quota. Please check your billing plan or usage limits in the Google AI Studio console.",
          isQuota: true
        });
      } else {
        setError({
          message: cleanMsg || 'An unexpected error occurred during generation.',
          isQuota: false
        });
      }
    } finally {
      setIsGenerating(false);
      setStatusMessage('');
    }
  };

  const removeVideo = (id: string) => {
    setHistory(prev => {
      const video = prev.find(v => v.id === id);
      if (video) URL.revokeObjectURL(video.url);
      return prev.filter(v => v.id !== id);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Film className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Veo Studio</h1>
          </div>
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full uppercase tracking-widest font-bold">
            v3.1 Preview
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400">Reference Image (Image-to-Video)</label>
              {!selectedImage ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-slate-300 hover:border-blue-500/50 transition-all cursor-pointer group"
                >
                  <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Click or drag image to animate</span>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageSelect} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              ) : (
                <div className="relative w-full h-48 rounded-2xl overflow-hidden group border border-slate-700">
                  <img src={selectedImage.preview} className="w-full h-full object-cover" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={clearImage}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-500 transition-colors shadow-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400">Motion Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={selectedImage ? "Describe how to animate the image..." : "Describe a scene from scratch..."}
                disabled={isGenerating}
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quality</label>
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {(['720p', '1080p'] as Resolution[]).map((res) => (
                    <button
                      key={res}
                      onClick={() => setResolution(res)}
                      disabled={isGenerating}
                      className={`flex-1 py-2 text-xs rounded-lg transition-all ${
                        resolution === res ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Canvas</label>
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {(['16:9', '9:16'] as AspectRatio[]).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      disabled={isGenerating}
                      className={`flex-1 py-2 text-xs rounded-lg transition-all flex items-center justify-center gap-1 ${
                        aspectRatio === ratio ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {ratio === '16:9' ? <Monitor size={12} /> : <Smartphone size={12} />}
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className={`border p-4 rounded-xl flex flex-col gap-3 text-sm animate-fade-in ${error.isQuota ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-bold">{error.isQuota ? 'Quota Exceeded' : 'Generation Error'}</p>
                    <p className="opacity-90">{error.message}</p>
                  </div>
                </div>
                {error.isQuota && (
                  <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-orange-500/20">
                    <a 
                      href="https://aistudio.google.com/app/usage" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold hover:underline"
                    >
                      Usage Dashboard <ExternalLink size={12} />
                    </a>
                    <a 
                      href="https://ai.google.dev/gemini-api/docs/billing" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold hover:underline"
                    >
                      Billing Info <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={startGeneration}
              disabled={isGenerating || (!prompt.trim() && !selectedImage)}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl ${
                isGenerating 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/20 active:scale-[0.98]'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                  Generating...
                </>
              ) : (
                <>
                  {selectedImage ? <Sparkles className="w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
                  {selectedImage ? 'Animate Image' : 'Create Video'}
                </>
              )}
            </button>

            {isGenerating && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-blue-400">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span className="text-sm font-medium animate-pulse">{statusMessage}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 animate-progress origin-left"></div>
                </div>
              </div>
            )}
          </section>

          <section className="bg-slate-900/30 rounded-3xl border border-slate-800/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-5 h-5 text-slate-500" />
              <h2 className="font-semibold text-slate-300">Veo 3.1 Pro Tips</h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              For best results with Image-to-Video, use high-resolution source images and describe the specific movement you want (e.g., "gentle sway of trees", "camera zooming slowly into the subject").
            </p>
          </section>
        </div>

        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" />
              Studio Gallery
            </h2>
            <span className="text-sm text-slate-500">{history.length} Clips</span>
          </div>

          {history.length === 0 && !isGenerating ? (
            <div className="h-96 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-600 gap-4">
              <div className="p-4 bg-slate-900 rounded-2xl">
                <ImageIcon size={48} className="opacity-20" />
              </div>
              <p className="text-center px-8">Start your journey.<br/>Upload an image or type a prompt.</p>
            </div>
          ) : (
            <div className="space-y-8 pb-12">
              {history.map((video) => (
                <article key={video.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl group animate-fade-in">
                  <div className={`relative bg-black flex items-center justify-center overflow-hidden ${video.aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[700px] mx-auto' : 'aspect-video'}`}>
                    <video 
                      src={video.url} 
                      controls 
                      autoPlay
                      loop
                      muted
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <p className="text-sm text-slate-300 italic leading-relaxed line-clamp-2">"{video.prompt}"</p>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-tighter pt-2">
                          <span className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded">
                            <Monitor size={10} /> {video.resolution}
                          </span>
                          <span className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded">
                            {video.aspectRatio === '16:9' ? 'LANDSCAPE' : 'PORTRAIT'}
                          </span>
                          <span>{new Date(video.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a 
                          href={video.url} 
                          download={`veo-generation-${video.id}.mp4`}
                          className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all active:scale-95 shadow-lg"
                          title="Download"
                        >
                          <Download size={20} />
                        </a>
                        <button 
                          onClick={() => removeVideo(video.id)}
                          className="p-3 bg-slate-800 hover:bg-red-900/50 hover:text-red-400 text-slate-300 rounded-xl transition-all active:scale-95 shadow-lg"
                          title="Delete"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes progress {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.7); }
          100% { transform: scaleX(0.95); }
        }
        .animate-progress {
          animation: progress 90s cubic-bezier(0.1, 0, 0, 1) forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default VideoStudio;
