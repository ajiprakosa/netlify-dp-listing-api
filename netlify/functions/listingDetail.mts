import type { Handler } from '@netlify/functions'
import { MongoClient, ObjectId } from 'mongodb'

const uri = process.env.MONGODB_URI!
const dbName = process.env.MONGODB_DB!
const collectionName = process.env.MONGODB_COLLECTION!

let cachedClient: MongoClient | null = null

const handler: Handler = async (event, context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    }
  }

  const id = event.path.split('/').pop() // get ID from /listings/:id

  if (!id) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing listing ID in URL' }),
    }
  }

  try {
    if (!cachedClient) {
      cachedClient = new MongoClient(uri)
      await cachedClient.connect()
    }

    const db = cachedClient.db(dbName)
    const collection = db.collection(collectionName)

    const listing = await collection.findOne({ _id: new ObjectId(id) })

    if (!listing) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Listing not found' }),
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(listing),
    }
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal Server Error', details: err.message }),
    }
  }
}

export { handler }
