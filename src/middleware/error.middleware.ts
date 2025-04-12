import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    name: err.name
  });

  // Check for OpenAI API quota error
  if (err.message.includes('429') && err.message.includes('quota')) {
    return res.status(429).json({
      error: 'OpenAI API quota exceeded',
      details: 'You have exceeded your OpenAI API usage quota. Please check your billing details or upgrade your plan.',
      timestamp: new Date().toISOString()
    });
  }

  // Default error status and message
  const status = 500;
  const message = err.message || 'Internal Server Error';

  // Send error response
  res.status(status).json({
    error: 'Failed to analyze document',
    details: message,
    timestamp: new Date().toISOString()
  });
}; 