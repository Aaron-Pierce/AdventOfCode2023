export const sum = (a: number, b: number) => a + b;
export const ident = <T>(a: T) => a;
export const tail = (arr: string[]) => { arr.shift(); return arr };
export const parseNum = (str: string) => parseInt(str); // Why? Because parseInt takes a radius as a second argument, so Array.map(parseInt) will use the element's index as the radix.

export function groupByInd<T>(arr: T[], predicate: (el: T, ind: number) => boolean): T[][]{
    if(arr.length === 0) return [];
    let grouped: T[][] = [[arr[0]]];
    let lastPredicateResult = predicate(arr[0], 0);
    for(let i = 1; i < arr.length; i++) {
        let el = arr[i];
        let predicateResult = predicate(el, i);
        if(predicateResult === lastPredicateResult) grouped[grouped.length - 1].push(el)
        else grouped.push([el]);
        lastPredicateResult = predicateResult;
    }
    return grouped;
}
export function groupBy<T>(arr: T[], predicate: (el: T) => boolean): T[][]{
    return groupByInd<T>(arr, (el, ind) => predicate(el));
}