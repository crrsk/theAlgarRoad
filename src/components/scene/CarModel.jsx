import { useGLTF } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameState } from '../../gameState';

export default function CarModel() {
  const { scene } = useGLTF('/car.glb');
  const wheelsRef = useRef([]);

  useEffect(() => {
    wheelsRef.current = [];
    
    // Reset scale and position before measuring to avoid React StrictMode double-render bugs!
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.updateMatrixWorld(true);

    // Auto-scale the car so it's not too huge or tiny
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    if (maxDim > 0) {
       // Target length tuned for a wider playable street view.
       const targetScale = 2.75 / maxDim;
       scene.scale.setScalar(targetScale);
    }
    
    // We target wheels to ignore invisible bounding boxes, adding Spanish and common names just in case
    scene.updateMatrixWorld(true);
    let lowestY = Infinity;
    scene.traverse((child) => {
      const name = child.name.toLowerCase();
      if (child.isMesh && (name.includes('wheel') || name.includes('tire') || name.includes('rueda') || name.includes('neumatico'))) {
         const wheelBox = new THREE.Box3().setFromObject(child);
         if (wheelBox.min.y < lowestY) lowestY = wheelBox.min.y;
      }
    });
    
    if (lowestY === Infinity) {
       box.setFromObject(scene);
       lowestY = box.min.y;
    }

    // Box3 uses World Coordinates! We must subtract the parent's world position to get the local offset
    const parentWorldPos = new THREE.Vector3();
    if (scene.parent) {
        scene.parent.getWorldPosition(parentWorldPos);
    }
    
    const yOffset = parentWorldPos.y - lowestY;
    scene.position.y += yOffset;
    
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      if (child.name.toLowerCase().includes('wheel') && child.isMesh) {
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
