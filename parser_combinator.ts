export interface ParsingOutput<T> {
    residue: string,
    tokens: T
}

export type Parser<T> = (input: string) => ParsingOutput<T>;

type Bool = true | false;
type NoToken<T> = T extends undefined ? true : false;
type NotUndefined<T> = Not<NoToken<T>>; 
type Not<T extends Bool> = T extends true ? false : true;
type And<T1 extends Bool, T2 extends Bool> = T1 extends true ? (T2 extends true ? true : false) : false;
export type CombineTypes<A, B> = And<NotUndefined<A>, NotUndefined<B>> extends true 
    ? [A, B] 
    : (And<NoToken<A>, NoToken<B>> extends true 
        ? undefined
        : NoToken<A> extends true
            ? B
            : A
        );

export function combine<A, B>(p1: Parser<A>, p2: Parser<B>): Parser<CombineTypes<A, B>> {
    return (input: string) => {
        let out1 = p1(input);
        let out2 = p2(out1.residue);

        let outputs = [out1.tokens, out2.tokens].filter(e => e !== undefined);
        let toReturn = outputs.length === 0 ? undefined : outputs.length === 1 ? outputs[0] : outputs;
        return {
            residue: out2.residue,
            tokens: toReturn as CombineTypes<A, B>
        }
    }
}

// type Flatten<T> = T extends Parser<infer Inner> ? Inner : never;
// type CombineParserList<T extends readonly [Parser<unknown>, ...Parser<unknown>[]]> = T[0] extends any ? T[""] : never;
// type _CombineParserList<N extends number> = N;
// type m = _CombineParserList<[1, 2, 3]>; 
// type k = CombineParserList<[Parser<number>, Parser<undefined>, Parser<string>]>;
type Flatten<T extends Parser<unknown>> = T extends Parser<infer Inner> ? Inner : never;
type ParserList = readonly [...Parser<unknown>[]];
type Combined<AlreadyCombined extends ParserList, ToCombine extends ParserList, CombinedType extends unknown> = AlreadyCombined["length"] extends ToCombine["length"] ? CombinedType : Combined<[...AlreadyCombined, ToCombine[AlreadyCombined["length"]]], ToCombine, CombineTypes<Flatten<ToCombine[AlreadyCombined["length"]]>, CombinedType>>;


let pp = [
    word(),
    skip(whitespace()),
    character(','),
    whitespace()
];

function tupelize<T extends any[]>(...args: T): T {
    return args;
}

let q = tupelize(
    word(),
    skip(whitespace()),
    character(','),
    whitespace()
);

export function make_parser<T extends Parser<unknown>[]>(...parsers: T): Parser<Combined<[], typeof parsers, undefined>> {
    if(parsers.length === 1) throw "Can't combine only one parser - just use the parser!";
    if(parsers.length === 2) return combine(parsers[0], parsers[1]) as any;
    const remainder = parsers.slice(1);
    return combine(parsers[0], make_parser(...remainder)) as any;
}
type fefesh = Combined<[], typeof q, undefined>;
let res = make_parser(
    word(),
    skip(whitespace()),
    character(','),
    whitespace()
)


export function contiguousMatch(regexp: RegExp): Parser<string> {
    return (input: string) => {
        let parsed = "";
        for (let i = 0; i < input.length; i++) {
            if (input[i].match(regexp)) parsed += input[i];
            else break;
        }
        if (parsed.length === 0) throw new Error(`Could not parse word from '${input}'`);
        return {
            residue: input.slice(parsed.length),
            tokens: parsed
        }
    }
}

export function character(char: string): Parser<string> {
    if (char.length !== 1) throw new Error(`A character parser may only be given one character, not '${char}'`)
    return (input: string) => {
        if (input.charAt(0) !== char) throw new Error(`Could not parse char ${char} from '${input}'`)
        return {
            tokens: input.charAt(0),
            residue: input.slice(1)
        }
    }
}
export function word(): Parser<string> {
    return contiguousMatch(/[A-Za-z]/);
}
export function whitespace(): Parser<string> {
    return contiguousMatch(/\s/);
}

export function skip(parser: Parser<any>): Parser<undefined> {
    return (input) => {
        let output = parser(input);
        return {
            residue: output.residue,
            tokens: undefined
        }
    }
}