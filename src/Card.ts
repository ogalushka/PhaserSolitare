import { CardSuit, CardValue } from './CardConsts';

export class CardData {
    constructor(public readonly suit:CardSuit,
                public readonly card:CardValue,
                public readonly sprite:string,
                public readonly backSprite:string) {
                }

    canParent(child:CardData):boolean {
        if (this.card == CardValue.Ace) {
            return false;
        }

        if ((this.suit - child.suit) % 2 == 0) {
            return false;
        }

        if (this.card - child.card != 1) {
            return false;
        }

        return true;
    }
}


