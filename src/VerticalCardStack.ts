import { Geom } from "phaser";
import { CardDropZone } from "./CardDropZone";
import { CardSprite } from "./CardSprite";
import { CardStack, hiddenOffset, setPositionTween } from "./CardStack";

export class VerticalCardStack implements CardStack {

    constructor(public readonly cards:CardSprite[] = [],
                private readonly dropZone:CardDropZone,
                private readonly position:Geom.Point,
                private readonly offset:Geom.Point
               ) {

        this.cards.forEach(c => c.parentStack = this);
        this.dropZone.cardStack = this;
        this.resetPositions();
    }

    resetPositions() {
        this.stackCards();

        for(let i = this.cards.length - 1; i >= 0; i--) {
            const card = this.cards[i];

            if (!card.input) {
                throw new Error(`Adding an uninteractable card to a stack ${card}`);
            }

            if (i == this.cards.length - 1) {
                card.input.draggable = true;
                card.doubleClickable = true;
                if (card.getHidden()) {
                    card.setHidden(false);
                }
                continue;
            }

            const prevCardSprite = this.cards[i + 1];
            const prevCard = prevCardSprite.cardData;
            const currentCard = card.cardData;

            card.doubleClickable = false;
            card.input.draggable = Boolean(
                prevCardSprite.input?.draggable 
                && currentCard.canParent(prevCard)
                && !card.getHidden()
            );
        }

        this.dropZone.disableInteractive();
        this.dropZone.setDepth(this.cards.length - 1);
    }

    getStackedCards(rootCard:CardSprite):CardSprite[] {
        //TODO error maybe?
        const index = this.cards.indexOf(rootCard);
        if (index >= 0) {
            return this.cards.slice(index);
        }

        return [];
    }

    canParent(card:CardSprite) {
        if (!this.cards.length) {
            return true;
        }

        const lastCardData = this.cards[this.cards.length - 1].cardData;
        const newCardData = card.cardData;

        return lastCardData.canParent(newCardData);
    }

    enableDrops(): void {
        this.dropZone.setInteractive();
    }

    addCard(card: CardSprite) {
        card.parentStack = this;
        this.cards.push(card);
    }

    removeCard(card: CardSprite) {
        const index = this.cards.indexOf(card);
        if (index >= 0) {
            card.parentStack = undefined;
            this.cards.splice(index, 1);
        }
    }

    stackCards() {
        const { width, height } = this.dropZone.scene.sys.canvas;
        const { hiddenOffset, visibleOffset } = this.findOffsets(width, height);

        let currentX = this.position.x;
        let currentY = this.position.y;
        for(let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            const depth = i;
            setPositionTween(card, currentX, currentY, () => card.setDepth(depth));

            currentX += card.getHidden() ? hiddenOffset.x : visibleOffset.x;
            currentY += card.getHidden() ? hiddenOffset.y : visibleOffset.y;
        }

        this.dropZone.x = currentX;
        this.dropZone.y = currentY;
    }

    findOffsets(maxWidth:number, maxHeight:number):OffsetPair {
        let currentOffset = new Geom.Point(this.offset.x, this.offset.y);
        let currentHiddenOffset = new Geom.Point(hiddenOffset.x, hiddenOffset.y);

        let totalWidth = 0;
        let totalHeight = 0;
        let cardWidth = 0;
        let cardHeight = 0;
        for(const card of this.cards) {
            totalWidth += card.getHidden() ? currentHiddenOffset.x : currentOffset.x;
            totalHeight += card.getHidden() ? currentHiddenOffset.y : currentOffset.y;
            cardWidth = card.displayWidth;
            cardHeight = card.displayHeight;
        }
        totalWidth += cardWidth / 2;
        totalHeight += cardHeight / 2;

        const availableWidth = maxWidth - this.position.x;
        const availableHeight = maxHeight - this.position.y;
        const widthPercent = availableWidth / totalWidth;
        const heightPercent = availableHeight / totalHeight;

        if(widthPercent < 1) {
            currentOffset.x = Math.floor(widthPercent * currentOffset.x);
            currentHiddenOffset.x = Math.floor(widthPercent * currentHiddenOffset.x);
        }

        if (heightPercent < 1) {
            currentOffset.y = Math.floor(heightPercent * currentOffset.y);
            currentHiddenOffset.y = Math.floor(heightPercent * currentHiddenOffset.y);
        }

        return { visibleOffset: currentOffset, hiddenOffset: currentHiddenOffset };
    }
}

interface OffsetPair {
    hiddenOffset:Geom.Point,
    visibleOffset:Geom.Point
}
