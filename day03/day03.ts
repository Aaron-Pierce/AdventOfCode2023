import { readFileSync } from "fs";

const sum = (a: number, b: number) => a + b;
const isDigit = (char: string) => '0' <= char && char <= '9';

function groupBy<T>(arr: T[], predicate: (el: T) => boolean): T[][]{
    if(arr.length === 0) return [];
    let grouped: T[][] = [[arr[0]]];
    let lastPredicateResult = predicate(arr[0]);
    for(let i = 1; i < arr.length; i++) {
        let el = arr[i];
        let predicateResult = predicate(el);
        if(predicateResult === lastPredicateResult) grouped[grouped.length - 1].push(el)
        else grouped.push([el]);
        lastPredicateResult = predicateResult;
    }
    return grouped;
}

function last<T>(arr: T[]): T {
    return arr[arr.length - 1];
}

type Substring = {
    startIndex: number,
    length: number,
    value: string
}
type PartNumber = {
    lineIndex: number,
    substring: Substring,
    value: number
}
const indexAfter = (substr: Substring) => substr.startIndex + substr.length;

function getPartNumbers(lines: string[], lineIndex: number): PartNumber[] {
    let prevLine = lines[lineIndex - 1];
    let line = lines[lineIndex];
    let nextLine = lines[lineIndex + 1];
    
    const defaultSubstring: Substring = {
        length: 0,
        startIndex: 0,
        value: "default"
    }
    let substrings = groupBy(line.split(""), isDigit)
        .map(group => group.join(""))
        .reduce((prefix, el) => [...prefix, {
            startIndex: indexAfter(last(prefix)),
            length: el.length,
            value: el}
        ], [defaultSubstring])
        .filter(substr => !isNaN(substr.value as any));

    // For each range, see if that range in the above or below lines contains a symbol (is not wholly '.')
    let partNumbers = substrings.filter(substr => {
        return [prevLine, nextLine].filter(e => e).some(otherLine => {
            let neighborString = otherLine.substring(substr.startIndex - 1, indexAfter(substr) + 1);
            return neighborString.split("").filter(e => e !== ".").length > 0;
        }) || (line.charAt(substr.startIndex - 1) || '.') !== "." || (line.charAt(indexAfter(substr)) || '.') !== "."
    });
    
    return partNumbers.map(substring => {
        return {
            lineIndex,
            substring,
            value: parseInt(substring.value)
        }
    });
}

function part1(lines: string[]){
    return (
        lines.map((_, lineIndex) => getPartNumbers(lines, lineIndex))
            .map(line => line.map(partNum => partNum.value))
            .map(line => line.reduce(sum, 0))
            .reduce(sum, 0)
    );
}


function adjacentPartNumbers(asteriskInd: number, partNums: PartNumber[]): PartNumber[] {
    return partNums.filter(num => num.substring.startIndex - 1 <= asteriskInd && asteriskInd <= indexAfter(num.substring))
}

function part2(lines: string[]){
    let partNumbers = lines.map((_, lineInd) => getPartNumbers(lines, lineInd));
    let gears = lines.flatMap((line, lineInd) => {
        let asterisks = line.split("")
            .map<[string, number]>((char, ind) => [char, ind])
            .filter((([char, _]) => char === '*'));
        
        return asterisks.map(([_char, astInd]) => [
            ...adjacentPartNumbers(astInd, partNumbers[lineInd - 1] ?? []),
            ...adjacentPartNumbers(astInd, partNumbers[lineInd] ?? []),
            ...adjacentPartNumbers(astInd, partNumbers[lineInd + 1] ?? [])
        ]).filter(adjacentParts => adjacentParts.length === 2);
    });
    let gearRatios = gears.map(gear => gear[0].value * gear[1].value)
    return gearRatios.reduce(sum, 0);

}

let input = readFileSync("input.txt").toString().split("\n").filter(e => e);

console.log(part1(input));
console.log(part2(input));