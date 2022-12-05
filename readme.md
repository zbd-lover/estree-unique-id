# 介绍
基于estree，生成一个安全且唯一的标识符名称
# 用法
```javascript
import acorn from 'acorn'
import UniqueIdGenerator from 'estree-unique-id'
// const UniqueIdGenerator = window.$UniqueIdGenerator
const script = `const a = 10`
const generator = new UniqueIdGenerator(acorn.parse(script, { esmaVersion: 'latest', sourceType: 'module' }))
console.log(generator.generate('a')) // $a
```
# 核心类
## UniqueIdGenerator
```typescript
import type { Program, BlockStatement, Function as EstFnc } from 'estree'
type Context =  Program | BlockStatement | EstFnc
class UniqueIdGenerator {
  constructor(context: Context, retry?: (old: string) => string)
  setContext(context: Context): void
  setRetry(retry: (old: string) => string): void
  setMaxRetryTimes(times: number): void
  // 根据给定标识符名称进行生成
  generate(name: string | ((...args: any[]) => string)): string
  getGeneratedNames(): string[]
}
```
+ 我们需要指定一个上下文，好让UniqueIdGenerator知道哪些标识符名称可以声明
+ 我们可以设置retry函数，如果目标名称已经存在了，则会调用它来尝试生成新的名称（尝试次数默认最大为100，可以通过setMaxRetryTimes改变它）。
