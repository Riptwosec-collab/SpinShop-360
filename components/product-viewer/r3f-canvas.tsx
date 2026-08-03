"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { MaterialOption } from "@/types/product";

function Model({ modelUrl, activeMaterial }: { modelUrl: string; activeMaterial: MaterialOption | null }) {
  const { scene } = useGLTF(modelUrl);
  const originalColors = useRef<Map<string, THREE.Color>>(new Map());

  useEffect(() => {
    // Snapshot original material colors once so we always recolor from a
    // known baseline rather than compounding tints across re-renders.
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat) => {
        const std = mat as THREE.MeshStandardMaterial;
        if (std.color && !originalColors.current.has(mat.uuid)) {
          originalColors.current.set(mat.uuid, std.color.clone());
        }
      });
    });
  }, [scene]);

  useEffect(() => {
    if (!activeMaterial) return;

    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      materials.forEach((mat) => {
        const std = mat as THREE.MeshStandardMaterial;
        // If the product declares a specific target material name, only
        // recolor that material; otherwise recolor every material on the
        // mesh (useful for single-material demo models).
        const matchesTarget =
          !activeMaterial.targetMaterialName || mat.name === activeMaterial.targetMaterialName;
        if (!matchesTarget || !std.color) return;

        std.color.set(activeMaterial.color);
        if (activeMaterial.roughness != null) std.roughness = activeMaterial.roughness;
        if (activeMaterial.metalness != null) std.metalness = activeMaterial.metalness;
        std.needsUpdate = true;
      });
    });
  }, [activeMaterial, scene]);

  return <primitive object={scene} />;
}

export function R3FCanvas({
  modelUrl,
  activeMaterial,
}: {
  modelUrl: string;
  alt: string;
  activeMaterial: MaterialOption | null;
}) {
  return (
    <div className="aspect-square w-full overflow-hidden rounded-2xl border border-border bg-surface-secondary">
      <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6} shadows="contact">
            <Model modelUrl={modelUrl} activeMaterial={activeMaterial} />
          </Stage>
        </Suspense>
        <OrbitControls enablePan={false} minDistance={1.5} maxDistance={6} autoRotate autoRotateSpeed={1.2} />
      </Canvas>
    </div>
  );
}
