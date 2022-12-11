import type { Program, BlockStatement, Function as EstFnc } from 'estree'
import { parse, type Scope } from 'estree-identifier-parser'

export type Context = Program | BlockStatement | EstFnc
export type RetryFn = (old: string) => string

function retryWith$ (old: string) {
  return '$' + old
}

function hasAncestralId (scope: Scope, name: string) {
  return scope.hasId((id) => id.scope === 'ancestral' && id.name === name)
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

  private _isUnique (ctx: Scope, name: string) {
    if (this.generatedNames.includes(name)) return false
    if (ctx === this.context && ctx.hasId(name)) return false
    if (ctx !== this.context && hasAncestralId(ctx, name)) return false

    for (let i = 0; i < ctx.children.length; i++) {
      const childCtx = ctx.children[i]
      if (!this._isUnique(childCtx, name)) return false
    }

    return true
  }

  public isUnique (name: string) {
    return this._isUnique(this.context, name)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public generate (_name: string | ((...args: any[]) => string)): string {
    const name = typeof _name === 'string' ? _name : _name()
    if (this._isUnique(this.context, name)) {
      this.retryTimes = 0
      this.generatedNames.push(name)
      return name
    }
    const newName = this.retry(name)
    this.retryTimes++
    if (newName === name) {
      if (this.retryTimes === this.maxRetryTimes) {
        this.retryTimes = 0
        throw new Error(`尝试生成有效变量名的次数超过最大尝试次数${this.maxRetryTimes}`)
      }
    }
    return this.generate(newName)
  }
}