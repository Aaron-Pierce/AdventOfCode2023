import { readFileSync } from "fs";
import { ident } from "../utils";

// Find the empty columns of a given grid.
// Instead of taking the grid and directly accessing it,
// this takes a function to ask for elements of the grid.
// This allows you to easily "transpose" the grid by swapping the row/col
// used to index the grid when the function is called.
function __findEmptyColumns(grid: (row: number, col: number) => string, numRows: number, numCols: number): Set<number> {
    let emptyColumns = new Set<number>();
    for (let col = 0; col < numCols; col++) {
        let isEmpty = true;
        for(let row = 0; row < numRows; row++) {
            if(grid(row, col) !== '.') {
                isEmpty = false;
                break;
            }
        }
        if (isEmpty) emptyColumns.add(col);
    }
    return emptyColumns;
}

// Pass the grid as normal to __findEmptyColumns, so that it just finds the empty columns
function findEmptyColumns(grid: string[][]) {
    return __findEmptyColumns(
        (row, col) => grid[row][col],
        grid.length,
        grid[0].length
    )
}

// Pass the "transposed" grid to __findEmptyColumns, so that it actually finds the empty rows.
// To "transpose" the grid, the row/col which __findEmptyColumns uses is swapped,
// and so we also swap numRows and numCols
function findEmptyRows(grid: string[][]) {
    return __findEmptyColumns(
        (col, row) => grid[row][col],
        grid[0].length,
        grid.length
    )
}

function findGalaxies(grid: string[][]) {
    const numRows = grid.length;
    const numCols = grid[0].length;
    let galaxies: [number, number][] = [];
    for(let row = 0; row < numRows; row++){
        for (let col = 0; col < numCols; col++) {
            if(grid[row][col] === "#") {
                galaxies.push([row, col]);
            }
        }
    }
    return galaxies;

}

function isBetween(middle: number, bound1: number, bound2: number) {
    return Math.min(bound1, bound2) < middle && middle < Math.max(bound1, bound2)
}

function part1(grid: string[][], expansionFactor: number = 2) {
    let emptyCols = Array.from(findEmptyColumns(grid));
    let emptyRows = Array.from(findEmptyRows(grid));
    let galaxies = findGalaxies(grid);
    let distanceTotal = 0;
    for(let i = 0; i < galaxies.length; i++) {
        for(let j = i + 1; j < galaxies.length; j++) {
            let galaxyA = galaxies[i];
            let galaxyB = galaxies[j];
            // We can only move orthogonally, so this is just a manhattan distance
            let distance = Math.abs(galaxyA[1] - galaxyB[1]) + Math.abs(galaxyA[0] - galaxyB[0]);
            // And any time we cross an empty column, we have actually crossed more space (1 extra col for part1, 1_000_000 for part 2)
            distance += emptyCols.filter(emptyCol => isBetween(emptyCol, galaxyA[1], galaxyB[1])).length * (expansionFactor - 1);
            distance += emptyRows.filter(emptyRow => isBetween(emptyRow, galaxyA[0], galaxyB[0])).length * (expansionFactor - 1);
            
            distanceTotal += distance;
        }
    }
    return distanceTotal;
}

function part2(grid: string[][]) {
    return part1(grid, 1_000_000);
}

const input = readFileSync("./input.txt").toString().split("\n").filter(ident).map(e => e.split("").filter(ident));

console.log(
    part1(input)
);


console.log(
    part2(input)
);
