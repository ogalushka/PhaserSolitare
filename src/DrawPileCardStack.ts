import { Geom } from "phaser";
import { CardSprite } from "./CardSprite";
import { CardStack, setPositionTween } from "./CardStack";

export class DrawPileCardStack implements CardStack {
    private readonly cards:CardSprite[] = [];
    private readonly offset:Geom.Point;
    constructor(
        private readonly visibleCards:number,
        private readonly position:Geom.Point) {

        this.offset = new Geom.Point(30, 0);
    }

    resetPositions(): void {
        for(let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];

            const visibleIndex =  i - (this.cards.length - this.visibleCards);

            card.setVisible(visibleIndex >= 0);
            const depth = i;

            if (visibleIndex >= 0) {
                setPositionTween(card,
                                 this.position.x + (this.offset.x * visibleIndex),
                                 this.position.y + (this.offset.y * visibleIndex),
                                 () => card.setDepth(depth));
           } else {
               card.setDepth(depth);
           }

            if (!card.input) {
                throw new Error(`Adding an uninteractable card to a stack ${card}`);
            }

            card.input.draggable = (i == (this.cards.length - 1));
            card.doubleClickable = card.input.draggable;
        }
    }

    getStackedCards(rootCard: CardSprite): CardSprite[] {
        return [rootCard];
    }

    canParent(_: CardSprite): boolean {
        return false;
    }

    enableDrops(): void {
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
    
    removeLastCard():CardSprite | undefined {
        return this.cards.pop();
    }
}
