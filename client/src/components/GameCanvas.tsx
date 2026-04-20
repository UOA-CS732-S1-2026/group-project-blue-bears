import { Application, Assets, Sprite, Spritesheet, AnimatedSprite, Graphics, MeshRope } from 'pixi.js'
import { useEffect, useRef } from 'react';
import spritesheetImage from "../sprites/animations.png"
import spritesheet_animations from "../sprites/animations.json"
import { CreateRope, UpdateRope } from "./RopeUtil"
import backgroundImage from "../assets/arena.png"
import ropeTexture from "../assets/rope.png"

import "./GameCanvas.css"

function GameCanvas() {

    const canvas = useRef<HTMLCanvasElement | null>(null);

    /* Changes animation of a sprite.
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

    /* Convert to normalized device coordinates
        (-1, 1) for top left corner
        (1, 1) for top right corner
        (-1, -1) for bottom left corner
        (1, -1) for bottom right corner
        (0, 0) for center
    */
    const NDC = (x: number, y: number) => {
        const w = canvas.current!.width;
        const h = canvas.current!.height;
        
        let posX = (x+1)/2 * w;
        let posY = (1-y)/2 * h;
        
        return [posX, posY] as const;
    };

    useEffect(() => {
        let app: Application | null = null;
  
        (async () => {
            if (!canvas.current) {
                return;
            }

            app = new Application();
            const canvasWidth = canvas.current.clientWidth || 800;
            const canvasHeight = canvas.current.clientHeight || 480;
            await app.init({
                canvas: canvas.current,
                backgroundColor: 0xFFFFFF,
                width: canvasWidth,
                height: canvasHeight,
            });

            const graphics = new Graphics();

            const texture = await Assets.load(spritesheetImage);
            const spritesheet = new Spritesheet(
                texture, 
                spritesheet_animations
            )
            await spritesheet.parse();

            const backgroundTexture = await Assets.load(backgroundImage);
            const backgroundSprite = new Sprite(backgroundTexture);
            backgroundSprite.position.set(0,0);
            backgroundSprite.setSize(app.screen.width, app.screen.height);

            const redSprite = new AnimatedSprite(spritesheet.animations['player-pull-red']);
            redSprite.anchor.set(0.5, 0.5);
            redSprite.setSize(150, 150)
            redSprite.position.set(...NDC(-0.6, -0.23));
            redSprite.animationSpeed = 0.12;
            redSprite.play();

            const blueSprite = new AnimatedSprite(spritesheet.animations['player-pull-blue']);
            blueSprite.anchor.set(0.5, 0.5);
            blueSprite.scale.x = -1;
            blueSprite.setSize(150, 150)
            blueSprite.position.set(...NDC(0.6, -0.23));
            blueSprite.animationSpeed = 0.12;
            blueSprite.play();

            /*
            setTimeout(() => {
                changeAnimation(redSprite, spritesheet.animations['player-pull-blue'], 0.12);
            }, 3000)
            */

            const rope = CreateRope(...NDC(-1.1, -0.2), ...NDC(1.1, -0.2), 60);
            rope.particles[14].pinned = true;
            rope.particles[46].pinned = true;

            // MeshRope for stylization
            const ropeTextureAsset = await Assets.load(ropeTexture);
            const meshRope = new MeshRope({
                texture: ropeTextureAsset,
                points: rope.points,
                textureScale: 0.25
            });

            // Add graphics to scene
            app.stage.addChild(
                backgroundSprite,
                meshRope, 
                redSprite, 
                blueSprite,
                graphics
            );
            // Main update loop
            app.ticker.add((delta: { deltaMS: number; }) => {
                // get dt in seconds
                const dt = delta.deltaMS / 1000;
                UpdateRope(rope, dt);

                graphics.clear();
                graphics.setStrokeStyle(0xff0000)

                graphics.moveTo(rope.points[0].x, rope.points[0].y);
                for (let i = 1; i < rope.points.length; i++) {
                    graphics
                        .lineTo(rope.points[i].x, rope.points[i].y)
                        .circle(rope.points[i].x, rope.points[i].y, 5);
                }
                graphics.stroke();
            })

        })();

    }, [])

    return (<canvas className="game-canvas" ref={canvas} />);
}


export default GameCanvas;