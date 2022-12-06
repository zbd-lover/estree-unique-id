# 介绍
基于estree，生成一个安全且唯一的标识符名称
# 用法
```javascript
import acorn from 'acorn'
import UniqueIdGenerator from 'estree-unique-id'
// const UniqueIdGenerator = window.UniqueIdGenerator
const script = `const a = 10; function fn() { console.log(1) }`
// 和默认的retry函数行为一致
const retry = (old) => '$' + old
// 可以不指定retry
const generator = new UniqueIdGenerator(acorn.parse(script, { esmaVersion: 'latest', sourceType: 'module' }), retry)
// b
console.log(generator.generate('b'))
 // $a（a已经存在，generator会调用retry并将a传入以获取新的期待的变量名称）
console.log(generator.generate('a'))
// $console. console它在函数fn中使用，且在fn对应的函数作用域内没有声明console，对fn来说，console来自祖先变量作用域（在这里是全局作用域）
// 在这种情况下，generator也会调用retry来获取新名称——它不会生成一个可能被子级变量作用域使用的变量名
console.log(generator.generate('console')) 
// $const，const是关键字，传入关键字或保留字时，同样会进行retry行为
console.log(generator.generate('const'))
```
# 核心类
## UniqueIdGenerator
```typescript
import type { Program, BlockStatement, Function as EstFnc } from 'estree'
// js程序，块语句，函数都可以是上下文
// 如果函数作为上下文，函数和函数参数会被当作已声明的变量
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
