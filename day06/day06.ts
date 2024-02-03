import { readFileSync } from "fs";
import {ident, parseNum, range, tail, zip} from "../utils";

type Time = number;
type Distance = number;
type Race = [Time, Distance];


// For a given hold time (h) and race duration (t), the distance traveled is:
// h * (t - h)
// So we want to know when h * (t - h) > d
// th - h^2 - d > 0
// -h^2 + th - d > 0
// h^2 - th + d < 0
// Quadratic equation:
// (t +- \sqrt{t^2 - 4d}) / 2
// The parabola faces up, the section between the roots is below zero.
function waysToBeat([time, distance]: Race) {
    let discriminant = Math.sqrt(time * time - 4 * distance);
    let max = (time + discriminant) / 2;
    let min = (time - discriminant) / 2;
    return Math.floor(max) - Math.ceil(min) + 1;
}

function part1(races: Race[]){
    return races.reduce((result, [time, distance]) => {
        return result * waysToBeat([time, distance])
    }, 1);
}

function part2(races: Race[]){
    let unkernedRace = races.reduce((acc, el) => [acc[0] + el[0].toString(), acc[1] + el[1].toString()], ["", ""]);
    let time = parseInt(unkernedRace[0]);
    let distance = parseInt(unkernedRace[1]);
    return waysToBeat([time, distance]);
}

let input = readFileSync("./input.txt").toString().split("\n").filter(ident)
    .map(line => line.split(/\s+/).map(parseNum))
    .map(tail);
console.log(input)

console.log(part1(zip(input[0], input[1])));
console.log(part2(zip(input[0], input[1])));