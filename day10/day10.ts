import { readFileSync } from "fs";
import { ident } from "../utils";
const Directions = ["Up", "Down", "Left", "Right"] as const;
type Direction = typeof Directions[any]
type DirectionTo<T> = {[d in Direction]?: T};

const Pipes: {[symbol: string]: DirectionTo<Direction>} = {
    "|": {
        "Up": "Up",
        "Down": "Down"
    },
    "-": {
        "Left": "Left",
        "Right": "Right"
    },
    "L": {
        "Down": "Right",
        "Left": "Up"
    },
    "J": {
        "Down": "Left",
        "Right": "Up"
    },
    "7": {
        "Right": "Down",
        "Up": "Left"
    },
    "F": {
        "Up": "Right",
        "Left": "Down"
    },
    ".": {},
    "*": {}
}

type RowColDelta = {
    dRow: number,
    dCol: number
}

const directionToRowColDelta: Required<DirectionTo<RowColDelta>> = {
    "Up": {dRow: -1, dCol: 0},
    "Down": {dRow: 1, dCol: 0},
    "Left": {dRow: 0, dCol: -1},
    "Right": {dRow: 0, dCol: 1}
}

type Neighbor = {
    position: [number, number],
    symbol: string
}

function neighbors(map: string[], [row, col]: [number, number]): DirectionTo<Neighbor> {
    const numCols = map[0].length;
    const numRows = map.length;
    let toReturn: DirectionTo<Neighbor> = {};
    const makeNeighbor = ([r, c]: [number, number]): Neighbor => { return { position: [r, c], symbol: map[r].charAt(c) } } 
    if(row > 0) toReturn["Up"] = makeNeighbor([row - 1, col]);
    if(row < numRows - 1) toReturn["Down"] = makeNeighbor([row + 1, col]);
    if(col > 0) toReturn['Left'] = makeNeighbor([row, col - 1]);
    if(col < numCols - 1) toReturn["Right"] = makeNeighbor([row, col + 1]);
    return toReturn;
}

function canMoveIntoNeighborFrom(neighbor: Neighbor, neighborDirection: Direction): boolean { 
    return Pipes[neighbor.symbol][neighborDirection] != undefined;
}

function findStartPosition(map: string[]): [number, number] {
    const [startRow, startColumn] = map
        .map((el, ind) => [ind, el.indexOf("S")])
        .filter(([_rowIndex, location]) => location != -1)[0];
    return [startRow, startColumn];
}

function part1(map: string[]) {
    let loopInfo = walkLoop(map, findStartPosition(map));
    return loopInfo.loopLength / 2;
}


function setEq<T>(a: Set<T>, b: Set<T>) {
    return a.size === b.size && Array.from(a).every(e => b.has(e));
}

const memoKey = ([row, col]: [number, number]) => `r${row}, c${col}`;


// Given the map and the starting position,
// walk around the loop and record the length and all of the (row, column) positions
// of cells which belong to the loop.
function walkLoop(map: string[], [startRow, startColumn]: [number, number]) {
    let startNeighbors = neighbors(map, [startRow, startColumn]);
    let validNextMoves = (Object.entries(startNeighbors) as [Direction, Neighbor][]).filter(([dir, neighbor]) => canMoveIntoNeighborFrom(neighbor, dir))
    let [firstNeighborDirection, firstNeighbor] = validNextMoves[0];

    let [walkRow, walkCol] = [...firstNeighbor.position];
    let inDirection = firstNeighborDirection;
    let loopLength = 1;

    let loopPositions: Set<string> = new Set();
    loopPositions.add(memoKey([startRow, startColumn]));

    
    while(!(walkRow === startRow && walkCol === startColumn)) {
        loopPositions.add(memoKey([walkRow, walkCol]))
        let currentSymbol = map[walkRow].charAt(walkCol);
        let nextDirection = Pipes[currentSymbol][inDirection];            
        if (nextDirection === undefined) throw `Pipe led to dead end from ${walkRow}, ${walkCol}, inDirection ${inDirection}`
        let delta = directionToRowColDelta[nextDirection];
        walkRow += delta.dRow;
        walkCol += delta.dCol;
        inDirection = nextDirection;
        loopLength++;
    }

    return {
        loopLength, loopPositions
    };
}

