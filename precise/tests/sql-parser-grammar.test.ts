import { CharStream, CommonTokenStream } from 'antlr4ng'
import { describe, expect, it } from 'vitest'
import { SqlBaseLexer } from '../src/generated/lexer/SqlBase.g4/SqlBaseLexer'
import { SqlBaseParser } from '../src/generated/lexer/SqlBase.g4/SqlBaseParser'
import SqlBaseErrorListener from '../src/sql/SqlBaseErrorListener'

function parseMarkers(sql: string) {
  const inputStream = CharStream.fromString(sql)
  const lexer = new SqlBaseLexer(inputStream)
  const tokenStream = new CommonTokenStream(lexer)
  const parser = new SqlBaseParser(tokenStream)
  const errors = new SqlBaseErrorListener()

  parser.removeErrorListeners()
  parser.addErrorListener(errors)
  parser.singleStatement()

  return errors.getMarkers()
}

function expectParses(sql: string) {
  expect(parseMarkers(sql)).toHaveLength(0)
}

function expectParseFails(sql: string) {
  expect(parseMarkers(sql).length).toBeGreaterThan(0)
}

describe('Athena grammar regressions', () => {
  it('accepts SHOW PARTITIONS without FROM', () => {
    expectParses('SHOW PARTITIONS happyhospitaldev_spectrum.ods_json;')
  })

  it('rejects SHOW PARTITIONS with FROM', () => {
    expectParseFails('SHOW PARTITIONS FROM happyhospitaldev_spectrum.ods_json;')
  })

  it('accepts ALTER TABLE ADD IF NOT EXISTS PARTITION', () => {
    expectParses("ALTER TABLE orders ADD IF NOT EXISTS PARTITION (ds='2023-01-01');")
  })

  it('accepts ALTER TABLE ADD multiple PARTITION clauses with LOCATION', () => {
    expectParses(`ALTER TABLE orders ADD
      PARTITION (dt = '2016-05-31', country = 'IN') LOCATION 's3://amzn-s3-demo-bucket/path/to/INDIA_31_May_2016/'
      PARTITION (dt = '2016-06-01', country = 'IN') LOCATION 's3://amzn-s3-demo-bucket/path/to/INDIA_01_June_2016/';`)
  })

  it('accepts UNLOAD with TO and WITH options', () => {
    expectParses(`UNLOAD (SELECT * FROM old_table)
TO 's3://amzn-s3-demo-bucket/unload_test_1/'
WITH (format = 'JSON');`)
  })
})
