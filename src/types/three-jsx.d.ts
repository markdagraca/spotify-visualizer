import { ThreeElements } from '@react-three/fiber'

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      ambientLight: any
      directionalLight: any
      mesh: any
      boxGeometry: any
      meshStandardMaterial: any
    }
  }
} 