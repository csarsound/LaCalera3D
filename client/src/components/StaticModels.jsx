import React, { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import StaticModel from './StaticModel';
import { STATIC_MODELS } from '../constants/modelData';

function StaticModels() {
  return (
    <>
      {STATIC_MODELS.map((model) => (
        <Suspense key={model.id} fallback={null}>
          <StaticModel
            url={model.url}
            position={model.position}
            scale={model.scale}
          />
        </Suspense>
      ))}
    </>
  );
}

// Precarga todos los modelos para mejorar el rendimiento
STATIC_MODELS.forEach(model => useGLTF.preload(model.url));

export default StaticModels;