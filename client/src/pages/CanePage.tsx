import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { CaneWorkspace } from '../components/CaneChatWidget';

export const CanePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const prompt = searchParams.get('prompt') || '';
  const mode = (searchParams.get('mode') as any) || 'general';

  return (
    <div className="max-w-6xl mx-auto pb-6">
      <CaneWorkspace fullScreen initialPrompt={prompt} initialMode={mode} />
    </div>
  );
};
