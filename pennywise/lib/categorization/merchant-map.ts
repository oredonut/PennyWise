interface MerchantMapping {
  merchant_keyword: string
  category_id: string
}

export function applyUserMerchantMap(
  merchant: string,
  merchantMap: MerchantMapping[]
): string | null {
  const lower = merchant.toLowerCase()
  const match = merchantMap.find((m) => lower.includes(m.merchant_keyword.toLowerCase()))
  return match ? match.category_id : null
}
