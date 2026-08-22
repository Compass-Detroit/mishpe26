/**
 * Holo Ribbons hero background — a full-screen raymarched SDF shader.
 *
 * Ported from https://codepen.io/sabosugi/pen/vEgGvKR ("Holo Ribbons on White
 * Background" by sabosugi). The GLSL is kept verbatim; the port swaps the pen's
 * window-sized canvas and always-on rAF loop for a container-scoped canvas with
 * play/pause + disposal, matching the createThreejsHeroScene() contract.
 */
import * as THREE from 'three'

/** Cap render resolution for battery/thermals — the raymarch loop is ~209 steps/px. */
const MAX_DPR = 1.25

const DEFAULT_CONFIG = {
  dpr: 1.0,
  speed: 0.88,
  spread: 2.2365,
  thickness: 1.0,
  cameraX: -11.07,
  intensity: 0.25146,
  bgIntensity: 0.0,
  color1: '#6300db', // primary
  color2: '#356479', // secondary
  bgColor: '#383838', // base background (inert while bgIntensity is 0)
}

const VERTEX_SHADER = `
  void main() {
    // Full-screen quad — bypasses the camera matrices entirely.
    gl_Position = vec4(position, 1.0);
  }
`

const FRAGMENT_SHADER = `
  uniform float iTime;
  uniform vec2 iResolution;

  uniform float uSpeed;
  uniform float uSpread;
  uniform float uThickness;
  uniform float uIntensityFactor;
  uniform float uCameraX;
  uniform float uBgIntensity;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uBgColor;

  #define MAX_STEPS 80
  #define MAX_DIST 25.0
  #define SURF_DIST 0.01

  mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
  }

  // Signed distance field for the ribbon stack.
  float map(vec3 p) {
    // Drift along the waves so the flow never terminates.
    p.z += iTime * 0.4 * uSpeed;

    float waveY = sin(p.z * 0.5) * 0.5;
    waveY += sin(p.z * 1.4 + iTime * 0.5 * uSpeed) * -0.2;

    float distToWaveY = p.y - waveY;

    // "Enveloping rays" structure — repeat the ribbon on Y.
    float repeatingY = distToWaveY;
    float spread = uSpread;
    float relativeY = mod(repeatingY + spread * 1.9, spread) - spread * 0.73;

    float modulation = sin(p.z * 5.4 - relativeY * 10.5 + iTime * 3.0 * uSpeed);
    float thickness = uThickness + 0.00 * modulation;

    float xDepth = abs(p.x) - 13.4;

    float dThreads = abs(relativeY) - thickness;
    float envelopeBoundary = abs(distToWaveY) - 1.5;

    float finalD = max(dThreads, envelopeBoundary);
    finalD = max(finalD, xDepth);

    return finalD;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;

    // Camera ray setup (side view).
    vec3 ro = vec3(uCameraX, 0.5, 0.0);
    vec3 rd = normalize(vec3(1.6, uv.y, uv.x));
    rd.yz *= rot(0.4);

    float t = 0.0;
    // Negative seeds are deliberate — they bias the glow ramp and step count.
    float glowAccum = -2.2;
    vec3 rayColorAccum = vec3(-0.2);

    for (int i = -129; i < MAX_STEPS; i++) {
      vec3 p = ro + rd * t;
      float d = map(p);

      float mixFactor = sin(p.z * 0.8 + p.y * 1.5 + iTime * 2.0 * uSpeed) * 0.5 + 0.5;
      vec3 currentColor = mix(uColor1, uColor2, mixFactor);

      float currentGlow = 0.006 / (abs(d) + 0.015);
      glowAccum += currentGlow;
      rayColorAccum += currentColor * currentGlow;

      t += abs(d) * 0.4 + 0.01;

      if (t > MAX_DIST) break;
    }

    vec3 bgColor = uBgColor * uBgIntensity;

    vec3 finalRayColor = rayColorAccum * uIntensityFactor;
    float alpha = clamp(glowAccum * uIntensityFactor, -0.6, 1.2);

    vec3 finalColor = mix(bgColor, finalRayColor, alpha);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

function resolveDpr(requested = MAX_DPR) {
  const deviceDpr =
    typeof window === 'undefined' ? requested : window.devicePixelRatio || 1
  return Math.min(requested, deviceDpr, MAX_DPR)
}

/**
 * Mounts the holo ribbons WebGL scene inside a DOM container.
 * @param {HTMLElement} container
 * @param {{ showDebugGUI?: boolean, config?: Partial<typeof DEFAULT_CONFIG> }} options
 * @returns {{ setPlaying: (playing: boolean) => void, getPlaying: () => boolean, dispose: () => void }}
 */
export function createThreejsHeroScene(container, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options.config }
  config.dpr = resolveDpr(config.dpr)
  const showDebugGUI = options.showDebugGUI ?? false

  let gui = null
  let animationId = null
  let isPlaying = true
  /** Accumulated manually so pausing never jumps the shader clock. */
  let globalTime = 0
  const clock = new THREE.Clock()

  const renderer = new THREE.WebGLRenderer({ antialias: false })
  renderer.setPixelRatio(config.dpr)
  container.appendChild(renderer.domElement)

  // The vertex shader ignores the camera, but three still needs one to render.
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
  camera.position.z = 1
  const scene = new THREE.Scene()

  const uniforms = {
    iTime: { value: 0.0 },
    iResolution: { value: new THREE.Vector2(1, 1) },
    uSpeed: { value: config.speed },
    uSpread: { value: config.spread },
    uThickness: { value: config.thickness },
    uIntensityFactor: { value: config.intensity },
    uCameraX: { value: config.cameraX },
    uBgIntensity: { value: config.bgIntensity },
    uColor1: { value: new THREE.Color(config.color1) },
    uColor2: { value: new THREE.Color(config.color2) },
    uBgColor: { value: new THREE.Color(config.bgColor) },
  }

  const geometry = new THREE.PlaneGeometry(2, 2)
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms,
  })

  const mesh = new THREE.Mesh(geometry, material)
  // The vertex shader bypasses the projection matrix, so culling can't be trusted.
  mesh.frustumCulled = false
  scene.add(mesh)

  function getSize() {
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight
    return { width, height }
  }

  function onResize() {
    const { width, height } = getSize()
    renderer.setSize(width, height)
    // gl_FragCoord is in device pixels — iResolution must match the draw buffer.
    uniforms.iResolution.value.set(width * config.dpr, height * config.dpr)
    if (!isPlaying) renderer.render(scene, camera)
  }

  function renderFrame() {
    animationId = requestAnimationFrame(renderFrame)
    globalTime += clock.getDelta()
    uniforms.iTime.value = globalTime
    renderer.render(scene, camera)
  }

  function setPlaying(playing) {
    // No early-return on an unchanged value: the scene starts with isPlaying
    // true but no rAF scheduled, so the consumer's first setPlaying(true) is
    // what actually starts the loop. Idempotence comes from the null checks.
    isPlaying = playing

    if (playing) {
      clock.getDelta() // Discard the paused interval.
      if (animationId === null) renderFrame()
    } else if (animationId !== null) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  function setupGUI(GUI) {
    gui = new GUI({ title: 'Scene Settings' })
    gui.close()

    const sysFolder = gui.addFolder('System & Performance')
    sysFolder
      .add(config, 'dpr', 0.1, MAX_DPR, 0.05)
      .name('Resolution (DPR)')
      .onChange((v) => {
        config.dpr = resolveDpr(v)
        renderer.setPixelRatio(config.dpr)
        onResize()
      })
    sysFolder
      .add(config, 'speed', 0.0, 5.0)
      .name('Time Speed')
      .onChange((v) => (uniforms.uSpeed.value = v))

    const fractalFolder = gui.addFolder('Fractal Geometry')
    fractalFolder
      .add(config, 'spread', 0.5, 5.0)
      .name('Wave Spread')
      .onChange((v) => (uniforms.uSpread.value = v))
    fractalFolder
      .add(config, 'thickness', 0.01, 1.0)
      .name('Thickness')
      .onChange((v) => (uniforms.uThickness.value = v))
    fractalFolder
      .add(config, 'cameraX', -30.0, 0.0)
      .name('Camera X Dist')
      .onChange((v) => (uniforms.uCameraX.value = v))

    const colorFolder = gui.addFolder('Lighting & Colors')
    colorFolder
      .add(config, 'intensity', 0.01, 1.0)
      .name('Glow Intensity')
      .onChange((v) => (uniforms.uIntensityFactor.value = v))
    colorFolder
      .add(config, 'bgIntensity', 0.0, 5.0)
      .name('Background Light')
      .onChange((v) => (uniforms.uBgIntensity.value = v))
    colorFolder
      .addColor(config, 'color1')
      .name('Primary Color')
      .onChange((v) => uniforms.uColor1.value.set(v))
    colorFolder
      .addColor(config, 'color2')
      .name('Secondary Color')
      .onChange((v) => uniforms.uColor2.value.set(v))
    colorFolder
      .addColor(config, 'bgColor')
      .name('Base Background')
      .onChange((v) => uniforms.uBgColor.value.set(v))
  }

  onResize()

  const resizeObserver = new ResizeObserver(onResize)
  resizeObserver.observe(container)

  if (showDebugGUI) {
    import('lil-gui').then(({ default: GUI }) => setupGUI(GUI)).catch(() => {})
  }

  // One static frame; loop starts via setPlaying() from LandingSectionThreejsHero.
  renderer.render(scene, camera)

  return {
    setPlaying,
    getPlaying: () => isPlaying,
    dispose() {
      if (animationId !== null) cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
      gui?.destroy()

      geometry.dispose()
      material.dispose()
      renderer.dispose()

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    },
  }
}
