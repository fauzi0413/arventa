"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: React.ReactNode;
  /** Delay before animation starts (seconds) */
  delay?: number;
  /** Duration of the animation (seconds) */
  duration?: number;
  /** Y offset to animate from (px) */
  y?: number;
  /** Starting opacity */
  opacity?: number;
  /** Blur effect (px) — 0 to disable */
  blur?: number;
  /** Extra className on wrapper */
  className?: string;
  /** HTML tag for wrapper element */
  as?: React.ElementType;
}

/**
 * ScrollReveal — ReactBits-style text scroll reveal.
 * Wraps text/heading content and animates it into view as the user scrolls.
 * Only applies to text, not to card/image elements.
 */
export function ScrollReveal({
  children,
  delay = 0,
  duration = 0.8,
  y = 32,
  opacity = 0,
  blur = 6,
  className = "",
  as: Tag = "div",
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        {
          opacity,
          y,
          filter: blur > 0 ? `blur(${blur}px)` : "none",
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    return () => ctx.revert();
  }, [delay, duration, y, opacity, blur]);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={className}>
      {children}
    </Tag>
  );
}
