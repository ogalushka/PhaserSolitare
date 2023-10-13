import { cardAtlas, cardPlaceSound, cardTakeSound, fileCardNames, fileCardSuit } from './CardConsts';
import { CardData } from './Card';
import { AUTO, Game, GameObjects, Geom, Input, Math as PMath, Scene, Textures, Types, Utils } from 'phaser';
import { CardStack, stackOffset } from './CardStack';
import { CardSprite } from './CardSprite';
import { CardDropZone } from './CardDropZone';
import { DrawPileCardStack } from './DrawPileCardStack';
import { CollectionCardStack } from './CollectionCardStack';
import { VerticalCardStack } from './VerticalCardStack';

type Image = GameObjects.Image;
const cardPlaceholder = "cardBack_blue3.png";
const cardbackFrame = "cardBack_blue2.png";


export default class Solitare extends Scene {
    private readonly cardSize:Geom.Point;
    private readonly cards:Map<string, CardSprite>;
    private readonly deck:CardData[] = [];
    private readonly stacks:CardStack[] = [];
    private readonly collectionStacks:CollectionCardStack[] = [];
    private drawStack:DrawPileCardStack = null!;
    private readonly deckCardBacks:Image[] = [];
    private readonly deckPosition:Geom.Point = new Geom.Point(0, 0);

    private dragStartPosition:Geom.Point = new Geom.Point(0, 0);
    private dragPulled:boolean = false;
    private dragCards:CardSprite[] = [];
    private dropPreview: GameObjects.RenderTexture = null!;
    private playGameEndAnimation:boolean = false;

    constructor () {
        super('Solitare');

        this.cardSize = new Geom.Point(186, 131);

        this.cards = new Map<string, CardSprite>();
    }

    preload () {
        this.load.atlasXML(cardAtlas, "assets/cards.png", "assets/cards.xml");
        this.load.audio(cardTakeSound, [`assets/${cardTakeSound}`]);
        this.load.audio(cardPlaceSound, [`assets/${cardPlaceSound}`]);

        for(let suitIndex = 0; suitIndex < fileCardSuit.length; suitIndex++) {
            const suit = fileCardSuit[suitIndex];

            for(let cardIndex = 0; cardIndex < fileCardNames.length; cardIndex++) {
                const card = fileCardNames[cardIndex];
                const imageName = `card${suit}${card}.png`;

                const cardData = new CardData(suitIndex, cardIndex, imageName, cardbackFrame);

                this.deck.push(cardData);
            }
        }
    }

    create () {
        Utils.Array.Shuffle(this.deck);

        const atlas = this.textures.get(cardAtlas);
        const cardBackFrame = atlas.get(cardbackFrame);
        const stackCount = 7;
        const gameWidth = this.game.canvas.width
        const delta = gameWidth / (stackCount + 1);

        this.cardSize.x = cardBackFrame.width;
        this.cardSize.y = cardBackFrame.height;
        this.deckPosition.x = delta;
        this.deckPosition.y = 125;
        this.dropPreview = this.add.renderTexture(0, 0, this.cardSize.x, this.cardSize.y * 4)
            .setAlpha(.5)
            .setDepth(50)
            .setOrigin(0.5, 0);

        this.createVerticalStacks(delta);
        this.createCollectionStacks(gameWidth, delta, atlas);
        this.createDrawDeck(delta, atlas);
        
        this.input.on(Input.Events.DRAG_START, this.onDragStart, this);
        this.input.on(Input.Events.DRAG, this.onDrag, this);
        this.input.on(Input.Events.DROP, this.onDrop, this);
        this.input.on(Input.Events.DRAG_ENTER, this.onDragEnter, this);
        this.input.on(Input.Events.DRAG_LEAVE, this.onDragLeave, this);
        this.input.on(Input.Events.DRAG_END, this.onDragEnd, this);
        this.events.on(CardSprite.DOUBLE_CLICK, this.onCardDoubleClick, this);
    }

    private createVerticalStacks(delta:number){
        for(let i = 0; i < 7; i++) {
            const totalCards = i + 1;
            const hiddenCards = Math.floor(totalCards / 2);
            const x = delta + delta * i;
            const y = 350;
            this.createStack(this.deck, i + 1, hiddenCards, x, y);
        }
    }

    private createCollectionStacks(gameWidth:number, delta:number, atlas:Textures.Texture) {
        for(let i = 0; i < 4; i++) {
            const x = gameWidth - delta - (delta * i);
            const y = 125;

            const dropZone = new CardDropZone(this, this.cardSize.x, this.cardSize.y);
            this.add.existing(dropZone);

            const collectStack = new CollectionCardStack(new Geom.Point(x, y), dropZone);
            this.stacks.push(collectStack);
            this.collectionStacks.push(collectStack);

            this.add.image(x, y, atlas, cardPlaceholder).setDepth(-100);
        }
    }

