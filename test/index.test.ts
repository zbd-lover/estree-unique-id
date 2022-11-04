import { parse } from 'acorn'
import { Program } from 'estree'
import { createNameMaker } from '../src'

function parseScript (script: string) {
  return parse(script, {
    ecmaVersion: 'latest',
    sourceType: 'script'
  }) as unknown as Program
}

test('one level scope', () => {
  const script = `
    const var1 = 10
    console.log(var1, var2)
  `
  const program = parseScript(script)
  const make1 = createNameMaker(program, (old) => `$$_${old}`)
  expect(make1('var1')).toBe('$$_var1')
  expect(make1(() => 'var1')).toBe('$$_$$_var1')
  expect(make1(() => '$$_$$_var1')).toBe('$$_$$_$$_var1')
  expect(make1('console')).toBe('$$_console')
  expect(make1('var2')).toBe('$$_var2')

  const make2 = createNameMaker(program)
  expect(make2('var1')).toBe('$var1')

  let count = 0
  const make3 = createNameMaker(program, (old) => {
    if (count === 0) {
      count++
      return old
    }
    return `$_${old}`
  })
  expect(make3('var1')).toBe('$_var1')
})

test('two level scope', () => {
  const script = `
    const var1 = 10
    function fn1(arg1) {
      window.arg1 = arg1
      console.log(var1, var2)
      function fn2() {
        console.log(globalValue1)
      }
    }
  `
  const program = parseScript(script)
  const make = createNameMaker(program, (old) => `$$_${old}`)
  expect(make('var1')).toBe('$$_var1')
  expect(make(() => 'var1')).toBe('$$_$$_var1')
  expect(make('console')).toBe('$$_console')
  expect(make('window')).toBe('$$_window')
  expect(make('globalValue1')).toBe('$$_globalValue1')
  expect(make('globalValue1')).toBe('$$_$$_globalValue1')
})