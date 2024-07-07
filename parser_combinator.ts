// Given a string, and an object T, parses the serialized representation of T,
// and returns the deserialized value and whatever's left of the input afterwards
export type Parser<T> = (input: string) => ParsingOutput<T>;
export interface ParsingOutput<T> {
    residue: string,
    tokens: T
}


// Given two parsers, P<A> and P<B>, which output an object A and B respectively,
// what should P<A>(P<B>) output? 
// Well, if both return a value, return both their outputs [OA, OB] (where OA is the output of parser A, similar. B)
// If one is undefined, just return that one as a single value.
// And if both are undefined, return undefined.
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


// Given two parsers, as described above, return a parser which outputs P<A>(P<B>)
function combine<T1 extends Parser<undefined>, T2 extends Parser<undefined>>(p1: T1, p2: T2): Parser<undefined>;
function combine<T1 extends Parser<unknown>, T2 extends Parser<undefined>>(p1: T1, p2: T2): Parser<Flatten<T1>>;
function combine<T1 extends Parser<undefined>, T2 extends Parser<unknown>>(p1: T1, p2: T2): Parser<Flatten<T2>>;
function combine<T1 extends Parser<unknown>, T2 extends Parser<unknown>>(p1: T1, p2: T2): Parser<[Flatten<T1>, Flatten<T2>]>;

function combine<T1, T2>(p1: Parser<T1>, p2: Parser<T2>): Parser<CombineTypes<T1, T2>> {
    return (input: string) => {
        let out1 = p1(input);
        let out2 = p2(out1.residue);

        let tok1 = out1.tokens;
        let tok2 = out2.tokens;
        let filtered = [tok1, tok2].filter(e => e !== undefined);
        
        // TODO: try to figure out how to do this without a type assertion.
        // May require a total re-think, typescript doesn't want to narrow
        // T1 to undefined when p1(input).tokens is undefined.
        // Need to understand this corner of ts better
        return {
            residue: out2.residue,
            tokens: (filtered.length === 0 ? undefined : filtered.length === 1 ? filtered[0] : filtered) as CombineTypes<T1, T2>
        };
    }
}

// Given a list of parsers, produce the type from combining all of them from left to right.
type Flatten<T extends Parser<unknown>> = T extends Parser<infer Inner> ? Inner : never;
type ParserList = readonly [...Parser<unknown>[]];
type Combined<AlreadyCombined extends ParserList, ToCombine extends ParserList, CombinedType extends unknown> = AlreadyCombined["length"] extends ToCombine["length"] ? CombinedType : Combined<[...AlreadyCombined, ToCombine[AlreadyCombined["length"]]], ToCombine, CombineTypes<CombinedType, Flatten<ToCombine[AlreadyCombined["length"]]>>>;

// Given a list of parsers, produce a parser which is the composition of all of them from left to right
export function make_parser<T extends Parser<unknown>[]>(...parsers: T): Parser<Combined<[], typeof parsers, undefined>> {
    if (parsers.length === 1) throw "Can't combine only one parser - just use the parser!";
    if (parsers.length === 2) return combine(parsers[0], parsers[1]) as any;
    const remainder = parsers.slice(1);
    return combine(parsers[0], make_parser(...remainder)) as any;
}



/*
* The rest of the file is just a bunch of basic parsers which can be combined
*/

// Parse out the longest prefix of the string where each character
// matches a particular regexp.
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

// Parse out a single character
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

// Parse out a string of english letters
export function word(): Parser<string> {
    return contiguousMatch(/[A-Za-z]/);
}

// Parse out a contiguous block of whitespace
export function whitespace(): Parser<string> {
    return contiguousMatch(/\s/);
}

// Parse out the given prefix of the string
export function exactly(str: string): Parser<string> {
    return (input: string) => {
        if(input.substring(0, str.length) !== str) throw new Error(`Couldn't parse exact literal '${str}' from '${input}'`)
        return {
            residue: input.slice(str.length),
            tokens: input.substring(0, str.length)
        }
    }
}

// Swallow the output of the given parser - don't add its tokens to the output.
export function skip(parser: Parser<any>): Parser<undefined> {
    return (input) => {
        let output = parser(input);
        return {
            residue: output.residue,
            tokens: undefined
        }
    }
}