import { createHash } from "node:crypto"
import { ObjectId, type Db } from "mongodb"
import { buildTransactions, type TransactionInput } from "../transaction-input"
import type { FinanceTransaction } from "../finance"

export type TransactionDocument = Omit<FinanceTransaction, "_id" | "userId" | "createdAt"> & {
  _id: ObjectId; userId: ObjectId; createdAt: Date; updatedAt?: Date; payloadHash?: string
}

export class Transaction {
  private collection
  constructor(db: Db) { this.collection = db.collection<TransactionDocument>("transactions") }

  async create(input: TransactionInput, userId: ObjectId) {
    const rows = buildTransactions(input, userId.toHexString())
    await this.saveOnce(rows, userId, "new")
    return this.collection.find({ userId, _id: { $in: rows.map(row => this.id(userId, "new", row._id)) } }).sort({ installmentNumber: 1 }).toArray()
  }

  private id(userId: ObjectId, source: string, id: string) {
    return new ObjectId(createHash("sha256").update(`${userId}:${source}:${id}`).digest("hex").slice(0, 24))
  }

  async saveOnce(rows: FinanceTransaction[], userId: ObjectId, source: "new" | "import") {
    if (!rows.length) return
    await this.collection.createIndex({ userId: 1, dueDate: 1 })
    await this.collection.bulkWrite(rows.map(row => {
      const { _id, userId: ignored, createdAt, ...data } = row
      const payloadHash = createHash("sha256").update(JSON.stringify(data)).digest("hex")
      const id = this.id(userId, source, _id)
      return { updateOne: {
        // A changed payload with the same request ID fails rather than changing an existing purchase.
        filter: source === "new" ? { _id: id, userId, payloadHash } : { _id: id, userId },
        update: { $setOnInsert: { ...data, _id: id, userId, createdAt: new Date(createdAt), payloadHash } },
        upsert: true,
      } }
    }))
  }

  async findByUserId(userId: ObjectId) {
    return this.collection.find({ userId }).sort({ createdAt: -1 }).toArray()
  }
  async updatePaymentStatus(id: ObjectId, userId: ObjectId, isPaid: boolean) {
    return this.collection.updateOne({ _id: id, userId, type: "despesa" }, { $set: { isPaid, updatedAt: new Date() } })
  }
  async delete(id: ObjectId, userId: ObjectId) { return this.collection.deleteOne({ _id: id, userId }) }
}
