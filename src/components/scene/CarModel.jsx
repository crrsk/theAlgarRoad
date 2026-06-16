import { useGLTF } from '@react-three/drei';
import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameState } from '../../gameState';

export default function CarModel() {
  const { scene: originalScene } = useGLTF('/car.glb');
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

    // Since the cloned scene is not attached to any parent yet, world coordinates are local.
    // We can directly offset the position to make the lowest point rest exactly at local Y = 0.
    // This completely avoids the production bug where parent matrices are stale during useEffect.
    cloned.position.y -= lowestY;
    
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      if (child.isMesh && child.name.toLowerCase().match(/wheel|tire|rueda|neumatico/)) {
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
     wheelsRef.current.forEach(wheel => {
         // Assuming rotation on X moves the wheel forward
         wheel.rotation.x -= GameState.speed * delta * 2;
     });
  });

  return <primitive object={scene} />;
}

useGLTF.preload('/car.glb');
