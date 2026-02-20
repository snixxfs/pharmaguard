import { motion } from "framer-motion";
import * as React from "react";

export default function AppBackground() {
  const blobs = [
    { hue: "var(--brand-teal)", top: "10%", left: "12%", size: 420, delay: 0 },
    { hue: "var(--brand-cyan)", top: "18%", right: "14%", size: 520, delay: 2 },
    { hue: "var(--brand-indigo)", bottom: "16%", left: "18%", size: 480, delay: 3.5 },
    { hue: "var(--brand-violet)", bottom: "10%", right: "10%", size: 560, delay: 1.2 },
  ];
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ background: "linear-gradient(180deg, hsl(var(--background)), hsl(210 42% 96%))" }}
    >
      {/* Bio grid overlay */}
      <div className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "linear-gradient(0deg, rgba(0,0,0,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px, 28px 28px",
          maskImage: "radial-gradient(1000px 600px at 50% 10%, black, transparent 70%)",
        }}
      />

      {/* Aurora blobs */}
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute blur-3xl"
          style={{
            ...("top" in b ? { top: b.top as string } : {}),
            ...("bottom" in b ? { bottom: b.bottom as string } : {}),
            ...("left" in b ? { left: b.left as string } : {}),
            ...("right" in b ? { right: b.right as string } : {}),
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            background: `radial-gradient(closest-side, hsl(${b.hue} / 0.35), transparent 70%)`,
          }}
          initial={{ opacity: 0.6, y: 0, x: 0 }}
          animate={{ opacity: 0.8, y: [0, -20, 0], x: [0, 12, 0] }}
          transition={{ duration: 22 + i * 3, delay: b.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 40 40'%3E%3Cg fill='%23000000' fill-opacity='0.5'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3Ccircle cx='21' cy='11' r='1'/%3E%3Ccircle cx='11' cy='31' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
