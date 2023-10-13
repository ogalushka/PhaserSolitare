import { GameObjects, Geom } from "phaser";
import { CardSprite } from "./CardSprite";
import { cardPlaceSound } from "./CardConsts";

export interface CardStack {
    resetPositions():void;
    getStackedCards(rootCard:CardSprite):CardSprite[];
    canParent(card:CardSprite):boolean;
    enableDrops():void;
    addCard(card:CardSprite):void;
    removeCard(card:CardSprite):void;
}

export const stackOffset:Geom.Point = new Geom.Point(0, 45);
export const hiddenOffset:Geom.Point = new Geom.Point(0, 20);
const tweenSpeed = 3;

export function setPositionTween(card:CardSprite, x:number, y:number, callback: (() => void) | undefined) {
    const distSq = Math.pow(x - card.x, 2) + Math.pow(y - card.y, 2);
    if (distSq < 50) {
        card.setPosition(x, y);
        if (callback) callback();
        return;
    }

    const dist = Math.sqrt(distSq);
    const duration = dist / tweenSpeed;
    card.scene.tweens.add({
        targets: card,
        x:x,
        y:y,
        duration:duration,
        ease: "quad.inout",
        onComplete: () => { 
            if(callback) callback();
            const placeSoundPlaying = card.scene.sound.getAll(cardPlaceSound).some(s => s.isPlaying);
            if (!placeSoundPlaying){
                card.scene.sound.play(cardPlaceSound);
            }
        }
    });
}
