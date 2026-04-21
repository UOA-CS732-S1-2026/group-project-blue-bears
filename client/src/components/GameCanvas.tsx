import {
  Application,
  Assets,
  Sprite,
  Spritesheet,
  AnimatedSprite,
  Graphics,
  MeshRope,
  type AnimatedSpriteFrames,
} from "pixi.js";

import { useEffect, useRef } from "react";
import spritesheetImage from "../sprites/animations.png";
import spritesheet_animations from "../sprites/animations.json";
import { CreateRope, UpdateRope } from "./RopeUtil";
import backgroundImage from "../assets/arena2.png";
import ropeTexture from "../assets/rope2.png";

import "./GameCanvas.css";

function GameCanvas() {
  // Reference to HTML canvas element for rendering scene.
  const canvas = useRef<HTMLCanvasElement | null>(null);
  let app: Application | null;

  /* Convert to normalized device coordinates */
  const NDC = (x: number, y: number) => {
    const w = canvas.current!.width;
    const h = canvas.current!.height;

    let posX = ((x + 1) / 2) * w;
    let posY = ((1 - y) / 2) * h;

    return [posX, posY] as const;
  };

  const initApp = async (canvas : HTMLCanvasElement): Promise<Application | null> =>  {
    if (!canvas) return null;

    const app = new Application();
    await app.init({
      canvas: canvas,
      backgroundColor: 0xFFFFFF,
      width: canvas.clientWidth || 800,
      height: canvas.clientHeight || 480,
    });

    return app;
  }

  const createAnimatedSprite = (
    frames: AnimatedSpriteFrames,
    sizeX: number,
    sizeY: number,
    x: number,
    y: number,
    flipX: boolean = false
  ): AnimatedSprite => {
    const sprite = new AnimatedSprite(frames);
    sprite.anchor.set(0.5, 0.5);
    sprite.scale.x = flipX ? -1 : 1;
    sprite.setSize(sizeX, sizeY);
    sprite.position.set(x, y);
    sprite.animationSpeed = 0.12;
    sprite.play();
    return sprite;
  }

  /* Changes animation of a sprite.
    Usage e.g.

    changeAnimation(redSprite, spritesheet.animations['player-pull-blue'], 0.12);

    const changeAnimation = (
        sprite : AnimatedSprite,
        frames : AnimatedSpriteFrames,
        speed : number) =>
    {
        sprite.textures = frames;
        sprite.animationSpeed = speed;
        sprite.play();
    }
  */

  useEffect(() => {

    (async () => {
      if (!canvas.current) {
        return;
      }

      app = await initApp(canvas.current);
      if (!app) return;

      const graphics = new Graphics();

      // Load spritesheet in
      const texture = await Assets.load(spritesheetImage);
      const spritesheet = new Spritesheet(texture, spritesheet_animations);
      await spritesheet.parse();

      // Add background
      const backgroundTexture = await Assets.load(backgroundImage);
      const backgroundSprite = new Sprite(backgroundTexture);
      backgroundSprite.position.set(0, 0);
      backgroundSprite.setSize(app.screen.width, app.screen.height);

      const redSprite = createAnimatedSprite(
        spritesheet.animations["player-pull-red"],
        150, 150,
        ...NDC(-0.6, -0.18)
      )

      const blueSprite = createAnimatedSprite(
        spritesheet.animations["player-pull-blue"],
        150, 150,
        ...NDC(0.6, -0.18),
        true
      )

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
        //graphics,
      );

      // Main update loop
      app.ticker.add((delta: { deltaMS: number }) => {
        // get dt in seconds
        const dt = delta.deltaMS / 1000;
        UpdateRope(rope, dt);

        graphics.clear();
        graphics.setStrokeStyle(0xff0000);

        graphics.moveTo(rope.points[0].x, rope.points[0].y);
        for (let i = 1; i < rope.points.length; i++) {
          graphics
            .lineTo(rope.points[i].x, rope.points[i].y)
            .circle(rope.points[i].x, rope.points[i].y, 5);
        }
        graphics.stroke();
      });

    })();
    
  }, []);

  return <canvas className="game-canvas" ref={canvas} />;
}

export default GameCanvas;
