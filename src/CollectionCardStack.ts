import { Geom } from "phaser";
import { CardValue } from "./CardConsts";
import { CardSprite } from "./CardSprite";
import { CardStack, setPositionTween } from "./CardStack";
import { CardDropZone } from "./CardDropZone";

export class CollectionCardStack implements CardStack {

    public readonly cards:CardSprite[] = [];

    constructor(private readonly position:Geom.Point,
                private readonly zone:CardDropZone
               ){
                   this.zone.x = this.position.x;
                   this.zone.y = this.position.y;
                   this.zone.cardStack = this;
               }

    resetPositions(): void {
        for(let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            if (!card.input) {
                throw new Error(`Adding an uninteractable card to a stack ${card}`);
            }

            card.setVisible(i >= this.cards.length - 2);
            const depth = i;
            setPositionTween(card, this.position.x, this.position.y, () => card.setDepth(depth));
            card.doubleClickable = false;
            card.input.draggable = i == this.cards.length - 1;
        }

        this.zone.disableInteractive();
    }

    getStackedCards(rootCard: CardSprite): CardSprite[] {
        return [rootCard];
    }

    canParent(card: CardSprite): boolean {
        var childCard = card.cardData;

        if (this.cards.length == 0) {
            return childCard.card === CardValue.Ace;
        }

        var parentCard = this.cards[this.cards.length - 1].cardData;

        if (childCard.suit != parentCard.suit) {
            return false;
        }

        if ((childCard.card - parentCard.card) == 1){ 
            return true;
        }

        return false;
    }

    enableDrops(): void {
        this.zone.setInteractive();
    }

    addCard(card: CardSprite): void {
        this.cards.push(card);
        card.parentStack = this;
    }

    removeCard(card: CardSprite): void {
        const index = this.cards.indexOf(card);
        if (index >= 0) {
            card.parentStack = undefined;
            this.cards.splice(index, 1);
        }
    }
}