    private createDrawDeck(delta:number, atlas:Textures.Texture) {
        for(let i = 0; i < 3; i++) {
            const x = this.deckPosition.x;
            const y = this.deckPosition.y;

            const deckCard = this.add.image(x - i * 3, y - i * 3, atlas,
                           i == 0 ? cardPlaceholder : cardbackFrame);
            this.deckCardBacks.push(deckCard);
        }

        const cardFrame = atlas.get("cardBack_blue2.png");
        const drawZone = this.add.zone(this.deckPosition.x, this.deckPosition.y, cardFrame.width, cardFrame.height)
            .setInteractive();
        drawZone.on(Input.Events.POINTER_DOWN, this.drawNext, this);
        this.drawStack = new DrawPileCardStack(3, new Geom.Point(delta * 2, 125));
        this.stacks.push(this.drawStack);
    }

    private onCardDoubleClick(card:CardSprite) {
        if (card.parentStack) {
            for(var stack of this.collectionStacks) {
                if (stack.canParent(card)) {
                    const pastStack = card.parentStack;
                    card.parentStack.removeCard(card);
                    pastStack.resetPositions();
                    this.sound.play(cardTakeSound);

                    card.setDepth(100);
                    stack.addCard(card);
                    stack.resetPositions();
                    this.checkGameEnd();
                    return;
                }
            }
        }
    }

    private createStack(deck:CardData[], count:number, hiddenCount:number, x:number, y:number) {
        const stackCards:CardSprite[] = [];

        for(var i = 0; i < count; i++) {
            const card = deck.pop();
            if (!card) {
                break;
            }

            const cardSprite = this.getCardImage(card);
            cardSprite.setHidden(i < hiddenCount);

            stackCards.push(cardSprite);
        }

        const dropZone = new CardDropZone(this, this.cardSize.x, this.cardSize.y);
        this.add.existing(dropZone);

        this.stacks.push(new VerticalCardStack(stackCards, dropZone, new Geom.Point(x, y), stackOffset));
    }

    private getCardImage(card:CardData):CardSprite {
        const atlas = this.textures.get("cards");
        const name = card.sprite;

        let cardSprite:CardSprite | undefined;

        if (this.cards.has(name)) {
            cardSprite = this.cards.get(name);
        } else if (!this.cards.has(name)) {
            cardSprite = new CardSprite(this, card, atlas);
            this.add.existing(cardSprite);
            this.cards.set(name, cardSprite);
        }

        cardSprite!.x = this.deckPosition.x;
        cardSprite!.y = this.deckPosition.y;

        return cardSprite!;
    }

    private onDragStart(_pointer:Input.Pointer, card:CardSprite) {
        this.dragStartPosition.x = card.x;
        this.dragStartPosition.y = card.y;
        this.dragPulled = false;
    }

    private onDrag(_pointer:Input.Pointer, card:CardSprite, dragX:number, dragY:number) {
        if (!this.dragPulled) {
            const distSq = Math.pow(dragX - this.dragStartPosition.x, 2) + Math.pow(dragY - this.dragStartPosition.y, 2);
            if (distSq < 5000) {
                return;
            }

            this.startCardDrag(card);
        }

        for(let i = 0; i < this.dragCards.length; i++) {
            const card = this.dragCards[i];
            card.x = dragX + (stackOffset.x * i);
            card.y = dragY + (stackOffset.y * i);
        }
    }

    private startCardDrag(card:CardSprite) {
        const sourceStack = card.parentStack;
        if (!sourceStack) {
            throw new Error(`Card can't be dragged if it's not on a stack card:${card}`);
        }

        this.sound.play(cardTakeSound);
        this.dragCards = sourceStack.getStackedCards(card);
        this.dragCards.forEach((c,i) => c.setDepth(1000 + i));

        this.dragPulled = true;
        for(const stack of this.stacks) {
            if (stack != sourceStack && stack.canParent(card)) {
                stack.enableDrops();
            }
        }
    }

    private onDrop(_pointer:Input.Pointer, 
                   card:CardSprite,
                   dropZone:CardDropZone) {
        this.dropPreview.clear();
        const oldStack = card.parentStack;
        const newStack = dropZone.cardStack;

        if (!oldStack) {
            throw new Error(`Card can't be dragged if it's not on a stack card:${card}`);
        }

        if (!newStack) {
            throw new Error(`Card can't be droped on zone not in stack ${card}`);
        }

        if (newStack.canParent(card)) {
            this.dragCards.forEach(c => oldStack.removeCard(c));
            this.dragCards.forEach(c => newStack.addCard(c));

            this.stacks.forEach(s => s.resetPositions());
        }

        this.checkGameEnd();
    }

