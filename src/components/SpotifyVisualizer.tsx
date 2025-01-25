"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js"

interface AudioFeatures {
  energy: number
  danceability: number
  valence: number
}

interface NowPlaying {
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
}

interface AudioAnalysis {
  segments: {
    start: number
    duration: number
    loudness_max: number
    pitches: number[]
  }[]
  beats: {
    start: number
    duration: number
    confidence: number
  }[]
  sections: {
    start: number
    duration: number
    loudness_max: number
    pitches: number[]
  }[]
  bars: {
    start: number
    duration: number
    loudness_max: number
    pitches: number[]
  }[]
}

interface AudioData {
  features: {
    energy: number
    danceability: number
    valence: number
    tempo: number
  }
  synthetic: {
    beats: Array<{
      start: number
      duration: number
      confidence: number
    }>
    sections: Array<{
      start: number
      duration: number
      loudness: number
      tempo: number
      key: number
      mode: number
      time_signature: number
    }>
  }
  trackId: string
  progress_ms: number
}

interface LightTrace {
  startPoint: THREE.Vector3
  endPoint: THREE.Vector3
  progress: number
  duration: number
  startTime: number
  color: THREE.Color
}

interface SceneRefs {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  baseRenderer: THREE.WebGLRenderer
  composer: EffectComposer
  particles: THREE.Points
  traces: THREE.LineSegments
  controls: OrbitControls
  core: THREE.Mesh
  bloomPass: UnrealBloomPass
}

