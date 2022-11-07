import { Program, BlockStatement } from 'estree';
export declare type ContextNode = Program | BlockStatement;
export declare type Retry = (old: string) => string;
export declare type NameMaker = string | ((...args: any[]) => string);
export declare function createNameMaker(node: ContextNode, retry?: Retry): (make: NameMaker) => string;
