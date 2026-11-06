import bcrypt from "bcryptjs"
import type { Db, Collection, ObjectId } from "mongodb"

import { createToken } from "@/lib/auth"

interface UserData {
  name: string
  email: string
  password: string
}

interface UserDocument {
  _id?: ObjectId
  name: string
  email: string
  password: string
  createdAt: Date
}

export class User {
  private collection: Collection<UserDocument>

  constructor(db: Db) {
    this.collection = db.collection("users")
  }

  async create(userData: UserData) {
    const { name, password } = userData
    const email = userData.email.trim().toLowerCase()
    await this.collection.createIndex({ email: 1 }, { unique: true })

    // Check if user already exists
    const existingUser = await this.collection.findOne({ email })
    if (existingUser) {
      throw new Error("Essa conta já existe")
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    const user: UserDocument = {
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    }

    const result = await this.collection.insertOne(user)
    return { ...user, _id: result.insertedId }
  }

  async authenticate(email: string, password: string) {
    email = email.trim().toLowerCase()
    const user = await this.collection.findOne({ email })
    if (!user) {
      throw new Error("Credenciais inválidas")
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      throw new Error("Credenciais inválidas")
    }

    // Sign the server session
    const token = createToken(user._id!.toString(), user.email)

    return { user: { _id: user._id, name: user.name, email: user.email }, token }
  }

  async findById(id: ObjectId) {
    return await this.collection.findOne({ _id: id })
  }
}
