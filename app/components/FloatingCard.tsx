"use client";

import { motion } from "framer-motion";

interface FloatingCardProps {
  text: React.ReactNode; // ✅ allows strings, fragments, JSX, etc.
  className?: string;
  color?: "blue" | "orange";
}

const FloatingCard: React.FC<FloatingCardProps> = ({ text, className = "", color = "blue" }) => {
  const colorClass =
    color === "blue"
      ? "border-blue-200 bg-white/80 text-gray-800"
      : "border-orange-200 bg-white/80 text-gray-800";

  return (
    <motion.div
      className={`px-4 py-2 text-sm rounded-lg border shadow-sm backdrop-blur-sm ${colorClass} ${className}`}
      animate={{
        y: [6, -12, 0, 8, 0],
        x: [0, 5, 5, -10, 0],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {text}
    </motion.div>
  );
};

export default FloatingCard;