import { AnimatedSprite, type AnimatedSpriteFrames } from "pixi.js";

export const createAnimatedSprite = (
  frames: AnimatedSpriteFrames,
  sizeX: number,
  sizeY: number,
  x: number,
  y: number,
  flipX: boolean = false,
): AnimatedSprite => {
  const sprite = new AnimatedSprite(frames);
  sprite.anchor.set(0.5, 0.5);
  sprite.scale.x = flipX ? -1 : 1;
  sprite.setSize(sizeX, sizeY);
  sprite.position.set(x, y);
  sprite.animationSpeed = 0.12;
  sprite.play();
  return sprite;
};

/*  Changes animation of a sprite.
  Usage e.g.

  changeAnimation(redSprite, spritesheet.animations['player-pull-blue'], 0.12);
*/
export const changeAnimation = (
  sprite: AnimatedSprite,
  frames: AnimatedSpriteFrames,
  speed: number,
) => {
  sprite.textures = frames;
  sprite.animationSpeed = speed;
  sprite.play();
};

export default { createAnimatedSprite, changeAnimation };
