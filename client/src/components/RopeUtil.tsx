const GRAVITY = 800; // pixels/s²
const ITERATIONS = 40; // More = stiffer rope, but more computationally expensive

import { Point } from 'pixi.js';

type RopeParticle = {
  x: number;
  y: number;
  px: number;
  py: number;
  pinned: boolean;
};

export type Rope = {
  points: Point[];
  particles: RopeParticle[];
  segLen: number;
};

/* Rope Data Structure */
export function CreateRope(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  numSegments: number = 10,
): Rope {
  const points: Point[] = []; // PIXI.Point[] - shared with MeshRope
  const particles: RopeParticle[] = []; // physics state, one per point
  const segLen = Math.hypot(x2 - x1, y2 - y1) / numSegments;

  for (let i = 0; i <= numSegments; i++) {
    const t = i / numSegments;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;

    points.push(new Point(x, y)); // For using MeshRope (PIXI.js)
    particles.push({ x, y, px: x, py: y, pinned: false });
  }

  particles[0].pinned = true;
  particles[numSegments].pinned = true;

  return { points, particles, segLen };
}

/* Update Rope Physics */
export function UpdateRope(rope: Rope, dt: number): void {
  const { points, particles, segLen } = rope;

  // Verlet integrate
  for (const p of particles) {
    if (p.pinned) continue;
    const vx = p.x - p.px;
    const vy = p.y - p.py;
    p.px = p.x;
    p.py = p.y;
    p.x += vx;
    p.y += vy + GRAVITY * dt * dt;
  }

  // Distance constraints
  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < particles.length - 1; i++) {
      const a = particles[i], b = particles[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      const correction = (dist - segLen) / dist * 0.5;
      const ox = dx * correction, oy = dy * correction;
      if (!a.pinned) { a.x += ox; a.y += oy; }
      if (!b.pinned) { b.x -= ox; b.y -= oy; }
    }
  }

  // Sync physics state > PIXI.Points so MeshRope updates automatically
  for (let i = 0; i < particles.length; i++) {
    points[i].x = particles[i].x;
    points[i].y = particles[i].y;
  }
}

