
import React from 'react';
import { ShieldCheck, ExternalLink, Key } from 'lucide-react';

interface Props {
  onKeySelected: () => void;
}

const ApiKeyRequired: React.FC<Props> = ({ onKeySelected }) => {
  const handleSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      // Assume success as per instructions to avoid race conditions
      onKeySelected();
    } catch (err) {
      console.error("Failed to open key selection:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="max-w-md w-full space-y-8 bg-slate-900/50 p-8 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl text-center">
        <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
          <Key className="w-8 h-8 text-blue-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">Setup Required</h1>
        <p className="text-slate-400 mb-8">
          To use the high-performance Veo 3.1 video generation models, you must select an API key from a paid Google Cloud project.
        </p>

        <div className="space-y-4">
          <button
            onClick={handleSelectKey}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-blue-900/20"
          >
            <ShieldCheck className="w-5 h-5" />
            Select API Key
          </button>
          
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-400 transition-colors"
          >
            Learn more about billing
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyRequired;
