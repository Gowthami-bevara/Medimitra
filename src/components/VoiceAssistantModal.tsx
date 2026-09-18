import React from 'react';
import { useApp } from '../context/AppContext';
import { FullScreenAiChat } from './FullScreenAiChat';

export const VoiceAssistantModal: React.FC = () => {
  const { isVoiceAssistantOpen } = useApp();

  if (!isVoiceAssistantOpen) return null;

  return <FullScreenAiChat />;
};
