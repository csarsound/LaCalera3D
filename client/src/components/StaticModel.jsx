import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';

function StaticModel({ url, position, scale }) {
  const ref = useRef();
  const { scene } = useGLTF(url);

  return <primitive ref={ref} object={scene} position={position} scale={scale} />;
}

export default StaticModel;