
"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EMOTES } from '@/lib/game/constants';
import { Zap, Target, Swords, Users, Trophy } from 'lucide-react';
import { getState } from 'playroomkit';

interface HUDProps {
  health: number;
  maxHealth: number;
  kills: number;
  deaths: number;
  ammo: number;
  maxAmmo: number;
  weaponName: string;
  isDead: boolean;
  onRespawn: () => void;
  emoteId?: string | null;
  abilityCooldown?: number;
}

export function HUD({ health, maxHealth, kills, deaths, ammo, maxAmmo, weaponName, isDead, onRespawn, emoteId, abilityCooldown = 0 }: HUDProps) {
  const [prevKills, setPrevKills] = useState(0);
  const [showKillStreak, setShowKillStreak] = useState(false);
  const [activeEmote, setActiveEmote] = useState<string | null>(null);
  const gameMode = (getState('gameMode') || 'tdm_unranked') as string;

  useEffect(() => {
    if (kills > prevKills && kills > 0) {
      setShowKillStreak(true);
      const timer = setTimeout(() => setShowKillStreak(false), 2000);
      setPrevKills(kills);
      return () => clearTimeout(timer);
    }
    if (deaths > 0) setPrevKills(0);
  }, [kills, deaths, prevKills]);

  useEffect(() => {
    if (emoteId) {
      const emoteName = EMOTES.find(e => e.id === emoteId)?.name || 'EMOTE';
      setActiveEmote(emoteName);
      const timer = setTimeout(() => setActiveEmote(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [emoteId]);

  const getModeIcon = () => {
    if (gameMode.includes('ranked')) return <Trophy className="w-4 h-4 text-primary" />;
    if (gameMode.includes('1v1')) return <Swords className="w-4 h-4 text-secondary" />;
    if (gameMode === 'training') return <Target className="w-4 h-4 text-green-500" />;
    return <Users className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-50">
      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="2" fill="white" />
          <path d="M16 4V10M16 22V28M4 16H10M22 16H28" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Top Center: Game Mode Info */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-background/60 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full shadow-2xl">
         {getModeIcon()}
         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
            {gameMode.replace('_', ' ')}
         </span>
      </div>

      {/* Health & Kill Stats */}
      <div className="absolute top-6 left-6 flex flex-col gap-2">
        <div className="bg-background/80 border-2 border-primary p-4 rounded-xl shadow-lg backdrop-blur-md">
          <div className="text-primary font-bold text-[10px] uppercase tracking-widest mb-1">Health</div>
          <div className="w-64 h-4 bg-muted rounded-full overflow-hidden border border-border">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: '100%' }}
              animate={{ width: `${(health / maxHealth) * 100}%` }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between mt-2 font-black italic text-xl">
            <span className="text-white">{Math.max(0, Math.floor(health))} HP</span>
            <span className="text-secondary">{kills} KILLS</span>
          </div>
        </div>
      </div>

      {/* Weapon & Ability Stats */}
      <div className="absolute bottom-6 right-6 flex items-end gap-4">
        {/* Ability Indicator */}
        <div className="bg-background/80 border-2 border-primary p-4 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-3">
           <div className={`p-2 rounded-lg ${abilityCooldown > 0 ? 'bg-muted text-muted-foreground' : 'bg-primary text-white animate-pulse'}`}>
              <Zap className="w-6 h-6" />
           </div>
           <div className="text-right">
              <div className="text-[10px] font-black text-primary uppercase tracking-widest">Ability [Q]</div>
              <div className="text-xl font-black italic text-white">
                 {abilityCooldown > 0 ? `${(abilityCooldown / 1000).toFixed(1)}s` : 'READY'}
              </div>
           </div>
        </div>

        {/* Ammo & Weapon */}
        <div className="bg-background/80 border-2 border-secondary p-4 rounded-xl shadow-lg backdrop-blur-md text-right">
          <div className="text-secondary font-bold text-[10px] uppercase tracking-widest mb-1">{weaponName}</div>
          <div className="text-5xl font-black italic text-white leading-none">
            {gameMode === 'training' ? '∞' : ammo} <span className="text-xl text-muted-foreground">/ {maxAmmo}</span>
          </div>
        </div>
      </div>

      {/* Emote Notification */}
      <AnimatePresence>
        {activeEmote && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="absolute bottom-40 left-1/2 -translate-x-1/2 bg-white text-black font-black italic px-6 py-2 rounded-xl shadow-xl uppercase text-lg border-2 border-primary"
          >
            {activeEmote}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kill Streak Pop */}
      <AnimatePresence>
        {showKillStreak && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 2, opacity: 0 }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 flex flex-col items-center"
          >
            <div className="bg-destructive text-white font-black italic text-6xl px-8 py-4 rounded-2xl shadow-[0_0_50px_rgba(255,59,48,0.5)] border-4 border-white rotate-[-3deg]">
              {kills}x KILL !!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Death Screen */}
      <AnimatePresence>
        {isDead && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/90 backdrop-blur-xl flex flex-col items-center justify-center pointer-events-auto"
          >
            <motion.h2 className="text-[#00CCFF] font-black italic text-8xl mb-12 uppercase tracking-tighter">Wasted</motion.h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRespawn}
              className="bg-secondary text-secondary-foreground font-black italic text-4xl px-12 py-6 rounded-2xl border-4 border-white shadow-[0_0_50px_rgba(255,199,0,0.4)]"
            >
              RESPAWN
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
