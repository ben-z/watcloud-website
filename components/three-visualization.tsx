import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeVisualization: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000); // Adjusted FOV
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Slightly brighter ambient
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9); // Slightly stronger directional
    directionalLight.position.set(8, 12, 10); // Adjusted light position
    directionalLight.castShadow = false; // Can be true if shadows are needed and optimized
    scene.add(directionalLight);
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3); // Softer fill light from another angle
    directionalLight2.position.set(-8, 5, -5);
    scene.add(directionalLight2);


    // Materials (reusable)
    const rackMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.7, roughness: 0.6 }); // Darker grey, less reflective
    const nodeMaterialIdle = new THREE.MeshStandardMaterial({ color: 0x2b6cb0, emissive: 0x0a2a4a, metalness: 0.6, roughness: 0.5 }); // Calmer blue
    const nodeMaterialActive = new THREE.MeshStandardMaterial({ color: 0x38a169, emissive: 0x1c5133, metalness: 0.6, roughness: 0.5 }); // Calmer green for active
    const particleMaterial = new THREE.SpriteMaterial({
        color: 0x4fd1c5, // Teal color for particles
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
    });


    // Geometries (reusable)
    const rackGeometry = new THREE.BoxGeometry(0.8, 2.2, 0.4); // Slightly slimmer racks
    const nodeGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.25); // Smaller nodes
    // Particle geometry is not needed for SpriteMaterial, remove SphereGeometry for particles


    const racks: THREE.Mesh[] = [];
    const nodes: { mesh: THREE.Mesh; originalEmissive: number; isActive: boolean; lastPulseTime: number }[] = [];
    const particles: THREE.Sprite[] = [];

    const numRacks = 3;
    const rackSpacing = 1.2; // Closer racks

    // Create Racks and Nodes
    for (let i = 0; i < numRacks; i++) {
      const rack = new THREE.Mesh(rackGeometry, rackMaterial);
      rack.position.set((i - (numRacks - 1) / 2) * rackSpacing, 0, 0);
      racks.push(rack);
      scene.add(rack);

      const nodesPerRow = 4; // Reduced nodes
      const nodesPerColumn = 6; // Reduced nodes
      for (let r = 0; r < nodesPerRow; r++) {
        for (let c = 0; c < nodesPerColumn; c++) {
          const isInitiallyActive = Math.random() > 0.8; // Fewer initially active nodes
          const material = isInitiallyActive ? nodeMaterialActive.clone() : nodeMaterialIdle.clone();
          const nodeMesh = new THREE.Mesh(nodeGeometry, material);
          nodeMesh.position.set(
            rack.position.x + (r - (nodesPerRow - 1) / 2) * 0.18, // Adjusted spacing
            (c - (nodesPerColumn - 1) / 2) * 0.22 + 0.1, // Adjusted spacing
            rack.position.z + 0.15 // Nodes slightly more embedded
          );
          nodes.push({ mesh: nodeMesh, originalEmissive: (material as THREE.MeshStandardMaterial).emissive.getHex(), isActive: isInitiallyActive, lastPulseTime: 0 });
          scene.add(nodeMesh);
        }
      }
    }

    // Particle system
    const numParticles = 30; // Reduced particles
    for (let i = 0; i < numParticles; i++) {
        const particle = new THREE.Sprite(particleMaterial);
        const startRackIndex = Math.floor(Math.random() * numRacks);
        const endRackIndex = (startRackIndex + Math.floor(Math.random() * (numRacks -1)) + 1) % numRacks; // Ensure different rack for target

        particle.userData = {
            startPosition: new THREE.Vector3(
                racks[startRackIndex].position.x + (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 2,
                racks[startRackIndex].position.z + (Math.random() * 0.5 + 0.2) // Start slightly in front
            ),
            endPosition: new THREE.Vector3(
                racks[endRackIndex].position.x + (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 2,
                racks[endRackIndex].position.z + (Math.random() * 0.5 + 0.2)
            ),
            progress: Math.random(), // Start at a random point in lifetime
            life: Math.random() * 3 + 2, // seconds (2-5s lifetime)
            speed: Math.random() * 0.2 + 0.1 // Slower, more varied speed
        };
        particle.position.copy(particle.userData.startPosition);
        particle.scale.set(0.03, 0.03, 0.03); // Smaller particles
        particles.push(particle);
        scene.add(particle);
    }

    camera.position.set(0, 1.5, 4.5); // Adjusted camera for a clearer overall view
    camera.lookAt(0, 0.2, 0); // Look slightly above center mass

    // Group for overall rotation/animation
    const group = new THREE.Group();
    racks.forEach(rack => group.add(rack));
    nodes.forEach(nodeObj => group.add(nodeObj.mesh));
    // Particles are managed separately
    scene.add(group);


    // Animation loop
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const deltaTime = clock.getDelta();

      // Group rotation (very subtle)
      group.rotation.y = Math.sin(elapsedTime * 0.02) * 0.05;

      // Node pulsing
      nodes.forEach(nodeObj => {
        const material = nodeObj.mesh.material as THREE.MeshStandardMaterial;
        if (nodeObj.isActive) {
          const pulseSpeed = 0.8;
          const pulseMinEmissive = 0.1; // Fraction of original emissive
          const pulseMaxEmissive = 1.2; // Fraction of original emissive
          const emissiveIntensity = (Math.sin(elapsedTime * pulseSpeed + nodeObj.mesh.position.y) + 1) / 2; // 0 to 1
          const targetEmissive = nodeObj.originalEmissive * (pulseMinEmissive + emissiveIntensity * (pulseMaxEmissive - pulseMinEmissive));
          material.emissive.setHex(targetEmissive);

          // Chance to become idle
          if (elapsedTime - nodeObj.lastPulseTime > 5 && Math.random() < 0.01) { // Check every ~5s, small chance to go idle
            nodeObj.isActive = false;
            nodeObj.lastPulseTime = elapsedTime;
            (nodeObj.mesh.material as THREE.MeshStandardMaterial).color.set(nodeMaterialIdle.color);
            (nodeObj.mesh.material as THREE.MeshStandardMaterial).emissive.set(nodeMaterialIdle.emissive);
          }
        } else {
           // Chance to become active
           if (elapsedTime - nodeObj.lastPulseTime > 2 && Math.random() < 0.005) { // Check every ~2s, very small chance to activate
            nodeObj.isActive = true;
            nodeObj.lastPulseTime = elapsedTime;
            (nodeObj.mesh.material as THREE.MeshStandardMaterial).color.set(nodeMaterialActive.color);
             // Store the new originalEmissive from the active material for pulsing
            nodeObj.originalEmissive = nodeMaterialActive.emissive.getHex();
          }
        }
      });

      // Particle animation (clearer paths)
      particles.forEach(p => {
        p.userData.progress += p.userData.speed * deltaTime / p.userData.life;

        if (p.userData.progress >= 1) {
            p.userData.progress = 0; // Reset progress
            // Optionally re-randomize start/end positions for variety if desired
             const startRackIndex = Math.floor(Math.random() * numRacks);
             const endRackIndex = (startRackIndex + Math.floor(Math.random() * (numRacks -1)) + 1) % numRacks;
             p.userData.startPosition.set(
                racks[startRackIndex].position.x + (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 2,
                racks[startRackIndex].position.z + (Math.random() * 0.5 + 0.2)
            );
            p.userData.endPosition.set(
                racks[endRackIndex].position.x + (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 2,
                racks[endRackIndex].position.z + (Math.random() * 0.5 + 0.2)
            );
            p.userData.life = Math.random() * 3 + 2;
        }

        p.position.lerpVectors(p.userData.startPosition, p.userData.endPosition, p.userData.progress);

        // Fade in at start, fade out at end
        const fadeThreshold = 0.15; // 15% of life for fade in/out
        if (p.userData.progress < fadeThreshold) {
            p.material.opacity = (p.userData.progress / fadeThreshold) * 0.6;
        } else if (p.userData.progress > 1 - fadeThreshold) {
            p.material.opacity = ((1 - p.userData.progress) / fadeThreshold) * 0.6;
        } else {
            p.material.opacity = 0.6;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (currentMount) {
        const width = currentMount.clientWidth;
        const height = currentMount.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Cleanup
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('resize', handleResize);
      if (currentMount && renderer.domElement) {
         if (currentMount.contains(renderer.domElement)) {
            currentMount.removeChild(renderer.domElement);
         }
      }

      renderer.dispose();
      rackGeometry.dispose();
      nodeGeometry.dispose();
      // particleGeometry was removed
      rackMaterial.dispose();
      nodeMaterialActive.dispose();
      nodeMaterialIdle.dispose();
      nodes.forEach(n => (n.mesh.material as THREE.Material).dispose()); // Dispose cloned materials
      particleMaterial.dispose();

      racks.length = 0;
      nodes.length = 0;
      particles.length = 0;
      scene.clear();
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default ThreeVisualization;
