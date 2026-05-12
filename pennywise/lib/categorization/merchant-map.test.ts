import { describe, it, expect } from 'vitest'
import { applyUserMerchantMap } from './merchant-map'

describe('applyUserMerchantMap', () => {
  const merchantMap = [
    { merchant_keyword: 'mama put', category_id: 'food' },
    { merchant_keyword: 'keke napep', category_id: 'transport' },
  ]

  it('returns category_id when merchant matches a user-trained keyword', () => {
    expect(applyUserMerchantMap('Mama Put Joint', merchantMap)).toBe('food')
  })

  it('matches case-insensitively', () => {
    expect(applyUserMerchantMap('KEKE NAPEP RIDE', merchantMap)).toBe('transport')
  })

  it('returns null when no user mapping matches', () => {
    expect(applyUserMerchantMap('Unknown Shop', merchantMap)).toBeNull()
  })

  it('returns null when merchantMap is empty', () => {
    expect(applyUserMerchantMap('Shoprite', [])).toBeNull()
  })

  it('returns first match when multiple keywords could match', () => {
    const multiMap = [
      { merchant_keyword: 'shop', category_id: 'misc' },
      { merchant_keyword: 'shoprite', category_id: 'food' },
    ]
    expect(applyUserMerchantMap('Shoprite', multiMap)).toBe('misc')
  })
})
