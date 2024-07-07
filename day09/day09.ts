import { readFileSync } from "fs";
import { ident, last } from "../utils";


function delta(sequence: number[]): number[] {
    if(sequence.every(e => e === 0)) sequence;
    let derived = sequence.map((_, ind, arr) => (arr[ind + 1] ?? Infinity) - arr[ind]);
    derived.pop(); // Last element is garbage, just because map iterates over the entire array
    return derived;
}

function extrapolateForward(sequence: number[]): number[] {
    if (sequence.every(e => e === 0)) return [...sequence, 0];
    let derivative = extrapolateForward(delta(sequence));
    return [...sequence, last(derivative) + last(sequence)];
}

function extrapolateBackward(sequence: number[]): number[] {
    if (sequence.every(e => e === 0)) return [0, ...sequence];
    let derivative = extrapolateBackward(delta(sequence));
    return [sequence[0] - derivative[0], ...sequence];
}

function part1(sequences: number[][]) {
    return sequences.map(extrapolateForward).reduce((acc, el) => acc + last(el), 0);
}

function part2(sequences: number[][]) {
    return sequences.map(extrapolateBackward).reduce((acc, el) => acc + el[0], 0);
}

const inputLines = readFileSync("input.txt").toString().split("\n").filter(ident);
const sequences = inputLines.map(line => line.split(/\s/).map(e => parseInt(e)))
console.log(
    part1(sequences)
);

console.log(
    part2(sequences)
);