function part2(_map: string[]) {
    let initalStartPosition = findStartPosition(_map)
    let initialLoopInfo = walkLoop(_map, initalStartPosition);
    let map = pad(_map, ...initalStartPosition, initialLoopInfo.loopPositions).split("\n");
    

    let [startRow, startColumn] = findStartPosition(map);
    let loopInfo = walkLoop(map, [startRow, startColumn]);

    // BFS through the map, finding enclosed regions.
    // If the enclosed region touches the border of the map, it is not inside of the loop
    // Otherwise, it is.
    let visited = new Set();
    const bfs = ([rootRow, rootColumn]: [number, number]) => {
        let queue = [[rootRow, rootColumn]];
        visited.add(memoKey([rootRow, rootColumn]));

        let isInterior = true;
        let size = 0;
        while(queue.length > 0) {
            let [row, col] = queue.shift() as [number, number];
            let cellSymbol = map[row].charAt(col);
            let neighborList = neighbors(map, [row, col]);

            // If the cell has fewer than four neighbors, then it's on the map border,
            // so this region cannot be enclosed by the loop
            if(Object.keys(neighborList).length < 4) isInterior = false;

            for(let n of Object.values(neighborList)) {
                let key = memoKey(n.position)
                if(!visited.has(key) && !loopInfo.loopPositions.has(key)) {
                    queue.push(n.position);
                    visited.add(key);
                }
            }
            
            // Don't count fake padding cells, only
            if(cellSymbol != "*") size++;
        }

        return isInterior ? size : 0;
    }

    let interior = 0;
    for(let row = 0; row < map.length; row++) {
        for(let col = 0; col < map[0].length; col++) {
            if(!visited.has(memoKey([row, col])) && !loopInfo.loopPositions.has(memoKey([row, col]))) {
                interior += bfs([row, col]);
            }
        }
    }
    return interior;
}


/*
 This is pretty gross - expand each cell into four.
 Every cell gets a padding cell to its right and below it.
 Non-loop cells are expanded with *'s, so that we know it's fake, but it allows the BFS to escape
 out of regions which are bounded by pipe exteriors.
*/
function pad(map: string[], startRow: number, startColumn: number, loopPositions: Set<String>) {

    
    let startNeighbors = neighbors(map, [startRow, startColumn]);
    let neighborlyDirections = Directions.filter(e => startNeighbors[e] !== undefined && Pipes[startNeighbors[e]?.symbol as string][e] !== undefined);    

    // If S is a pipe, we need to expand it correctly, so we need to know what kind of pipe it is.
    let matchingPipeForS = Object.entries(Pipes).filter(([_symbol, links]) => setEq(new Set(Object.values(links)), new Set(neighborlyDirections)))[0][0]
    const memoKey = ([row, col]: [number, number]) => `r${row}, c${col}`;

    let output = "";
    for(let row = 0; row < map.length; row++) {
        // Expand every cell along the horizontal axis
        output += "*";
        for(let col = 0; col < map[0].length; col++) {
            let c = map[row].charAt(col);
            output += (c);
            if(c === "S") c = matchingPipeForS;
            if((c === "-" || c === "F" || c === "L") && loopPositions.has(memoKey([row, col]))) output += ("-")
            else output += ("*")
        }
        output += ("\n");

        // Expand every cell along the vertical axis
        output += ("*");
        for(let col = 0; col < map[0].length; col++) {
            let c = map[row].charAt(col);
            if(c === "S") c = matchingPipeForS;
            if((c === "|" || c === "7" || c === "F")  && loopPositions.has(memoKey([row, col])))
            output += ("|*")
            else
            output += ("**")
        }
        output += ("\n")
    }
    return output;
}

const inputLines = readFileSync("input.txt").toString().split("\n").filter(ident);



console.log(
    part1(inputLines)
);

console.log(
    part2(inputLines)
);
