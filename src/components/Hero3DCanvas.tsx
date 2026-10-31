import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const Hero3DCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Test WebGL availability
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) {
      setWebGlSupported(false);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    
    // Isometric camera perspective
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    // Adjusted isometric viewpoint matching reference angle
    camera.position.set(6.2, 5.2, 6.2);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebGlSupported(false);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    const disposables: { dispose: () => void }[] = [];

    // Root group for mouse parallax
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 2. Lighting Rig (Deep navy ambient, restrained cyan highlights, soft rim)
    const ambientLight = new THREE.AmbientLight(0x061124, 3.2);
    scene.add(ambientLight);

    const topKeyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    topKeyLight.position.set(5, 8, 5);
    scene.add(topKeyLight);

    const cyanFillLight = new THREE.DirectionalLight(0x38bdf8, 3.4);
    cyanFillLight.position.set(-5, 2, 4);
    scene.add(cyanFillLight);

    const indigoRimLight = new THREE.DirectionalLight(0x4338ca, 2.0);
    indigoRimLight.position.set(0, 4, -6);
    scene.add(indigoRimLight);

    // Center point light inside glass cube
    const centerPointLight = new THREE.PointLight(0x00f0ff, 3.0, 7);
    centerPointLight.position.set(0, 0.8, 0);
    rootGroup.add(centerPointLight);

    // 3. Materials
    // Dark metallic pedestal material
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x071126,
      emissive: 0x030a17,
      emissiveIntensity: 0.4,
      metalness: 0.85,
      roughness: 0.25,
    });
    disposables.push(pedestalMat);

    // Cyan glowing edge line material
    const cyanLineMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85,
      linewidth: 1.5,
    });
    disposables.push(cyanLineMat);

    const faintCyanLineMat = new THREE.LineBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.45,
    });
    disposables.push(faintCyanLineMat);

    // Physical Glass Material (Crystal-clear cube)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xa5f3fc,
      emissive: 0x021a36,
      emissiveIntensity: 0.2,
      roughness: 0.06,
      metalness: 0.05,
      transmission: 0.92,
      ior: 1.5,
      thickness: 1.0,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    disposables.push(glassMat);

    // Mini glowing cyan data cube material
    const cyanBlockMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.75,
      metalness: 0.9,
      roughness: 0.15,
    });
    disposables.push(cyanBlockMat);

    // 4. Helper Function: Create an Elevated Pedestal
    const createPedestal = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      disposables.push(geo);
      const mesh = new THREE.Mesh(geo, pedestalMat);
      mesh.position.set(x, y, z);

      const edgeGeo = new THREE.EdgesGeometry(geo);
      disposables.push(edgeGeo);
      const edge = new THREE.LineSegments(edgeGeo, cyanLineMat);
      mesh.add(edge);

      rootGroup.add(mesh);
      return mesh;
    };

    // Helper: Create a cluster of 4 mini cyan cubes inside a mini glass cube
    const createDataCubeCluster = (parent: THREE.Object3D, scale = 1) => {
      const clusterGroup = new THREE.Group();
      parent.add(clusterGroup);

      // Mini transparent glass enclosure
      const miniGlassGeo = new THREE.BoxGeometry(0.85 * scale, 0.85 * scale, 0.85 * scale);
      disposables.push(miniGlassGeo);
      const miniGlass = new THREE.Mesh(miniGlassGeo, glassMat);
      clusterGroup.add(miniGlass);

      const miniEdgesGeo = new THREE.EdgesGeometry(miniGlassGeo);
      disposables.push(miniEdgesGeo);
      miniGlass.add(new THREE.LineSegments(miniEdgesGeo, cyanLineMat));

      // 4 mini cyan cubes arranged in 2x2 grid inside
      const cubeSize = 0.22 * scale;
      const offset = 0.14 * scale;
      const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
      disposables.push(cubeGeo);

      const offsets = [
        [-offset, -offset, -offset],
        [offset, -offset, -offset],
        [-offset, offset, offset],
        [offset, offset, offset],
      ];

      offsets.forEach(([ox, oy, oz]) => {
        const miniCube = new THREE.Mesh(cubeGeo, cyanBlockMat);
        miniCube.position.set(ox, oy, oz);
        clusterGroup.add(miniCube);
      });

      return clusterGroup;
    };

    // 5. Central Platform & Crystal Glass Cube
    const centerPlatform = createPedestal(2.4, 0.35, 2.4, 0, -0.4, 0);

    // Central Glass Cube
    const centerCubeGeo = new THREE.BoxGeometry(1.9, 1.9, 1.9);
    disposables.push(centerCubeGeo);
    const centerCube = new THREE.Mesh(centerCubeGeo, glassMat);
    centerCube.position.set(0, 1.15, 0);
    centerPlatform.add(centerCube);

    const centerCubeEdgesGeo = new THREE.EdgesGeometry(centerCubeGeo);
    disposables.push(centerCubeEdgesGeo);
    const centerCubeEdges = new THREE.LineSegments(centerCubeEdgesGeo, cyanLineMat);
    centerCube.add(centerCubeEdges);

    // 6. Holographic Academic Certificate inside Central Cube
    const certGroup = new THREE.Group();
    centerCube.add(certGroup);

    // Certificate Sheet
    const sheetGeo = new THREE.BoxGeometry(0.95, 1.25, 0.02);
    disposables.push(sheetGeo);
    const sheetMat = new THREE.MeshStandardMaterial({
      color: 0x0f2a4a,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.92,
    });
    disposables.push(sheetMat);
    const sheetMesh = new THREE.Mesh(sheetGeo, sheetMat);
    certGroup.add(sheetMesh);

    // Luminous Sheet Border
    const sheetBorderGeo = new THREE.EdgesGeometry(sheetGeo);
    disposables.push(sheetBorderGeo);
    sheetMesh.add(new THREE.LineSegments(sheetBorderGeo, cyanLineMat));

    // Horizontal embossed text lines on certificate
    const lineThickness = 0.03;
    const textLines = [
      { y: 0.42, w: 0.65 },
      { y: 0.30, w: 0.52 },
      { y: 0.18, w: 0.58 },
      { y: 0.06, w: 0.45 },
      { y: -0.06, w: 0.38 },
    ];

    textLines.forEach((tl) => {
      const lineGeo = new THREE.BoxGeometry(tl.w, lineThickness, 0.025);
      disposables.push(lineGeo);
      const lineMesh = new THREE.Mesh(lineGeo, cyanBlockMat);
      lineMesh.position.set(-0.06, tl.y, 0.015);
      certGroup.add(lineMesh);
    });

    // Verification Rosette Seal on bottom-right of certificate
    const sealGroup = new THREE.Group();
    sealGroup.position.set(0.24, -0.32, 0.025);
    certGroup.add(sealGroup);

    // Circular Seal Rosette
    const sealGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.02, 24);
    disposables.push(sealGeo);
    const sealMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1,
    });
    disposables.push(sealMat);
    const sealMesh = new THREE.Mesh(sealGeo, sealMat);
    sealMesh.rotation.x = Math.PI / 2;
    sealGroup.add(sealMesh);

    // Seal Hanging Ribbons
    const ribbonGeo = new THREE.BoxGeometry(0.06, 0.24, 0.01);
    disposables.push(ribbonGeo);
    const leftRibbon = new THREE.Mesh(ribbonGeo, cyanBlockMat);
    leftRibbon.position.set(-0.05, -0.2, 0);
    leftRibbon.rotation.z = 0.25;
    sealGroup.add(leftRibbon);

    const rightRibbon = new THREE.Mesh(ribbonGeo, cyanBlockMat);
    rightRibbon.position.set(0.05, -0.2, 0);
    rightRibbon.rotation.z = -0.25;
    sealGroup.add(rightRibbon);

    // Floating 3D Ethereum diamond emblem above certificate sheet
    const ethGroup = new THREE.Group();
    ethGroup.position.set(0, 0.72, 0.02);
    certGroup.add(ethGroup);

    const ethGeo = new THREE.OctahedronGeometry(0.18, 0);
    disposables.push(ethGeo);
    const ethMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1,
    });
    disposables.push(ethMat);
    const ethMesh = new THREE.Mesh(ethGeo, ethMat);
    ethMesh.scale.set(0.75, 1.25, 0.75);
    ethGroup.add(ethMesh);

    const ethEdgeGeo = new THREE.EdgesGeometry(ethGeo);
    disposables.push(ethEdgeGeo);
    const ethEdges = new THREE.LineSegments(ethEdgeGeo, cyanLineMat);
    ethEdges.scale.set(0.75, 1.25, 0.75);
    ethGroup.add(ethEdges);

    // 7. Five Surrounding Pedestals matching reference layout:
    // Node 1: Left-back (Shield Node)
    const pShield = createPedestal(1.4, 0.3, 1.4, -2.8, -0.15, -1.3);
    const shieldGroup = new THREE.Group();
    shieldGroup.position.set(0, 0.65, 0);
    pShield.add(shieldGroup);

    // 3D Shield Mesh (Octahedron prism with embossed shield outline)
    const shieldGeo = new THREE.OctahedronGeometry(0.42, 0);
    disposables.push(shieldGeo);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.65,
      metalness: 0.85,
      roughness: 0.15,
    });
    disposables.push(shieldMat);
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.scale.set(0.85, 1.15, 0.35);
    shieldGroup.add(shieldMesh);

    const shieldEdgeGeo = new THREE.EdgesGeometry(shieldGeo);
    disposables.push(shieldEdgeGeo);
    const shieldEdges = new THREE.LineSegments(shieldEdgeGeo, cyanLineMat);
    shieldEdges.scale.set(0.85, 1.15, 0.35);
    shieldGroup.add(shieldEdges);

    // Node 2: Top/Back-center (Data Cube Cluster)
    const pBack = createPedestal(1.3, 0.3, 1.3, 0.2, 0.1, -2.9);
    const backCluster = createDataCubeCluster(pBack, 1.05);
    backCluster.position.set(0, 0.65, 0);

    // Node 3: Left-front (Data Cube Cluster)
    const pLeftFront = createPedestal(1.4, 0.3, 1.4, -2.3, -0.45, 1.9);
    const leftFrontCluster = createDataCubeCluster(pLeftFront, 1.05);
    leftFrontCluster.position.set(0, 0.65, 0);

    // Node 4: Right-front (Database Ledger Node)
    const pDb = createPedestal(1.4, 0.3, 1.4, 2.3, -0.4, 1.7);
    const dbGroup = new THREE.Group();
    dbGroup.position.set(0, 0.65, 0);
    pDb.add(dbGroup);

    // 3 Stacked Cylinders (Database icon representation)
    const discGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.15, 24);
    disposables.push(discGeo);
    const discEdgeGeo = new THREE.EdgesGeometry(discGeo);
    disposables.push(discEdgeGeo);

    [-0.22, 0.0, 0.22].forEach((dy) => {
      const disc = new THREE.Mesh(discGeo, cyanBlockMat);
      disc.position.set(0, dy, 0);
      dbGroup.add(disc);

      const discEdge = new THREE.LineSegments(discEdgeGeo, cyanLineMat);
      discEdge.position.set(0, dy, 0);
      dbGroup.add(discEdge);
    });

    // Node 5: Right-back (Data Cube Cluster)
    const pRightBack = createPedestal(1.3, 0.3, 1.3, 2.8, 0.05, -1.2);
    const rightBackCluster = createDataCubeCluster(pRightBack, 1.05);
    rightBackCluster.position.set(0, 0.65, 0);

    // 8. Circuit Lines Connecting Pedestals on Ground
    const circuitPoints: number[] = [
      // From Center to Left-Back Shield
      0, -0.4, 0,  -2.8, -0.15, -1.3,
      // Center to Back
      0, -0.4, 0,  0.2, 0.1, -2.9,
      // Center to Left-Front
      0, -0.4, 0,  -2.3, -0.45, 1.9,
      // Center to Right-Front Database
      0, -0.4, 0,  2.3, -0.4, 1.7,
      // Center to Right-Back
      0, -0.4, 0,  2.8, 0.05, -1.2,
      // Peripheral loops
      -2.8, -0.15, -1.3,  0.2, 0.1, -2.9,
      0.2, 0.1, -2.9,  2.8, 0.05, -1.2,
      -2.3, -0.45, 1.9,  -2.8, -0.15, -1.3,
      2.3, -0.4, 1.7,  2.8, 0.05, -1.2,
      -2.3, -0.45, 1.9,  2.3, -0.4, 1.7,
    ];

    const circuitGeo = new THREE.BufferGeometry();
    circuitGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(circuitPoints, 3)
    );
    disposables.push(circuitGeo);

    const circuitLines = new THREE.LineSegments(circuitGeo, faintCyanLineMat);
    rootGroup.add(circuitLines);

    // Small floating data cubes along circuit paths
    const scatteredCubeGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    disposables.push(scatteredCubeGeo);
    const scatteredCubeCoords = [
      [-1.4, -0.3, -0.65],
      [0.1, -0.15, -1.45],
      [-1.15, -0.42, 0.95],
      [1.15, -0.4, 0.85],
      [1.4, -0.18, -0.6],
      [0, -0.42, 1.8],
      [-2.55, -0.3, 0.3],
    ];

    scatteredCubeCoords.forEach(([cx, cy, cz]) => {
      const mini = new THREE.Mesh(scatteredCubeGeo, cyanBlockMat);
      mini.position.set(cx, cy, cz);
      rootGroup.add(mini);
    });

    // 9. Floating Volumetric Data Particles
    const dustCount = 65;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 8;
      dustPositions[i + 1] = Math.random() * 4 - 0.5;
      dustPositions[i + 2] = (Math.random() - 0.5) * 8;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    disposables.push(dustGeo);

    const dustMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.035,
      transparent: true,
      opacity: 0.45,
    });
    disposables.push(dustMat);
    const dustParticles = new THREE.Points(dustGeo, dustMat);
    scene.add(dustParticles);

    // 10. Interactive Parallax Handling
    let targetTiltX = 0;
    let targetTiltY = 0;
    let curTiltX = 0;
    let curTiltY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetTiltY = x * 0.18;
      targetTiltX = -y * 0.14;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((touch.clientY - rect.top) / rect.height) * 2 - 1);
        targetTiltY = x * 0.14;
        targetTiltX = -y * 0.1;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 11. Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const motionScale = prefersReducedMotion ? 0.08 : 1.0;

      // Mouse Parallax Lerping
      curTiltX += (targetTiltX - curTiltX) * 0.05;
      curTiltY += (targetTiltY - curTiltY) * 0.05;

      // Slow continuous turntable rotation + mouse parallax
      const slowRotationSpeed = 0.16; // Smooth, calm rotation (revolving slowly)
      rootGroup.rotation.y = elapsed * slowRotationSpeed * motionScale + curTiltY;
      rootGroup.rotation.x = curTiltX + Math.sin(elapsed * 0.35 * motionScale) * 0.02;

      // Gentle floating animation of certificate inside central cube
      certGroup.position.y = Math.sin(elapsed * 1.2 * motionScale) * 0.04;
      certGroup.rotation.y = Math.sin(elapsed * 0.5 * motionScale) * 0.06;
      ethGroup.rotation.y = elapsed * 0.5 * motionScale;

      // Subtle rotation & float for satellite node emblems
      shieldGroup.rotation.y = elapsed * 0.35 * motionScale;
      shieldGroup.position.y = 0.65 + Math.sin(elapsed * 1.3 * motionScale) * 0.03;

      backCluster.rotation.y = elapsed * 0.25 * motionScale;
      leftFrontCluster.rotation.y = -elapsed * 0.22 * motionScale;
      rightBackCluster.rotation.y = elapsed * 0.28 * motionScale;

      dbGroup.position.y = 0.65 + Math.sin((elapsed * 1.1 + 1.0) * motionScale) * 0.03;

      // Gentle drift of dust particles
      dustParticles.rotation.y = elapsed * 0.015 * motionScale;

      renderer.render(scene, camera);
    };

    animate();

    // 12. Unmount Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);

      disposables.forEach((item) => {
        try {
          item.dispose();
        } catch {
          // Ignore disposal errors
        }
      });

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (!webGlSupported) {
    return (
      <div
        className="relative w-full h-[360px] sm:h-[420px] md:h-[480px] lg:h-[540px] flex items-center justify-center p-6"
        aria-label="3D Academic Blockchain Representation"
      >
        <div className="relative w-72 h-72 rounded-2xl bg-slate-900/90 border border-cyan-500/30 flex flex-col items-center justify-center p-6 text-center shadow-2xl shadow-cyan-950/50">
          <div className="w-16 h-16 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-100">Immutable Academic Ledger</span>
          <span className="text-xs text-slate-400 mt-1">Decentralized Credential Cryptographic Mesh</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[360px] sm:h-[420px] md:h-[500px] lg:h-[560px] flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
      aria-label="Interactive 3D Academic Blockchain Ledger"
    >
      {/* Background ambient radial glow matching reference */}
      <div className="absolute inset-0 bg-radial from-cyan-500/15 via-indigo-500/5 to-transparent blur-3xl pointer-events-none" />
    </div>
  );
};
