import { MongoClient } from 'mongodb';

async function initializeDatabase() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const client = new MongoClient(uri);
    
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('family-finance');

    // Create users collection with validation
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { bsonType: 'string' },
            email: { bsonType: 'string' },
            password: { bsonType: 'string' },
            createdAt: { bsonType: 'date' }
          }
        }
      }
    });

    // Create unique index on email
    await db.collection('users').createIndex({ email: 1 }, { unique: true });

    // Create transactions collection with validation
    await db.createCollection('transactions', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['userId', 'type', 'amount', 'category'],
          properties: {
            userId: { bsonType: 'objectId' },
            type: { enum: ['receita', 'despesa'] },
            amount: { bsonType: 'number' },
            category: { bsonType: 'string' },
            description: { bsonType: 'string' },
            isPaid: { bsonType: 'bool' },
            createdAt: { bsonType: 'date' }
          }
        }
      }
    });

    // Create index on userId for faster queries
    await db.collection('transactions').createIndex({ userId: 1 });

    console.log('Database initialized successfully');
    await client.close();
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();