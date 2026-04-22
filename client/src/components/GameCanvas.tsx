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
import { CreateRope, UpdateRope } from "./RopeUtil";
import backgroundImage from "../assets/arena3.png";
import ropeTexture from "../assets/rope2.png";
import { createAnimatedSprite } from "./GraphicsUtil";

import "./GameCanvas.css";

function GameCanvas() {
  // Reference to HTML canvas element for rendering scene.
  const canvas = useRef<HTMLCanvasElement | null>(null);

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
        spritesheet.animations["player-pull"],
        150,
        150, // WIDTH, HEIGHT
        ...NDC(-0.6, -0.18),
      );
      redSprite.tint = 'red';

      const blueSprite = createAnimatedSprite(
        spritesheet.animations["player-pull"],
        150,
        150,
        ...NDC(0.6, -0.18),
        true, // Flip horizontally
      );
      blueSprite.tint = 'blue'

      const rope = CreateRope(...NDC(-1.1, -0.15), ...NDC(1.1, -0.15), 60);

      // Temporary pins - just for testing.
      rope.particles[14].pinned = true;
      rope.particles[46].pinned = true;

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

        RopeNodeVisualiser.clear();
        RopeNodeVisualiser.setStrokeStyle(0xff0000);
        RopeNodeVisualiser.moveTo(rope.points[0].x, rope.points[0].y);
        for (let i = 1; i < rope.points.length; i++) {
          RopeNodeVisualiser.lineTo(rope.points[i].x, rope.points[i].y).circle(
            rope.points[i].x,
            rope.points[i].y,
            5,
          );
        }
        RopeNodeVisualiser.stroke();
      });
    })();
  }, []);

  return <canvas className="game-canvas" ref={canvas} />;
}

export default GameCanvas;
