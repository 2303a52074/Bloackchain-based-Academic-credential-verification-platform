import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface StageData {
  id: string;
  number: string;
  title: string;
  description: string;
}

const STAGES: StageData[] = [
  {
    id: 'issue',
    number: '01',
    title: 'Issue',
    description: 'Accredited universities cryptographically sign and mint the credential directly to the recipient.',
  },
  {
    id: 'hash',
    number: '02',
    title: 'Hash',
    description: 'The academic record is compressed into a deterministic, privacy-preserving cryptographic SHA-256 hash.',
  },
  {
    id: 'anchor',
    number: '03',
    title: 'Anchor',
    description: 'The cryptographic proof is anchored into smart contract state and persistent ledger records.',
  },
  {
    id: 'verify',
    number: '04',
    title: 'Verify',
    description: 'Employers and institutions validate cryptographic checksums directly against authoritative registry proofs.',
  },
];

export const ScrollStory3D: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const activeStageRef = useRef<number>(0);

  // Sync ref
  useEffect(() => {
    activeStageRef.current = activeStage;
  }, [activeStage]);

  // Three.js 3D Scene Initialization
  useEffect(() => {
    const canvasContainer = canvasContainerRef.current;
    if (!canvasContainer) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      canvasContainer.clientWidth / canvasContainer.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    canvasContainer.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x0a192f, 2.0);
    scene.add(ambientLight);

    const mainLight = new THREE.PointLight(0x38bdf8, 3, 20);
    mainLight.position.set(3, 4, 6);
    scene.add(mainLight);

    const secondaryLight = new THREE.PointLight(0x6366f1, 2.5, 20);
    secondaryLight.position.set(-4, -3, 4);
    scene.add(secondaryLight);

    // Master Group
    const stageRoot = new THREE.Group();
    scene.add(stageRoot);

    // --- Object 1: Credential Slab (Stage 0: Issue) ---
    const certGeo = new THREE.BoxGeometry(2.4, 3.2, 0.08);
    const certMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.2,
    });
    const certMesh = new THREE.Mesh(certGeo, certMat);
    const certEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(certGeo),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, opacity: 0.8, transparent: true })
    );
    certMesh.add(certEdges);

    // Inner Crest on Certificate
    const crestGeo = new THREE.TorusGeometry(0.45, 0.04, 16, 32);
    const crestMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const crest = new THREE.Mesh(crestGeo, crestMat);
    crest.position.set(0, 0.6, 0.05);
    certMesh.add(crest);

    stageRoot.add(certMesh);

    // --- Object 2: Cryptographic Merkle Hash Matrix (Stage 1: Hash) ---
    const hashCoreGeo = new THREE.OctahedronGeometry(1.2, 0);
    const hashCoreMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      wireframe: false,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x0369a1,
      emissiveIntensity: 0.5,
    });
    const hashMesh = new THREE.Mesh(hashCoreGeo, hashCoreMat);

    const hashOuterWire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.6, 1),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.4 })
    );
    hashMesh.add(hashOuterWire);
    stageRoot.add(hashMesh);

    // --- Object 3: Immutable Blockchain Ledger Chain (Stage 2: Anchor) ---
    const blockGroup = new THREE.Group();
    const blockGeo = new THREE.BoxGeometry(1.1, 1.1, 1.1);
    const blockMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
    });

    const blocks: THREE.Mesh[] = [];
    const blockPositions = [-1.7, 0, 1.7];
    blockPositions.forEach((xPos, idx) => {
      const b = new THREE.Mesh(blockGeo, blockMat.clone());
      b.position.set(xPos, 0, 0);
      const bEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(blockGeo),
        new THREE.LineBasicMaterial({
          color: idx === 1 ? 0x38bdf8 : 0x475569,
          transparent: true,
          opacity: 0.9,
        })
      );
      b.add(bEdges);
      blockGroup.add(b);
      blocks.push(b);
    });

    // Connecting Chain Link Cylinders between blocks
    const chainGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8);
    chainGeo.rotateZ(Math.PI / 2);
    const chainMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const link1 = new THREE.Mesh(chainGeo, chainMat);
    link1.position.set(-0.85, 0, 0);
    blockGroup.add(link1);

    const link2 = new THREE.Mesh(chainGeo, chainMat);
    link2.position.set(0.85, 0, 0);
    blockGroup.add(link2);

    stageRoot.add(blockGroup);

    // --- Object 4: Verification Consensus Halo & Laser Sweep (Stage 3: Verify) ---
    const verifyGroup = new THREE.Group();
    const ringGeo1 = new THREE.RingGeometry(1.4, 1.48, 48);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    verifyGroup.add(ringMesh1);

    const ringGeo2 = new THREE.RingGeometry(1.65, 1.7, 48);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    verifyGroup.add(ringMesh2);

    // Verified Checkmark representation
    const checkGeo = new THREE.BufferGeometry();
    const checkPoints = new Float32Array([
      -0.5, -0.05, 0.1,
      -0.1, -0.45, 0.1,
      -0.1, -0.45, 0.1,
      0.65, 0.45, 0.1,
    ]);
    checkGeo.setAttribute('position', new THREE.BufferAttribute(checkPoints, 3));
    const checkMat = new THREE.LineBasicMaterial({
      color: 0x10b981,
      linewidth: 4,
    });
    const checkLine = new THREE.LineSegments(checkGeo, checkMat);
    verifyGroup.add(checkLine);

    stageRoot.add(verifyGroup);

    // Initial Scales / Visibilities
    certMesh.scale.set(1, 1, 1);
    hashMesh.scale.set(0, 0, 0);
    blockGroup.scale.set(0, 0, 0);
    verifyGroup.scale.set(0, 0, 0);

    // Resize handler
    const handleResize = () => {
      if (!canvasContainer) return;
      const w = canvasContainer.clientWidth;
      const h = canvasContainer.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation & Lerp loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const stage = activeStageRef.current;

      // Target scales for each 3D representation
      const targetCertScale = stage === 0 ? 1 : 0.001;
      const targetHashScale = stage === 1 ? 1 : 0.001;
      const targetBlockScale = stage === 2 ? 1 : 0.001;
      const targetVerifyScale = stage === 3 ? 1 : 0.001;

      // Smooth lerp interpolation (0.08 smoothing factor)
      certMesh.scale.lerp(new THREE.Vector3(targetCertScale, targetCertScale, targetCertScale), 0.08);
      hashMesh.scale.lerp(new THREE.Vector3(targetHashScale, targetHashScale, targetHashScale), 0.08);
      blockGroup.scale.lerp(new THREE.Vector3(targetBlockScale, targetBlockScale, targetBlockScale), 0.08);
      verifyGroup.scale.lerp(new THREE.Vector3(targetVerifyScale, targetVerifyScale, targetVerifyScale), 0.08);

      // Stage-specific motions
      // 0: Certificate floating and tilt
      certMesh.rotation.y = Math.sin(elapsed * 0.8) * 0.2;
      certMesh.rotation.x = Math.cos(elapsed * 0.7) * 0.1;
      certMesh.position.y = Math.sin(elapsed * 1.5) * 0.1;

      // 1: Hash core spinning
      hashMesh.rotation.x = elapsed * 0.7;
      hashMesh.rotation.y = elapsed * 0.9;
      hashOuterWire.rotation.y = -elapsed * 0.5;

      // 2: Ledger blocks rhythmic consensus float
      blocks.forEach((b, i) => {
        b.rotation.x = Math.sin(elapsed + i) * 0.15;
        b.rotation.y = elapsed * 0.4 + i * 0.5;
      });
      blockGroup.rotation.y = Math.sin(elapsed * 0.4) * 0.2;

      // 3: Verify rings pulsating and rotating
      ringMesh1.rotation.z = elapsed * 0.6;
      ringMesh2.rotation.z = -elapsed * 0.4;
      const pulse = 1 + Math.sin(elapsed * 3) * 0.04;
      verifyGroup.scale.x = THREE.MathUtils.lerp(verifyGroup.scale.x, targetVerifyScale * pulse, 0.1);
      verifyGroup.scale.y = THREE.MathUtils.lerp(verifyGroup.scale.y, targetVerifyScale * pulse, 0.1);

      // Light color transition based on stage
      if (stage === 3) {
        mainLight.color.lerp(new THREE.Color(0x10b981), 0.05); // Verified green
      } else {
        mainLight.color.lerp(new THREE.Color(0x38bdf8), 0.05); // Cyan
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (canvasContainer.contains(renderer.domElement)) {
        canvasContainer.removeChild(renderer.domElement);
      }
      certGeo.dispose();
      certMat.dispose();
      hashCoreGeo.dispose();
      hashCoreMat.dispose();
      blockGeo.dispose();
      blockMat.dispose();
      ringGeo1.dispose();
      ringGeo2.dispose();
    };
  }, []);

  // Scroll detection to update active stage
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // If in viewport, calculate progress through section
      if (rect.top <= viewportHeight * 0.4 && rect.bottom >= viewportHeight * 0.2) {
        const totalScrollable = rect.height - viewportHeight * 0.4;
        const currentProgress = (viewportHeight * 0.4 - rect.top) / totalScrollable;
        const clamped = Math.max(0, Math.min(0.999, currentProgress));
        const newStage = Math.floor(clamped * 4);
        setActiveStage(newStage);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      ref={containerRef}
      id="how-it-works"
      className="relative w-full py-24 md:py-32 border-t border-slate-800/60 bg-[#070b14]"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Subtle section label */}
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-cyan-400 font-mono">
            Cryptographic Lifecycle
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-100 tracking-tight mt-1">
            How CredentialChain Works
          </h2>
        </div>

        {/* Responsive Grid: Interactive 3D Canvas + Stage Progression */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left / Top: Interactive 3D Scene */}
          <div className="lg:col-span-7 relative h-[380px] md:h-[460px] rounded-2xl border border-slate-800/80 bg-[#0b1329]/50 overflow-hidden flex items-center justify-center">
            {/* Ambient inner glow */}
            <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

            {/* 3D Canvas Container */}
            <div
              ref={canvasContainerRef}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              aria-label="Interactive 3D Lifecycle Visualization"
            />

            {/* Stage Indicator Badge inside Canvas */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>STAGE {STAGES[activeStage].number} · {STAGES[activeStage].title.toUpperCase()}</span>
            </div>
          </div>

          {/* Right: Four short stages */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {STAGES.map((stage, idx) => {
              const isActive = activeStage === idx;
              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveStage(idx)}
                  className={`text-left p-5 rounded-xl transition-all duration-300 border cursor-pointer ${
                    isActive
                      ? 'bg-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-950/20 translate-x-1'
                      : 'bg-slate-900/20 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/40 opacity-70 hover:opacity-90'
                  }`}
                >
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span
                      className={`text-xs font-mono tracking-wider ${
                        isActive ? 'text-cyan-400' : 'text-slate-500'
                      }`}
                    >
                      {stage.number}
                    </span>
                    <span
                      className={`text-lg font-semibold tracking-tight ${
                        isActive ? 'text-slate-100' : 'text-slate-300'
                      }`}
                    >
                      {stage.title}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {stage.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
