
"use client";

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { onPlayerJoin, isHost, setState, myPlayer, getState, rpc, onRPC } from 'playroomkit';
import { HUD } from './HUD';
import { EmoteWheel } from './EmoteWheel';
import { PlayerState, Bullet, GameMode } from '@/lib/game/types';
import { CHARACTERS, WEAPONS, MAP_SIZE, MAPS, BOT_NAMES } from '@/lib/game/constants';
import { createMap } from './MapManager';
import { Play, RotateCcw, Settings, Keyboard, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore, useUser } from '@/firebase';
import { updateDoc, doc, increment } from 'firebase/firestore';
import { adjustBotDifficulty } from '@/ai/flows/adaptive-bot-difficulty';

export function GameView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [me, setMe] = useState<PlayerState | null>(null);
  const [isDead, setIsDead] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEmoteWheel, setShowEmoteWheel] = useState(false);
  
  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playersGroup = useRef<THREE.Group>(new THREE.Group());
  const bulletsGroup = useRef<THREE.Group>(new THREE.Group());
  const effectsGroup = useRef<THREE.Group>(new THREE.Group());
  const targetsGroup = useRef<THREE.Group>(new THREE.Group());
  
  const playersRef = useRef<any[]>([]);
  const db = useFirestore();
  const { user } = useUser();

  const gameLoopState = useRef({
    bullets: [] as (Bullet & { mesh: THREE.Mesh; createdAt: number })[],
    effects: [] as { mesh: THREE.Mesh; createdAt: number; type: string }[],
    lastFrame: performance.now(),
    keys: {} as Record<string, boolean>,
    mouse: { x: 0, y: 0 },
    mapIndex: -1,
    lastShot: 0,
    lastAbility: 0,
    ammo: 30,
    isReloading: false,
    sensitivity: 0.5,
    keybinds: {
      moveUp: 'w', moveDown: 's', moveLeft: 'a', moveRight: 'd',
      ability: 'q', emote: 't', reload: 'r'
    },
    botsInitialized: false,
    matchEnded: false,
    currentBotDifficulty: 'intermediate' as 'beginner' | 'intermediate' | 'pro',
    lastDifficultyCheck: 0
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = sceneRef.current;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(playersGroup.current);
    scene.add(bulletsGroup.current);
    scene.add(effectsGroup.current);
    scene.add(targetsGroup.current);

    // Track players manually as some SDK versions might not export getPlayers()
    onPlayerJoin((player) => {
      playersRef.current.push(player);
      player.onQuit(() => {
        playersRef.current = playersRef.current.filter(p => p.id !== player.id);
      });
    });

    onRPC('shoot', (data: Bullet) => {
      const bulletGeo = new THREE.SphereGeometry(5);
      const bulletMat = new THREE.MeshBasicMaterial({ color: data.color });
      const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
      bulletMesh.position.set(data.x, data.y, data.z);
      bulletsGroup.current.add(bulletMesh);
      gameLoopState.current.bullets.push({ ...data, mesh: bulletMesh, createdAt: Date.now() });
    });

    onRPC('ability_shockwave', (data: { x: number, z: number, color: string }) => {
      const ringGeo = new THREE.TorusGeometry(10, 2, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: 0.8 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.set(data.x, 20, data.z);
      effectsGroup.current.add(ringMesh);
      gameLoopState.current.effects.push({ mesh: ringMesh, createdAt: Date.now(), type: 'shockwave' });
    });

    onRPC('ability_dash', (data: { x: number, z: number, color: string }) => {
      const dashGeo = new THREE.BoxGeometry(50, 50, 50);
      const dashMat = new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: 0.5 });
      const dashMesh = new THREE.Mesh(dashGeo, dashMat);
      dashMesh.position.set(data.x, 50, data.z);
      effectsGroup.current.add(dashMesh);
      gameLoopState.current.effects.push({ mesh: dashMesh, createdAt: Date.now(), type: 'dash_trail' });
    });

    onRPC('hit_target', (data: { targetId: string }) => {
       const target = scene.getObjectByName(data.targetId);
       if (target && target instanceof THREE.Mesh) {
         (target.material as THREE.MeshStandardMaterial).color.set(0xff0000);
         setTimeout(() => {
           if (target && target instanceof THREE.Mesh) {
             (target.material as THREE.MeshStandardMaterial).color.set(0xffffff);
           }
         }, 500);
       }
    });

    const handlePointerLockChange = () => {
      if (document.pointerLockElement !== containerRef.current && !showEmoteWheel && !isPaused) {
        setIsPaused(true);
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    
    const requestLock = () => {
      if (!isPaused && !isDead && !showEmoteWheel) {
        containerRef.current?.requestPointerLock();
      }
    };

    containerRef.current.addEventListener('mousedown', requestLock);

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'escape') {
        if (showEmoteWheel) {
           setShowEmoteWheel(false);
           requestLock();
           return;
        }
        setIsPaused(prev => !prev);
        if (document.pointerLockElement) document.exitPointerLock();
        return;
      }
      if (key === gameLoopState.current.keybinds.emote) {
        setShowEmoteWheel(true);
        if (document.pointerLockElement) document.exitPointerLock();
        return;
      }
      gameLoopState.current.keys[key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => (gameLoopState.current.keys[e.key.toLowerCase()] = false);
    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === containerRef.current) {
        gameLoopState.current.mouse.x += e.movementX * 0.002 * gameLoopState.current.sensitivity;
      }
    };
    const handleMouseDown = (e: MouseEvent) => { if (e.button === 0) gameLoopState.current.keys['mouse0'] = true; };
    const handleMouseUp = (e: MouseEvent) => { if (e.button === 0) gameLoopState.current.keys['mouse0'] = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    const animate = (now: number) => {
      const dt = (now - gameLoopState.current.lastFrame) / 1000;
      gameLoopState.current.lastFrame = now;

      if (!isPaused && !showEmoteWheel) update(dt, now);
      if (rendererRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      requestAnimationFrame(animate);
    };

    const update = (dt: number, now: number) => {
      const player = myPlayer();
      if (!player) return;

      const state = player.getPublicState() as PlayerState;
      if (!state || isDead) return;

      const gameMode = getState('gameMode') as GameMode || 'tdm_unranked';
      const syncedMapIndex = getState('mapIndex') ?? 0;
      
      if (syncedMapIndex !== gameLoopState.current.mapIndex) {
        gameLoopState.current.mapIndex = syncedMapIndex;
        createMap(MAPS[syncedMapIndex].theme, scene);
      }

      let dx = 0, dz = 0;
      const binds = gameLoopState.current.keybinds;
      if (gameLoopState.current.keys[binds.moveUp]) dz -= 1;
      if (gameLoopState.current.keys[binds.moveDown]) dz += 1;
      if (gameLoopState.current.keys[binds.moveLeft]) dx -= 1;
      if (gameLoopState.current.keys[binds.moveRight]) dx += 1;

      const char = CHARACTERS.find(c => c.id === state.charId) || CHARACTERS[0];
      const speed = char.speed * 80;

      if (dx !== 0 || dz !== 0) {
        const mag = Math.sqrt(dx * dx + dz * dz);
        state.x += (dx / mag) * speed * dt * 10;
        state.z += (dz / mag) * speed * dt * 10;
        state.x = Math.max(-MAP_SIZE / 2, Math.min(MAP_SIZE / 2, state.x));
        state.z = Math.max(-MAP_SIZE / 2, Math.min(MAP_SIZE / 2, state.z));
      }

      state.angle = gameLoopState.current.mouse.x;

      const weapon = WEAPONS.find(w => w.id === state.weaponId) || WEAPONS[0];
      const isTraining = gameMode === 'training';
      
      if (gameLoopState.current.keys['mouse0'] && now - gameLoopState.current.lastShot > weapon.fireRate) {
        if (gameLoopState.current.ammo > 0 || isTraining) {
          gameLoopState.current.lastShot = now;
          if (!isTraining) gameLoopState.current.ammo--;
          
          const bullet: Bullet = {
            id: Math.random().toString(36),
            ownerId: player.id,
            x: state.x,
            y: state.y + 50,
            z: state.z,
            angle: state.angle,
            speed: 3000,
            damage: weapon.damage,
            color: weapon.color
          };
          
          rpc('shoot', bullet);

          if (isTraining) {
            const raycaster = new THREE.Raycaster();
            const direction = new THREE.Vector3(Math.sin(state.angle), 0, Math.cos(state.angle));
            raycaster.set(new THREE.Vector3(state.x, state.y + 50, state.z), direction);
            const intersects = raycaster.intersectObjects(scene.children, true);
            const hit = intersects.find(i => i.object.name.startsWith('target_board'));
            if (hit) {
              rpc('hit_target', { targetId: hit.object.name });
            }
          }
        }
      }

      // Ability logic
      if (gameLoopState.current.keys[binds.ability] && now - gameLoopState.current.lastAbility > 10000) {
        gameLoopState.current.lastAbility = now;
        if (state.charId === 'void_runner') {
          const dashDist = 400;
          state.x += Math.sin(state.angle) * dashDist;
          state.z += Math.cos(state.angle) * dashDist;
          rpc('ability_dash', { x: state.x, z: state.z, color: char.color });
        } else {
          rpc('ability_shockwave', { x: state.x, z: state.z, color: char.color });
        }
      }

      if (gameLoopState.current.keys[binds.reload] && gameLoopState.current.ammo < 30 && !gameLoopState.current.isReloading) {
        gameLoopState.current.isReloading = true;
        setTimeout(() => {
          gameLoopState.current.ammo = 30;
          gameLoopState.current.isReloading = false;
        }, weapon.reloadTime);
      }

      gameLoopState.current.bullets = gameLoopState.current.bullets.filter(b => {
        const life = now - b.createdAt;
        if (life > 2000) {
          bulletsGroup.current.remove(b.mesh);
          return false;
        }
        b.mesh.position.x += Math.sin(b.angle) * b.speed * dt;
        b.mesh.position.z += Math.cos(b.angle) * b.speed * dt;
        return true;
      });

      gameLoopState.current.effects = gameLoopState.current.effects.filter(e => {
        const life = now - e.createdAt;
        if (life > 1000) {
          effectsGroup.current.remove(e.mesh);
          return false;
        }
        if (e.type === 'shockwave') {
          e.mesh.scale.setScalar(1 + life * 0.05);
          (e.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - life / 1000;
        } else if (e.type === 'dash_trail') {
          (e.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - life / 500;
        }
        return true;
      });

      if (cameraRef.current) {
        cameraRef.current.position.set(state.x - Math.sin(state.angle) * 800, 1000, state.z - Math.cos(state.angle) * 800);
        cameraRef.current.lookAt(state.x, state.y + 100, state.z);
      }

      if (isHost()) {
        checkWinConditions(gameMode);
        
        if (now - gameLoopState.current.lastDifficultyCheck > 30000) {
           gameLoopState.current.lastDifficultyCheck = now;
           adjustBotDifficulty({
             kills: state.kills,
             deaths: state.deaths,
             assists: state.assists,
             totalGameTimeSeconds: Math.floor(now / 1000),
             previousBotDifficulty: gameLoopState.current.currentBotDifficulty
           }).then(res => {
             gameLoopState.current.currentBotDifficulty = res.newBotDifficulty;
             setState('botDifficulty', res.newBotDifficulty);
           });
        }
      }

      player.setState(state);
      setMe(state);
    };

    const checkWinConditions = (mode: GameMode) => {
       if (gameLoopState.current.matchEnded) return;
       const players = playersRef.current;
       if (mode === 'custom_1v1' && players.length >= 1) {
          const winner = players.find(p => (p.getPublicState() as PlayerState).kills >= 10);
          if (winner) {
             gameLoopState.current.matchEnded = true;
          }
       }
    };

    requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
    };
  }, [isPaused, isDead, showEmoteWheel]);

  useEffect(() => {
    if (me && me.kills > 0 && user) {
       const gameMode = getState('gameMode') as GameMode;
       if (gameMode === 'tdm_ranked') {
         updateDoc(doc(db, 'users', user.uid), {
            kills: increment(1),
            xp: increment(100)
         });
       }
    }
  }, [me?.kills]);

  const handleRespawn = () => {
    const p = myPlayer();
    if (p) {
      const state = p.getPublicState() as PlayerState;
      p.setState({ ...state, health: 100, x: (Math.random() - 0.5) * 2000, z: (Math.random() - 0.5) * 2000 });
      setIsDead(false);
      gameLoopState.current.ammo = 30;
      containerRef.current?.requestPointerLock();
    }
  };

  const selectEmote = (emoteId: string) => {
    const p = myPlayer();
    if (p) {
      const state = p.getPublicState() as PlayerState;
      p.setState({ ...state, emoteId, lastEmote: Date.now() });
    }
    setShowEmoteWheel(false);
    containerRef.current?.requestPointerLock();
  };

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      
      <HUD 
        health={me?.health || 100}
        maxHealth={100}
        kills={me?.kills || 0}
        deaths={me?.deaths || 0}
        ammo={gameLoopState.current.ammo}
        maxAmmo={30}
        weaponName={WEAPONS.find(w => w.id === me?.weaponId)?.name || 'UNARMED'}
        isDead={isDead}
        onRespawn={handleRespawn}
        emoteId={me?.emoteId}
        abilityCooldown={Math.max(0, 10000 - (Date.now() - gameLoopState.current.lastAbility))}
      />

      <AnimatePresence>
        {showEmoteWheel && (
          <EmoteWheel 
            onSelect={selectEmote} 
            onClose={() => { setShowEmoteWheel(false); containerRef.current?.requestPointerLock(); }} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPaused && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-center justify-center pointer-events-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl bg-card border-2 border-white/10 p-10 rounded-[3rem] shadow-2xl space-y-8 overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="text-center">
                <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter">Paused</h2>
              </div>

              {!showSettings ? (
                <div className="space-y-4">
                  <Button 
                    onClick={() => { setIsPaused(false); containerRef.current?.requestPointerLock(); }}
                    className="w-full h-16 bg-primary text-white font-black italic text-xl rounded-2xl"
                  >
                    <Play className="mr-2" /> Resume
                  </Button>
                  <Button 
                    onClick={() => setShowSettings(true)}
                    className="w-full h-16 bg-muted text-white font-black italic text-xl rounded-2xl"
                  >
                    <Settings className="mr-2" /> Settings
                  </Button>
                  <Button 
                    onClick={() => window.location.reload()}
                    className="w-full h-16 bg-destructive/20 text-destructive font-black italic text-xl rounded-2xl"
                  >
                    <RotateCcw className="mr-2" /> Quit to Lobby
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Sensitivity</label>
                    <input 
                      type="range" min="0.1" max="2" step="0.1" 
                      defaultValue={gameLoopState.current.sensitivity}
                      onChange={(e) => gameLoopState.current.sensitivity = parseFloat(e.target.value)}
                      className="w-full accent-primary"
                    />
                  </div>
                  <div className="space-y-4">
                     <h3 className="text-sm font-black text-primary uppercase flex items-center gap-2">
                        <Keyboard className="w-4 h-4" /> Keybinds
                     </h3>
                     <div className="grid grid-cols-2 gap-4">
                        {Object.entries(gameLoopState.current.keybinds).map(([key, val]) => (
                          <div key={key} className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">{key}</label>
                            <Input 
                              className="bg-white/5 border-white/10 h-10 font-black uppercase text-center text-white"
                              defaultValue={val}
                              maxLength={1}
                              onChange={(e) => {
                                const newKey = e.target.value.toLowerCase();
                                if (newKey) {
                                  (gameLoopState.current.keybinds as any)[key] = newKey;
                                }
                              }}
                            />
                          </div>
                        ))}
                     </div>
                  </div>
                  <Button 
                    onClick={() => setShowSettings(false)}
                    className="w-full h-12 bg-white text-black font-black uppercase rounded-xl"
                  >
                    <Save className="mr-2 w-4 h-4" /> Save & Back
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
