import { GameObjects, Scene } from "phaser";
import { CardStack } from "./CardStack";

export class CardDropZone extends GameObjects.Zone {
    public cardStack:CardStack | undefined;

    constructor(scene:Scene, width:number, height:number) {
        super(scene, 0, 0, width, height);
        this.setRectangleDropZone(width, height);
        this.disableInteractive();
    }
}
