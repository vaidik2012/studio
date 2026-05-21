
"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface CharacterPreview3DProps {
  modelUrl: string | undefined;
  baseColor: string;
  textureUrl?: string;
}

export function CharacterPreview3D({ modelUrl, baseColor, textureUrl }: CharacterPreview3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 150, 450);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(0, 200, 100);
    scene.add(dirLight);

    const characterGroup = new THREE.Group();
    scene.add(characterGroup);

    // Textured Material
    const textureLoader = new THREE.TextureLoader();
    const material = new THREE.MeshStandardMaterial({ 
      color: baseColor || '#00A3FF',
      roughness: 0.4,
      metalness: 0.6
    });

    if (textureUrl) {
      textureLoader.load(textureUrl, (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 1);
        material.map = tex;
        material.needsUpdate = true;
      });
    }

    // Stylized "Toy" Character Shape
    const bodyGeo = new THREE.CapsuleGeometry(50, 100, 10, 20);
    const bodyMesh = new THREE.Mesh(bodyGeo, material);
    bodyMesh.position.y = 100;
    characterGroup.add(bodyMesh);

    const headGeo = new THREE.SphereGeometry(45, 32, 32);
    const headMesh = new THREE.Mesh(headGeo, material);
    headMesh.position.y = 200;
    characterGroup.add(headMesh);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(8, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(15, 210, 35);
    characterGroup.add(leftEye);
    
    const rightEye = leftEye.clone();
    rightEye.position.set(-15, 210, 35);
    characterGroup.add(rightEye);

    let isDragging = false;
    let previousX = 0;

    const onMouseDown = (e: MouseEvent) => { isDragging = true; previousX = e.clientX; };
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const delta = e.clientX - previousX;
        rotationRef.current += delta * 0.01;
        previousX = e.clientX;
      }
    };
    const onMouseUp = () => { isDragging = false; };

    containerRef.current.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const clock = new THREE.Clock();
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      characterGroup.rotation.y = rotationRef.current;
      if (!isDragging) rotationRef.current += delta * 0.8;
      
      // Sine wave hover animation
      characterGroup.position.y = Math.sin(Date.now() * 0.003) * 10;
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousedown', onMouseDown);
      }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
    };
  }, [baseColor, textureUrl]);

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
        <div className="bg-primary/20 backdrop-blur-md px-4 py-1 rounded-full border border-primary/30 text-[10px] font-black uppercase tracking-widest text-white/70">
          DRAG TO ROTATE
        </div>
      </div>
    </div>
  );
}
