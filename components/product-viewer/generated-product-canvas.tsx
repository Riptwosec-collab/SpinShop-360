"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Stage } from "@react-three/drei";
import type { GeneratedProductModelKind } from "@/lib/product-3d-assets";

 type V3 = [number, number, number];

interface GeneratedProductCanvasProps {
  kind: GeneratedProductModelKind;
  color?: string | null;
  autoRotate?: boolean;
}

function BoxPart({
  position,
  size,
  color,
  rotation = [0, 0, 0],
  metalness = 0.15,
  roughness = 0.45,
  emissive,
}: {
  position: V3;
  size: V3;
  color: string;
  rotation?: V3;
  metalness?: number;
  roughness?: number;
  emissive?: string;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        emissive={emissive}
        emissiveIntensity={emissive ? 1.6 : 0}
      />
    </mesh>
  );
}

function CylinderPart({
  position,
  radius,
  height,
  color,
  rotation = [0, 0, 0],
  metalness = 0.15,
  roughness = 0.45,
}: {
  position: V3;
  radius: number;
  height: number;
  color: string;
  rotation?: V3;
  metalness?: number;
  roughness?: number;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, height, 32]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

function SpherePart({ position, radius, color }: { position: V3; radius: number; color: string }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <sphereGeometry args={[radius, 24, 16]} />
      <meshStandardMaterial color={color} metalness={0.45} roughness={0.32} />
    </mesh>
  );
}

const KEYBOARD_ROWS = Array.from({ length: 5 }, (_, row) =>
  Array.from({ length: row === 4 ? 14 : 15 }, (_, column) => ({ row, column }))
).flat();

function KeyboardModel({ color }: { color: string }) {
  return (
    <group rotation={[-0.04, -0.08, 0]}>
      <RoundedBox args={[3.55, 0.18, 1.35]} radius={0.07} smoothness={4} position={[0, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} metalness={0.62} roughness={0.28} />
      </RoundedBox>
      <BoxPart position={[0, 0.105, 0]} size={[3.35, 0.035, 1.16]} color="#2b313b" metalness={0.5} roughness={0.34} />

      {KEYBOARD_ROWS.map(({ row, column }) => {
        const x = -1.47 + column * 0.205;
        const z = 0.44 - row * 0.205;
        const isAccent = (row === 0 && column === 0) || (row === 3 && column === 13);
        const isDark = row === 0 || row === 4;
        return (
          <BoxPart
            key={`${row}-${column}`}
            position={[x, 0.175, z]}
            size={[0.175, 0.07, 0.17]}
            color={isAccent ? "#2f7cff" : isDark ? "#343b47" : "#edf2f7"}
            metalness={0.03}
            roughness={0.5}
          />
        );
      })}

      <BoxPart position={[0, 0.175, -0.58]} size={[1.0, 0.07, 0.16]} color="#e8edf5" metalness={0.02} roughness={0.52} />
      <BoxPart position={[-1.25, 0.175, -0.58]} size={[0.28, 0.07, 0.16]} color="#343b47" />
      <BoxPart position={[-0.92, 0.175, -0.58]} size={[0.28, 0.07, 0.16]} color="#343b47" />
      <BoxPart position={[0.92, 0.175, -0.58]} size={[0.28, 0.07, 0.16]} color="#343b47" />
      <BoxPart position={[1.25, 0.175, -0.58]} size={[0.28, 0.07, 0.16]} color="#343b47" />
      <CylinderPart position={[1.48, 0.19, 0.52]} radius={0.085} height={0.08} color="#59616d" metalness={0.72} roughness={0.24} />
      <BoxPart position={[0, -0.03, -0.665]} size={[3.05, 0.025, 0.025]} color="#4fdcff" emissive="#22d3ee" roughness={0.2} />
    </group>
  );
}

function SmartphoneModel({ color }: { color: string }) {
  const cameras: V3[] = [
    [-0.42, 0.92, -0.145],
    [-0.12, 0.92, -0.145],
    [-0.42, 0.60, -0.145],
  ];

  return (
    <group rotation={[0.04, -0.18, 0]}>
      <RoundedBox args={[1.48, 3.02, 0.20]} radius={0.12} smoothness={5} castShadow receiveShadow>
        <meshStandardMaterial color={color} metalness={0.82} roughness={0.23} />
      </RoundedBox>

      <RoundedBox args={[1.36, 2.88, 0.035]} radius={0.08} smoothness={4} position={[0, 0, 0.116]} castShadow>
        <meshStandardMaterial color="#050b15" metalness={0.08} roughness={0.10} />
      </RoundedBox>
      <BoxPart position={[0, 0.62, 0.137]} size={[0.72, 0.035, 0.012]} color="#2f7cff" emissive="#116cff" roughness={0.2} />
      <BoxPart position={[0, -1.06, 0.137]} size={[0.46, 0.025, 0.012]} color="#4fdcff" emissive="#22d3ee" roughness={0.2} />
      <CylinderPart position={[0, 1.15, 0.145]} radius={0.035} height={0.02} rotation={[Math.PI / 2, 0, 0]} color="#111827" />

      <RoundedBox args={[0.66, 0.86, 0.055]} radius={0.10} smoothness={4} position={[-0.27, 0.80, -0.132]} castShadow>
        <meshStandardMaterial color="#303640" metalness={0.72} roughness={0.22} />
      </RoundedBox>
      {cameras.map((position, index) => (
        <group key={index} position={position} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.14, 0.14, 0.075, 40]} />
            <meshStandardMaterial color="#aab1ba" metalness={0.9} roughness={0.14} />
          </mesh>
          <mesh position={[0, 0.044, 0]}>
            <cylinderGeometry args={[0.095, 0.095, 0.082, 40]} />
            <meshStandardMaterial color="#07111f" metalness={0.35} roughness={0.08} />
          </mesh>
        </group>
      ))}
      <CylinderPart position={[-0.12, 0.60, -0.18]} radius={0.055} height={0.04} rotation={[Math.PI / 2, 0, 0]} color="#fff1c2" roughness={0.15} />
      <BoxPart position={[0.755, 0.35, 0]} size={[0.035, 0.46, 0.08]} color="#343a43" metalness={0.85} roughness={0.18} />
      <BoxPart position={[-0.755, 0.38, 0]} size={[0.035, 0.62, 0.08]} color="#343a43" metalness={0.85} roughness={0.18} />
    </group>
  );
}

