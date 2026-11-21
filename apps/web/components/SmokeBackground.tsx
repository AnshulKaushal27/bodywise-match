"use client";

import * as React from "react";
import { useMotion } from "@/lib/motion";

// ==========================================
// EXPOSED TUNING CONSTANTS (Brand & Performance)
// ==========================================
export const SMOKE_CONSTANTS = {
  SPEED: 0.025,
  DENSITY: 1.0,
  SCALE: 2.2,
  ACCENT_MAX: 0.25, // Capped at 0.25 for brand softness and contrast safety
  LIME_MAX: 0.25, // Token alias for backward compatibility
  ALPHA: 0.62, // 0.55 - 0.70 soft haze range
  DEPTH_MAX: 0.07, // Depth blue accent (#3B82F6 at max 7%)
  EVERGREEN_MAX: 0.07, // Token alias for backward compatibility
  ENABLE_POINTER: true,
  TARGET_FPS: 30,
  MAX_FRAME_TIME_MS: 24, // Threshold for adaptive fallback
  ADAPTIVE_SAMPLE_FRAMES: 60,
} as const;

// Color vectors (Brand Lock White + Blue tokens)
// Paper #F5F9FF: [0.961, 0.976, 1.000]
// Sky #E3EEFC:   [0.890, 0.933, 0.988]
// Accent #BBD9FF: [0.733, 0.851, 1.000]
// Depth Blue #3B82F6: [0.231, 0.510, 0.965]
// Primary Blue #1D4ED8: [0.114, 0.306, 0.847]

const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;

varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;
uniform float u_pointer_active;
uniform float u_scale;
uniform float u_accent_max;
uniform float u_alpha;
uniform float u_depth_max;
uniform int u_octaves;

