import { readFileSync } from 'fs';
import { Parser, character, combine, make_parser, skip, whitespace, word } from "../parser_combinator";
import { ident } from '../utils';

function part1(directions: string, lines: [[string, string], string][]) {
    
}

function part2() {

}


// I wanted to write a tiny little type-safe parser combinator for this.
// The dream was to pass in an array of parsers to a function,
// and get a properly typed parser out.
// So you could construct a parser like:
// parser = make_parser([word, skip(equals_sign), word_tuple])
// where word_tuple = make_parser(skip('('), word, skip(', '), word, skip(')'))
// And then you could write parser("LRL = (MCG, TRC)")
// And the type of the parser would be
// Parser<[String, [String, String]]>.
// and it would return ["LRL", ["MCG", "TRC"]]
// 
// And I've got that now, but only if you write out all of the combinations in source
let [directions, networkInput] = readFileSync("input.txt").toString().split("\n\n");

let word_tuple = make_parser(
    skip(character('(')),
    word(),
    skip(character(',')),
    skip(whitespace()),
    word(),
    skip(character(')'))
);

let input_line_parser = make_parser(
    word(),
    skip(whitespace()),
    skip(character('=')),
    skip(whitespace()),
    word_tuple
)


let parsed = networkInput.split("\n").filter(ident).map(input_line_parser).map(e => e.tokens);
console.log(parsed[0]);

// part1(directions, parsed);
