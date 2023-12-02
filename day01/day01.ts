import { readFileSync } from "fs";


function first<T>(arr: T[]): T {
    return arr[0];
}

function last<T>(arr: T[]): T {
    return arr[arr.length - 1];
}
const chars = (str: string) => str.split("");
const isCharADigit = (c: string) => '0' <= c && c <= '9'

const add = (a: number, b: number) => a + b;

const VALUES: { [key: string]: number } = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9
}

function part1(lines: string[]) {
    const firstNumber = (string: string) => {
        return parseInt(
            first(
                chars(string).filter(isCharADigit)
            )
        );
    }

    const lastNumber = (string: string) => {
        return parseInt(
            last(
                chars(string).filter(isCharADigit)
            )
        );
    }

    return lines.map((line) => firstNumber(line) * 10 + lastNumber(line)).reduce(add);
}


function part2(lines: string[]) {
    const firstNumber = (string: string) => Object.keys(VALUES)
            .map(key => [string.indexOf(key), VALUES[key]])
            .filter((([index, key]) => index >= 0))
            .reduce((p1, p2) => p1[0] < p2[0] ? p1 : p2)[1];
    
    const lastNumber = (string: string) => {
        function lastIndexOf(string: string, search: string, last: number = -1): number {
            let indexOf = string.indexOf(search, last + 1);
            if (indexOf !== -1) return lastIndexOf(string, search, indexOf);
            return last;
        }

        return Object.keys(VALUES)
            .map(key => [lastIndexOf(string, key), VALUES[key]])
            .filter((([index, key]) => index >= 0))
            .reduce((p1, p2) => p1[0] > p2[0] ? p1 : p2)[1];
    }

    return lines.map(line => 10 * firstNumber(line) + lastNumber(line)).reduce(add);
}

let input = readFileSync("./input.txt").toString().split("\n").filter(e => e);

console.log(`Part 1:`, part1(input))
console.log(`Part 2:`, part2(input))