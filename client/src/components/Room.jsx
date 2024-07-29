import {
  Grid,
  useCursor,
  PerformanceMonitor,
} from "@react-three/drei";
import Stats from 'stats.js'

import { useThree } from "@react-three/fiber";
import { atom, useAtom } from "jotai";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useGrid } from "../hooks/useGrid";
import { Avatar } from "./Avatar";
import { Item } from "./Item";
import { Shop } from "./Shop";
import { charactersAtom, mapAtom, socket, userAtom } from "./SocketManager";
import { ModelComponents } from './StaticModels';
import {
  buildModeAtom,
  draggedItemAtom,
  draggedItemRotationAtom,
  shopModeAtom,
} from "./UI";

export const roomItemsAtom = atom([]);

function PerformanceStats() {
  useEffect(() => {
    const stats = new Stats()
    stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom)

    function animate() {
      stats.begin()
      stats.end()
      requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)

    return () => document.body.removeChild(stats.dom)
  }, [])

  return null
}

export const Room = () => {
  const [buildMode] = useAtom(buildModeAtom);
  const [shopMode, setShopMode] = useAtom(shopModeAtom);
  const [characters] = useAtom(charactersAtom);
  const [map] = useAtom( mapAtom);
  const [items, setItems] = useAtom(roomItemsAtom);
  const [onFloor, setOnFloor] = useState(false);
  useCursor(onFloor);
  const { vector3ToGrid, gridToVector3 } = useGrid();

  const scene = useThree((state) => state.scene);
  const [user] = useAtom(userAtom);
  const PisoParque = ModelComponents.pisoParque;
  const Iglesia = ModelComponents.Iglesia;
  const Davivienda = ModelComponents.davivienda;
  const Alcaldia = ModelComponents.alcaldia;
  const Olivar = ModelComponents.olivar;
  const [dpr, setDpr] = useState(0.75);
  const [lastAdjustTime, setLastAdjustTime] = useState(0);

  useEffect(() => {
    setItems(map.items);
  }, [map]);

  const onPlaneClicked = (e) => {
    if (!buildMode) {
      const character = scene.getObjectByName(`character-${user}`);
      if (!character) {
        return;
      }
      socket.emit(
        "move",
        vector3ToGrid(character.position),
        vector3ToGrid(e.point)
      );
    } else {
      if (draggedItem !== null) {
        if (canDrop) {
          setItems((prev) => {
            const newItems = [...prev];
            delete newItems[draggedItem].tmp;
            newItems[draggedItem].gridPosition = vector3ToGrid(e.point);
            newItems[draggedItem].rotation = draggedItemRotation;
            return newItems;
          });
        }
        setDraggedItem(null);
      }
    }
  };

  const [draggedItem, setDraggedItem] = useAtom(draggedItemAtom);
  const [draggedItemRotation, setDraggedItemRotation] = useAtom(
    draggedItemRotationAtom
  );
  const [dragPosition, setDragPosition] = useState([0, 0]);
  const [canDrop, setCanDrop] = useState(false);

  useEffect(() => {
    if (draggedItem === null) {
      setItems((prev) => prev.filter((item) => !item.tmp));
    }
  }, [draggedItem]);

  useEffect(() => {
    if (draggedItem === null) {
      // FIXED: issue with 0 being falsy
      return;
    }
    const item = items[draggedItem];
    const width =
      draggedItemRotation === 1 || draggedItemRotation === 3
        ? item.size[1]
        : item.size[0];
    const height =
      draggedItemRotation === 1 || draggedItemRotation === 3
        ? item.size[0]
        : item.size[1];

    let droppable = true;

    // check if item is in bounds
    if (
      dragPosition[0] < 0 ||
      dragPosition[0] + width > map.size[0] * map.gridDivision
    ) {
      droppable = false;
    }
    if (
      dragPosition[1] < 0 ||
      dragPosition[1] + height > map.size[1] * map.gridDivision
    ) {
      droppable = false;
    }
    // check if item is not colliding with other items
    if (!item.walkable && !item.wall) {
      items.forEach((otherItem, idx) => {
        // ignore self
        if (idx === draggedItem) {
          return;
        }

        // ignore wall & floor
        if (otherItem.walkable || otherItem.wall) {
          return;
        }

        // check item overlap
        const otherWidth =
          otherItem.rotation === 1 || otherItem.rotation === 3
            ? otherItem.size[1]
            : otherItem.size[0];
        const otherHeight =
          otherItem.rotation === 1 || otherItem.rotation === 3
            ? otherItem.size[0]
            : otherItem.size[1];
        if (
          dragPosition[0] < otherItem.gridPosition[0] + otherWidth &&
          dragPosition[0] + width > otherItem.gridPosition[0] &&
          dragPosition[1] < otherItem.gridPosition[1] + otherHeight &&
          dragPosition[1] + height > otherItem.gridPosition[1]
        ) {
          droppable = false;
        }
      });
    }

    setCanDrop(droppable);
  }, [dragPosition, draggedItem, items, draggedItemRotation]);
  const state = useThree((state) => state);

  useEffect(() => {
    if (buildMode) {
      setItems(map?.items || []);
    } else {
      socket.emit("itemsUpdate", items);
    }
  }, [buildMode]);

  const onItemSelected = (item) => {
    setShopMode(false);

    setItems((prev) => [
      ...prev,
      {
        ...item,
        gridPosition: [0, 0],
        tmp: true,
      },
    ]);
    setDraggedItem(items.length);
    setDraggedItemRotation(item.rotation || 0);
  };

  const staticModels = useMemo(() => (
    <>
      <Suspense fallback={null}>
        <PisoParque />
      </Suspense>
      <Suspense fallback={null}>
        <Iglesia />
      </Suspense>
      <Suspense fallback={null}>
        <Davivienda />
      </Suspense>
      <Suspense fallback={null}>
        <Alcaldia />
      </Suspense>
      <Suspense fallback={null}>
        <Olivar />
      </Suspense>
    </>
  ), []);

  return (
    <>
      <PerformanceMonitor 
      onIncline={() => {
        const newDPR = Math.min(dpr + 0.15, 2.5);
        console.log('Performance improved, new DPR:', newDPR.toFixed(2));
        setDpr(newDPR);
      }}

      onDecline={() => {
        const now = Date.now();
        if (now - lastAdjustTime > 2000) { // 2 segundos de demora
          const newDPR = Math.max(dpr - 0.15, 0.75);
          console.log('Performance declined, new DPR:', newDPR.toFixed(2));
          setDpr(newDPR);
          setLastAdjustTime(now);
      }
    }}
      >
      {shopMode && <Shop onItemSelected={onItemSelected} />}
      {!buildMode && !shopMode}
      {!shopMode &&
        (buildMode ? items : map.items).map((item, idx) => (
          <Item
            key={`${item.name}-${idx}`}
            item={item}
            onClick={() => {
              if (buildMode) {
                setDraggedItem((prev) => (prev === null ? idx : prev));
                setDraggedItemRotation(item.rotation || 0);
              }
            }}
            isDragging={draggedItem === idx}
            dragPosition={dragPosition}
            dragRotation={draggedItemRotation}
            canDrop={canDrop}
          />
        ))}

      {!shopMode && (
        <mesh
          rotation-x={-Math.PI / 2}
          position-y={-0.002}
          onClick={onPlaneClicked}
          onPointerEnter={() => setOnFloor(true)}
          onPointerLeave={() => setOnFloor(false)}
          onPointerMove={(e) => {
            if (!buildMode) {
              return;
            }
            const newPosition = vector3ToGrid(e.point);
            if (
              !dragPosition ||
              newPosition[0] !== dragPosition[0] ||
              newPosition[1] !== dragPosition[1]
            ) {
              setDragPosition(newPosition);
            }
          }}
          position-x={map.size[0] / 2}
          position-z={map.size[1] / 2}
          receiveShadow
        >
          <planeGeometry args={map.size} />
          <meshStandardMaterial color="#108080" />
        </mesh>
      )}
      {staticModels}

      {(buildMode || shopMode) && (
        <Grid infiniteGrid fadeDistance={50} fadeStrength={5} />
      )}
      {!buildMode &&
        characters.map((character) => (
          <Suspense key={character.session + "-" + character.id}>
            <group>
              <Avatar
                id={character.id}
                position={gridToVector3(character.position)}
                hairColor={character.hairColor}
                topColor={character.topColor}
                bottomColor={character.bottomColor}
                avatarUrl={character.avatarUrl}
              />
            </group>
          </Suspense>
        ))}
      </PerformanceMonitor>
      <PerformanceStats />
    </>
  );
};
