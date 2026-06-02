'use client';

import { useEffect, useRef, useState } from 'react';
import TopBar from '@/components/TopBar';
import { RotateCcw, Play, Pause, Box } from 'lucide-react';

export default function AssemblyPage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<unknown>(null);
  const sceneRef = useRef<unknown>(null);
  const cameraRef = useRef<unknown>(null);
  const modelRef = useRef<unknown>(null);
  const frameRef = useRef<number>(0);
  const sphericalRef = useRef({ theta: 0.4, phi: 1.1, radius: 3 });
  const targetRef = useRef({ x: 0, y: 0, z: 0 });
  const dragRef = useRef({ active: false, right: false, lastX: 0, lastY: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const autoRotateRef = useRef(false);
  const wireframeRef = useRef(false);

  const updateCamera = () => {
    const THREE = (window as unknown as { THREE: unknown }).THREE as { [key: string]: unknown };
    if (!cameraRef.current || !THREE) return;
    const { theta, phi, radius } = sphericalRef.current;
    const { x, y, z } = targetRef.current;
    const cam = cameraRef.current as { position: { set: (x: number, y: number, z: number) => void }; lookAt: (x: number, y: number, z: number) => void };
    cam.position.set(
      x + radius * Math.sin(phi) * Math.sin(theta),
      y + radius * Math.cos(phi),
      z + radius * Math.sin(phi) * Math.cos(theta)
    );
    cam.lookAt(x, y, z);
  };

  useEffect(() => {
    let mounted = true;

    const loadThree = async () => {
      // Use dynamic ES module import — GLTFLoader is bundled with three via esm.sh
      const THREE_MOD = await import('https://esm.sh/three@0.128.0' as string) as unknown;
      const { GLTFLoader } = await import('https://esm.sh/three@0.128.0/examples/jsm/loaders/GLTFLoader.js' as string) as { GLTFLoader: new () => { load: (url: string, onLoad: (gltf: { scene: unknown }) => void, onProgress: () => void, onError: () => void) => void } };
      (window as unknown as { THREE: unknown; GLTFLoader: unknown }).THREE = THREE_MOD;
      (window as unknown as { THREE: unknown; GLTFLoader: unknown; _GLTFLoader: unknown })._GLTFLoader = GLTFLoader;

      if (!mounted || !mountRef.current) return;

      const THREE = (window as unknown as { THREE: { [key: string]: unknown } }).THREE as { [key: string]: unknown };
      const W = mountRef.current.clientWidth;
      const H = mountRef.current.clientHeight;

      // Scene — background matches theme
      const scene = new (THREE.Scene as new () => { background: unknown; environment: unknown; add: (obj: unknown) => void })();
      const isDark = document.documentElement.classList.contains('dark')
        || document.documentElement.getAttribute('data-theme') === 'dark'
        || window.matchMedia('(prefers-color-scheme: dark)').matches;
      (scene as { background: unknown }).background = new (THREE.Color as new (c: number) => unknown)(isDark ? 0x1e1e1e : 0xf0eeeb);
      sceneRef.current = scene;

      // Camera
      const camera = new (THREE.PerspectiveCamera as new (fov: number, aspect: number, near: number, far: number) => unknown)(45, W / H, 0.01, 1000);
      cameraRef.current = camera;
      updateCamera();

      // Renderer
      const renderer = new (THREE.WebGLRenderer as new (opts: unknown) => {
        setSize: (w: number, h: number) => void;
        setPixelRatio: (r: number) => void;
        shadowMap: { enabled: boolean };
        toneMapping: unknown;
        toneMappingExposure: number;
        render: (s: unknown, c: unknown) => void;
        domElement: HTMLCanvasElement;
        outputEncoding: unknown;
      })({ antialias: true, alpha: false });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.toneMapping = (THREE as { ACESFilmicToneMapping: unknown }).ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.4;
      renderer.outputEncoding = (THREE as { sRGBEncoding: unknown }).sRGBEncoding;
      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // ── IBL environment — this is what makes metallic materials look real ──
      // Generate a neutral studio environment using PMREMGenerator
      const pmremGenerator = new ((THREE as { PMREMGenerator: new (r: unknown) => {
        compileEquirectangularShader: () => void;
        fromScene: (s: unknown, blur?: number) => { texture: unknown };
        dispose: () => void;
      } }).PMREMGenerator)(renderer);
      pmremGenerator.compileEquirectangularShader();

      // Use RoomEnvironment-style neutral grey scene for IBL
      const envScene = new (THREE.Scene as new () => { background: unknown; add: (obj: unknown) => void })();
      // Add some coloured planes to simulate a studio environment
      const addPlane = (color: number, x: number, y: number, z: number, rx: number, ry: number) => {
        const geo = new (THREE.PlaneGeometry as new (w: number, h: number) => unknown)(20, 20);
        const mat = new (THREE.MeshBasicMaterial as new (opts: unknown) => unknown)({ color, side: (THREE as { DoubleSide: unknown }).DoubleSide });
        const mesh = new (THREE.Mesh as new (g: unknown, m: unknown) => { rotation: { x: number; y: number }; position: { set: (x: number, y: number, z: number) => void } })(geo, mat);
        mesh.rotation.x = rx;
        mesh.rotation.y = ry;
        mesh.position.set(x, y, z);
        (envScene as { add: (o: unknown) => void }).add(mesh);
      };
      addPlane(0xffffff, 0, 0, -10, 0, 0);     // back — white
      addPlane(0xdddddd, -10, 0, 0, 0, Math.PI / 2); // left — light grey
      addPlane(0xdddddd, 10, 0, 0, 0, -Math.PI / 2); // right
      addPlane(0xffffff, 0, 10, 0, Math.PI / 2, 0);  // top — white
      addPlane(0xbbbbbb, 0, -10, 0, -Math.PI / 2, 0); // bottom — grey
      addPlane(0xeeeeee, 0, 0, 10, 0, Math.PI); // front
      const envTexture = pmremGenerator.fromScene(envScene, 0.04).texture;
      (scene as { environment: unknown }).environment = envTexture;
      pmremGenerator.dispose();

      // Lighting — bright key + soft fills for shadow depth
      const ambient = new (THREE.AmbientLight as new (color: number, intensity: number) => unknown)(0xffffff, 0.6);
      scene.add(ambient);
      const key = new (THREE.DirectionalLight as new (color: number, intensity: number) => { position: { set: (x: number, y: number, z: number) => void }; castShadow: boolean })(0xffffff, 2.0);
      key.position.set(5, 8, 5);
      key.castShadow = true;
      scene.add(key);
      const fill = new (THREE.DirectionalLight as new (color: number, intensity: number) => { position: { set: (x: number, y: number, z: number) => void } })(0xfff5ee, 0.8);
      fill.position.set(-5, 3, -3);
      scene.add(fill);
      const rim = new (THREE.DirectionalLight as new (color: number, intensity: number) => { position: { set: (x: number, y: number, z: number) => void } })(0xffffff, 0.5);
      rim.position.set(0, -4, -6);
      scene.add(rim);

      // Load GLB
      const GLTFLoader = (window as unknown as { _GLTFLoader: new () => { load: (url: string, onLoad: (gltf: { scene: unknown }) => void, onProgress: () => void, onError: () => void) => void } })._GLTFLoader;
      const loader = new GLTFLoader();
      loader.load(
        '/robot_assembly.glb',
        (gltf: { scene: unknown }) => {
          if (!mounted) return;
          const model = gltf.scene;
          const box = new (THREE.Box3 as new () => { setFromObject: (obj: unknown) => unknown; getCenter: (v: unknown) => { x: number; y: number; z: number; multiplyScalar: (s: number) => { x: number; y: number; z: number } }; getSize: (v: unknown) => { x: number; y: number; z: number } })();
          box.setFromObject(model);
          const center = box.getCenter(new (THREE.Vector3 as new () => unknown)());
          const size = box.getSize(new (THREE.Vector3 as new () => unknown)());
          const maxDim = Math.max((size as { x: number; y: number; z: number }).x, (size as { x: number; y: number; z: number }).y, (size as { x: number; y: number; z: number }).z);
          const scale = 2 / maxDim;
          (model as { scale: { setScalar: (s: number) => void }; position: { sub: (v: unknown) => void } }).scale.setScalar(scale);
          const scaledCenter = (center as { multiplyScalar: (s: number) => unknown }).multiplyScalar(scale);
          (model as { position: { sub: (v: unknown) => void } }).position.sub(scaledCenter);
          sphericalRef.current.radius = 2.8;
          scene.add(model);
          modelRef.current = model;
          setLoading(false);
          updateCamera();
        },
        () => {},
        () => { if (mounted) { setError(true); setLoading(false); } }
      );

      // Animate
      const animate = () => {
        frameRef.current = requestAnimationFrame(animate);
        if (autoRotateRef.current && !dragRef.current.active) {
          sphericalRef.current.theta += 0.005;
          updateCamera();
        }
        renderer.render(scene, camera);
      };
      animate();

      // Resize
      const onResize = () => {
        if (!mountRef.current) return;
        const W2 = mountRef.current.clientWidth;
        const H2 = mountRef.current.clientHeight;
        renderer.setSize(W2, H2);
        (camera as { aspect: number; updateProjectionMatrix: () => void }).aspect = W2 / H2;
        (camera as { updateProjectionMatrix: () => void }).updateProjectionMatrix();
      };
      window.addEventListener('resize', onResize);

      // Mouse controls
      const el = renderer.domElement;
      el.addEventListener('mousedown', (e: MouseEvent) => {
        dragRef.current = { active: true, right: e.button === 2, lastX: e.clientX, lastY: e.clientY };
      });
      window.addEventListener('mouseup', () => { dragRef.current.active = false; });
      el.addEventListener('mousemove', (e: MouseEvent) => {
        if (!dragRef.current.active) return;
        const dx = e.clientX - dragRef.current.lastX;
        const dy = e.clientY - dragRef.current.lastY;
        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;
        if (dragRef.current.right) {
          targetRef.current.x -= dx * 0.002 * sphericalRef.current.radius;
          targetRef.current.y += dy * 0.002 * sphericalRef.current.radius;
        } else {
          sphericalRef.current.theta -= dx * 0.008;
          sphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sphericalRef.current.phi + dy * 0.008));
        }
        updateCamera();
      });
      el.addEventListener('wheel', (e: WheelEvent) => {
        sphericalRef.current.radius = Math.max(0.5, Math.min(20, sphericalRef.current.radius * (1 + e.deltaY * 0.001)));
        updateCamera();
        e.preventDefault();
      }, { passive: false });
      el.addEventListener('contextmenu', (e: Event) => e.preventDefault());
    };

    loadThree().catch(() => { setError(true); setLoading(false); });

    return () => {
      mounted = false;
      cancelAnimationFrame(frameRef.current);
      if (rendererRef.current) {
        const r = rendererRef.current as { domElement: HTMLElement; dispose: () => void };
        r.domElement.remove();
        r.dispose();
      }
    };
  }, []);

  const resetCamera = () => {
    sphericalRef.current = { theta: 0.4, phi: 1.1, radius: 2.8 };
    targetRef.current = { x: 0, y: 0, z: 0 };
    updateCamera();
  };

  const toggleAutoRotate = () => {
    autoRotateRef.current = !autoRotateRef.current;
    setAutoRotate(autoRotateRef.current);
  };

  const toggleWireframe = () => {
    wireframeRef.current = !wireframeRef.current;
    setWireframe(wireframeRef.current);
    if (modelRef.current) {
      (modelRef.current as { traverse: (cb: (c: unknown) => void) => void }).traverse((child: unknown) => {
        const c = child as { isMesh?: boolean; material?: { wireframe: boolean } };
        if (c.isMesh && c.material) c.material.wireframe = wireframeRef.current;
      });
    }
  };

  return (
    <div>
      <TopBar title="Robot Assembly" subtitle="Interactive 3D model — drag to rotate, scroll to zoom" />
      <div className="card overflow-hidden mb-4" style={{ height: 500, position: 'relative' }}>
        <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'var(--color-surface)' }}>
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading robot assembly...</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'var(--color-surface)' }}>
            <span className="text-3xl">⚠️</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Could not load model</span>
            <span className="text-xs text-center max-w-xs" style={{ color: 'var(--text-muted)' }}>
              Make sure <code style={{ fontFamily: 'monospace' }}>robot_assembly.glb</code> is in your <code style={{ fontFamily: 'monospace' }}>/public</code> folder
            </span>
          </div>
        )}
        {!loading && !error && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px]" style={{ color: 'var(--text-muted)', pointerEvents: 'none' }}>
            Drag to rotate · Scroll to zoom · Right-drag to pan
          </div>
        )}
      </div>
      <div className="flex gap-2 mb-6">
        <button onClick={resetCamera} className="btn btn-ghost"><RotateCcw size={14} /> Reset view</button>
        <button onClick={toggleAutoRotate} className="btn" style={{ background: autoRotate ? 'var(--accent-soft)' : 'transparent', color: autoRotate ? 'var(--accent)' : 'var(--text-secondary)', border: `1px solid ${autoRotate ? 'var(--accent)' : 'var(--border)'}` }}>
          {autoRotate ? <Pause size={14} /> : <Play size={14} />} Auto rotate
        </button>
        <button onClick={toggleWireframe} className="btn" style={{ background: wireframe ? 'var(--accent-soft)' : 'transparent', color: wireframe ? 'var(--accent)' : 'var(--text-secondary)', border: `1px solid ${wireframe ? 'var(--accent)' : 'var(--border)'}` }}>
          <Box size={14} /> Wireframe
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Base platform', desc: 'Mounting plate with pan servo housing' },
          { label: 'Pan servo (bottom)', desc: 'SG90 · 0–180° horizontal rotation' },
          { label: 'Tilt servo (elbow)', desc: 'SG90 · ±45° vertical tilt' },
          { label: 'IMX500 camera mount', desc: 'CSI ribbon cable routed through arm' },
          { label: 'Water nozzle', desc: 'Brass hex nut + hose barb fitting' },
          { label: 'Pump connection', desc: 'Silicone tube from 12V submersible pump' },
        ].map(item => (
          <div key={item.label} className="card-flat p-4">
            <div className="text-[12px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{item.label}</div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}