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
import type { GameStats, GameStatus } from "../hooks/useGameLogic";
import type { OpponentStats } from "../pages/GamePage";

interface GameCanvasProps {
  status: GameStatus;
  playerStats: GameStats;
  opponentStats: OpponentStats;
}

const DRAW_ROPE_NODES = true;

const GameCanvas: React.FC<GameCanvasProps> = ({ status, playerStats, opponentStats }) => {
  // Reference to HTML canvas element for rendering scene.
  const canvas = useRef<HTMLCanvasElement | null>(null);

  console.log(status);
  console.log(playerStats);
  console.log(opponentStats);

  // Pixi.js application instance.
  let app: Application | null;

  /* Convert to normalized device coordinates */
  const NDC = (x: number, y: number) => {
    const w = canvas.current!.width;
    const h = canvas.current!.height;

    let posX = ((x + 1) / 2) * w;
    let posY = ((1 - y) / 2) * h;

    return [posX, posY] as const;
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
      width: canvas.clientWidth || 800,
      height: canvas.clientHeight || 480,
    });

    return app;
  };

  useEffect(() => {

    (async () => {
      if (!canvas.current) {
        return;
      }

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
        ...NDC(-0.6, -0.18), // POSITION
      );
      redSprite.tint = 'red';

      const blueSprite = createAnimatedSprite(
        spritesheet.animations["player-pull"],
        150, 150,
        ...NDC(0.6, -0.18),
        true, // Flip horizontally
      );
      blueSprite.tint = 'blue'

      const rope = CreateRope(...NDC(-1.1, -0.15), ...NDC(1.1, -0.15), 20);

      // Temporary pins - just for testing.
      rope.particles[5].pinned = true;
      rope.particles[15].pinned = true;

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

        if (DRAW_ROPE_NODES)
          drawRopeViz(RopeNodeVisualiser, rope);
      });
    })();

  }, []);

  return <canvas className="game-canvas" ref={canvas} />;
}

export default GameCanvas;
