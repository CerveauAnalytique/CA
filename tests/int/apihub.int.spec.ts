import { describe, expect, it } from 'vitest'
import { countEndpoints } from '@/collections/ApiListings'

describe('API Hub: countEndpoints', () => {
  it('counts the methods of a JSON OpenAPI file', () => {
    const spec = JSON.stringify({ openapi: '3.0.0', paths: { '/a': { get: {}, post: {}, parameters: [] }, '/b': { delete: {} } } })
    expect(countEndpoints(spec)).toBe(3)
  })

  it('counts the methods of a YAML OpenAPI file', () => {
    const spec = ['openapi: 3.0.0', 'info:', '  title: x', 'paths:', '  /a:', '    get:', '      summary: a', '    put:', '      summary: b', '  /b:', '    post:', '      summary: c', 'components: {}'].join('\n')
    expect(countEndpoints(spec)).toBe(3)
  })

  it('returns 0 for text that is not an API file', () => {
    expect(countEndpoints('hello')).toBe(0)
  })
})
