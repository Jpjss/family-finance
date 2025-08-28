import type { Db, Collection, ObjectId } from "mongodb"

interface MonthlyNoteData {
  expenseNotes?: string
  incomeNotes?: string
}

interface MonthlyNoteDocument {
  _id: ObjectId
  userId: ObjectId
  month: number
  year: number
  expenseNotes?: string
  incomeNotes?: string
  createdAt: Date
  updatedAt: Date
}

export class MonthlyNote {
  private collection: Collection<MonthlyNoteDocument>

  constructor(db: Db) {
    this.collection = db.collection("monthlyNotes")
  }

  async upsert(userId: ObjectId, month: number, year: number, noteData: MonthlyNoteData) {
    const filter = { userId, month, year }
    const update = {
      $set: {
        ...noteData,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    }

    return await this.collection.updateOne(filter, update, { upsert: true })
  }

  async findByUserAndDate(userId: ObjectId, month: number, year: number) {
    return await this.collection.findOne({ userId, month, year })
  }
}
