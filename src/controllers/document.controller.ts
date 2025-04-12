import { Request, Response } from 'express';
import { DocumentAnalysisResult, ErrorResponse } from '../types';
import { analyzeDocumentContent } from '../services/ai.service';
import { extractTextFromDocument } from '../services/document.service';
import multer from 'multer';

// Configure multer for file upload
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  },
});

export const analyzeDocument = async (req: Request, res: Response) => {
  try {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send progress updates
    const sendProgress = (progress: number, message: string) => {
      // Send the progress update to the client
      res.write(`data: ${JSON.stringify({ type: 'progress', progress, message })}\n\n`);
    };

    let text: string;

    if (req.file) {
      // Handle file upload
      sendProgress(10, 'Extracting text from document...');
      text = await extractTextFromDocument(req.file.buffer, req.file.mimetype);
    } else if (req.body.text) {
      // Handle direct text input
      text = req.body.text;
    } else {
      throw new Error('No document or text provided');
    }

    // Use the model from environment variables
    const modelId = process.env.AI_MODEL || 'gpt-4';

    // Analyze the document with progress updates
    const result = await analyzeDocumentContent(text, modelId, sendProgress);

    // Send the final result
    res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error in document analysis:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`);
    res.end();
  }
}; 