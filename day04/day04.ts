import { readFileSync } from "fs";

type Card = [WinningNumbers, MyNumbers];
type WinningNumbers = number[];
type MyNumbers = number[];

const sum = (a: number, b: number) => a + b;

function part1(input: Card[]){
    return input.map(([winningNums, myNums]) => {
        let winningSet = new Set(winningNums);
        return Math.floor(2**(myNums.filter(e => winningSet.has(e)).length - 1))
    }).reduce(sum)
}

function part2(input: Card[]){
    let memo: {[cardIndex: number]: number} = {};
    function processCard(index: number): number {
        if(memo[index]) return memo[index];
        let [winningNums, myNums] = input[index];
        let winningSet = new Set(winningNums);
        let matches = myNums.filter(n => winningSet.has(n));
        let solution = matches.length + matches.map((_, n) => processCard(index + n + 1)).reduce(sum, 0);
        memo[index] = solution;
        return solution;
    }
    return input.map((_, ind) => processCard(ind)).reduce(sum) + input.length;
}

let input = readFileSync("./input.txt")
    .toString()
    .split("\n")
    .filter(e => e)
    .map(line => line.split(": ")[1])
    .map(line => line.split(/\s+\|\s+/)
        .map(half => half.split(/\s+/)
            .map(num => parseInt(num))
        ) as Card
    );

console.log(part1(input));
console.log(part2(input));