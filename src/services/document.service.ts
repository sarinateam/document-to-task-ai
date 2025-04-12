import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

export const extractTextFromDocument = async (
  buffer: Buffer,
  mimeType: string
): Promise<string> => {
  try {
    switch (mimeType) {
      case 'application/pdf':
        const pdfData = await pdfParse(buffer);
        return pdfData.text;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const result = await mammoth.extractRawText({ buffer });
        return result.value;

      case 'text/plain':
        return buffer.toString('utf-8');

      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error('Error extracting text from document:', error);
    throw new Error('Failed to extract text from document');
  }
}; 