
import React, { useState, useEffect } from 'react';
import ApiKeyRequired from './components/ApiKeyRequired';
import VideoStudio from './components/VideoStudio';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      try {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } catch (err) {
        setHasKey(false);
      }
    };
    checkKey();
  }, []);

  const handleKeySelected = () => {
    setHasKey(true);
  };

  const handleKeyReset = () => {
    setHasKey(false);
  };

  if (hasKey === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return hasKey ? (
    <VideoStudio onKeyReset={handleKeyReset} />
  ) : (
    <ApiKeyRequired onKeySelected={handleKeySelected} />
  );
};

export default App;
