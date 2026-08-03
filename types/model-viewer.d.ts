import type { DetailedHTMLProps, HTMLAttributes } from "react";

/**
 * Minimal, additive typing for Google's <model-viewer> web component so the
 * JSX compiler and TypeScript don't error out. Only the attributes SpinShop
 * 360 actually uses are declared; extend as needed.
 * Docs: https://modelviewer.dev/docs/
 */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerJSX;
    }
  }
}

type ModelViewerJSX = DetailedHTMLProps<
  HTMLAttributes<HTMLElement> & {
    src?: string;
    alt?: string;
    poster?: string;
    ar?: boolean;
    "ar-modes"?: string;
    "ar-scale"?: string;
    "camera-controls"?: boolean;
    "touch-action"?: string;
    "auto-rotate"?: boolean;
    "auto-rotate-delay"?: number;
    "rotation-per-second"?: string;
    "shadow-intensity"?: string | number;
    "shadow-softness"?: string | number;
    exposure?: string | number;
    "environment-image"?: string;
    "skybox-image"?: string;
    loading?: "auto" | "lazy" | "eager";
    reveal?: "auto" | "interaction" | "manual";
    "camera-orbit"?: string;
    "field-of-view"?: string;
    "min-camera-orbit"?: string;
    "max-camera-orbit"?: string;
    "interaction-prompt"?: string;
    "disable-zoom"?: boolean;
    "variant-name"?: string;
    orientation?: string;
    scale?: string;
  },
  HTMLElement
>;

export interface ModelViewerElement extends HTMLElement {
  src: string;
  alt: string;
  cameraOrbit: string;
  cameraTarget: string;
  fieldOfView: string;
  autoRotate: boolean;
  availableVariants: string[];
  variantName: string | null;
  canActivateAR: boolean;
  toDataURL: (type?: string, encoderOptions?: number) => string;
  jumpCameraToGoal: () => void;
  resetTurntableRotation: () => void;
  getCameraOrbit: () => { theta: number; phi: number; radius: number };
  model?: {
    materials: Array<{
      name: string;
      pbrMetallicRoughness: {
        setBaseColorFactor: (rgba: [number, number, number, number]) => void;
        setMetallicFactor: (value: number) => void;
        setRoughnessFactor: (value: number) => void;
      };
    }>;
  };
}

export {};
