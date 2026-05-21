
"use client";

import React, { useState, useEffect } from 'react';
import { Lobby } from '@/components/game/Lobby';
import { GameView } from '@/components/game/GameView';
import { useMultiplayer } from '@/components/game/MultiplayerManager';
import { useUser } from '@/firebase';
import { AuthScreen } from '@/components/auth/AuthScreen';

export default function Home() {
  const { initialized } = useMultiplayer();
  const { user, loading: authLoading } = useUser();
  const [gameState, setGameState] = useState<'lobby' | 'playing'>('lobby');

  if (!initialized || authLoading) {
    return (
      <div className="w-full h-screen bg-[#14161A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(0,163,255,0.4)]" />
          <h1 className="text-white font-black italic text-2xl tracking-tighter uppercase animate-pulse">
            Booting Multiverse...
          </h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <main className="w-full h-screen overflow-hidden">
      {gameState === 'lobby' ? (
        <Lobby onStart={() => setGameState('playing')} />
      ) : (
        <GameView />
      )}
    </main>
  );
}