function GamingChairModel({ color }: { color: string }) {
  const metal = "#3c4653";
  return (
    <group scale={0.78} position={[0, -1.6, 0]}>
      <RoundedBox args={[1.7, 0.28, 1.48]} radius={0.12} smoothness={4} position={[0, 2.05, 0]} castShadow>
        <meshStandardMaterial color="#181b21" roughness={0.58} />
      </RoundedBox>
      <BoxPart position={[-0.72, 2.22, 0]} size={[0.16, 0.24, 1.22]} color={color} roughness={0.46} />
      <BoxPart position={[0.72, 2.22, 0]} size={[0.16, 0.24, 1.22]} color={color} roughness={0.46} />

      <group position={[0, 3.35, 0.55]} rotation={[-0.12, 0, 0]}>
        <RoundedBox args={[1.58, 2.45, 0.30]} radius={0.16} smoothness={4} castShadow>
          <meshStandardMaterial color="#171a20" roughness={0.58} />
        </RoundedBox>
        <BoxPart position={[-0.66, 0, -0.02]} size={[0.17, 2.12, 0.31]} color={color} roughness={0.45} />
        <BoxPart position={[0.66, 0, -0.02]} size={[0.17, 2.12, 0.31]} color={color} roughness={0.45} />
        <RoundedBox args={[0.96, 0.42, 0.36]} radius={0.12} smoothness={3} position={[0, 0.86, -0.12]} castShadow>
          <meshStandardMaterial color="#20242c" roughness={0.62} />
        </RoundedBox>
        <RoundedBox args={[0.96, 0.46, 0.23]} radius={0.10} smoothness={3} position={[0, -0.53, -0.20]} castShadow>
          <meshStandardMaterial color={color} roughness={0.46} />
        </RoundedBox>
      </group>

      {[-1, 1].map((side) => (
        <group key={side}>
          <BoxPart position={[1.02 * side, 2.40, 0]} size={[0.10, 0.82, 0.12]} color={metal} metalness={0.78} roughness={0.26} />
          <RoundedBox args={[0.38, 0.12, 0.82]} radius={0.06} smoothness={3} position={[1.02 * side, 2.82, -0.02]} castShadow>
            <meshStandardMaterial color="#111419" roughness={0.72} />
          </RoundedBox>
        </group>
      ))}

      <BoxPart position={[0, 1.78, 0]} size={[0.72, 0.16, 0.62]} color={metal} metalness={0.78} roughness={0.25} />
      <CylinderPart position={[0, 1.15, 0]} radius={0.11} height={1.15} color="#9aa1aa" metalness={0.94} roughness={0.15} />
      <CylinderPart position={[0, 0.78, 0]} radius={0.21} height={0.58} color="#15181e" roughness={0.7} />
      <CylinderPart position={[0, 0.46, 0]} radius={0.28} height={0.16} color={metal} metalness={0.82} roughness={0.22} />

      {Array.from({ length: 5 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 5;
        return (
          <group key={index} rotation={[0, angle, 0]}>
            <BoxPart position={[0, 0.45, 0.58]} size={[0.16, 0.12, 1.15]} color={metal} metalness={0.80} roughness={0.25} />
            <CylinderPart position={[0, 0.25, 1.13]} radius={0.15} height={0.10} rotation={[Math.PI / 2, 0, 0]} color="#111318" roughness={0.85} />
          </group>
        );
      })}
    </group>
  );
}

