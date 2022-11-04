import { type ScopeNode as SourceNode } from 'estree-identifier-parser';
export { SourceNode };
export declare type Retry = (old: string) => string;
export declare type NameMaker = string | ((...args: any[]) => string);
export declare function createNameMaker(node: SourceNode, retry?: Retry): (make: NameMaker) => string;
