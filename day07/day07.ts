import { readFileSync } from "fs";
import { ident } from "../utils";

type Turn = [Hand, Bid];

type Bid = number;

type Hand = {
    str: String,
    type: HandKind
}
let HandOrder = ["5Kind", "4Kind", "FullHouse", "3Kind", "2Pair", "Pair", "High"] as const;
type HandKind = typeof HandOrder[number];
const handKindValue = (handKind: HandKind) => HandOrder.indexOf(handKind);

let createHandComparator = (cardOrder: string) => {
    let cardValue = (char: string) => cardOrder.indexOf(char); 
    return (hand1: Hand, hand2: Hand) => {
        if(hand1.type !== hand2.type) return handKindValue(hand2.type) - handKindValue(hand1.type);
        for(let i = 0; i < hand1.str.length; i++){
            let card1 = hand1.str.charAt(i);
            let card2 = hand2.str.charAt(i);
            if(card1 !== card2) return cardValue(card2) - cardValue(card1);
        }
        return 0;
    }
}


function parseHand(str: String, useJokers: boolean = false): Hand {
    console.log();
    console.log();
    console.log(`Parsing ${str} with${useJokers ? "" : "out"} jokers`);
    let counts: {[card: string]: number} = {};
    let jokers = 0;
    str.split("").forEach(char => {
        console.log("Counting", char);
        
        if(char === 'J' && useJokers) {
            jokers++;
            return;
        } else {
            if(counts[char] === undefined) counts[char] = 0;
            counts[char]++; 
        }
    });
    console.log(`${jokers} jokers, other counts: ${JSON.stringify(counts)}`);
    
    let handTypeToOccurance: {[kind in HandKind]: number[]} = {
        "5Kind": [5],
        "4Kind": [4, 1],
        FullHouse: [3, 2],
        "3Kind": [3, 1, 1],
        "2Pair": [2, 2, 1],
        Pair: [2, 1, 1, 1],
        High: [1, 1, 1, 1, 1]
    };
    
    for(let [handKind, occurancesInHandKind] of Object.entries(handTypeToOccurance)) {
        
        let occurancesInHand = Object.values(counts).sort((a, b) => a - b).reverse();
        console.log(`\tConsidering ${handKind}, ${occurancesInHandKind} vs ${occurancesInHand}`);
        let remainingJokers = jokers;
        let cantMake = false;
        for(let i = 0; i < Math.max(occurancesInHandKind.length, occurancesInHand.length); i++) {
            if(occurancesInHand[i] === occurancesInHandKind[i]) {
                console.log(`\t\tIndex ${i} (${occurancesInHandKind[i]}) matches`);
                continue;
            };
            let jokersNeededToMatch = (occurancesInHandKind[i] || 0) - (occurancesInHand[i] || 0);
            if(jokersNeededToMatch > 0 && jokersNeededToMatch <= remainingJokers) {
                console.log(`\t\t For ${i}, meeting ${occurancesInHandKind[i]} from ${occurancesInHand[i]} with ${jokersNeededToMatch} jokers`);
                
                remainingJokers -= jokersNeededToMatch;
                continue;
            }
            // Otherwise, the counts don't match and we don't have enough jokers, this kind won't work
            cantMake = true;
            break;
        }
        if(!cantMake) {
            return {
                type: handKind as HandKind,
                str
            }
        }
    }
    throw "Could not parse hand: " + str;
}

function part1(turns: Turn[]){
    let part1HandComparator = createHandComparator("AKQJT98765432")
    turns.sort((t1, t2) => part1HandComparator(t1[0], t2[0]));
    // console.log(turns);
    return turns.reduce((acc, [hand, bid], rankMinus1) => acc + bid * (rankMinus1 + 1), 0);
}

function part2(turns: Turn[]){
    let part2HandComparator = createHandComparator("AKQT98765432J")
    turns.sort((t1, t2) => part2HandComparator(t1[0], t2[0]));
    // console.log(turns);
    return turns.reduce((acc, [hand, bid], rankMinus1) => acc + bid * (rankMinus1 + 1), 0);
}

let unparsedInput = readFileSync("./data.txt")
    .toString()
    .split("\n")
    .filter(ident)
    .map(line => line.split(" "));

console.log(
    part1(
        unparsedInput.map<Turn>(splitLine => [parseHand(splitLine[0]), parseInt(splitLine[1])])
    )
);

console.log(
    part2(
        unparsedInput.map<Turn>(splitLine => [parseHand(splitLine[0], true), parseInt(splitLine[1])])
    )
);

