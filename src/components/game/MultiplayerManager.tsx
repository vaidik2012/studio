
"use client";

import React, { useEffect, useState } from 'react';
import * as Playroom from 'playroomkit';

export function useMultiplayer() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await Playroom.insertCoin({
          gameId: "braxk-io-session",
          discord: true,
        });
        setInitialized(true);
      } catch (err) {
        console.error("Playroom Initialization Error:", err);
      }
    };
    init();
  }, []);

  return { 
    initialized, 
    isHost: Playroom.isHost(), 
    myPlayer: Playroom.myPlayer() 
  };
}

export const PlayroomProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
