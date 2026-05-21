
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { myPlayer, isHost, setState, getState, insertCoin } from 'playroomkit';
import { CHARACTERS, WEAPONS, MAPS, EMOTES } from '@/lib/game/constants';
import { GameMode } from '@/lib/game/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CharacterPreview3D } from './CharacterPreview3D';
import { useUser, useDoc, useAuth, useFirestore } from '@/firebase';
import { LogOut, User, Trophy, Coins, Star, Settings as SettingsIcon, Swords, Target, Users, Copy, Plus, Sparkles } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface LobbyProps {
  onStart: () => void;
}

export function Lobby({ onStart }: LobbyProps) {
  const { user } = useUser();
  const auth = useAuth();
  const { data: profile } = useDoc(user ? `users/${user.uid}` : null);
  const { toast } = useToast();
  
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0]);
  const [selectedWeapon, setSelectedWeapon] = useState(WEAPONS[0]);
  const [selectedMode, setSelectedMode] = useState<GameMode>('tdm_unranked');
  const [partyCode, setPartyCode] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    const code = window.location.hash.replace('#', '') || 'LOCAL';
    setPartyCode(code);
  }, []);

  const handleJoin = async () => {
    const player = myPlayer();
    if (player && profile) {
      if (isHost()) {
        setState('gameMode', selectedMode);
        if (selectedMode === 'training') {
          setState('mapIndex', MAPS.findIndex(m => m.theme === 'training'));
        } else if (selectedMode === 'custom_1v1') {
          setState('mapIndex', MAPS.findIndex(m => m.theme === 'duel'));
        } else {
          const playableMaps = MAPS.filter(m => m.theme !== 'training' && m.theme !== 'duel');
          const randomMap = playableMaps[Math.floor(Math.random() * playableMaps.length)];
          setState('mapIndex', MAPS.indexOf(randomMap));
        }
      }

      await player.setState({
        id: player.id,
        name: profile.username,
        charId: selectedChar.id,
        weaponId: selectedWeapon.id,
        x: 0, y: 0, z: 0,
        angle: 0,
        health: 100,
        kills: 0,
        deaths: 0,
        assists: 0,
        score: 0,
        team: Math.random() > 0.5 ? 'blue' : 'yellow',
        isBot: false,
        isReady: true
      });
      onStart();
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(partyCode);
    toast({ title: "Code Copied!", description: "Share this with your friends." });
  };

  const joinPrivateRoom = () => {
    if (!joinCode) return;
    window.location.hash = joinCode;
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-[#14161A] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full" />
      </div>

      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <motion.div className="flex items-center gap-3 bg-background/60 backdrop-blur-xl p-2 pr-6 rounded-full border border-white/10">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <User className="text-white w-6 h-6" />
            </div>
            <div>
              <div className="text-white font-black italic text-sm uppercase leading-none">{profile?.username || "GUEST"}</div>
              <div className="text-primary font-bold text-[10px] tracking-widest mt-1">LVL {profile?.level || 1} • {profile?.rank || "BRONZE"}</div>
            </div>
          </motion.div>
          <StatPill icon={<Coins className="w-3 h-3 text-secondary" />} value={profile?.coins || 0} />
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex bg-background/60 backdrop-blur-xl p-1 rounded-xl border border-white/10">
            <Input 
              placeholder="ROOM CODE" 
              value={joinCode} 
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="bg-transparent border-none text-xs font-black tracking-widest w-24 h-8 focus-visible:ring-0"
            />
            <Button size="sm" onClick={joinPrivateRoom} className="h-8 bg-primary rounded-lg text-[10px] font-black">JOIN</Button>
          </div>
          <div className="bg-background/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Party</span>
            <span className="text-secondary font-black tracking-tighter text-xl uppercase">{partyCode}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyRoomCode}><Copy className="w-3 h-3" /></Button>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl bg-white/5" onClick={() => signOut(auth)}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="z-10 w-full max-w-screen-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full pt-20">
        <div className="lg:col-span-3 space-y-6 bg-background/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar">
          <Tabs defaultValue="modes" className="w-full">
            <TabsList className="grid grid-cols-3 bg-muted/50 p-1 mb-6 rounded-xl">
              <TabsTrigger value="modes" className="font-bold uppercase italic text-[10px]">Battle</TabsTrigger>
              <TabsTrigger value="chars" className="font-bold uppercase italic text-[10px]">Heroes</TabsTrigger>
              <TabsTrigger value="arsenal" className="font-bold uppercase italic text-[10px]">Guns</TabsTrigger>
            </TabsList>
            
            <TabsContent value="modes" className="space-y-3">
              <ModeCard icon={<Star />} title="Ranked TDM" desc="Impacts Rank & XP" selected={selectedMode === 'tdm_ranked'} onClick={() => setSelectedMode('tdm_ranked')} />
              <ModeCard icon={<Swords />} title="Custom 1v1" desc="Private Duel Arena" selected={selectedMode === 'custom_1v1'} onClick={() => setSelectedMode('custom_1v1')} />
              <ModeCard icon={<Target />} title="Training" desc="Targets & Infinite Ammo" selected={selectedMode === 'training'} onClick={() => setSelectedMode('training')} />
              <ModeCard icon={<Users />} title="Quick Play" desc="Standard 4v4 TDM" selected={selectedMode === 'tdm_unranked'} onClick={() => setSelectedMode('tdm_unranked')} />
            </TabsContent>

            <TabsContent value="chars" className="space-y-3">
              {CHARACTERS.map(char => (
                <button 
                  key={char.id}
                  onClick={() => setSelectedChar(char)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${selectedChar.id === char.id ? 'border-primary bg-primary/20 shadow-lg' : 'border-white/5 hover:border-white/10 bg-white/5'}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center" style={{ color: char.color }}><Sparkles className="w-6 h-6" /></div>
                  <div>
                    <div className="font-black italic text-sm text-white uppercase">{char.name}</div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{char.ability}</div>
                  </div>
                </button>
              ))}
            </TabsContent>

            <TabsContent value="arsenal" className="space-y-3">
              {WEAPONS.map(weapon => (
                <WeaponCard key={weapon.id} weapon={weapon} isSelected={selectedWeapon.id === weapon.id} onClick={() => setSelectedWeapon(weapon)} />
              ))}
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-6 flex flex-col items-center justify-center relative h-full">
          <div className="w-full h-[65vh] relative z-10">
            <CharacterPreview3D modelUrl={selectedChar.modelUrl} baseColor={selectedChar.color} textureUrl={selectedChar.textureUrl} />
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground px-6 py-2 rounded-xl border-4 border-white font-black italic text-lg rotate-[-5deg] z-20">
              {selectedWeapon.name}
            </motion.div>
          </div>
          <div className="mt-4 text-center z-10">
            <h3 className="text-6xl font-black italic text-white uppercase tracking-tighter leading-none">{selectedChar.name}</h3>
            <p className="text-primary font-bold uppercase tracking-widest mt-2 text-sm">{selectedChar.abilityDesc}</p>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6 flex flex-col justify-between h-full py-12">
          <div className="bg-background/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6">
            <h4 className="text-white font-black italic text-2xl uppercase flex items-center gap-3">
              <Trophy className="text-primary w-6 h-6" /> Profile
            </h4>
            <div className="space-y-4">
              <StatItem label="RANK" value={profile?.rank || "BRONZE"} />
              <StatItem label="KILLS" value={profile?.kills || 0} />
              <StatItem label="XP" value={profile?.xp || 0} />
            </div>
          </div>

          <Button onClick={handleJoin} className="w-full h-24 bg-primary hover:bg-white text-white hover:text-primary transition-all rounded-[2rem] shadow-xl border-b-8 border-primary/60 active:border-b-0 active:translate-y-2 group">
            <div className="flex flex-col items-center">
              <span className="font-black italic text-4xl uppercase tracking-tighter">Enter Battle</span>
              <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{selectedMode.replace('_', ' ')}</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ModeCard({ icon, title, desc, selected, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${selected ? 'border-primary bg-primary/20 shadow-lg' : 'border-white/5 hover:border-white/10 bg-white/5'}`}>
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-primary">{icon}</div>
      <div>
        <div className="font-black italic text-sm text-white uppercase">{title}</div>
        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{desc}</div>
      </div>
    </button>
  );
}

function WeaponCard({ weapon, isSelected, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${isSelected ? 'border-secondary bg-secondary/20 shadow-lg' : 'border-white/5 hover:border-white/10 bg-white/5'}`}>
      <div className="font-black italic text-sm text-white uppercase">{weapon.name}</div>
    </button>
  );
}

function StatPill({ icon, value }: { icon: React.ReactNode, value: string | number }) {
  return (
    <div className="bg-background/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
      {icon} <span className="text-white font-black italic text-sm">{value}</span>
    </div>
  );
}

function StatItem({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className="text-white font-black italic text-lg uppercase">{value}</span>
    </div>
  );
}
