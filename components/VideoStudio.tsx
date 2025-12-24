
import React, { useState, useRef } from 'react';
import { 
  Wand2, Sparkles, Film, Clock, Download, 
  Trash2, Info, AlertCircle, RefreshCw,
  Monitor, Smartphone, Image as ImageIcon, X, Upload, ExternalLink
} from 'lucide-react';
import { generateVeoVideo, getOperationStatus, fetchVideoBlobUrl, ImagePayload } from '../services/geminiService';
import { GeneratedVideo, Resolution, AspectRatio } from '../types';

interface Props {
  onKeyReset: () => void;
}

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

  const parseErrorMessage = (err: any): string => {
    let msg = err.message || String(err);
    const jsonMatch = msg.match(/\{.*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.error?.message) return parsed.error.message;
        if (parsed.message) return parsed.message;
      } catch (e) {}
    }
    return msg;
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
        const stages = [
          'Analyzing source details...',
          'Calculating motion vectors...',
          'Rendering physics and light...',
          'Refining temporal consistency...',
          'Applying final cinematic grade...'
        ];
        setStatusMessage(stages[Math.floor(Math.random() * stages.length)]);
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await getOperationStatus(operation);
      }

      if (operation.error) {
        const opErrorMsg = operation.error.message || "Generation failed";
        if (opErrorMsg.includes("Requested entity was not found")) {
          throw new Error("API_KEY_RESET_REQUIRED");
        }
        throw new Error(opErrorMsg);
      }

      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (videoUri) {
        setStatusMessage('Finalizing download link...');
        const blobUrl = await fetchVideoBlobUrl(videoUri);
        
        const newVideo: GeneratedVideo = {
          id: Date.now().toString(),
          url: blobUrl,
          prompt: prompt || 'Image-to-Video Animation',
          resolution,
          aspectRatio,
          createdAt: Date.now()
        };
        
        setHistory(prev => [newVideo, ...prev]);
        setPrompt('');
        clearImage();
      } else {
        throw new Error("Generation completed but no video content was returned.");
      }
    } catch (err: any) {
      const cleanMsg = parseErrorMessage(err);
      if (err.message === "API_KEY_RESET_REQUIRED" || cleanMsg.includes("Requested entity was not found")) {
        onKeyReset();
        return;
      } 
      const isQuotaError = cleanMsg.includes("RESOURCE_EXHAUSTED") || cleanMsg.includes("429") || cleanMsg.toLowerCase().includes("quota");
      setError({ message: cleanMsg, isQuota: isQuotaError });
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
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Film className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Veo Studio Pro</h1>
          </div>
          <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-full uppercase tracking-widest font-bold">
            v3.1 Preview
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 space-y-6 backdrop-blur-sm">
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                <ImageIcon size={14} className="text-blue-400" />
                Source Image
              </label>
              {!selectedImage ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-slate-300 hover:border-blue-500/50 transition-all cursor-pointer group bg-slate-950/50"
                >
                  <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Click to upload reference frame</span>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageSelect} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              ) : (
                <div className="relative w-full h-48 rounded-2xl overflow-hidden group border border-slate-700 shadow-xl">
                  <img src={selectedImage.preview} className="w-full h-full object-cover" alt="Preview" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button 
                      onClick={clearImage}
                      className="p-3 bg-red-600/90 text-white rounded-xl hover:bg-red-500 transition-all shadow-lg backdrop-blur-sm active:scale-95"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                <Wand2 size={14} className="text-blue-400" />
                Motion Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={selectedImage ? "Describe how this scene should animate..." : "Describe a cinematic scene..."}
                disabled={isGenerating}
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none shadow-inner"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resolution</label>
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {(['720p', '1080p'] as Resolution[]).map((res) => (
                    <button
                      key={res}
                      onClick={() => setResolution(res)}
                      disabled={isGenerating}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        resolution === res ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aspect Ratio</label>
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {(['16:9', '9:16'] as AspectRatio[]).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      disabled={isGenerating}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                        aspectRatio === ratio ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {ratio === '16:9' ? <Monitor size={10} /> : <Smartphone size={10} />}
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className={`p-4 rounded-2xl border flex flex-col gap-3 text-sm transition-all ${error.isQuota ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-bold">{error.isQuota ? 'Quota Exceeded' : 'System Error'}</p>
                    <p className="opacity-90 leading-relaxed">{error.message}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={startGeneration}
              disabled={isGenerating || (!prompt.trim() && !selectedImage)}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-950/20 active:scale-[0.98] ${
                isGenerating 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                  Processing Reel...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {selectedImage ? 'Animate Frame' : 'Generate Clip'}
                </>
              )}
            </button>

            {isGenerating && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-blue-400">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest animate-pulse">{statusMessage}</span>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 animate-progress origin-left rounded-full"></div>
                </div>
              </div>
            )}
          </section>

          <section className="bg-slate-900/30 rounded-3xl border border-slate-800/50 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-slate-300">Studio Insights</h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed italic">
              "For superior temporal coherence in Veo 3.1, specify camera movement in your prompt. A 'Slow panning shot' or 'Dynamic tracking' often yields smoother motion than generic descriptions."
            </p>
          </section>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" />
              Studio Gallery
            </h2>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{history.length} Clips Saved</span>
          </div>

          {history.length === 0 && !isGenerating ? (
            <div className="h-[450px] border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-600 gap-6 bg-slate-950/50">
              <div className="p-6 bg-slate-900 rounded-3xl shadow-inner">
                <ImageIcon size={64} className="opacity-10" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-slate-500">No cinematic clips found</p>
                <p className="text-xs opacity-50">Your AI-generated gallery will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 pb-12">
              {history.map((video) => (
                <article key={video.id} className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl hover:border-slate-700 transition-colors group">
                  <div className={`relative bg-black flex items-center justify-center overflow-hidden transition-all duration-500 ${video.aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[650px] mx-auto' : 'aspect-video'}`}>
                    <video 
                      src={video.url} 
                      controls 
                      autoPlay
                      loop
                      muted
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <p className="text-sm text-slate-200 font-medium leading-relaxed italic">"{video.prompt}"</p>
                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-md border border-slate-700/50">
                            <Monitor size={12} /> {video.resolution}
                          </span>
                          <span className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-md border border-slate-700/50">
                            {video.aspectRatio === '16:9' ? 'LANDSCAPE' : 'PORTRAIT'}
                          </span>
                          <span className="opacity-50">{new Date(video.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a 
                          href={video.url} 
                          download={`veo-studio-${video.id}.mp4`}
                          className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all active:scale-90 border border-slate-700/50"
                          title="Download Clip"
                        >
                          <Download size={18} />
                        </a>
                        <button 
                          onClick={() => removeVideo(video.id)}
                          className="p-3 bg-slate-800 hover:bg-red-900/30 hover:text-red-400 text-slate-300 rounded-xl transition-all active:scale-90 border border-slate-700/50"
                          title="Delete"
                        >
                          <Trash2 size={18} />
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
          100% { transform: scaleX(0.98); }
        }
        .animate-progress {
          animation: progress 90s cubic-bezier(0.1, 0, 0, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default VideoStudio;
