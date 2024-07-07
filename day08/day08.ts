import { readFileSync } from 'fs';
import { character, exactly, make_parser, skip, word } from "../parser_combinator";
import { ident } from '../utils';
import { assert } from 'console';


function part1(directions: string, lines: [string, [string, string]][]) {
    let networkMap = Object.fromEntries(lines);
    
    let position = "AAA";
    let steps = 0;

    while(position !== "ZZZ") {
        position = networkMap[position]["LR".indexOf(directions[steps++ % directions.length])];
    }   

    return steps;
}


type LoopDescription = {
    startPosition: string,
    startStep: number
}

/*

The general idea was:
1. Ghosts have to loop, since the space of (position, index into direction string) is finite.
2. We can generate an infinite list of the steps at which a particular ghost is on a terminal space from:
(for some integer i which is >= 1)
(steps until the loop start state) + i * (number of steps until reaching the terminal state) + (i-1) * (number of steps until getting back to the start of the loop).

And then I didn't have a better idea about how to solve this than brute force:
for every ghost we have a list of these generating functions, and we just iterate through all of the possible inputs to see if every ghost has some step in common.

But the problem simplifies this for us:
1. Every ghost's loop contains only one terminal state
2. Every ghost's loop offset (number of steps before reaching the loop start state for the first time)
is exactly equal to the number of steps it takes to go from the terminal state to the start of the loop again.
For example: a loop which starts at step 3, and loops every 100 steps, will hit the terminal state after 97 steps through the loop.
This simplifies the math a lot:
(loopOffset) + i * loopStartToTerminal + (i-1)*terminalToLoopBeginning
 => loopOffset + i * loopStartToTerminal + (i-1)*loopOffset
 => i * (loopStartToTerminal + loopOffset)
 => i * loopLength

So every ghost will be on a terminal state every `loopLength` steps.
So when will all ghosts be on a terminal state? The LCM of the loop lengths.
Didn't bother to implement an LCM function, just use WolframAlpha!
*/

function part2(directions: string, inputLines: [string, [string, string]][]) {
    let networkMap = Object.fromEntries(inputLines);
    let positions = Object.keys(networkMap).filter(e => e.endsWith("A"));

    // The one liner I used in part1 was gross
    const advance_ = (pos, step) => {
        let direction = directions[step % directions.length];
        let directionAsIndex = "LR".indexOf(direction);
        let nextPosition = networkMap[pos][directionAsIndex];
        let nextStep = step + 1;
        return [nextPosition, nextStep];
    }

    // For a ghost's start position, find the first repeated (state, step % directions.length) pair.
    function findLoop(startPosition: string): LoopDescription {
        let position = startPosition;
        let step = 0;
        let visited = new Set();
        const memoKey = (_position: string, _step: number) => _position + "|" + (_step % directions.length);

        while (!visited.has(memoKey(position, step))) {
            visited.add(memoKey(position, step));
            [position, step] = advance_(position, step);
        }
        

        return {
            startPosition: position,
            startStep: step % directions.length
        }
    }

    function findLoopOffsetAndLength(loop: LoopDescription, startPosition: string) {

        // Walk until we hit the loop start state
        let position = startPosition;
        let step = 0;
        while (!(position == loop.startPosition && (step % directions.length) == (loop.startStep % directions.length))) {
            [position, step] = advance_(position, step);

        }
        
        // That many steps is the offset.
        // This offset is always equal to startPosition.startStep,
        // so this is redundant.
        const offset = step;
        [position, step] = advance_(position, step);

        // Walk the loop until we get back to the start state
        while (!(position == loop.startPosition && (step % directions.length) == (loop.startStep % directions.length))) {
            [position, step] = advance_(position, step);

        }
        
        // The length of the loop is the number of steps that took.
        const length = step - offset;
        return [offset, length];

    }

    // Walk the loop and identify any time we cross a state which ends in a Z.
    // We could just do this while computing the loop length, but that's cluttered
    function findPotentialEndNodesAlongPath(startPosition: string, startStep: number, pathLength: number): [string, number][] {
        let position = startPosition;
        let step = startStep;
        let finds:  [string, number][] = [];
        for(let i = 0; i < pathLength; i++) {
            
            if(position.endsWith("Z")) finds.push([position, i]);
            [position, step] = advance_(position, step);

        }
        return finds;
    }

    let generatingFunctions: ((i: number) => number)[] = [];
    for(let ghostStart of positions) {

        let loop = findLoop(ghostStart);
        let [loopOffset, loopLength] = findLoopOffsetAndLength(loop, ghostStart);
        let potentialEndNodes = findPotentialEndNodesAlongPath(loop.startPosition, loop.startStep, loopLength);
        assert(potentialEndNodes.length === 1) // happens to be true for my input
        let loopIndexOfEnd = potentialEndNodes[0][1];
        assert((loopLength - loopIndexOfEnd) === loopOffset) // happens to be true for all of the loops
        // Now, find the offset - how long it takes from t=0 to beginning the loop

        let stepsWhenOnPotentialEndNode = (i) => loopOffset + (i * loopIndexOfEnd) + (i-1) * (loopLength - loopIndexOfEnd);
        generatingFunctions.push(stepsWhenOnPotentialEndNode);
    }
    
    // At this point, I realized that the generating functions were equivalent to i*loopLength.
    // So this line is just equivalent to each loop's length
    let poses = generatingFunctions.map(e => e(1));

    console.log(`Go to WolframAlpha and plug in lcm(${poses.join(", ")})`)
}



let [directions, networkInput] = readFileSync("input.txt").toString().split("\n\n");

let word_tuple = make_parser(
    skip(character('(')),
    word(),
    skip(exactly(', ')),
    word(),
    skip(character(')'))
);

let input_line_parser = make_parser(
    word(),
    skip(exactly(" = ")),
    word_tuple
)


let parsed = networkInput.split("\n").filter(ident).map(input_line_parser).map(e => e.tokens);

console.log(
    part1(directions, parsed)
)


console.log(
    part2(directions, parsed)
)
