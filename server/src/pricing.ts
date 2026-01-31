import { AppConfig } from './config.js'

export function estimateCostUSD(config: AppConfig, scannedBytes?: number | null) {
  if (!scannedBytes || scannedBytes <= 0) {
    return null
  }
  const price = config.pricing.regionOverrides[config.region]?.pricePerTB ?? config.pricing.defaultPricePerTB
  const currency = config.pricing.regionOverrides[config.region]?.currency ?? config.pricing.currency
  const tb = scannedBytes / 1_000_000_000_000
  const estimated = tb * price
  return { amount: Number(estimated.toFixed(6)), currency }
}

export function formatSeconds(valueMs?: number | null) {
  if (valueMs === undefined || valueMs === null) return null
  const seconds = valueMs / 1000
  return Number(seconds.toFixed(2))
}

export function formatGB(bytes?: number | null) {
  if (bytes === undefined || bytes === null) return null
  const gb = bytes / 1_000_000_000
  return Number(gb.toFixed(2))
}
