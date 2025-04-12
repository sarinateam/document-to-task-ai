# Document-to-Task AI - Backend

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js" />
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" />
</div>

## Overview

The Document-to-Task AI backend is a Node.js/Express.js application that provides AI-powered document analysis capabilities. It processes software development documents using OpenAI's GPT models to extract actionable tasks and provides real-time progress updates through Server-Sent Events (SSE).

## Features

- **Document Analysis**: Process PDF, DOCX, and TXT files
- **AI Integration**: Leverage OpenAI's GPT models for intelligent task extraction
- **Real-time Progress**: SSE-based progress updates
- **Excel Export**: Generate Excel files with extracted tasks
- **Type Safety**: Full TypeScript support
- **Error Handling**: Comprehensive error handling and logging

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/document-to-task-ai.git
   cd document-to-task-ai/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=3001
   OPENAI_API_KEY=your_openai_api_key
   ```

## Usage

### Development

Start the development server:

```bash
npm run dev
# or
yarn dev
```

The server will start on port 3001 (or the port specified in your .env file).

### Production

Build and start the production server:

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## API Endpoints

### Document Analysis

```
POST /api/analyze
```

Analyzes a document and extracts tasks. Supports both file uploads and direct text input.

**Request Body:**
- For file upload: `multipart/form-data` with a `file` field
- For text input: JSON with a `text` field

**Response:**
Server-Sent Events (SSE) stream with:
- Progress updates
- Analysis results
- Error messages (if any)

### Task Export

```
POST /api/export
```

Exports extracted tasks to Excel format.

**Request Body:**
```json
{
  "tasks": [
    {
      "task": "string",
      "description": "string"
    }
  ]
}
```

**Response:**
Excel file download

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── routes/          # API routes
│   ├── types/           # TypeScript type definitions
│   └── index.ts         # Application entry point
├── .env                 # Environment variables
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3001 |
| OPENAI_API_KEY | OpenAI API key | - |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for the GPT models
- Express.js for the web framework
- TypeScript for the type safety 