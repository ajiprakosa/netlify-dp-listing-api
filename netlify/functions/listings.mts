import type { Handler } from '@netlify/functions'
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI!
const dbName = process.env.MONGODB_DB!
const collectionName = process.env.MONGODB_COLLECTION!

let cachedClient: MongoClient | null = null

const handler: Handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: '',
    }
  }

  try {
    const page = parseInt(event.queryStringParameters?.page || '1')
    const limit = parseInt(event.queryStringParameters?.limit || '10')
    const skip = (page - 1) * limit

    if (!cachedClient) {
      cachedClient = new MongoClient(uri)
      await cachedClient.connect()
    }

    const db = cachedClient.db(dbName)
    const collection = db.collection(collectionName)

    const total = await collection.countDocuments()
    const data = await collection.find().skip(skip).limit(limit).toArray()

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ total, page, limit, data }),
    }
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal Server Error', details: err.message }),
    }
  }
}

export { handler }
