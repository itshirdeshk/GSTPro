'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bot, 
  Send, 
  X, 
  MinusCircle, 
  MessageSquare, 
  Loader2, 
  Sparkles,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiPost } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatbotProps {
  analyticsData: any;
}

const SUGGESTED_PROMPTS = [
  "What is my best performing platform?",
  "Analyze my recent discrepancies.",
  "What's my total gross sales this month?",
  "Any tips for growth optimization?",
];

function FormattedMessage({ content }: { content: string }) {
  // Simple markdown parsing for bold and bullet points
  const lines = content.split('\n');
  
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        let processedLine = line.trim();
        
        // Handle bullet points
        const isBullet = processedLine.startsWith('* ') || processedLine.startsWith('- ');
        if (isBullet) {
          processedLine = processedLine.substring(2);
        }

        // Handle bold text (**text**)
        const parts = processedLine.split(/(\*\*.*?\*\*)/g);
        const renderedLine = parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-bold text-white">{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={i} className="flex gap-2 items-start pl-1">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              <span>{renderedLine}</span>
            </div>
          );
        }

        return <p key={i}>{renderedLine}</p>;
      })}
    </div>
  );
}

export function AIChatbot({ analyticsData }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hello! I am your **Sales Suite AI**. Choose a topic below or ask me a question about your analytics.' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await apiPost<any>('/ai/chat', {
        prompt: textToSend,
        analyticsData: analyticsData
      });

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: res.response || "I couldn't generate a response. Please try again." 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I'm having trouble connecting to the AI service right now." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent text-white shadow-lg hover:bg-accent2 transition-all duration-300 flex items-center justify-center group animate-in fade-in slide-in-from-bottom-4"
      >
        <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green rounded-full border-2 border-white animate-pulse" />
      </button>
    );
  }

  return (
    <div 
      className={cn(
        "fixed bottom-6 right-6 w-[400px] bg-bg2 border border-border rounded-2xl shadow-2xl transition-all duration-300 flex flex-col z-50 overflow-hidden",
        isMinimized ? "h-14" : "h-[600px]"
      )}
    >
      {/* Header */}
      <div className="bg-surface px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-heading">AI Insights Assistant</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
              <span className="text-[10px] text-text3 font-medium">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-surface2 rounded-md text-text3 hover:text-text transition-colors"
          >
            <MinusCircle className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-red/10 rounded-md text-text3 hover:text-red transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
          >
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex gap-3 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === 'user' ? "bg-accent/10" : "bg-surface"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-accent" /> : <Bot className="w-4 h-4 text-text2" />}
                </div>
                <div className={cn(
                  "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                  msg.role === 'user' 
                    ? "bg-accent text-white rounded-tr-none" 
                    : "bg-surface border border-border text-text rounded-tl-none"
                )}>
                  <FormattedMessage content={msg.content} />
                </div>
              </div>
            ))}

            {messages.length === 1 && !isLoading && (
              <div className="flex flex-wrap gap-2 ml-11 pr-4 animate-in fade-in slide-in-from-left-4 duration-500">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text2 hover:bg-surface2 hover:border-accent/50 hover:text-accent transition-all text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="flex gap-3 mr-auto max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-text2" />
                </div>
                <div className="bg-surface border border-border px-4 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  <span className="text-xs text-text3">Analyzing data...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-surface/30">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your sales performance..."
                className="w-full bg-surface border border-border rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent2 disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-text3 mt-2 text-center">
              AI can make mistakes. Please verify important financial data.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
