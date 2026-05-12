import { describe, it, expect } from 'vitest'
import { categorize } from './engine'

describe('categorize', () => {
  it('matches food merchants by keyword', () => {
    expect(categorize('Shoprite Lagos')).toBe('food')
    expect(categorize('Chicken Republic')).toBe('food')
  })

  it('matches transport merchants by keyword', () => {
    expect(categorize('Uber Trip')).toBe('transport')
    expect(categorize('Bolt Ride')).toBe('transport')
  })

  it('matches data merchants by keyword', () => {
    expect(categorize('MTN Recharge')).toBe('data')
    expect(categorize('Airtel Data')).toBe('data')
  })

  it('matches leisure merchants by keyword', () => {
    expect(categorize('Netflix Subscription')).toBe('leisure')
    expect(categorize('Spotify Premium')).toBe('leisure')
  })

  it('is case-insensitive', () => {
    expect(categorize('SHOPRITE')).toBe('food')
    expect(categorize('uber')).toBe('transport')
  })

  it('returns misc for unknown merchants', () => {
    expect(categorize('Unknown Merchant XYZ')).toBe('misc')
  })

  it('returns misc for empty string', () => {
    expect(categorize('')).toBe('misc')
  })
})
