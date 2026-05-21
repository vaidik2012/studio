
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EMOTES } from '@/lib/game/constants';
import { Smile } from 'lucide-react';

interface EmoteWheelProps {
  onSelect: (emoteId: string) => void;
  onClose: () => void;
}

export function EmoteWheel({ onSelect, onClose }: EmoteWheelProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      // Logic for selecting based on mouse position could go here, 
      // but we'll stick to a simple click-based selection or release
      if (e.key.toLowerCase() === 't') {
        // If nothing hovered, just close
        onClose();
      }
    };
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto bg-background/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative w-96 h-96 flex items-center justify-center">
        {/* Center Indicator */}
        <div className="absolute w-20 h-20 bg-primary/20 border-4 border-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,163,255,0.4)]">
          <Smile className="text-white w-10 h-10" />
        </div>

        {EMOTES.map((emote, i) => {
          const angle = (i / EMOTES.length) * Math.PI * 2;
          const radius = 140;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <motion.button
              key={emote.id}
              whileHover={{ scale: 1.2, zIndex: 10 }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(emote.id);
              }}
              className={`absolute w-24 h-24 p-2 rounded-2xl flex flex-col items-center justify-center transition-all border-2 
                ${hoveredIndex === i ? 'bg-primary border-white text-white shadow-xl' : 'bg-background/80 border-white/10 text-muted-foreground'}`}
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="text-[10px] font-black italic uppercase text-center leading-tight">
                {emote.name}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
