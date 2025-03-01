import React, { useState } from 'react';
import { Button } from './button';
import { Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils";

interface InsightsButtonProps {
  summary: string | null;
  className?: string;
}

export const InsightsButton: React.FC<InsightsButtonProps> = ({ 
  summary, 
  className = ''
}) => {
  const [open, setOpen] = useState(false);
  
  if (!summary) return null;
  
  return (
    <>
      <Button
        variant="simple"
        size="sm"
        className={cn(
          "gap-2 font-medium",
          // Override the text colors with !important to ensure gradient works in both modes
          "!text-transparent !dark:text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-[#818cf8] to-[#c084fc]",
          "hover:opacity-80",
          className
        )}
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-4 w-4 text-[#818cf8]" />
        AI Insights
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent 
          onOpenAutoFocus={(e) => {
            // Prevent the default autofocus behavior
            e.preventDefault();
          }}
          className={cn(
            // Responsive width with margins on different screen sizes
            "w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] md:w-[calc(100%-6rem)] lg:w-[calc(100%-10rem)]",
            // Set max-height instead of fixed height to allow content to determine size
            "max-h-[85vh]",
            "max-w-3xl",
            // Keep the same styling for the rest of the properties
            "flex flex-col"
          )}
        >
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2">
              <span className="!text-transparent !dark:text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-[#818cf8] to-[#c084fc] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#818cf8]" />
                AI Insights
              </span>
            </DialogTitle>
            <DialogDescription className="text-left">
              Conversation notes
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 rounded-md whitespace-pre-wrap overflow-y-auto">
            {summary}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}; 