import type { Program, BlockStatement, Function as EstFnc } from 'estree';
export declare type Context = Program | BlockStatement | EstFnc;
export declare type RetryFn = (old: string) => string;
export default class UniqueIdGenerator {
    private retry;
    private context;
    private retryTimes;
    private maxRetryTimes;
    private generatedNames;
    constructor(ctx: Context, retry?: RetryFn);
    setRetry(retry: RetryFn): void;
    setContext(ctx: Context): void;
    setMaxRetryTimes(times: number): void;
    getGeneratedNames(): string[];
    private isUnque;
    generate(_name: string | ((...args: any[]) => string)): string;
}
