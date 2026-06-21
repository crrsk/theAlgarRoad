import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameState } from '../../gameState';

export default function WeatherSystem() {
  const pointsRef = useRef();
  const audioDataRef = useRef(null);

  // Synthetic Rain Audio
  useEffect(() => {
    if (!GameState.isRaining) return;

    let audioCtx;
    let source;
    let gainNode;
    let biquadFilter;

    const initAudio = () => {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const bufferSize = audioCtx.sampleRate * 2; // 2 seconds of noise
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        // Generate white noise
        output[i] = Math.random() * 2 - 1;
      }

      source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Filter it to sound more like rain
      biquadFilter = audioCtx.createBiquadFilter();
      biquadFilter.type = 'lowpass';
      biquadFilter.frequency.value = 1000; // Muffled rain

      gainNode = audioCtx.createGain();
      gainNode.gain.value = 0.15; // Leve sonido

      source.connect(biquadFilter);
      biquadFilter.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      source.start();
      
      audioDataRef.current = { gainNode, audioCtx };
    };

    // User interaction might be required, but usually in a game we already had some
    try {
      initAudio();
    } catch (e) {
      console.warn("Audio Context failed to start for rain:", e);
    }

    return () => {
      if (source) source.stop();
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
    };
  }, []);

  const particleCount = 2000;
  
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      // Area of rain (x: -20 to 20, y: 0 to 40, z: -40 to 10)
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50 - 15;
      
      vel[i] = 20 + Math.random() * 10; // Falling speed
    }
    return [pos, vel];
  }, [particleCount]);

  useFrame((_, delta) => {
    // Audio sync logic
    if (audioDataRef.current && audioDataRef.current.audioCtx) {
      const { gainNode, audioCtx } = audioDataRef.current;
      if (GameState.isMenu || GameState.isPaused || GameState.isGameOver || !GameState.isRaining) {
        gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
      } else {
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        gainNode.gain.setTargetAtTime(0.15, audioCtx.currentTime, 0.1);
      }
    }

    if (!GameState.isRaining || !pointsRef.current || GameState.isPaused || GameState.isMenu) return;
    
    const positionsArray = pointsRef.current.geometry.attributes.position.array;

    for (let i = 0; i < particleCount; i++) {
      // Fall down
      positionsArray[i * 3 + 1] -= velocities[i] * delta;
      
      // Move backwards based on game speed (wind effect + car moving forward)
      positionsArray[i * 3 + 2] += GameState.speed * delta;
      
      // Reset if hits ground
      if (positionsArray[i * 3 + 1] < 0) {
        positionsArray[i * 3 + 1] = 40; // Spawn at top
        positionsArray[i * 3] = (Math.random() - 0.5) * 40; // Random X
        positionsArray[i * 3 + 2] = (Math.random() - 0.5) * 50 - 15; // Random Z
      }
      
      // Reset if goes behind camera (passed the player)
      if (positionsArray[i * 3 + 2] > 10) {
        positionsArray[i * 3 + 2] = -40; // Spawn far ahead
        positionsArray[i * 3] = (Math.random() - 0.5) * 40; // Random X
        positionsArray[i * 3 + 1] = Math.random() * 40; // Random Y
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!GameState.isRaining) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={0x88bbff}
        size={0.15}
        transparent
        opacity={0.6}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  );
}
