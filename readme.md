# Profile
Make a identifier name in topest scope without any negative effect.
# Api
## createNameMaker
### use
```javascript
// in esmodule
import createNameMaker from 'estree-idname-maker'
// in global
const { createNameMaker } = window.EstIdNameMaker
```
### example
```javascript
import { parse } from 'acorn'
const script = `
  const var1 = 10
  function fn2(var2) {
    console.log(var1, var2)
  }
`
const ast = parse(script, {
  ecmaVersion: 'latest',
  sourceType: 'script' 
})
// default retry fn: (old) => '$' + old
const make = createNameMaker(ast)
expect(make('var1')).toBe('$var1')
expect(make('$var1')).toBe('$$var1')
expect(make('console')).toBe('$console')
```
# Types
```typescript
import { Program, BlockStatement } from 'estree'
export type ContextNode = Program | BlockStatement
export type Retry = (old: string) => string
export type NameMaker = string | ((...args: any[]) => string)
export function createNameMaker(node: ContextNode, retry?: Retry): (make: NameMaker) => string;
```