// Simple 2D pseudo-random hash
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// 2D Gradient Noise
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// Fractal Brownian Motion (octaves 2 to 4)
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 4; ++i) {
    if (i >= u_octaves) break;
    v += a * noise(p);
    p = rot * p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = vec2(st.x * aspect, st.y) * u_scale;

  // Gentle pointer breeze repulsion (desktop fine pointer only)
  if (u_pointer_active > 0.5) {
    vec2 pointerCoord = vec2(u_pointer.x * aspect, u_pointer.y) * u_scale;
    float dist = length(p - pointerCoord);
    float radius = 0.28 * u_scale * aspect;
    if (dist < radius) {
      float force = smoothstep(radius, 0.0, dist) * 0.35;
      vec2 dir = normalize(p - pointerCoord + vec2(0.001));
      p += dir * force;
    }
  }

  // Prevailing diagonal wind: smoke streams traveling across the screen from left to right
  float t = u_time * 6.0;
  vec2 wind = vec2(0.68, 0.28) * t;

  // Domain Warping for fluid curling filaments
  vec2 a = vec2(0.85, 0.45);
  vec2 b = vec2(-0.55, 0.70);

  vec2 q = vec2(fbm(p - wind + a), fbm(p - wind + vec2(a.y, -a.x)));
  vec2 r = vec2(fbm(p + 3.2 * q + t * b), fbm(p + 3.2 * q + t * vec2(-b.y, b.x)));
  float f = fbm(p + 3.4 * r);

  // Normalize f [-0.5, 0.5] to [0.0, 1.0]
  float nf = clamp(0.5 + 0.5 * f, 0.0, 1.0);

  // Ribbon Stream Shaping:
  // Creates distinct flowing currents across the screen rather than an all-over flood
  float streamWave = sin(p.x * 1.3 - p.y * 1.7 + q.x * 2.6 - t * 0.75);
  float streamMod = smoothstep(-0.35, 0.55, streamWave);

  // Clear separation: 0 in negative space, dense and vibrant within the plume
  float plume = smoothstep(0.34, 0.72, nf) * streamMod;
  float density = pow(plume, 1.4);

  // Brand Palette Mapping for Explicit, Vivid Blue Smoke Wisps
  // Crisp Ice Blue Mist at outer wisp edges
  vec3 iceMist = vec3(0.816, 0.910, 0.992);
  // Azure Core Bloom
  vec3 azureBlue = vec3(0.482, 0.722, 0.980);
  // Vibrant Decorative Cerulean
  vec3 cerulean = vec3(0.231, 0.510, 0.965);
  // Royal Blue Spine
  vec3 royalSpine = vec3(0.114, 0.306, 0.847);

  // Rich organic multi-layered blue smoke color transition
  vec3 col = mix(iceMist, azureBlue, smoothstep(0.12, 0.45, density));
  col = mix(col, cerulean, smoothstep(0.40, 0.75, density));
  col = mix(col, royalSpine, smoothstep(0.70, 1.0, density) * (u_depth_max * 3.5 + 0.40));

  // Explicit smoke alpha: 0 in clear space, up to 0.65 in core plumes
  float smokeAlpha = density * u_alpha * 1.15;

  // Soft edge falloff at viewport bounds
  float edgeFade = smoothstep(0.0, 0.08, st.x) * smoothstep(1.0, 0.92, st.x) *
                   smoothstep(0.0, 0.10, st.y) * smoothstep(1.0, 0.88, st.y);
  smokeAlpha *= edgeFade;

  // Static tiny grain term to prevent color banding
  float grain = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.015;
  col += grain;

  gl_FragColor = vec4(col, smokeAlpha);
}
`;

// Layer 1 Ambient Moving Blue Smoke Streams (Directional & Crossing the Screen)
export function AmbientFallback() {
  return (
    <div
      data-ambient-fallback="true"
      className="absolute inset-0 pointer-events-none -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Stream 1: Upper diagonal smoke stream drifting across the screen */}
      <div className="absolute top-[8%] -left-[10%] w-[110%] max-w-[950px] h-[190px] rounded-[100px] bg-gradient-to-r from-transparent via-[#93C5FD]/40 via-[#60A5FA]/30 to-transparent blur-[85px] animate-smoke-stream-1 pointer-events-none" />

      {/* Stream 2: Lower counter-diagonal smoke stream curling across */}
      <div className="absolute top-[48%] -right-[8%] w-[105%] max-w-[850px] h-[170px] rounded-[90px] bg-gradient-to-l from-transparent via-[#60A5FA]/30 via-[#3B82F6]/20 to-transparent blur-[80px] animate-smoke-stream-2 pointer-events-none" />
    </div>
  );
}

export function SmokeBackground() {
  const { isMotionOn, isTabVisible } = useMotion();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const [hasWebGlError, setHasWebGlError] = React.useState(false);
  const [isReadyToFadeIn, setIsReadyToFadeIn] = React.useState(false);
  const [octaves, setOctaves] = React.useState<number>(4);
  const [scale, setScale] = React.useState<number>(SMOKE_CONSTANTS.SCALE);
  const [isIntersecting, setIsIntersecting] = React.useState(true);

  // Animation & WebGL state
  const glRef = React.useRef<WebGLRenderingContext | null>(null);
  const programRef = React.useRef<WebGLProgram | null>(null);
  const animFrameIdRef = React.useRef<number | null>(null);
  const frameCountRef = React.useRef<number>(0);
  const totalRenderFramesRef = React.useRef<number>(0);
  const totalElapsedRef = React.useRef<number>(0);
  const frameTimesRef = React.useRef<number[]>([]);
  const pointerPosRef = React.useRef<{ x: number; y: number; active: boolean }>({
    x: 0.5,
    y: 0.5,
    active: false,
  });
  const smoothedPointerRef = React.useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  // 1. Initial delayed mount for LCP/CLS preservation
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsReadyToFadeIn(true);
    }, 280);
    return () => clearTimeout(timer);
  }, []);

  // 2. IntersectionObserver for viewport pausing
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsIntersecting(entry.isIntersecting);
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // 3. Pointer tracking for gentle breeze interaction
  React.useEffect(() => {
    if (!SMOKE_CONSTANTS.ENABLE_POINTER || !isMotionOn) return;

    const container = containerRef.current;
    if (!container) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // Touch devices disabled
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height; // WebGL UV flip
      pointerPosRef.current = { x, y, active: true };
    };

    const handlePointerLeave = () => {
      pointerPosRef.current.active = false;
    };

    container.addEventListener("pointermove", handlePointerMove, { passive: true });
    container.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    return () => {
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [isMotionOn]);

  // 4. WebGL Setup & Render Loop
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        powerPreference: "low-power",
        premultipliedAlpha: false,
      });
    } catch {
      gl = null;
    }

    if (!gl) {
      setHasWebGlError(true);
      return;
    }

    glRef.current = gl;

    // Helper: Shader compilation
    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);

    if (!vertShader || !fragShader) {
      setHasWebGlError(true);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setHasWebGlError(true);
      return;
    }

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setHasWebGlError(true);
      return;
    }

    programRef.current = program;
    gl.useProgram(program);

    // Fullscreen single triangle covering [-1, 1] clip space
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1.0, -1.0, 3.0, -1.0, -1.0, 3.0]),
      gl.STATIC_DRAW
    );

    const aPositionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPositionLocation);
    gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uPointer = gl.getUniformLocation(program, "u_pointer");
    const uPointerActive = gl.getUniformLocation(program, "u_pointer_active");
    const uScale = gl.getUniformLocation(program, "u_scale");
    const uAccentMax = gl.getUniformLocation(program, "u_accent_max") || gl.getUniformLocation(program, "u_lime_max");
    const uAlpha = gl.getUniformLocation(program, "u_alpha");
    const uDepthMax = gl.getUniformLocation(program, "u_depth_max") || gl.getUniformLocation(program, "u_evergreen_max");
    const uOctaves = gl.getUniformLocation(program, "u_octaves");

    // Static uniforms
    if (uAccentMax) gl.uniform1f(uAccentMax, SMOKE_CONSTANTS.ACCENT_MAX);
    if (uAlpha) gl.uniform1f(uAlpha, SMOKE_CONSTANTS.ALPHA);
    if (uDepthMax) gl.uniform1f(uDepthMax, SMOKE_CONSTANTS.DEPTH_MAX);

    // Resize handler (low-resolution buffer: 0.5 desktop, 0.35 mobile)
    const handleResize = () => {
      if (!canvas || !gl) return;
      const rect = canvas.getBoundingClientRect();
      const isMobile = rect.width < 640;
      const resScale = isMobile ? 0.35 : 0.50;

      const bufWidth = Math.max(1, Math.round(rect.width * resScale));
      const bufHeight = Math.max(1, Math.round(rect.height * resScale));

      if (canvas.width !== bufWidth || canvas.height !== bufHeight) {
        canvas.width = bufWidth;
        canvas.height = bufHeight;
        gl.viewport(0, 0, bufWidth, bufHeight);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });

    // WebGL Context recovery handlers
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };

    const handleContextRestored = () => {
      // Re-trigger component initialization
      setHasWebGlError(false);
    };

    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

    // Single static frame renderer (used for reduced motion or fallback)
    const renderSingleFrame = (simulatedTime = 12.0) => {
      if (!gl || !program) return;
      gl.useProgram(program);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, simulatedTime * SMOKE_CONSTANTS.SPEED);
      gl.uniform2f(uPointer, 0.5, 0.5);
      gl.uniform1f(uPointerActive, 0.0);
      gl.uniform1f(uScale, scale);
      gl.uniform1i(uOctaves, octaves);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // If motion is off or reduced motion is preferred: render single static frame and exit
    if (!isMotionOn) {
      renderSingleFrame(12.0);
      return () => {
        window.removeEventListener("resize", handleResize);
        canvas.removeEventListener("webglcontextlost", handleContextLost);
        canvas.removeEventListener("webglcontextrestored", handleContextRestored);
        if (positionBuffer) gl?.deleteBuffer(positionBuffer);
        if (program) gl?.deleteProgram(program);
      };
    }

    // Animation loop capped at TARGET_FPS (30 fps)
    const interval = 1000 / SMOKE_CONSTANTS.TARGET_FPS;
    let lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      if (!isTabVisible || !isIntersecting) {
        // Paused while tab is hidden or off-screen
        animFrameIdRef.current = requestAnimationFrame(loop);
        return;
      }

      const elapsed = timestamp - lastTimestamp;
      if (elapsed >= interval) {
        lastTimestamp = timestamp - (elapsed % interval);
        const deltaSeconds = Math.min(elapsed / 1000, 0.1);
        totalElapsedRef.current += deltaSeconds;

        // Adaptive frame-time measurement for first 60 frames
        if (frameCountRef.current < SMOKE_CONSTANTS.ADAPTIVE_SAMPLE_FRAMES) {
          frameTimesRef.current.push(elapsed);
          frameCountRef.current++;

          if (frameCountRef.current === SMOKE_CONSTANTS.ADAPTIVE_SAMPLE_FRAMES) {
            const avgTime =
              frameTimesRef.current.reduce((a, b) => a + b, 0) /
              frameTimesRef.current.length;

            if (avgTime > SMOKE_CONSTANTS.MAX_FRAME_TIME_MS) {
              // Degradation step: drop to 2 octaves and 0.3 scale
              setOctaves(2);
              setScale(1.5);
            }
          }
        }

        // Pointer lerping (0.08 smoothing)
        const target = pointerPosRef.current;
        smoothedPointerRef.current.x += (target.x - smoothedPointerRef.current.x) * 0.08;
        smoothedPointerRef.current.y += (target.y - smoothedPointerRef.current.y) * 0.08;

        // Set dynamic uniforms
        gl.useProgram(program);
        gl.uniform2f(uResolution, canvas.width, canvas.height);
        gl.uniform1f(uTime, totalElapsedRef.current * SMOKE_CONSTANTS.SPEED);
        gl.uniform2f(uPointer, smoothedPointerRef.current.x, smoothedPointerRef.current.y);
        gl.uniform1f(uPointerActive, target.active ? 1.0 : 0.0);
        gl.uniform1f(uScale, scale);
        gl.uniform1i(uOctaves, octaves);

        // Expose debug frame counter on canvas element for verification
        totalRenderFramesRef.current++;
        canvas.setAttribute("data-frame-count", String(totalRenderFramesRef.current));

        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    // Cleanup GL resources on unmount
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);

      if (positionBuffer) gl?.deleteBuffer(positionBuffer);
      if (vertShader) gl?.deleteShader(vertShader);
      if (fragShader) gl?.deleteShader(fragShader);
      if (program) gl?.deleteProgram(program);
    };
  }, [isMotionOn, isTabVisible, isIntersecting, octaves, scale]);

  if (hasWebGlError) {
    return <AmbientFallback />;
  }

  return (
    <div
      ref={containerRef}
      data-smoke-background="true"
      className={`absolute inset-0 -z-10 pointer-events-none select-none overflow-hidden transition-opacity duration-1000 ease-out ${
        isReadyToFadeIn ? "opacity-100" : "opacity-0"
      }`}
      style={{
        // Seamless bottom fade to paper background
        maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
      }}
      aria-hidden="true"
    >
      {/* Layer 1: Ambient Moving Blue Hue Blooms (Always smooth & active) */}
      <AmbientFallback />

      {/* Layer 2: WebGL Organic Smoke Canvas */}
      <canvas
        ref={canvasRef}
        data-smoke-canvas="true"
        className="w-full h-full block relative z-10"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
        tabIndex={-1}
      />
    </div>
  );
}
