/**
 * @file pages/api/upload.js
 * @description API endpoint for file uploads. This endpoint parses multipart form data,
 * uploads the file to AWS S3 using AWS SDK for JavaScript (v3), and stores file metadata
 * in the database.
 */

import formidable from 'formidable';
import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { connectToDatabase } from '../../lib/db';

/**
 * API configuration.
 * Disables Next.js's built-in body parsing so that formidable can handle multipart data.
 */
export const config = {
  api: { bodyParser: false },
};

// Initialize AWS S3 client using AWS SDK v3.
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * API route handler for file uploads.
 *
 * @async
 * @function handler
 * @param {import('next').NextApiRequest} req - The HTTP request.
 * @param {import('next').NextApiResponse} res - The HTTP response.
 * @returns {Promise<void>}
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Use formidable's new promise-based API.
  const form = formidable({ multiples: false });
  try {
    const { fields, files } = await form.parse(req);
    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read file data from the temporary file.
    const fileData = fs.readFileSync(file.filepath);
    const key = `${Date.now()}-${file.originalFilename}`;
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: fileData,
      ContentType: file.mimetype,
    };

    // Upload the file to S3.
    await s3Client.send(new PutObjectCommand(params));

    // Construct the S3 file URL.
    const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Save file metadata to the database.
    const { db } = await connectToDatabase();
    await db.collection('uploads').insertOne({
      filename: file.originalFilename,
      s3Url,
      uploadedAt: new Date(),
    });

    return res.status(200).json({ message: 'File uploaded successfully', url: s3Url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error processing file upload' });
  }
}