function MechaModel({ color }: { color: string }) {
  const armor = "#dce2ec";
  const frame = "#222935";
  const sensor = "#ff3348";

  return (
    <group scale={0.72} position={[0, -1.6, 0]}>
      <CylinderPart position={[0, 0.12, 0]} radius={1.0} height={0.20} color="#10151d" metalness={0.45} roughness={0.34} />
      <CylinderPart position={[0, 0.24, 0]} radius={0.86} height={0.035} color="#4fdcff" roughness={0.14} />

      {[-1, 1].map((side) => (
        <group key={`leg-${side}`}>
          <BoxPart position={[0.36 * side, 0.52, 0]} size={[0.46, 0.24, 0.72]} color={frame} metalness={0.65} roughness={0.30} />
          <BoxPart position={[0.36 * side, 1.03, 0]} size={[0.42, 0.80, 0.42]} color={armor} metalness={0.48} roughness={0.34} />
          <SpherePart position={[0.36 * side, 1.50, 0]} radius={0.17} color={frame} />
          <BoxPart position={[0.36 * side, 1.92, 0]} size={[0.46, 0.78, 0.44]} color={armor} metalness={0.48} roughness={0.34} />
          <BoxPart position={[0.49 * side, 1.03, -0.02]} size={[0.13, 0.62, 0.46]} color={color} metalness={0.25} roughness={0.22} />
        </group>
      ))}

      <BoxPart position={[0, 2.38, 0]} size={[1.04, 0.46, 0.58]} color={frame} metalness={0.62} roughness={0.30} />
      <BoxPart position={[0, 3.02, 0]} size={[0.96, 1.08, 0.60]} color={frame} metalness={0.68} roughness={0.27} />
      <BoxPart position={[0, 3.18, -0.08]} size={[1.34, 0.72, 0.48]} color={armor} metalness={0.50} roughness={0.32} />
      <BoxPart position={[0, 3.18, -0.34]} size={[0.34, 0.34, 0.035]} color={color} emissive={color} roughness={0.20} />

      {[-1, 1].map((side) => (
        <group key={`arm-${side}`}>
          <SpherePart position={[0.88 * side, 3.28, 0]} radius={0.20} color={frame} />
          <BoxPart position={[0.90 * side, 3.28, 0]} size={[0.52, 0.42, 0.62]} color={armor} metalness={0.48} roughness={0.34} />
          <CylinderPart position={[1.08 * side, 2.80, 0]} radius={0.14} height={0.62} color={frame} metalness={0.68} roughness={0.26} />
          <SpherePart position={[1.08 * side, 2.45, 0]} radius={0.15} color={frame} />
          <BoxPart position={[1.08 * side, 2.10, 0]} size={[0.38, 0.62, 0.42]} color={armor} metalness={0.48} roughness={0.34} />
          <BoxPart position={[1.08 * side, 1.72, 0]} size={[0.27, 0.26, 0.31]} color={frame} metalness={0.60} roughness={0.32} />
        </group>
      ))}

      <CylinderPart position={[0, 3.66, 0]} radius={0.16} height={0.24} color={frame} metalness={0.62} roughness={0.30} />
      <RoundedBox args={[0.58, 0.56, 0.52]} radius={0.08} smoothness={3} position={[0, 4.04, 0]} castShadow>
        <meshStandardMaterial color={armor} metalness={0.50} roughness={0.30} />
      </RoundedBox>
      <BoxPart position={[0, 4.04, -0.285]} size={[0.42, 0.12, 0.035]} color={sensor} emissive={sensor} roughness={0.12} />
      <BoxPart position={[0.22, 4.48, 0]} size={[0.05, 0.58, 0.05]} color={color} metalness={0.36} roughness={0.20} rotation={[0, 0, -0.28]} />

      <BoxPart position={[0, 3.02, 0.46]} size={[0.78, 0.76, 0.24]} color={frame} metalness={0.64} roughness={0.28} />
      <BoxPart position={[-0.50, 3.08, 0.52]} size={[0.18, 0.94, 0.18]} color={color} metalness={0.28} roughness={0.22} rotation={[0, 0, -0.22]} />
      <BoxPart position={[0.50, 3.08, 0.52]} size={[0.18, 0.94, 0.18]} color={color} metalness={0.28} roughness={0.22} rotation={[0, 0, 0.22]} />
    </group>
  );
}

function ProductModel({ kind, color }: { kind: GeneratedProductModelKind; color?: string | null }) {
  if (kind === "keyboard") return <KeyboardModel color={color ?? "#161b22"} />;
  if (kind === "smartphone") return <SmartphoneModel color={color ?? "#747980"} />;
  if (kind === "gaming-chair") return <GamingChairModel color={color ?? "#b51f2e"} />;
  return <MechaModel color={color ?? "#2f7cff"} />;
}

export function GeneratedProductCanvas({ kind, color, autoRotate = true }: GeneratedProductCanvasProps) {
  return (
    <Canvas
      camera={{ position: [4.5, 3.2, 5.2], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      shadows
    >
      <Stage environment="city" intensity={0.72} shadows="contact">
        <ProductModel kind={kind} color={color} />
      </Stage>
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.8}
        maxDistance={12}
        autoRotate={autoRotate}
        autoRotateSpeed={1.15}
      />
    </Canvas>
  );
}
