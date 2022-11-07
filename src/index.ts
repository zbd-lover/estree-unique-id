import { Program, BlockStatement } from 'estree'
import { parse, Scope } from 'estree-identifier-parser'

export type ContextNode = Program | BlockStatement

export type Retry = (old: string) => string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NameMaker = string | ((...args: any[]) => string)

function retryWith$ (old: string) {
  return '$' + old 
}

function hasAncestralId (scope: Scope, name: string) {
  return scope.hasId((id) => id.scope === 'ancestral' && id.name === name)
}

export function createNameMaker (node: ContextNode, retry?: Retry) {
  const scope = parse(node)
  const generatedNames: string[] = []
  const _retry = retry || retryWith$

  const topScope = () => scope

  function canGen (scope: Scope, name: string) {
    const top = topScope()
    if (generatedNames.indexOf(name) >= 0) return false
    if (top === scope && scope.hasId(name)) return false
    if (top !== scope && hasAncestralId(scope, name)) return false

    for (let i = 0; i < scope.children.length; i++) {
      const childScope = scope.children[i]
      if (!canGen(childScope, name)) return false
    }

    return true
  }

  return function make (make: NameMaker): string {
    const name = typeof make === 'function' ? make() : String(make)

    function recur (name: string): string {
      if (!canGen(scope, name)) {
        const nextName = _retry(name)
        if (nextName === name) {
          console.warn('The old name and new name are same!')
        }
        return recur(nextName)
      }
      generatedNames.push(name)
      return name
    }

    return recur(name)
  }
}