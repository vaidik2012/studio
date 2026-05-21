
"use client";

import React, { useEffect, useState } from 'react';
import { insertCoin, onPlayerJoin, isHost, getPlayer, getState, setState, myPlayer } from 'playroom-kit';

export function useMultiplayer() {
  const [initialized, setInitialized] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await insertCoin({
        gameId: "braxk-io-session",
        discord: true,
      });
      setInitialized(true);
    };
    init();
  }, []);

  return { initialized, isHost: isHost(), myPlayer: myPlayer() };
}

export const PlayroomProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
