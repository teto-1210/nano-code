import { describe, it, expect } from 'vitest'
import { add, divide } from './calculator'

describe('add', () => {
  it('adds two positive numbers', () => {
    expect(add(1, 2)).toEqual({ ok: true, value: 3 })
  })

  it('handles negative numbers', () => {
    expect(add(-1, -2)).toEqual({ ok: true, value: -3 })
  })

  it('adds floats', () => {
    const res = add(0.1, 0.2)
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.value).toBeCloseTo(0.30000000000000004)
  })
})

describe('divide', () => {
  it('divides numbers', () => {
    expect(divide(6, 2)).toEqual({ ok: true, value: 3 })
  })

  it('divides producing decimal', () => {
    const res = divide(1, 4)
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.value).toBeCloseTo(0.25)
  })

  it('returns error on division by zero', () => {
    expect(divide(1, 0)).toEqual({ ok: false, error: 'Division by zero' })
  })
})
