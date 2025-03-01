import React, { useState } from 'react';
import { Button } from './button';
import { Share, Trash, Sparkles } from 'lucide-react';
import { useConversation } from '@/context/ConversationContext';
import { InsightsButton } from './insights-button';

export interface ConversationHeaderProps {
  title: string;
  onShareClick?: () => void;
  onDeleteClick?: () => void;
  showControls?: boolean;
  className?: string;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  title,
  onShareClick,
  onDeleteClick,
  showControls = true,
  className = '',
}) => {
  const { currentConversation } = useConversation();
  
  return (
    <div className={`flex items-center justify-between p-4 ${className}`}>
      <h1 className="text-lg font-semibold truncate">{title}</h1>
      
      {showControls && (
        <div className="flex gap-2">
          {currentConversation?.summary && (
            <InsightsButton summary={currentConversation.summary} />
          )}
          {onShareClick && (
            <Button variant="outline" size="icon" onClick={onShareClick}>
              <Share className="h-4 w-4" />
            </Button>
          )}
          {onDeleteClick && (
            <Button variant="outline" size="icon" onClick={onDeleteClick}>
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}; 