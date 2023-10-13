export const fileCardSuit:string[] = [
    "Clubs",
    "Hearts",
    "Spades",
    "Diamonds"];
export const fileCardNames:string[] = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K"];

export enum CardSuit {
    Clubs = 0,
    Hearts,
    Spades,
    Diamonds
}

export enum CardValue {
    Ace = 0,
    V2,
    V3,
    V4,
    V5,
    V6,
    V7,
    V8,
    V9,
    V10,
    Jack,
    Queen,
    King
}

export const cardAtlas:string = "cards";
export const cardPlaceSound = "cardPlace1.ogg";
export const cardTakeSound = "cardPlace2.ogg";
