
export type Difficulty = 'beginner' | 'intermediate' | 'pro';
export type GameMode = 'tdm_ranked' | 'tdm_unranked' | 'dm' | 'custom_1v1' | 'training';
export type Rank = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master';

export type WeaponCategory = 'HEAVY' | 'SMG' | 'PISTOL' | 'MELEE' | 'SNIPER';

export interface Weapon {
  id: string;
  name: string;
  category: WeaponCategory;
  damage: number;
  fireRate: number; // ms
  range: number;
  ammo: number;
  reloadTime: number;
  recoil: number;
  color: string;
  modelUrl: string;
  skinUrl: string;
  attachmentUrls?: string[];
}

export interface Character {
  id: string;
  name: string;
  ability: string;
  abilityDesc: string;
  speed: number;
  health: number;
  color: string;
  modelUrl: string;
  textureUrl: string;
}

export interface MapData {
  id: string;
  name: string;
  theme: 'tactical' | 'forest' | 'industrial' | 'cyber' | 'training' | 'duel';
  description: string;
}

export interface PlayerState {
  id: string;
  name: string;
  charId: string;
  weaponId: string;
  x: number;
  y: number;
  z: number;
  angle: number;
  health: number;
  kills: number;
  deaths: number;
  assists: number;
  lastShot: number;
  lastAbility: number;
  lastEmote: number;
  emoteId: string | null;
  isFiring: boolean;
  score: number;
  team: 'blue' | 'yellow';
  isBot: boolean;
  isReady: boolean;
}

export interface Bullet {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  z: number;
  angle: number;
  speed: number;
  damage: number;
  color: string;
}
