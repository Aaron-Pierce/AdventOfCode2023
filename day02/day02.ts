import { readFileSync } from "fs";

type Pull = {
    "red": number,
    "green": number,
    "blue": number
}
type Game = Pull[];

function leq(pull1: Pull, pull2: Pull) {
    return (
        pull1.red <= pull2.red
        && pull1.green <= pull2.green
        && pull1.blue <= pull2.blue
    )
}

function piecewiseMax(pull1: Pull, pull2: Pull) {
    return {
        'red': Math.max(pull1.red, pull2.red),
        'green': Math.max(pull1.green, pull2.green),
        'blue': Math.max(pull1.blue, pull2.blue),
    }
}

function power(pull: Pull) {
    return Object.values(pull).reduce((acc, el) => acc * el, 1);
}

function part1(games: Game[]){
    let bag: Pull = {
        "red": 12,
        "green": 13,
        "blue": 14
    }

    function isPossible(game: Game) {
        return game.every(pull => leq(pull, bag))
    }

    return games.reduce((gameIdSum, game, gameIdMinus1) => {
        return gameIdSum + (isPossible(game) ? gameIdMinus1 + 1 : 0)
    }, 0);
}

function part2(games: Game[]){
    return games.reduce((powerSum, game) => {
        return powerSum + power(game.reduce(piecewiseMax))
    }, 0);
}


function parseGame(line: string): Game {
    let pullStrings = line.split("; ");

    function parsePair(pair: string): [string, number] {
        let [color, countString] = pair.split(" ").reverse();
        return [color, parseInt(countString)];
    }
    
    const parsePull = (pullString: string) => {
        return {
            ...{
                "red": 0,
                "green": 0,
                "blue": 0
            },
            ...Object.fromEntries(pullString.split(", ").map(parsePair))
        };
    };

    let parsedGame = pullStrings.map(parsePull)
    return parsedGame;
}
let input = readFileSync("./input.txt").toString().split("\n").filter(e => e).map(line => line.split(": ")[1]).map(parseGame);

console.log(`Part 1:`, part1(input))
console.log(`Part 2:`, part2(input))