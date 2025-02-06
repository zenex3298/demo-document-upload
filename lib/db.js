/**
 * @file lib/db.js
 * @description Provides a MongoDB connection using the native MongoDB driver.
 * This module exports a function to connect to the database. In development mode,
 * the connection is cached to prevent multiple connections during hot-reloading.
 */

import { MongoClient } from 'mongodb';

// MongoDB connection URI from environment variables.
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('Add your MongoDB URI to .env.local');

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to store the MongoClient promise
  // to avoid creating multiple connections.
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, create a new MongoClient and connect directly.
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

/**
 * Connects to the MongoDB database.
 *
 * @async
 * @function connectToDatabase
 * @returns {Promise<{ client: MongoClient, db: import('mongodb').Db }>} 
 * An object containing the MongoClient instance and the connected database.
 */
export async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);
  return { client, db };
}
