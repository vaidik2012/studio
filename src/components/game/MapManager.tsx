
"use client";

import * as THREE from 'three';

export function createMap(theme: string, scene: THREE.Scene) {
  // Clear previous non-permanent objects
  const toRemove: THREE.Object3D[] = [];
  scene.children.forEach(child => {
    if (child.type !== 'Group' && child.type !== 'PerspectiveCamera' && child.type !== 'DirectionalLight' && child.type !== 'HemisphereLight') {
      toRemove.push(child);
    }
  });
  toRemove.forEach(child => scene.remove(child));

  // Ensure lighting
  if (!scene.getObjectByName('ambientLight')) {
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    ambient.name = 'ambientLight';
    scene.add(ambient);
  }

  switch (theme) {
    case 'tactical': buildTacticalArena(scene); break;
    case 'forest': buildForestCamp(scene); break;
    case 'industrial': buildIndustrialYard(scene); break;
    case 'cyber': buildCyberCity(scene); break;
    case 'training': buildTrainingGround(scene); break;
    case 'duel': buildDuelArena(scene); break;
    default: buildTacticalArena(scene);
  }
}

function buildTrainingGround(scene: THREE.Scene) {
  scene.background = new THREE.Color(0x2a2a2a);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ color: 0x333333 }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Firing Range Stalls
  for (let i = -1; i <= 1; i++) {
    const stall = new THREE.Mesh(new THREE.BoxGeometry(100, 150, 10), new THREE.MeshStandardMaterial({ color: 0x4d3221 }));
    stall.position.set(i * 150, 75, 400);
    scene.add(stall);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(100, 10, 100), new THREE.MeshStandardMaterial({ color: 0x4d3221 }));
    roof.position.set(i * 150, 150, 350);
    scene.add(roof);
  }

  // Targets
  const spawnTarget = (dist: number, x: number) => {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 60), new THREE.MeshStandardMaterial({ color: 0x888888 }));
    pole.position.y = 30;
    group.add(pole);
    const board = new THREE.Mesh(new THREE.BoxGeometry(40, 60, 5), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    board.position.y = 60;
    board.name = `target_board_${dist}_${x}`;
    group.add(board);
    group.position.set(x, 0, -dist * 20 + 200);
    scene.add(group);
  };

  [10, 25, 50].forEach(d => {
    spawnTarget(d, -200);
    spawnTarget(d, 0);
    spawnTarget(d, 200);
  });

  // CQB Maze
  const createWall = (x: number, z: number, w: number, h: number, d: number) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: 0x777777 }));
    wall.position.set(x, h/2, z);
    scene.add(wall);
  };
  createWall(-600, -200, 200, 100, 20);
  createWall(-800, 0, 20, 100, 400);

  // Shipping Containers
  const container = new THREE.Mesh(new THREE.BoxGeometry(200, 100, 100), new THREE.MeshStandardMaterial({ color: 0x2244aa }));
  container.position.set(600, 50, -200);
  scene.add(container);
}

function buildDuelArena(scene: THREE.Scene) {
  scene.background = new THREE.Color(0x0a0a0a);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1500, 2000), new THREE.MeshStandardMaterial({ color: 0x111111 }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Mid-line
  const line = new THREE.Mesh(new THREE.PlaneGeometry(1500, 10), new THREE.MeshBasicMaterial({ color: 0x00ffff }));
  line.rotation.x = -Math.PI / 2;
  line.position.y = 1;
  scene.add(line);

  // Symmetrical obstacles
  [-500, 500].forEach(z => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(100, 200, 100), new THREE.MeshStandardMaterial({ color: 0x444444 }));
    box.position.set(-200, 100, z);
    scene.add(box);
    const box2 = box.clone();
    box2.position.set(200, 100, z);
    scene.add(box2);
  });
}

function buildTacticalArena(scene: THREE.Scene) {
  scene.background = new THREE.Color(0x1a1c1a);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshStandardMaterial({ color: 0x141414 }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  for (let i = 0; i < 20; i++) {
    const container = new THREE.Mesh(new THREE.BoxGeometry(260, 110, 110), new THREE.MeshStandardMaterial({ color: 0x3a4b63 }));
    container.position.set(Math.random() * 2000 - 1000, 55, Math.random() * 2000 - 1000);
    container.rotation.y = Math.random() * Math.PI;
    scene.add(container);
  }
}

function buildForestCamp(scene: THREE.Scene) {
  scene.background = new THREE.Color(0x010205);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshStandardMaterial({ color: 0x0a1a0d }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  for (let i = 0; i < 100; i++) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(10, 15, 100), new THREE.MeshStandardMaterial({ color: 0x3d2b1f }));
    const x = Math.random() * 4000 - 2000;
    const z = Math.random() * 4000 - 2000;
    trunk.position.set(x, 50, z);
    scene.add(trunk);
  }
}

function buildIndustrialYard(scene: THREE.Scene) {
  scene.background = new THREE.Color(0x111111);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  for (let i = 0; i < 40; i++) {
    const container = new THREE.Mesh(new THREE.BoxGeometry(200, 100, 100), new THREE.MeshStandardMaterial({ color: 0xffa000 }));
    container.position.set(Math.random() * 3200 - 1600, 50, Math.random() * 3200 - 1600);
    container.rotation.y = Math.floor(Math.random() * 4) * (Math.PI / 2);
    scene.add(container);
  }
}

function buildCyberCity(scene: THREE.Scene) {
  scene.background = new THREE.Color(0x020205);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 1, roughness: 0.1 }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  for (let i = 0; i < 50; i++) {
    const barrier = new THREE.Mesh(new THREE.BoxGeometry(100, 150, 20), new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true }));
    barrier.position.set(Math.random() * 4000 - 2000, 75, Math.random() * 4000 - 2000);
    scene.add(barrier);
  }
}
