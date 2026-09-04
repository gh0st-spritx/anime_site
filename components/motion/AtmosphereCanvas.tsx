'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMotionIntensity } from './MotionContext.tsx';
import { useActiveAct } from './useActiveAct.ts';
import {
  ATMOSPHERE,
  DEFAULT_ATMOSPHERE,
  MAX_PARTICLES,
  type Atmosphere,
} from './atmosphere.ts';

const VERTEX = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uSize;
  uniform vec2 uDrift;
  uniform float uSway;
  uniform float uCount;
  varying float vFade;

  void main() {
    // Particles beyond the active act's count are faded out rather than
    // reallocated — one buffer, allocated once, for every act.
    // NOTE: 'active' is a reserved word in GLSL ES; do not rename this back.
    float inUse = step(float(gl_VertexID), uCount);

    vec3 p = position;
    float t = uTime;

    p.x += uDrift.x * t + sin(t * 0.6 + aSeed * 6.28) * uSway * 0.12;
    p.y -= uDrift.y * t;

    // Wrap in a 2x2 clip-space box so the field never empties out.
    p.x = fract((p.x + 1.0) * 0.5) * 2.0 - 1.0;
    p.y = fract((p.y + 1.0) * 0.5) * 2.0 - 1.0;

    // Fade at the vertical edges so nothing pops in or out.
    vFade = smoothstep(1.0, 0.72, abs(p.y)) * inUse;

    gl_Position = vec4(p.xy, 0.0, 1.0);
    gl_PointSize = uSize * (0.6 + aSeed * 0.8);
  }
`;

const FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFade;

  void main() {
    // Round, soft-edged points. Discarding outside the disc avoids square dots.
    vec2 d = gl_PointCoord - vec2(0.5);
    float r = length(d);
    if (r > 0.5) discard;

    float soft = smoothstep(0.5, 0.06, r);
    gl_FragColor = vec4(uColor, soft * uOpacity * vFade);
  }
`;

function ParticleField({ actKey }: { actKey: string }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const target = ATMOSPHERE[actKey] ?? DEFAULT_ATMOSPHERE;

  // Allocated once at the largest count any act needs; the shader masks the
  // rest. Reallocating a buffer on every act change would hitch the scroll.
  const geometry = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const seeds = new Float32Array(MAX_PARTICLES);
    for (let i = 0; i < MAX_PARTICLES; i++) {
      positions[i * 3] = Math.random() * 2 - 1;
      positions[i * 3 + 1] = Math.random() * 2 - 1;
      positions[i * 3 + 2] = 0;
      seeds[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    return g;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: DEFAULT_ATMOSPHERE.size },
      uDrift: { value: new THREE.Vector2(...DEFAULT_ATMOSPHERE.drift) },
      uSway: { value: DEFAULT_ATMOSPHERE.sway },
      uColor: { value: new THREE.Color(...DEFAULT_ATMOSPHERE.color) },
      uOpacity: { value: 0 },
      uCount: { value: DEFAULT_ATMOSPHERE.count },
    }),
    [],
  );

  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;

    const u = material.uniforms;
    u.uTime.value += delta;

    // Ease toward the new act's parameters so the atmosphere changes with the
    // scene instead of cutting.
    const k = Math.min(1, delta * 1.6);
    const lerp = (a: number, b: number) => a + (b - a) * k;

    u.uOpacity.value = lerp(u.uOpacity.value, target.opacity);
    u.uSize.value = lerp(u.uSize.value, target.size);
    u.uSway.value = lerp(u.uSway.value, target.sway);
    u.uCount.value = lerp(u.uCount.value, target.count);
    (u.uDrift.value as THREE.Vector2).lerp(
      new THREE.Vector2(target.drift[0], target.drift[1]),
      k,
    );
    (u.uColor.value as THREE.Color).lerp(
      new THREE.Color(target.color[0], target.color[1], target.color[2]),
      k,
    );
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Whether this device should render the atmosphere at all. */
function useCanRender(): boolean {
  const [can, setCan] = useState(false);

  useEffect(() => {
    const wideEnough = window.matchMedia('(min-width: 768px)').matches;
    // A low core count is the cheapest available proxy for a weak GPU.
    const capable = (navigator.hardwareConcurrency ?? 8) > 4;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    setCan(wideEnough && capable && !coarse);
  }, []);

  return can;
}

/**
 * A single fixed canvas carrying every act's atmosphere.
 *
 * It sits ABOVE the acts with additive blending, so the motes read as dust in
 * front of the lens rather than behind an opaque background. It never receives
 * pointer events and is hidden from assistive technology — this is set
 * dressing, and the story is carried entirely by the text underneath.
 */
export default function AtmosphereCanvas() {
  const intensity = useMotionIntensity();
  const actKey = useActiveAct();
  const canRender = useCanRender();

  if (intensity !== 'full' || !canRender) return null;

  return (
    <div className="atmosphere" aria-hidden="true">
      <Canvas
        orthographic
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        style={{ pointerEvents: 'none' }}
      >
        <ParticleField actKey={actKey} />
      </Canvas>
    </div>
  );
}
