import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

const MODELS = [
  '/CochesCirculacion/Bus.glb',
  '/CochesCirculacion/Jeep.glb',
  '/CochesCirculacion/Pickup Truck.glb',
  '/CochesCirculacion/Police Car.glb',
  '/CochesCirculacion/Red Car.glb',
  '/CochesCirculacion/Sports Car.glb',
];

MODELS.forEach((model) => useGLTF.preload(model));

export default function TrafficCar({ modelPath }) {
  const { scene } = useGLTF(modelPath);
  
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    
    // Auto-scale model so its length/width isn't excessively huge
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    
    // Set specific sizes based on vehicle type
    let targetLength = 3.0; // Normal cars slightly smaller
    if (modelPath.includes('Bus')) {
      targetLength = 6.5; // Bus should be much larger
    } else if (modelPath.includes('Pickup') || modelPath.includes('Jeep')) {
      targetLength = 3.5; // SUVs/Pickups slightly larger than normal cars
    }
    
    const maxDim = Math.max(size.x, size.z);
    const scaleFactor = targetLength / maxDim;
    clone.scale.setScalar(scaleFactor);
    
    // Recompute box after scale
    const scaledBox = new THREE.Box3().setFromObject(clone);
    // Shift model up so its lowest point (tires) is exactly at Y=0
    clone.position.y = -scaledBox.min.y;

    // Set shadows to FALSE to vastly improve performance
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        // Optionally simplify materials here if needed
      }
    });
    return clone;
  }, [scene, modelPath]);

  return <primitive object={clonedScene} />;
}
