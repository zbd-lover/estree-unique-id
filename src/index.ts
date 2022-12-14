import type { Program, BlockStatement, Function as EstFnc } from 'estree'
import { parse, type Scope } from 'estree-identifier-parser'

const specialWords = [
  'debugger', 'with',
  'null', 'undefined',
  'var', 'let', 'const',
  'function', 'async', 'await', 'yield',
  'class', 'extends', 'new', 'this', 'super',
  'return', 'break', 'continue',
  'if', 'else',
  'switch', 'case',
  'for', 'do', 'while', 'of', 'in',
  'throw', 'try', 'catch', 'finally',
  'typeof', 'void', 'delete', 'instanceof', 'new',
  'import', 'export', 'default',

  'enum', 'package', 'public', 'private', 'protected', 'interface', 'implements', 'static'
]

export type Context = Program | BlockStatement | EstFnc
export type RetryFn = (old: string) => string

function retryWith$ (old: string) {
  return '$' + old
}

function hasAncestralId (scope: Scope, name: string) {
  return scope.hasId((id) => id.scope === 'ancestral' && id.name === name)
}

function hasLocalId (scope: Scope, name: string) {
  return scope.hasId((id) => id.scope === 'local' && id.name === name)
}

export default class UniqueIdGenerator {
  private retry: RetryFn
  private context: Scope
  private retryTimes = 0
  private maxRetryTimes = 100
  private generatedNames: string[] = []

  constructor (ctx: Context, retry?: RetryFn) {
    const inFn = ctx.type !== 'BlockStatement' && ctx.type !== 'Program'
    this.context = parse(!inFn ? ctx : { type: 'Program', sourceType: 'module', body: [ctx] } as Program)
    if (inFn) {
      this.context = this.context.children[0]
      if (ctx.type !== 'ArrowFunctionExpression') {
        if (ctx.id?.type) {
          this.generatedNames.push(ctx.id.name)
        }
      }
    }
    this.retry = retry ?? retryWith$
  }

  public setRetry (retry: RetryFn) {
    this.retry = retry
  }

  public setContext (ctx: Context) {
    this.context = parse(ctx)
  }

  public setMaxRetryTimes (times: number) {
    this.maxRetryTimes = times
  }

  public getGeneratedNames () {
    return this.generatedNames
  }

  private isSafeInScope (ctx: Scope, name: string) {
    if (ctx === this.context && ctx.hasId(name)) return false
    if (ctx !== this.context && hasAncestralId(ctx, name)) return false

    for (let i = 0; i < ctx.children.length; i++) {
      const childCtx = ctx.children[i]
      if (!this.isSafeInScope(childCtx, name)) return false
    }

    return true
  }

  public isSafe (name: string) {
    if (specialWords.includes(name)) return false
    return this.isSafeInScope(this.context, name)
  }

  public isUnique (name: string) {
    return !this.generatedNames.includes(name) && !hasLocalId(this.context, name)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public generate (_name: string | ((...args: any[]) => string)): string {
    const name = typeof _name === 'string' ? _name : _name()
    if (this.isSafe(name) && this.isUnique(name)) {
      this.retryTimes = 0
      this.generatedNames.push(name)
      return name
    }
    const newName = this.retry(name)
    this.retryTimes++
    if (newName === name) {
      if (this.retryTimes === this.maxRetryTimes) {
        this.retryTimes = 0
        throw new Error(`????????????????????????????????????????????????????????????${this.maxRetryTimes}`)
      }
    }
    return this.generate(newName)
  }
}