    private onDragEnter(_pointer:Input.Pointer,
                        _:CardSprite,
                        cardDropZone:CardDropZone) {
        let firstCardX = 0;
        let firstCardY = 0;
        this.dropPreview.x = cardDropZone.x;
        this.dropPreview.y = cardDropZone.y - this.cardSize.y / 2;
        for(let i = 0; i < this.dragCards.length; i++) {
            const card = this.dragCards[i];
            if (i == 0) {
                firstCardX = card.x;
                firstCardY = card.y;
            }
            const targetX = card.x - firstCardX + card.width / 2;
            const targetY = card.y - firstCardY + card.height / 2;
            this.dropPreview.draw(card, targetX, targetY);
        }
    }

    private onDragLeave(_pointer:Input.Pointer,
                        _:CardSprite,
                        _dropZone:Image) {
        this.dropPreview.clear();
    }

    private onDragEnd(_pointer:Input.Pointer,
                      _:CardSprite,
                      _dropped:boolean) {
        this.dropPreview.clear();
        if (this.dragPulled) {
            this.stacks.forEach(s => s.resetPositions());
        }
    }

    private drawNext(_:Input.Pointer, _localX:number, _localY:number, _data:Types.Input.EventData) {
        if (this.deck.length) {
            for(let i = 0; i < 3; i++) {
                const card = this.deck.pop();
                if (!card) {
                    break;
                }
                this.drawStack.addCard(this.getCardImage(card));
            }
        } else {
            let card = this.drawStack.removeLastCard();
            while(card) {
                card.setVisible(false);
                if (card.input) {
                    card.input.draggable = false;
                }

                this.deck.push(card.cardData);
                card = this.drawStack.removeLastCard();
            }
        }

        if (this.deck.length > 3) {
            this.deckCardBacks.forEach(d => d.setVisible(true));
        } else if (this.deck.length == 0) {
            this.deckCardBacks.forEach((c, i) => c.setVisible(i == 0));
        } else {
            this.deckCardBacks.forEach((c, i) => c.setVisible(i < this.deckCardBacks.length - 1));
        }

        this.drawStack.resetPositions();
    }

    // Game win
    private checkGameEnd() {
        if (this.collectionStacks.every(c => c.cards.length >= 13)) {
            this.input.removeAllListeners();
            setTimeout(() => this.playGameEndAnimation = true, 500);
            this.renderTex = this.add.renderTexture(0, 0, this.sys.canvas.width, this.sys.canvas.height)
                .setOrigin(0, 0)
                .setDepth(50);
        }
    }

    currentCardAnimation:CardSprite | undefined;
    cardSpeed:PMath.Vector2 = new PMath.Vector2(-1, -1);
    cardAcceleration:PMath.Vector2 = new PMath.Vector2(0, 0.009);
    renderTex:GameObjects.RenderTexture | undefined;

    override update(_time:number, delta:number) {
        if (!this.playGameEndAnimation || !this.renderTex) {
            return;
        }

        if (!this.currentCardAnimation) {
            this.cardSpeed.x = -(Math.random() * 0.5 + 0.5);
            this.cardSpeed.y = -(Math.random() + 0.5);
            const maxCardStack = this.collectionStacks.reduce(
                (p, c) => p.cards.length > c.cards.length ? p : c, this.collectionStacks[0]);
            this.currentCardAnimation = maxCardStack.cards.pop();
            if (maxCardStack.cards.length) {
                maxCardStack.cards[maxCardStack.cards.length - 1].setVisible(true);
            }

            if (!this.currentCardAnimation) {
                this.playGameEndAnimation = false;
                return;
            }

            this.currentCardAnimation.setDepth(100)
        }

        const rightEdgeX = this.currentCardAnimation.x + this.currentCardAnimation.width;
        if (rightEdgeX < 0) {
            this.currentCardAnimation.setVisible(false);
            this.currentCardAnimation = undefined;
            return;
        }

        this.currentCardAnimation.x += 0.5 * (this.cardAcceleration.x ** 2) * delta + this.cardSpeed.x * delta;
        this.currentCardAnimation.y += 0.5 * (this.cardAcceleration.y ** 2) * delta + this.cardSpeed.y * delta;

        this.cardSpeed.x += this.cardAcceleration.x * delta;
        this.cardSpeed.y += this.cardAcceleration.y * delta;
        this.renderTex.draw(this.currentCardAnimation, this.currentCardAnimation.x, this.currentCardAnimation.y);

        const bottom = this.currentCardAnimation.y + this.currentCardAnimation.height / 2;
        if (bottom > this.sys.canvas.height) {
            this.currentCardAnimation.y = this.sys.canvas.height - this.currentCardAnimation.height / 2;
            this.cardSpeed.y = -this.cardSpeed.y * 0.7;
        }
    }
}

const config = {
    type: AUTO,
    backgroundColor: '#00a000',
    parent: "game",
    width: 1280,
    height: 960,
    scene: Solitare
};

new Game(config);
