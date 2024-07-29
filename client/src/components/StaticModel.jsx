import React, { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';

function StaticModel({ url, position, scale }) {
  const ref = useRef();
  const { scene } = useGLTF(url);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return <primitive ref={ref} object={scene} position={position} scale={scale} />;
}

export default StaticModel;