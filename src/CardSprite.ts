import { GameObjects, Input, Scene, Textures, Types } from "phaser";
import { CardData } from "./Card";
import { CardStack } from "./CardStack";

export class CardSprite extends GameObjects.Image {
    public static DOUBLE_CLICK = "double_click";
    static doubleClickDelay = 300;

    public readonly cardData:CardData;
    public doubleClickable:boolean = false;
    public parentStack:CardStack | undefined;
    private hidden: boolean = false;

    private lastClickTime:number = 0;

    constructor(scene:Scene, cardData:CardData, texture:Textures.Texture) {
        super(scene, 0, 0, texture, cardData.sprite);

        this.cardData = cardData;
        this.setDataEnabled();
        this.setInteractive({draggable:true});
        this.name = `${cardData.sprite}`;
        this.on(Input.Events.POINTER_DOWN, this.onDown, this);
    }

    private onDown(_input: Input.Pointer, _card: CardSprite, _event:Types.Input.EventData) {
        if (!this.doubleClickable) {
            return;
        }

        const currentTimestamp = new Date().getTime();
        if (currentTimestamp - this.lastClickTime <= CardSprite.doubleClickDelay) {
            this.scene.events.emit(CardSprite.DOUBLE_CLICK, this);
        }
        this.lastClickTime = currentTimestamp;
    }

    setHidden(hidden:boolean) {
        if (hidden == this.hidden) {
            return;
        }

        if (hidden) {
            this.tweenFlip(this.cardData.backSprite);
        } else {
            this.tweenFlip(this.cardData.sprite);
        }
        this.hidden = hidden;
    }

    getHidden():boolean {
        return this.hidden;
    }

    private tweenFlip(frameName:string) {
        this.scene.tweens.add({
            targets:this,
            props: {
                scaleX: { value: 0, duration: 50, yoyo: true },
            },
            onYoyo: () => this.setFrame(frameName),
            ease: 'Linear'
        });
    }
}
