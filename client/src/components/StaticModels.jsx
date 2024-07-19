import React, { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import StaticModel from './StaticModel';
import { STATIC_MODELS } from '../constants/modelData';

export function StaticModels() {
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

// Exporta cada modelo individualmente
export const ModelComponents = STATIC_MODELS.reduce((acc, model) => {
  acc[model.id] = () => (
    <Suspense fallback={null}>
      <StaticModel
        url={model.url}
        position={model.position}
        scale={model.scale}
      />
    </Suspense>
  );
  return acc;
}, {});

// Precarga todos los modelos para mejorar el rendimiento
STATIC_MODELS.forEach(model => useGLTF.preload(model.url));

export default StaticModels;