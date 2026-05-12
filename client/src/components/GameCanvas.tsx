import {
  Application,
  Assets,
  Sprite,
  Spritesheet,
  Graphics,
  MeshRope,
} from "pixi.js";

import { useEffect, useRef } from "react";
import spritesheetImage from "../sprites/animation.png";
import spritesheet_animation_meta from "../sprites/animation.json";
import { CreateRope, UpdateRope, type Rope } from "./RopeUtil";
import backgroundImage from "../assets/arena3.png";
import ropeTexture from "../assets/rope2.png";
import { createAnimatedSprite } from "./GraphicsUtil";
import "./GameCanvas.css";
import type { GameStatus } from "../hooks/useGameLogic";
import type { OpponentStats, PlayerStats } from "../pages/GamePage";

interface GameCanvasProps {
  status: GameStatus;
  playerStats: PlayerStats;
  opponentStats: OpponentStats;
  raceMeta: { passage: String }
}


const GameCanvas: React.FC<GameCanvasProps> = ({ status, playerStats, opponentStats, raceMeta }) => {
  // Reference to HTML canvas element for rendering scene.
  const canvas = useRef<HTMLCanvasElement | null>(null);

  const DRAW_ROPE_NODES = false;
  const MAX_SPRITE_PULL = 0.5;
  const SPRITE_PIVOT_POINT = 0.5;

  // Keep refs to the latest props so the Pixi ticker closure sees updates
  const statusRef = useRef(status);
  const playerStatsRef = useRef(playerStats);
  const opponentStatsRef = useRef(opponentStats);
  const raceMetaRef = useRef(raceMeta);

  // Sync refs when props change
  // Note: useEffect is safe here because these are simple assignments
  // and avoid recreating the Pixi app/ticker on every prop change.
  useEffect(() => {
    playerStatsRef.current = playerStats;
  }, [playerStats]);

  useEffect(() => {
    opponentStatsRef.current = opponentStats;
  }, [opponentStats]);

  useEffect(() => {
    raceMetaRef.current = raceMeta;
  }, [raceMeta])

  useEffect(() => {
    statusRef.current = status;
  }, [status])

  // Pixi.js application instance will be created inside the effect and cleaned up on unmount.

  /* Convert to normalized device coordinates */
  const NDC = (x: number, y: number) => {
    const w = canvas.current!.width;
    const h = canvas.current!.height;

    let posX = ((x + 1) / 2) * w;
    let posY = ((1 - y) / 2) * h;

    return [posX, posY] as const;
  };

  const findClosestRopeParticleIndex = (rope: Rope, targetX: number, targetY: number) => {
    let closestIndex = 0;
    let smallestDistanceSquared = Number.POSITIVE_INFINITY;

    for (let i = 0; i < rope.particles.length; i++) {
      const particle = rope.particles[i];
      const dx = particle.x - targetX;
      const dy = particle.y - targetY;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared < smallestDistanceSquared) {
        smallestDistanceSquared = distanceSquared;
        closestIndex = i;
      }
    }

    return closestIndex;
  };

  const drawRopeViz = (RopeGraphic: Graphics, Rope: Rope) => {
      RopeGraphic.clear();
      for (let i = 1; i < Rope.points.length; i++) {
        const from = Rope.points[i - 1];
        const to = Rope.points[i];

        const lineStyle = 0x00ff00
        const circleStyle = Rope.particles[i].pinned ? 0xff0000 : 0x00ff00;
        RopeGraphic
          .setStrokeStyle(lineStyle)
          .moveTo(from.x, from.y)
          .lineTo(to.x, to.y)
          .stroke();
        RopeGraphic
          .setStrokeStyle(circleStyle)
          .circle(to.x, to.y, 5)
          .stroke();
      }
  }

  const initApp = async (
    canvas: HTMLCanvasElement,
  ): Promise<Application | null> => {
    if (!canvas) return null;

    const app = new Application();
    await app.init({
      canvas: canvas,
      backgroundColor: 0xffffff,
      width: canvas.clientWidth || 1200,
      height: canvas.clientHeight || 480,
    });

    return app;
  };

  useEffect(() => {
    let app: Application | null = null;

    (async () => {
      if (!canvas.current) return;

      app = await initApp(canvas.current);
      if (!app) return;

      const RopeNodeVisualiser = new Graphics();

      // Load spritesheet in
      const texture = await Assets.load(spritesheetImage);
      const spritesheet = new Spritesheet(texture, spritesheet_animation_meta);
      await spritesheet.parse();

      // Add background
      const backgroundTexture = await Assets.load(backgroundImage);
      const backgroundSprite = new Sprite(backgroundTexture);
      backgroundSprite.position.set(0, 0);
      backgroundSprite.setSize(app.screen.width, app.screen.height);

      const redSprite = createAnimatedSprite(
        spritesheet.animations["player-pull"], // ANIMATION
        150, 150, // WIDTH, HEIGHT
        ...NDC(-SPRITE_PIVOT_POINT, -0.18), // POSITION
      );
      redSprite.tint = 'red';

      const blueSprite = createAnimatedSprite(
        spritesheet.animations["player-pull"],
        150, 150,
        ...NDC(SPRITE_PIVOT_POINT, -0.18),
        true, // Flip horizontally
      );
      blueSprite.tint = 'blue'

      const rope = CreateRope(...NDC(-1.1, -0.15), ...NDC(1.1, -0.15), 25);

      const redRopeParticleIndex = findClosestRopeParticleIndex(rope, redSprite.x, redSprite.y);
      const blueRopeParticleIndex = findClosestRopeParticleIndex(rope, blueSprite.x, blueSprite.y);
      rope.particles[redRopeParticleIndex].pinned = true;
      rope.particles[blueRopeParticleIndex].pinned = true;

      // MeshRope for stylization
      const ropeTextureAsset = await Assets.load(ropeTexture);
      const meshRope = new MeshRope({
        texture: ropeTextureAsset,
        points: rope.points,
        textureScale: 1,
      });

      // Add graphics to scene
      app.stage.addChild(
        backgroundSprite,
        meshRope,
        redSprite,
        blueSprite,
        RopeNodeVisualiser,
      );

      // Main update loop
      app.ticker.add((delta: { deltaMS: number }) => {
        // get dt in seconds
        const dt = delta.deltaMS / 1000;
        UpdateRope(rope, dt);

        // Read latest values from refs so the closure sees updates from React
        const playerWpm = Math.max(playerStatsRef.current.wpm, 1);
        const opponentWpm = Math.max(opponentStatsRef.current.wpm, 1);

        // Calculate pull amount from the WPM gap and clamp it to MAX_SPRITE_PULL.
        const pullAmount = (playerWpm - opponentWpm) / (playerWpm + opponentWpm) * -MAX_SPRITE_PULL

        // Interpolate sprite movement so they ease toward the target pull position.
        const interpolation = Math.min(1, dt * 10);
        const lerp = (start: number, end: number) => start + (end - start) * interpolation;
        const [targetRedX, targetRedY] = NDC(-SPRITE_PIVOT_POINT + pullAmount, -0.18);
        const [targetBlueX, targetBlueY] = NDC(SPRITE_PIVOT_POINT + pullAmount, -0.18);

        // Move sprites into position
        redSprite.position.set(
          lerp(redSprite.x, targetRedX),
          lerp(redSprite.y, targetRedY),
        )
        blueSprite.position.set(
          lerp(blueSprite.x, targetBlueX),
          lerp(blueSprite.y, targetBlueY),
        )

        // Set animation speed depending on WPM
        redSprite.animationSpeed = 0.12 + 0.36 * (playerWpm / 200)
        blueSprite.animationSpeed = 0.12 + 0.36 * (opponentWpm / 200)

        // Move the pinned rope particles to follow their sprites so the rope deforms correctly
        const heightOffset = redSprite.getSize().height * -0.05
        const redParticle = rope.particles[redRopeParticleIndex];
        redParticle.x = redSprite.x;
        redParticle.y = redSprite.y + heightOffset;
        redParticle.px = redSprite.x;
        redParticle.py = redSprite.y + heightOffset;
        rope.points[redRopeParticleIndex].x = redParticle.x;
        rope.points[redRopeParticleIndex].y = redParticle.y;

        const blueParticle = rope.particles[blueRopeParticleIndex];
        blueParticle.x = blueSprite.x + heightOffset*1.5;
        blueParticle.y = blueSprite.y;
        blueParticle.px = blueSprite.x;
        blueParticle.py = blueSprite.y + heightOffset;
        rope.points[blueRopeParticleIndex].x = blueParticle.x;
        rope.points[blueRopeParticleIndex].y = blueParticle.y;

        if (DRAW_ROPE_NODES)
          drawRopeViz(RopeNodeVisualiser, rope);

        // Cleanup after game finishes
        if (statusRef.current === "finished")
        {
          try {
            app?.ticker.stop();
            app?.destroy(false, { children: true, texture: true });
            app = null;
            console.log("Cleaned canvas.")
          } catch (err) {
            console.warn('Error while destroying PIXI app', err);
          }
        }
      });
    })();

  }, []);

  return <canvas className="game-canvas" ref={canvas} />;
}

export default GameCanvas;
