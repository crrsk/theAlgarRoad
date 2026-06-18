import { useGLTF } from '@react-three/drei';
import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameState } from '../../gameState';
import { CARS_CONFIG } from '../../utils/carsConfig';

export default function CarModel({ modelPath, isGarage = false }) {
  // Use a default fallback if modelPath is undefined for some reason during initial render
  const safeModelPath = modelPath || '/car.glb';
  const { scene: originalScene } = useGLTF(safeModelPath);
  const wheelsRef = useRef([]);

  const scene = useMemo(() => {
    // Clone the scene to avoid mutating the globally cached useGLTF instance.
    // This prevents compounding transformations on remounts.
    const cloned = originalScene.clone();
    
    // Auto-scale the car so it's not too huge or tiny
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    if (maxDim > 0) {
       const targetScale = 2.75 / maxDim;
       cloned.scale.setScalar(targetScale);
    }
    
    // Update matrices to calculate bounding box correctly after scaling
    cloned.updateMatrixWorld(true);
    let lowestY = Infinity;
    
    cloned.traverse((child) => {
      if (child.isMesh && child.name.toLowerCase().match(/wheel|tire|rueda|neumatico/)) {
         const wheelBox = new THREE.Box3().setFromObject(child);
         if (wheelBox.min.y < lowestY) lowestY = wheelBox.min.y;
      }
    });
    
    if (lowestY === Infinity) {
       const box2 = new THREE.Box3().setFromObject(cloned);
       lowestY = box2.min.y;
    }

    // This completely avoids the production bug where parent matrices are stale during useEffect.
    cloned.position.y -= lowestY;
    
    // Apply rotation offset if the model came inverted from factory (e.g. Red Car)
    const config = CARS_CONFIG.find(c => c.model === safeModelPath);
    if (config && config.rotationOffset) {
      cloned.rotation.y = config.rotationOffset;
    }
    
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      // Skip wheel recentering for models where it breaks placement
      const isProblematicModel = safeModelPath.includes('Pickup Truck') || safeModelPath.includes('Sports Car');

      if (!isProblematicModel && child.isMesh && child.name.toLowerCase().match(/wheel|tire|rueda|neumatico/)) {
         // Clone geometry so we don't mess up shared geometries across all 4 wheels
         child.geometry = child.geometry.clone();
         
         // Find local center of the geometry
         child.geometry.computeBoundingBox();
         const center = new THREE.Vector3();
         child.geometry.boundingBox.getCenter(center);
         
         // Shift the vertices so the wheel's origin is exactly at its center
         child.geometry.translate(-center.x, -center.y, -center.z);
         
         // Shift the object's position to compensate, so it stays in the same visual place
         child.position.add(center);
      }
    });

    return cloned;
  }, [originalScene]);

  useEffect(() => {
    wheelsRef.current = [];
    scene.traverse((child) => {
      if (child.isMesh && child.name.toLowerCase().match(/wheel|tire|rueda|neumatico/)) {
         wheelsRef.current.push(child);
      }
    });
  }, [scene]);

  useFrame((_, delta) => {
     if (GameState.isPaused || GameState.isMenu || GameState.isGameOver || isGarage) return;
     
     const isProblematicModel = safeModelPath.includes('Pickup Truck') || safeModelPath.includes('Sports Car');
     if (isProblematicModel) return;

     wheelsRef.current.forEach(wheel => {
         // Bloquear ruedas motrices (traseras) si el freno de mano está puesto
         // Asumimos que la trasera del coche es la parte negativa del eje Z local
         if (GameState.isHandbrake && wheel.position.z < 0) {
             return;
         }
         
         // Assuming rotation on X moves the wheel forward
         wheel.rotation.x -= GameState.speed * delta * 2;
     });
  });

  return <primitive object={scene} />;
}

// Preload all cars to avoid hitches when swapping in the garage
CARS_CONFIG.forEach(car => {
  useGLTF.preload(car.model);
});
