const comparable = value => value instanceof Date ? value.getTime() : value?.toHexString ? value.toHexString() : value
function matches(row, query) {
  return Object.entries(query).every(([key, expected]) => {
    const actual = comparable(row[key])
    if (expected && typeof expected === "object" && !(expected instanceof Date) && !expected.toHexString) {
      return Object.entries(expected).every(([operator, value]) => {
        if (operator === "$ne") return actual !== comparable(value)
        if (operator === "$lt") return actual < comparable(value)
        if (operator === "$lte") return actual <= comparable(value)
        if (operator === "$type") return typeof actual === value
        if (operator === "$in") return value.map(comparable).includes(actual)
        throw new Error(`Unsupported test operator: ${operator}`)
      })
    }
    return actual === comparable(expected)
  })
}
class Collection {
  constructor(rows = []) { this.rows = rows.map(row => ({ ...row })); this.beforeFindOne = null }
  async createIndex() {}
  async insertOne(row) {
    if (this.rows.some(existing => comparable(existing._id) === comparable(row._id) && row._id != null)) throw Object.assign(new Error("Duplicate"), { code: 11000 })
    this.rows.push({ ...row }); return { insertedId: row._id }
  }
  async findOne(query) { if (this.beforeFindOne) await this.beforeFindOne(query); return this.rows.find(row => matches(row, query)) || null }
  find(query) {
    let rows = this.rows.filter(row => matches(row, query)).map(row => ({ ...row }))
    return {
      sort(order) { rows.sort((a, b) => { for (const [key, direction] of Object.entries(order)) { if (comparable(a[key]) < comparable(b[key])) return -direction; if (comparable(a[key]) > comparable(b[key])) return direction } return 0 }); return this },
      limit(count) { rows = rows.slice(0, count); return this },
      async toArray() { return rows }, async close() {},
      async *[Symbol.asyncIterator]() { yield* rows },
    }
  }
  async updateOne(query, update, options = {}) {
    const row = this.rows.find(row => matches(row, query))
    if (!row) {
      if (options.upsert) { await this.insertOne({ ...query, ...update.$setOnInsert }); return { modifiedCount: 0, upsertedCount: 1 } }
      return { modifiedCount: 0, matchedCount: 0 }
    }
    Object.assign(row, update.$set)
    for (const [key, value] of Object.entries(update.$inc || {})) row[key] = (row[key] || 0) + value
    return { modifiedCount: 1, matchedCount: 1 }
  }
  async updateMany(query, update) { for (const row of this.rows.filter(row => matches(row, query))) Object.assign(row, update.$set) }
  async bulkWrite(operations) { for (const { updateOne: operation } of operations) await this.updateOne(operation.filter, operation.update, { upsert: operation.upsert }) }
}
function fakeDb(seed = {}) {
  const collections = Object.fromEntries(Object.entries(seed).map(([key, rows]) => [key, new Collection(rows)]))
  return { collection(name) { return collections[name] ||= new Collection() } }
}
module.exports = { fakeDb }
