// Load environment variables from .env file first
import dotenv from 'dotenv';
import path from 'path';

// Configure dotenv to load the .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { documentRoutes } from './routes/document.routes';
import { errorHandler } from './middleware/error.middleware';

// Check if OpenAI API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY environment variable is missing or empty');
  console.error('Please add your OpenAI API key to the .env file in the backend directory');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/documents', documentRoutes);

// Error handling
app.use(errorHandler);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`OpenAI API key is configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
}); 