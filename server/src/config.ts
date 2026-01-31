import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'

const pricingSchema = z.object({
  currency: z.string(),
  defaultPricePerTB: z.number(),
  billing: z.object({
    rounding: z.string(),
    minimumMB: z.number(),
  }),
  regionOverrides: z.record(
    z.object({
      currency: z.string().optional(),
      pricePerTB: z.number(),
    })
  ),
  sources: z.array(z.string()).optional(),
})

export type PricingConfig = z.infer<typeof pricingSchema>

const configSchema = z.object({
  port: z.number().default(8081),
  region: z.string(),
  workgroup: z.string(),
  outputLocation: z.string(),
  defaultCatalog: z.string().default('AwsDataCatalog'),
  defaultDatabase: z.string().optional(),
  pricingFile: z.string().default('config/athena-pricing.json'),
})

export type AppConfig = z.infer<typeof configSchema> & { pricing: PricingConfig }

export function loadConfig(): AppConfig {
  const port = process.env.PORT ? Number(process.env.PORT) : 8081
  const config = configSchema.parse({
    port,
    region: process.env.AWS_REGION,
    workgroup: process.env.ATHENA_WORKGROUP,
    outputLocation: process.env.ATHENA_OUTPUT_LOCATION,
    defaultCatalog: process.env.ATHENA_DEFAULT_CATALOG || 'AwsDataCatalog',
    defaultDatabase: process.env.ATHENA_DEFAULT_DATABASE,
    pricingFile: process.env.ATHENA_PRICING_FILE || 'config/athena-pricing.json',
  })

  const pricingPath = path.isAbsolute(config.pricingFile)
    ? config.pricingFile
    : path.join(process.cwd(), config.pricingFile)

  const rawPricing = fs.readFileSync(pricingPath, 'utf-8')
  const pricing = pricingSchema.parse(JSON.parse(rawPricing))

  return { ...config, pricing }
}
