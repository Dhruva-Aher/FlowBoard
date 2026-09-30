"use client"

import React, { memo } from "react"

import { cn } from "@/lib/utils"

interface AuroraTextProps {
  children: React.ReactNode
  className?: string
  colors?: string[]
  speed?: number
}

export const AuroraText = memo(
  ({
    children,
    className = "",
    colors = ["#5eead4", "#14b8a6", "#2dd4bf", "#99f6e4"],
    speed = 1,
  }: AuroraTextProps) => {
    const gradientStyle = {
      backgroundImage: `linear-gradient(135deg, ${colors.join(", ")}, ${
        colors[0]
      })`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      backgroundSize: "200% auto",
      animationDuration: `${10 / speed}s`,
    }

    return (
      <span
        className={cn("animate-aurora inline-block bg-clip-text text-transparent", className)}
        style={gradientStyle}
      >
        {children}
      </span>
    )
  }
)

AuroraText.displayName = "AuroraText"
