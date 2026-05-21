
import { Character, Weapon, MapData, Rank } from './types';

export const RANKS: Rank[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master'];

export const CHARACTERS: Character[] = [
  { 
    id: 'newbie', 
    name: 'Newbie', 
    ability: 'Void Shockwave', 
    abilityDesc: 'Press Q to release a massive kinetic shockwave that knocks back enemies.', 
    speed: 7, 
    health: 125, 
    color: '#00A3FF', 
    modelUrl: '/assets/newbie.fbx',
    textureUrl: 'https://picsum.photos/seed/skin1/512/512' 
  },
  { 
    id: 'void_runner', 
    name: 'Void Runner', 
    ability: 'Stealth Dash', 
    abilityDesc: 'Press Q to dash forward instantly, leaving a trail of particles.', 
    speed: 9, 
    health: 100, 
    color: '#A300FF', 
    modelUrl: '/assets/void_runner.fbx',
    textureUrl: 'https://picsum.photos/seed/skin2/512/512' 
  }
];

export const WEAPONS: Weapon[] = [
  {
    id: 'ak47',
    name: 'AK47',
    category: 'HEAVY',
    damage: 38,
    fireRate: 110,
    range: 1200,
    ammo: 30,
    reloadTime: 2500,
    recoil: 8,
    color: '#FF4D4D',
    modelUrl: '/assets/ak47.fbx',
    skinUrl: '/assets/ak47_skin.jpg'
  },
  {
    id: 'm4a1',
    name: 'M4A1',
    category: 'HEAVY',
    damage: 30,
    fireRate: 90,
    range: 1100,
    ammo: 30,
    reloadTime: 2200,
    recoil: 5,
    color: '#4DFF4D',
    modelUrl: '/assets/m4a1.fbx',
    skinUrl: '/assets/m4a1_skin.jpg'
  },
  {
    id: 'awm',
    name: 'AWM',
    category: 'SNIPER',
    damage: 100,
    fireRate: 1500,
    range: 3000,
    ammo: 5,
    reloadTime: 4000,
    recoil: 25,
    color: '#FFC700',
    modelUrl: '/assets/awm.fbx',
    skinUrl: '/assets/awm_skin.jpg'
  },
  {
    id: 'desert_eagle',
    name: 'Desert Eagle',
    category: 'PISTOL',
    damage: 50,
    fireRate: 400,
    range: 800,
    ammo: 7,
    reloadTime: 1500,
    recoil: 15,
    color: '#00A3FF',
    modelUrl: '/assets/desert_eagle.fbx',
    skinUrl: '/assets/desert_eagle_skin.jpg'
  }
];

export const MAPS: MapData[] = [
  {
    id: 'tactical_arena',
    name: 'Tactical Arena',
    theme: 'tactical',
    description: 'High-quality tactical arena with nature and heavy cover.'
  },
  {
    id: 'forest_camp',
    name: 'Logging Camp',
    theme: 'forest',
    description: 'Dense pine trees, logging shacks and night effects.'
  },
  {
    id: 'shipping_yard',
    name: 'Shipping Yard',
    theme: 'industrial',
    description: 'Industrial containers maze and central crane.'
  },
  {
    id: 'cyber_city',
    name: 'Cyber City',
    theme: 'cyber',
    description: 'Neon futuristic city with glowing grids.'
  },
  {
    id: 'training_ground',
    name: 'Training Ground',
    theme: 'training',
    description: 'Practice your aim in this specialized facility.'
  },
  {
    id: 'duel_arena',
    name: '1v1 Duel Arena',
    theme: 'duel',
    description: 'Compact, symmetrical map for custom duels.'
  }
];

export const EMOTES = [
  { id: 'dance', name: 'VICTORY DANCE' },
  { id: 'salute', name: 'RESPECT SALUTE' },
  { id: 'flex', name: 'FLEX MUSCLES' },
  { id: 'wave', name: 'FRIENDLY WAVE' },
  { id: 'laugh', name: 'CHALLENGE LAUGH' },
  { id: 'threaten', name: 'CUT THROAT' },
  { id: 'clap', name: 'CLAP CLAP' },
  { id: 'meditate', name: 'ZEN FOCUS' },
  { id: 'point', name: 'YOU ARE NEXT' },
  { id: 'sit', name: 'RELAX' }
];

export const BOT_NAMES = [
  "Shadow_Ghost", "Raptor99", "BulletStorm", "VoidWalker", "NeonNinja",
  "Bravo6", "SilverFox", "AlphaPrime", "StealthyOne", "DragonEye"
];

export const MAP_SIZE = 5000;
