import type { Db, Collection, ObjectId } from "mongodb"

interface TransactionData {
  userId: ObjectId
  description: string
  amount: number
  category: string
  type: "receita" | "despesa"
  isPaid?: boolean
}

interface TransactionDocument {
  _id: ObjectId
  userId: ObjectId
  description: string
  amount: number
  category: string
  type: "receita" | "despesa"
  isPaid: boolean
  createdAt: Date
  updatedAt?: Date
}

export class Transaction {
  private collection: Collection<TransactionDocument>

  constructor(db: Db) {
    this.collection = db.collection("transactions")
  }

  async create(transactionData: TransactionData) {
    const transaction: Omit<TransactionDocument, "_id"> = {
      ...transactionData,
      isPaid: transactionData.type === "receita" ? true : transactionData.isPaid || false,
      createdAt: new Date(),
    }

    const result = await this.collection.insertOne(transaction as TransactionDocument)
    return { ...transaction, _id: result.insertedId }
  }

  async findByUserId(userId: ObjectId) {
    return await this.collection.find({ userId }).sort({ createdAt: -1 }).toArray()
  }

  async updatePaymentStatus(transactionId: ObjectId, userId: ObjectId, isPaid: boolean) {
    return await this.collection.updateOne({ _id: transactionId, userId }, { $set: { isPaid, updatedAt: new Date() } })
  }

  async delete(transactionId: ObjectId, userId: ObjectId) {
    return await this.collection.deleteOne({ _id: transactionId, userId })
  }
}
