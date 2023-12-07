import { readFileSync } from "fs";
import { groupBy, groupByInd, ident, parseNum, tail } from "../utils";
import assert from "assert";

type Range = {
    sourceStart: number,
    destinationStart: number,
    range: number
}
type Map = Range[]

function transform(sourceNumber: number, maps: Map): number {
    for(let m of maps){
        if(m.sourceStart <= sourceNumber && sourceNumber < m.sourceStart + m.range){
            return (sourceNumber - m.sourceStart + m.destinationStart);
        }
    }
    return sourceNumber;
}

const tupleToRange = ([destinationStart, sourceStart, range]: number[]) => { return {destinationStart, sourceStart, range} };


function part1(seeds: number[], maps: Map[]){
    let seedLocation = seeds.map(seed => maps.reduce((acc, el) => transform(acc, el), seed));
    return Math.min(...seedLocation);
}

function part2(seeds: number[], maps: Map[]): number {
    // General strategy is to combine maps.
    // Combine (seed -> soil) and (soil -> fertilizer) into (seed -> fertilizer)
    // By the end, we'll have a map of seed -> location,
    // and a bunch of seed ranges.
    // We'll consider those seed ranges an identity map,
    // and apply the merge one more time.
    // Then, we iterate over the final ranges and pick the lowest.

    let seedPairs = groupByInd(seeds, (_, ind) => ind % 4 < 2) as [number, number][];
    let seedRanges: Range[] = seedPairs.map(([start, length]) => { return {
        range: length,
        sourceStart: start,
        destinationStart: start
    }});

    function forward(insideRange: Range, outsideRange: Range){
        //      1 2 3 4 5 6
        //          * *         Inside's destination
        //        * * * *       Outside's source

        let forwarded: Range = {
            sourceStart: insideRange.sourceStart,
            range: insideRange.range,
            destinationStart: outsideRange.destinationStart + (insideRange.destinationStart - outsideRange.sourceStart)
        }
        return [
            [forwarded],
            []
        ]
    }

    function splitOn(outsideRange: Range, insideRange: Range){
        //                  1 2 3 4 5 6 7 8
        // Outside range:     * * * * *         (Outside's Destination values)
        //  Inside range:       * * *           (Inside's Source values)

        // Output:            *
        //                      * * * 
        //                            *

        let middleLength = insideRange.range;
        let leftLength = insideRange.sourceStart - outsideRange.destinationStart;
        let rightLength = (outsideRange.destinationStart + outsideRange.range - 1) - (insideRange.sourceStart + insideRange.range - 1)
        
        let middleRange: Range = {
            sourceStart: outsideRange.sourceStart + leftLength,
            range: middleLength,
            destinationStart: insideRange.destinationStart
        }
        
        let leftRange: Range = {
            sourceStart: outsideRange.sourceStart,
            destinationStart: outsideRange.destinationStart,
            range: leftLength
        };
        
        let rightRange: Range = {
            sourceStart: outsideRange.sourceStart + leftLength + middleLength,
            destinationStart: outsideRange.destinationStart + leftLength + middleLength,
            range: rightLength
        }
        
        assert(leftRange.range > 0 || rightRange.range > 0);
        assert(leftRange.range + middleRange.range + rightRange.range === outsideRange.range);

        return [[middleRange], [leftRange, rightRange].filter(e => e.range > 0)]
    }

    function splitLeft(leftRange: Range, rightRange: Range): [Range[], Range[]] {
        //                     1 2 3 4 5 6 7 8
        // Left Range:             * * * *             (left's Destination)    
        // Right Range:                * * *          (right's Source)
        // Output:              
        //                         * *          (remainder)
        //                             * *      (completed)

        //     * * *
        //         * *

        let unintersectedLength = rightRange.sourceStart - leftRange.destinationStart;
        assert(unintersectedLength > 0);
        assert(unintersectedLength < leftRange.range)
        let finished: Range = {
            sourceStart: leftRange.sourceStart + unintersectedLength,
            destinationStart: rightRange.destinationStart,
            range: leftRange.range - unintersectedLength
        };

        let leftover: Range = {
            sourceStart: leftRange.sourceStart,
            destinationStart: leftRange.destinationStart,
            range: unintersectedLength
        }

        assert(finished.range + leftover.range === leftRange.range);
        assert(leftover.sourceStart + leftover.range === finished.sourceStart);
        assert(finished.range > 0 && leftover.range > 0);
        return [
            [finished],
            [leftover]
        ];
    }

    
    function splitRight(rightRange: Range, leftRange: Range): [Range[], Range[]] {
        //                     1 2 3 4 5 6 7 8
        // Right Range:                * * * *        (right's Destination)
        // Left Range:             * * * *             (left's Source)    
        // Output:              
        //                             * *      (completed)
        //                                 * *  (remainder)

        let intersectedLength = (leftRange.sourceStart + leftRange.range) - (rightRange.destinationStart);
        let unintersectedLength = rightRange.range - intersectedLength;
        let solution = [
            [{
                sourceStart: rightRange.sourceStart,
                destinationStart: leftRange.destinationStart + leftRange.range - intersectedLength,
                range: intersectedLength
            }],
            [{
                sourceStart: rightRange.sourceStart + intersectedLength,
                destinationStart: rightRange.destinationStart + intersectedLength,
                range: unintersectedLength
            }]
        ];
        assert(intersectedLength + unintersectedLength === rightRange.range)
        assert(solution[0][0].sourceStart + solution[0][0].range === solution[1][0].sourceStart);
        assert(solution[0][0].range > 0 && solution[1][0].range > 0);
        return solution as [Range[], Range[]];
    }

    function within(innerRange: Range, outerRange: Range){
        //      [  ]      Inner's destination
        // [           ]   Outer's source
        return (outerRange.sourceStart <= innerRange.destinationStart) && (innerRange.destinationStart + innerRange.range <= outerRange.sourceStart + outerRange.range)
    }

    
    function consumes(outerRange: Range, innerRange: Range){
        
        // [           ]   Outer's destination
        //      [  ]      Inner's source
        return (outerRange.destinationStart <= innerRange.sourceStart) && (innerRange.sourceStart + innerRange.range <= outerRange.destinationStart + outerRange.range)
    }

    function intersectsLeft(leftRange: Range, rightRange: Range){
        /// [     ] Left's destination
        //     [     ] Right's source
        return (leftRange.destinationStart <= rightRange.sourceStart && rightRange.sourceStart < leftRange.destinationStart + leftRange.range)
    }

    
    function intersectsRight(rightRange: Range, leftRange: Range){
        ///    [     ] Right's destination
        //  [     ] Left's source
        return (leftRange.sourceStart <= rightRange.destinationStart && rightRange.destinationStart < leftRange.sourceStart + leftRange.range);
    }

    function project(sourceRange: Range, destinationMap: Map) {
        for(let destinationRange of destinationMap){
            if(within(sourceRange, destinationRange)) {
                return forward(sourceRange, destinationRange)
            }
            if(consumes(sourceRange, destinationRange)) {
                return splitOn(sourceRange, destinationRange)
            }
            if(intersectsLeft(sourceRange, destinationRange)) {
                return splitLeft(sourceRange, destinationRange)
            }
            if(intersectsRight(sourceRange, destinationRange)){
                return splitRight(sourceRange, destinationRange)
            }
        }
        return [[sourceRange], []]

    }

    function combineMaps(sourceMap: Map, destinationMap: Map): Map {
        let queue = [...sourceMap];
        let newMap: Map = [];
        for(let sourceRange of queue){
            let [finishedRanges, remainderRanges] = project(sourceRange, destinationMap);
            queue.push(...remainderRanges);
            newMap.push(...finishedRanges);
        }
        return newMap;
    }

    function toRange([fromLow, fromHigh]: [number, number], [toLow, toHigh]: [number, number]): Range {
        assert(fromHigh - fromLow === toHigh - toLow, `{${fromHigh} - ${fromLow}} !== {${toHigh} - ${toLow}}`)
        return {
            sourceStart: fromLow,
            destinationStart: toLow,
            range: fromHigh - fromLow
        }
    } 

    assert(within(
        toRange([10, 20], [30, 40]),
        toRange([20, 50], [100, 130])
    ))
    assert(within(
        toRange([1, 3], [11, 13]),
        toRange([11, 14], [21, 24])
    ))
    assert(within(
        toRange([1, 3], [11, 13]),
        toRange([10, 13], [21, 24])
    ))

    

    let finalMap = [seedRanges, ...maps].reduce(combineMaps, seedRanges);
    
    return Math.min(...finalMap.map(m => m.destinationStart));
}

let input = readFileSync("input.txt")
                .toString()
                .split("\n\n")
                .filter(ident);
let seeds = tail(input[0].split(/\s+/)).map(num => parseInt(num));
let maps = tail(input).map(block => block.split("\n").filter(ident))
    .map(lines => tail(lines).map(line => tupleToRange(line.split(" ").map(parseNum))))


console.log(part1(seeds, maps))
console.log(part2(seeds, maps));
// I wonder if this is my largest ratio yet of lines for part2 to part1