export default function SpotifyVisualizer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [audioData, setAudioData] = useState<AudioData | null>(null)
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const lastTrackIdRef = useRef<string | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const lightTracesRef = useRef<LightTrace[]>([])
  const sceneRef = useRef<SceneRefs | null>(null)
  
  useEffect(() => {
    const init = () => {
      if (!containerRef.current) return

      const scene = new THREE.Scene()
      scene.fog = new THREE.FogExp2(0x000000, 0.05)
      
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      const baseRenderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance"
      })
      
      baseRenderer.setSize(window.innerWidth, window.innerHeight)
      baseRenderer.setClearColor(0x000000, 0)
      baseRenderer.setPixelRatio(window.devicePixelRatio)
      containerRef.current.appendChild(baseRenderer.domElement)

      const controls = new OrbitControls(camera, baseRenderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.enableZoom = false
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.5

      camera.position.z = 5

      // Create central energy core
      const coreGeometry = new THREE.IcosahedronGeometry(1, 4)
      const coreMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          energy: { value: 0.5 },
          color1: { value: new THREE.Color(0x00ffff) },
          color2: { value: new THREE.Color(0xff00ff) }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          uniform float time;
          uniform float energy;
          
          void main() {
            vNormal = normal;
            vec3 pos = position;
            float displacement = sin(time * 2.0 + position.y * 5.0) * energy * 0.2;
            pos += normal * displacement;
            vPosition = pos;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          uniform float time;
          uniform float energy;
          uniform vec3 color1;
          uniform vec3 color2;
          
          void main() {
            float pulse = sin(time * 3.0 + length(vPosition) * 5.0) * 0.5 + 0.5;
            vec3 color = mix(color1, color2, pulse);
            float fresnel = pow(1.0 + dot(vNormal, normalize(vPosition)), 3.0);
            float glow = energy * (0.5 + pulse * 0.5);
            gl_FragColor = vec4(color * (fresnel + glow), 0.8);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
      })
      const core = new THREE.Mesh(coreGeometry, coreMaterial)
      scene.add(core)

      // Create energy field particles
      const particlesGeometry = new THREE.BufferGeometry()
      const particleCount = 15000
      const positions = new Float32Array(particleCount * 3)
      const colors = new Float32Array(particleCount * 3)
      const sizes = new Float32Array(particleCount)
      const speeds = new Float32Array(particleCount)
      const offsets = new Float32Array(particleCount)

      for (let i = 0; i < particleCount; i++) {
        const radius = 2 + Math.random() * 3
        const phi = Math.random() * Math.PI * 2
        const theta = Math.random() * Math.PI

        positions[i * 3] = radius * Math.sin(theta) * Math.cos(phi)
        positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi)
        positions[i * 3 + 2] = radius * Math.cos(theta)

        const color = new THREE.Color()
        color.setHSL(Math.random(), 0.8, 0.5)
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b

        sizes[i] = Math.random() * 3
        speeds[i] = Math.random()
        offsets[i] = Math.random() * Math.PI * 2
      }

      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
      particlesGeometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1))
      particlesGeometry.setAttribute('offset', new THREE.BufferAttribute(offsets, 1))

      const particlesMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          energy: { value: 0.5 },
          danceability: { value: 0.5 },
          texture: { value: new THREE.TextureLoader().load('/particle.png') }
        },
        vertexShader: `
          attribute float size;
          attribute float speed;
          attribute float offset;
          varying vec3 vColor;
          varying float vAlpha;
          uniform float time;
          uniform float energy;
          uniform float danceability;
          
          void main() {
            vColor = color;
            vec3 pos = position;
            float t = time * speed + offset;
            
            // Spiral motion
            float radius = length(pos.xy);
            float angle = atan(pos.y, pos.x) + t * (0.1 + danceability * 0.2);
            pos.x = radius * cos(angle);
            pos.y = radius * sin(angle);
            
            // Pulse with energy
            float pulse = sin(t * 2.0) * energy;
            pos *= 1.0 + pulse * 0.1;
            
            // Wave distortion
            pos.z += sin(t + radius * 5.0) * 0.2 * energy;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = size * (350.0 / -mvPosition.z) * (1.0 + pulse * 0.5);
            gl_Position = projectionMatrix * mvPosition;
            
            // Fade based on distance and energy
            vAlpha = (1.0 - length(pos) / 5.0) * (0.5 + energy * 0.5);
          }
        `,
        fragmentShader: `
          uniform sampler2D texture;
          varying vec3 vColor;
          varying float vAlpha;
          
          void main() {
            vec4 texColor = texture2D(texture, gl_PointCoord);
            gl_FragColor = vec4(vColor, vAlpha) * texColor;
          }
        `,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })

      const particles = new THREE.Points(particlesGeometry, particlesMaterial)
      scene.add(particles)

      // Create energy traces
      const tracesGeometry = new THREE.BufferGeometry()
      const tracesPositions = new Float32Array(2000 * 2 * 3) // 2000 lines
      const tracesColors = new Float32Array(2000 * 2 * 3)
      tracesGeometry.setAttribute('position', new THREE.BufferAttribute(tracesPositions, 3))
      tracesGeometry.setAttribute('color', new THREE.BufferAttribute(tracesColors, 3))

      const tracesMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        linewidth: 2
      })

      const traces = new THREE.LineSegments(tracesGeometry, tracesMaterial)
      scene.add(traces)

      // Add post-processing
      const composer = new EffectComposer(baseRenderer)
      const renderPass = new RenderPass(scene, camera)
      composer.addPass(renderPass)

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5,  // strength
        0.4,  // radius
        0.85  // threshold
      )
      composer.addPass(bloomPass)

      sceneRef.current = { 
        scene, 
        camera, 
        baseRenderer,
        composer, 
        particles, 
        traces, 
        controls,
        core,
        bloomPass
      }
    }

    init()

    return () => {
      if (sceneRef.current) {
        const { baseRenderer } = sceneRef.current
        containerRef.current?.removeChild(baseRenderer.domElement)
      }
    }
  }, [])

  const createLightTrace = (features: AudioData['features']) => {
    const radius = 1.5 + Math.random() * 2
    const startPhi = Math.random() * Math.PI * 2
    const startTheta = Math.random() * Math.PI
    const endPhi = startPhi + (Math.random() - 0.5) * Math.PI * features.danceability
    const endTheta = startTheta + (Math.random() - 0.5) * Math.PI * features.energy

    const startPoint = new THREE.Vector3(
      radius * Math.sin(startTheta) * Math.cos(startPhi),
      radius * Math.sin(startTheta) * Math.sin(startPhi),
      radius * Math.cos(startTheta)
    )

    const endPoint = new THREE.Vector3(
      radius * Math.sin(endTheta) * Math.cos(endPhi),
      radius * Math.sin(endTheta) * Math.sin(endPhi),
      radius * Math.cos(endTheta)
    )

    const color = new THREE.Color()
    color.setHSL(
      Math.random() * 0.2 + features.valence * 0.5,
      0.8 + features.energy * 0.2,
      0.6 + features.energy * 0.4
    )

    return {
      startPoint,
      endPoint,
      progress: 0,
      duration: 0.3 + Math.random() * 0.4 + features.danceability * 0.3,
      startTime: currentTime,
      color
    }
  }

  useEffect(() => {
    let animationFrameId: number

    const animate = (timestamp: number) => {
      if (!sceneRef.current) return

      const { scene, camera, composer, particles, traces, controls, core, bloomPass } = sceneRef.current

      // Update current time based on track progress
      if (audioData?.progress_ms !== undefined) {
        const elapsed = (Date.now() - startTimeRef.current)
        setCurrentTime((audioData.progress_ms + elapsed) / 1000)
      }

      if (audioData) {
        const { features, synthetic } = audioData
        
        // Update core shader uniforms
        const coreMaterial = core.material as THREE.ShaderMaterial
        coreMaterial.uniforms.time.value = currentTime
        coreMaterial.uniforms.energy.value = features.energy
        coreMaterial.uniforms.color1.value.setHSL(
          features.valence * 0.5,
          0.8,
          0.6 + features.energy * 0.4
        )
        coreMaterial.uniforms.color2.value.setHSL(
          (features.valence * 0.5 + 0.5) % 1,
          0.8,
          0.6 + features.energy * 0.4
        )

        // Update particle shader uniforms
        const particlesMaterial = particles.material as THREE.ShaderMaterial
        particlesMaterial.uniforms.time.value = currentTime
        particlesMaterial.uniforms.energy.value = features.energy
        particlesMaterial.uniforms.danceability.value = features.danceability

        // Update bloom intensity based on energy
        bloomPass.strength = 1 + features.energy

        // Find current beat
        const currentBeat = synthetic.beats.find(b => 
          b.start <= currentTime && b.start + b.duration > currentTime
        )

        // Create new traces on beats with energy-based probability
        if (currentBeat && Math.random() < features.energy * 1.5) {
          const numTraces = Math.floor(2 + features.energy * 4)
          for (let i = 0; i < numTraces; i++) {
            lightTracesRef.current.push(createLightTrace(features))
          }
        }

        // Update traces with curved paths and glow
        const tracesPositions = traces.geometry.attributes.position.array as Float32Array
        const tracesColors = traces.geometry.attributes.color.array as Float32Array
        let traceIndex = 0

        lightTracesRef.current = lightTracesRef.current.filter(trace => {
          const age = currentTime - trace.startTime
          if (age > trace.duration) return false

          const progress = age / trace.duration
          
          // Create curved path using quadratic bezier
          const control = new THREE.Vector3()
          control.addVectors(trace.startPoint, trace.endPoint).multiplyScalar(0.5)
          control.normalize().multiplyScalar(
            trace.startPoint.length() * (1 + features.energy * 0.5)
          )

          const pos = new THREE.Vector3()
          pos.x = Math.pow(1 - progress, 2) * trace.startPoint.x + 
                 2 * (1 - progress) * progress * control.x + 
                 Math.pow(progress, 2) * trace.endPoint.x
          pos.y = Math.pow(1 - progress, 2) * trace.startPoint.y + 
                 2 * (1 - progress) * progress * control.y + 
                 Math.pow(progress, 2) * trace.endPoint.y
          pos.z = Math.pow(1 - progress, 2) * trace.startPoint.z + 
                 2 * (1 - progress) * progress * control.z + 
                 Math.pow(progress, 2) * trace.endPoint.z

          if (traceIndex < 2000) {
            // Start point
            tracesPositions[traceIndex * 6] = trace.startPoint.x
            tracesPositions[traceIndex * 6 + 1] = trace.startPoint.y
            tracesPositions[traceIndex * 6 + 2] = trace.startPoint.z
            // End point
            tracesPositions[traceIndex * 6 + 3] = pos.x
            tracesPositions[traceIndex * 6 + 4] = pos.y
            tracesPositions[traceIndex * 6 + 5] = pos.z

            // Color with energy-based glow
            const alpha = Math.sin(progress * Math.PI) * (1 + features.energy * 0.5)
            tracesColors[traceIndex * 6] = trace.color.r
            tracesColors[traceIndex * 6 + 1] = trace.color.g
            tracesColors[traceIndex * 6 + 2] = trace.color.b
            tracesColors[traceIndex * 6 + 3] = trace.color.r * alpha
            tracesColors[traceIndex * 6 + 4] = trace.color.g * alpha
            tracesColors[traceIndex * 6 + 5] = trace.color.b * alpha

            traceIndex++
          }

          return true
        })

        // Clear unused traces
        for (let i = traceIndex; i < 2000; i++) {
          for (let j = 0; j < 6; j++) {
            tracesPositions[i * 6 + j] = 0
            tracesColors[i * 6 + j] = 0
          }
        }

        traces.geometry.attributes.position.needsUpdate = true
        traces.geometry.attributes.color.needsUpdate = true

        // Dynamic camera movement based on energy and tempo
        const tempoScale = features.tempo / 120
        const energyScale = features.energy
        controls.autoRotateSpeed = 0.2 + tempoScale * energyScale
        camera.position.y = Math.sin(currentTime * 0.2) * features.danceability
        camera.lookAt(scene.position)
      }

      controls.update()
      composer.render()
      animationFrameId = requestAnimationFrame(animate)
    }

    animate(performance.now())

    const handleResize = () => {
      if (!sceneRef.current || !containerRef.current) return
      const { camera, baseRenderer } = sceneRef.current
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      baseRenderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    // Fetch track data periodically
    const fetchData = async () => {
      try {
        const [trackDataRes, nowPlayingRes] = await Promise.all([
          fetch("/api/spotify/audio-analysis"),
          fetch("/api/spotify/now-playing")
        ])

        if (trackDataRes.ok) {
          const data = await trackDataRes.json()
          console.log("Received track data:", {
            trackId: data.trackId,
            progress: data.progress_ms,
            features: data.features,
            beats: data.synthetic.beats.length,
            sections: data.synthetic.sections.length
          })
          
          // Reset time when track changes
          if (lastTrackIdRef.current !== data.trackId) {
            console.log("Track changed, resetting time")
            startTimeRef.current = Date.now()
            setCurrentTime((data.progress_ms || 0) / 1000)
            lastTrackIdRef.current = data.trackId
          }
          
          setAudioData(data)
        }

        if (nowPlayingRes.ok) {
          const track = await nowPlayingRes.json()
          setNowPlaying(track)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 2000)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      clearInterval(interval)
    }
  }, [audioData])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" />
      {nowPlaying && (
        <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg">
          <h2 className="font-semibold">{nowPlaying.name}</h2>
          <p className="text-sm text-muted-foreground">
            {nowPlaying.artists.map(a => a.name).join(", ")}
          </p>
        </div>
      )}
    </div>
  )
}

