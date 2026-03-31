import { useEffect, useRef } from "react";

export default function VelleraBackground() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const scrollSpeedRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationId;

    // Set canvas size to window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = Array.from({ length: 40 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: Math.random() * 0.5 + 0.2, // Upward movement
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.5 ? "#00E5FF" : "#CCFF00",
        trail: [],
      }));
    };
    initParticles();

    // Handle scroll for parallax acceleration
    const handleScroll = () => {
      scrollSpeedRef.current = window.scrollY * 0.001;
    };
    window.addEventListener("scroll", handleScroll);

    // Animation loop
    const animate = () => {
      // Clear canvas with semi-transparent background for trail effect
      ctx.fillStyle = "rgba(18, 18, 18, 0.95)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add subtle gradient overlay
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "rgba(0, 229, 255, 0.05)");
      gradient.addColorStop(0.5, "rgba(18, 18, 18, 0)");
      gradient.addColorStop(1, "rgba(204, 255, 0, 0.05)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Accelerate upward based on scroll
        const acceleratedVy = particle.vy + scrollSpeedRef.current;

        // Update position
        particle.x += particle.vx;
        particle.y -= acceleratedVy;

        // Store trail for glow effect
        particle.trail.push({ x: particle.x, y: particle.y });
        if (particle.trail.length > 20) particle.trail.shift();

        // Wrap around screen
        if (particle.y < -20) particle.y = canvas.height + 20;
        if (particle.x < -20) particle.x = canvas.width + 20;
        if (particle.x > canvas.width + 20) particle.x = -20;

        // Draw trail with gradient
        if (particle.trail.length > 1) {
          for (let i = 0; i < particle.trail.length - 1; i++) {
            const trailOpacity = (i / particle.trail.length) * particle.opacity;
            ctx.strokeStyle = particle.color.replace(")", `, ${trailOpacity})`).replace("rgb", "rgba");
            ctx.lineWidth = particle.size * 0.5;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(particle.trail[i].x, particle.trail[i].y);
            ctx.lineTo(particle.trail[i + 1].x, particle.trail[i + 1].y);
            ctx.stroke();
          }
        }

        // Draw particle
        ctx.fillStyle = particle.color.replace(")", `, ${particle.opacity})`).replace("rgb", "rgba");
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect
        const glowGradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 3
        );
        glowGradient.addColorStop(0, particle.color.replace(")", `, ${particle.opacity * 0.6})`).replace("rgb", "rgba"));
        glowGradient.addColorStop(1, particle.color.replace(")", ", 0)").replace("rgb", "rgba"));
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        background: "#121212",
        display: "block",
      }}
    />
  );
}