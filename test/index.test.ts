import { parse } from 'acorn'
import type { BlockStatement, FunctionDeclaration, Program } from 'estree'
import UniqueIdGenerator from '../src'

function parseScript (script: string) {
  return parse(script, {
    ecmaVersion: 'latest',
    sourceType: 'script'
  }) as unknown as Program
}

describe('测试核心类：UniqueIdGenerator', () => {
  test('测试初始化', () => {
    const generator1 = new UniqueIdGenerator(parseScript('const a = 10'))
    expect(generator1.generate('a')).toBe('$a')
    expect(generator1.getGeneratedNames()).toEqual(['$a'])

    const generator2 = new UniqueIdGenerator(parseScript('const b = 10'), (a: string) => '_' + a)
    expect(generator2.generate(() => 'b')).toBe('_b')
    expect(generator2.getGeneratedNames()).toEqual(['_b'])
  })

  test('测试方法：isSafe', () => {
    const ast = parseScript('const a = 1; function fn() { console.log(1) }')
    const generator = new UniqueIdGenerator(ast)
    expect(generator.isSafe('a')).toBe(false)
    expect(generator.isSafe('console')).toBe(false)
    expect(generator.isSafe('fn')).toBe(false)
    expect(generator.isSafe('b')).toBe(true)
    expect(generator.isSafe('const')).toBe(false)
  })

  test('测试方法：isUnique', () => {
    const ast = parseScript('const a = 1; function fn() { console.log(1) }')
    const generator = new UniqueIdGenerator(ast)
    expect(generator.isUnique('a')).toBe(false)
    expect(generator.isUnique('fn')).toBe(false)
    expect(generator.isUnique('console')).toBe(true)
    expect(generator.isUnique('b')).toBe(true)
    expect(generator.isUnique('const')).toBe(true)
  })

  test('测试方法：setRetry', () => {
    const generator = new UniqueIdGenerator(parseScript('const a = 10'))
    const retry = jest.fn((old) => old + '$')
    generator.setRetry(retry)
    expect(generator.generate('a')).toBe('a$')
    expect(generator.getGeneratedNames()).toEqual(['a$'])
    expect(retry).toBeCalledTimes(1)
  })

  test('测试方法：setContext', () => {
    const generator = new UniqueIdGenerator(parseScript('const a = 10'))
    const script = 'const b = 10'
    generator.setContext(parseScript(script))
    expect(generator.generate('a')).toBe('a')
    expect(generator.getGeneratedNames()).toEqual(['a'])
  })

  test('应正确处理，当上下文为BlockStatement时', () => {
    const ast = parseScript('{ const a = 10 }').body[0] as BlockStatement
    const generator = new UniqueIdGenerator(ast)
    expect(generator.generate('a')).toBe('$a')
    expect(generator.getGeneratedNames()).toEqual(['$a'])
  })

  test('应正确处理，当上下文为Function时', () => {
    const ast = parseScript('function fn1(a) { const b = 10}').body[0] as FunctionDeclaration
    const generator = new UniqueIdGenerator(ast)
    expect(generator.generate('a')).toBe('$a')
    expect(generator.generate('b')).toBe('$b')
    expect(generator.getGeneratedNames()).toEqual(['fn1', '$a', '$b'])
  })

  test('应正确处理，当变量作用域的层级为多层时', () => {
    const ast = parseScript('const a = 1; function fn() { console.log(1) }')
    const generator = new UniqueIdGenerator(ast)
    expect(generator.generate('a')).toBe('$a')
    expect(generator.generate('console')).toBe('$console')
    expect(generator.getGeneratedNames()).toEqual(['$a', '$console'])
  })

  test('应正确处理，当传入的值为关键字时', () => {
    const ast = parseScript('')
    const generator = new UniqueIdGenerator(ast)
    expect(generator.generate('const')).toBe('$const')
  })

  test('测试重试机制是否正常工作', () => {
    const retry = jest.fn((old) => '_' + old)
    const generator = new UniqueIdGenerator(parseScript('const a = 10'), retry)
    expect(generator.generate('a')).toBe('_a')
    expect(generator.generate('a')).toBe('__a')
    expect(generator.getGeneratedNames()).toEqual(['_a', '__a'])
    expect(retry).toBeCalledTimes(3)

    const identifier = jest.fn((old) => old)
    generator.setRetry(identifier)
    generator.setContext(parseScript('const b = 10'))
    expect(() => generator.generate('b')).toThrowError()
    expect(identifier).toBeCalledTimes(100)

    identifier.mockClear()
    generator.setMaxRetryTimes(2)
    expect(() => generator.generate('b')).toThrowError()
    expect(identifier).toBeCalledTimes(2)
  })
})