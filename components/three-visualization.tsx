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
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); // alpha: true for transparent background
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Adjust for device pixel ratio
    currentMount.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    camera.add(pointLight); // Attach light to camera
    scene.add(camera); // Ensure camera (with light) is part of the scene

    // Spheres and lines setup
    const sphereGeometry = new THREE.SphereGeometry(0.3, 16, 16); // Smaller spheres
    const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0x007bff, emissive: 0x111133 }); // Blueish, slightly emissive
    const spheres: THREE.Mesh[] = [];
    const lines: THREE.Line[] = [];

    const numSpheres = 7;
    const radius = 2.5;

    for (let i = 0; i < numSpheres; i++) {
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      const angle = (i / numSpheres) * Math.PI * 2;
      const x = Math.cos(angle) * radius * (Math.random() * 0.4 + 0.8); // Add some randomness to position
      const y = Math.sin(angle) * radius * (Math.random() * 0.4 + 0.8);
      const z = (Math.random() - 0.5) * 2;
      sphere.position.set(x, y, z);
      spheres.push(sphere);
      scene.add(sphere);
    }

    // Create lines between spheres
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.5 });
    for (let i = 0; i < spheres.length; i++) {
      for (let j = i + 1; j < spheres.length; j++) {
        if (Math.random() > 0.6) { // Don't connect all spheres to keep it cleaner
            const points = [spheres[i].position, spheres[j].position];
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(lineGeometry, lineMaterial);
            lines.push(line);
            scene.add(line);
        }
      }
    }

    camera.position.z = 6;

    // Group for rotation
    const group = new THREE.Group();
    spheres.forEach(sphere => group.add(sphere));
    lines.forEach(line => group.add(line));
    scene.add(group);

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Subtle rotation for the group
      group.rotation.y = elapsedTime * 0.1;
      group.rotation.x = elapsedTime * 0.05;

      // Individual sphere pulsation (optional, can be resource intensive)
      // spheres.forEach((sphere, index) => {
      //   sphere.scale.setScalar(Math.sin(elapsedTime * 0.5 + index) * 0.1 + 0.9);
      // });

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
    // Initial resize call
    handleResize();


    // Cleanup
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('resize', handleResize);
      if (currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      lineMaterial.dispose();
      lines.forEach(line => line.geometry.dispose());
      // Dispose other geometries/materials if added
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />; // Ensure div takes full hero-visualization space
};

export default ThreeVisualization;
