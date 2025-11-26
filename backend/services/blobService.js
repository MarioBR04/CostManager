const { BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');
require('dotenv').config();

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = 'recipe-images';

let blobServiceClient;
let containerClient;

async function init() {
    if (!AZURE_STORAGE_CONNECTION_STRING) {
        console.warn('AZURE_STORAGE_CONNECTION_STRING is not set. Image upload will fail.');
        return;
    }
    try {
        blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
        containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
        await containerClient.createIfNotExists({
            access: 'blob' // Allow public read access to blobs
        });
    } catch (error) {
        console.error('Error initializing Azure Blob Storage:', error.message);
    }
}

init();

exports.uploadImage = async (file) => {
    if (!containerClient) {
        throw new Error('Azure Blob Storage is not configured.');
    }

    const extension = path.extname(file.originalname);
    const blobName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${extension}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype }
    });

    return blockBlobClient.url;
};
