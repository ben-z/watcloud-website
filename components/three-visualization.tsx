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
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Softer ambient light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Directional light for better shading
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Materials (reusable)
    const rackMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.4 });
    const nodeMaterialActive = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x003300, metalness: 0.5, roughness: 0.5 });
    const nodeMaterialIdle = new THREE.MeshStandardMaterial({ color: 0x007700, emissive: 0x001100, metalness: 0.5, roughness: 0.5 });
    const particleMaterial = new THREE.SpriteMaterial({ color: 0x00bbff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });


    // Geometries (reusable)
    const rackGeometry = new THREE.BoxGeometry(1, 2.5, 0.5);
    const nodeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.3); // Small boxes for nodes
    const particleGeometry = new THREE.SphereGeometry(0.03, 8, 8); // Small spheres for particles


    const racks: THREE.Mesh[] = [];
    const nodes: THREE.Mesh[] = [];
    const particles: THREE.Sprite[] = []; // Using Sprites for particles now

    const numRacks = 3;
    const rackSpacing = 1.5;

    // Create Racks and Nodes
    for (let i = 0; i < numRacks; i++) {
      const rack = new THREE.Mesh(rackGeometry, rackMaterial);
      rack.position.set((i - (numRacks - 1) / 2) * rackSpacing, 0, 0);
      racks.push(rack);
      scene.add(rack);

      const nodesPerRow = 5;
      const nodesPerColumn = 8;
      for (let r = 0; r < nodesPerRow; r++) {
        for (let c = 0; c < nodesPerColumn; c++) {
          const node = new THREE.Mesh(nodeGeometry, Math.random() > 0.3 ? nodeMaterialIdle : nodeMaterialActive);
          node.position.set(
            rack.position.x + (r - (nodesPerRow -1) / 2) * 0.22, // Distribute nodes on the rack
            (c - (nodesPerColumn - 1) / 2) * 0.25 + 0.1, // Stack nodes vertically
            rack.position.z + 0.2 // Place nodes slightly in front of the rack's center
          );
          node.userData = { baseColor: node.material === nodeMaterialActive ? 0x00ff00 : 0x007700, originalEmissive: (node.material as THREE.MeshStandardMaterial).emissive.getHex() };
          nodes.push(node);
          scene.add(node);
        }
      }
    }

    // Particle system
    const numParticles = 100;
    for (let i = 0; i < numParticles; i++) {
        const particle = new THREE.Sprite(particleMaterial);
        particle.position.set(
            (Math.random() - 0.5) * numRacks * rackSpacing, // Spread across racks
            (Math.random() - 0.5) * 3, // Vertical spread
            (Math.random() - 0.5) * 2   // Depth spread
        );
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.01,
                (Math.random() - 0.5) * 0.01,
                (Math.random() - 0.5) * 0.01
            ),
            life: Math.random() * 2 + 1 // seconds
        };
        particles.push(particle);
        scene.add(particle);
    }


    camera.position.set(0, 2, 7); // Adjusted camera position
    camera.lookAt(0, 0, 0);

    // Group for overall rotation/animation
    const group = new THREE.Group();
    racks.forEach(rack => group.add(rack));
    nodes.forEach(node => group.add(node));
    // Particles are managed separately for now, but could be added to group if desired
    scene.add(group);


    // Animation loop
    const clock = new THREE.Clock();
    let lastBlinkTime = 0;

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const deltaTime = clock.getDelta();

      // Group rotation
      group.rotation.y = Math.sin(elapsedTime * 0.05) * 0.2; // Slower, gentler rotation

      // Node blinking
      if (elapsedTime - lastBlinkTime > 0.2) { // Blink interval
        nodes.forEach(node => {
          if (Math.random() < 0.05) { // Chance to toggle state
            const material = node.material as THREE.MeshStandardMaterial;
            if (material.emissive.getHex() === node.userData.originalEmissive) {
              material.emissive.setHex(0x00ff00); // Brighter emissive for "active"
            } else {
              material.emissive.setHex(node.userData.originalEmissive);
            }
          }
        });
        lastBlinkTime = elapsedTime;
      }

      // Particle animation
      particles.forEach(p => {
        p.position.addScaledVector(p.userData.velocity, deltaTime * 100); // Adjust speed with deltaTime
        p.userData.life -= deltaTime;

        if (p.userData.life <= 0) {
            // Reset particle
            p.position.set(
                (Math.random() - 0.5) * numRacks * rackSpacing,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 2
            );
            p.userData.life = Math.random() * 2 + 1; // Reset life
            p.material.opacity = 0.7; // Reset opacity
        } else {
            // Fade out particle towards end of life
            p.material.opacity = Math.max(0, (p.userData.life / (Math.random() * 2 + 1)) * 0.7);
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
    handleResize(); // Initial call

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

      // Dispose THREE.js objects
      renderer.dispose();
      rackGeometry.dispose();
      nodeGeometry.dispose();
      particleGeometry.dispose(); // Dispose particle geometry
      rackMaterial.dispose();
      nodeMaterialActive.dispose();
      nodeMaterialIdle.dispose();
      particleMaterial.dispose(); // Dispose particle material

      // Clear arrays
      racks.length = 0;
      nodes.length = 0;
      particles.length = 0;
      scene.clear(); // Clear all objects from scene
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default ThreeVisualization;
