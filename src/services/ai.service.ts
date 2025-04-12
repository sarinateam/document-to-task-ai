import OpenAI from 'openai';
import { DocumentAnalysisResult, Task, TaskCategory } from '../types';

// Initialize OpenAI client
const initializeOpenAI = (): OpenAI => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }
  return new OpenAI({ apiKey });
};

const openai = initializeOpenAI();

const SYSTEM_PROMPT = `You are an assistant that extracts and organizes software feature requirements from brief descriptions. When given a system concept, you must identify all distinct user-related functional tasks or features and return them in a JSON array. Each task includes a short descriptive name and a 1–2 sentence description. Avoid implementation details; focus on what the user or admin can do functionally.

You must:

Prioritize the tasks: list independent modules first, followed by dependent ones.

If any functional gaps exist in the provided concept, intelligently fill them with commonly expected features based on your best knowledge.

For example, if the concept mentions a "dashboard" but doesn't specify what it includes, include features like "View user activity", "See recent notifications", and "Check system status".
In some cases, you may need to create new features that are not explicitly mentioned in the concept but are expected in a well-designed system.
for example, you have a documentation which dosen't mention anything about the admin panel, but you can assume that the admin panel will have features like "manage users", "manage content", "manage settings", etc.
literally, you need to think like a user and a admin and extract the features accordingly.

Example output format:

[
  {
    "task": "authentication",
    "description": "Login using email and password"
  },
  {
    "task": "registration",
    "description": "Register using email, mobile number, and personal details"
  }
]


IMPORTANT: Return ONLY the JSON array with no additional text, markdown formatting, or explanations.`;

// Function to analyze document content with OpenAI
export const analyzeDocumentContent = async (
  text: string,
  modelId: string,
  onProgress: (progress: number, message: string) => void
): Promise<DocumentAnalysisResult> => {
  try {
    onProgress(20, 'Processing document...');
    
    // Log the extracted text that will be sent to OpenAI
    console.log('=== EXTRACTED TEXT BEING SENT TO OPENAI ===');
    console.log(text);
    console.log('=== END OF EXTRACTED TEXT ===');
    console.log('Text length:', text.length, 'characters');
    
    // Log the prompts for debugging
    console.log('System Prompt:', SYSTEM_PROMPT);
    
    const userPrompt = `Please analyze the following description and extract all distinct user-related 
          functional tasks (like registration, password reset, comment moderation, etc.) and return them as a JSON 
          array. Each item should have a "task" field with a short name and a "description" field with a 1–2 sentence 
          explanation.:\n\n${text}`;
    
    console.log('User Prompt:', userPrompt);
    console.log('Using model:', modelId);
      
      const response = await openai.chat.completions.create({
        model: modelId,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      response_format: { type: "json_object" }
      });
    
    console.log('OpenAI API response received:', response);
      
      const content = response.choices[0]?.message?.content || '';
    console.log('OpenAI Response content:', content);
    
    // Check if the content is empty
    if (!content) {
      console.error('OpenAI response content is empty');
      throw new Error('OpenAI response content is empty');
    }
    
    // Try to parse the content as JSON to validate it
    try {
      JSON.parse(content);
      console.log('Content is valid JSON');
    } catch (parseError) {
      console.error('Content is not valid JSON:', parseError);
      throw new Error('OpenAI response is not valid JSON');
    }
    
    const tasks = parseTasksFromResponse(content);
    console.log('Parsed tasks:', tasks);
    
    // Check if we got any tasks
    if (tasks.length === 0) {
      console.error('No tasks were parsed from the response');
      throw new Error('No tasks were parsed from the response');
    }
    
    onProgress(100, 'Analysis complete!');
    
    return {
      tasks,
      summary: `Found ${tasks.length} tasks.`
    };
  } catch (error) {
    console.error('Error analyzing document with AI:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check for specific error types
      if (error.message.includes('API key')) {
        throw new Error('OpenAI API key is invalid or missing. Please check your configuration.');
      } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
        throw new Error('OpenAI API quota exceeded or rate limit reached. Please try again later.');
      } else if (error.message.includes('model')) {
        throw new Error(`Invalid model ID: ${modelId}. Please check your configuration.`);
      }
    }
    
    throw new Error(`Failed to analyze document with AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Function to parse tasks from AI response
const parseTasksFromResponse = (response: string): Task[] => {
  try {
    console.log('Attempting to parse response:', response);
    
    // Parse the JSON response
    const parsedResponse = JSON.parse(response);
    console.log('Parsed JSON response:', parsedResponse);
    
    // Check if the response is an object with a tasks property
    if (parsedResponse.tasks && Array.isArray(parsedResponse.tasks)) {
      console.log('Response is an object with tasks array');
      
      // Map the simple task format to our Task interface
      const tasks = parsedResponse.tasks.map((item: { task?: string; description?: string }, index: number) => {
        console.log(`Processing task item ${index}:`, item);
        
        // Validate required fields
        if (!item.task) {
          console.error(`Task item ${index} missing 'task' field:`, item);
        }
        
        if (!item.description) {
          console.error(`Task item ${index} missing 'description' field:`, item);
        }
        
        return {
          id: `task-${index + 1}`,
          title: item.task || 'Untitled Task',
          description: item.description || 'No description provided',
          priority: 3 // Required field
          // category and dependencies are optional, so we don't need to set them
        };
      });
      
      console.log('Successfully parsed tasks:', tasks);
      return tasks;
    }
    
    // Check if the response is an array of objects with task and description fields
    if (Array.isArray(parsedResponse)) {
      console.log('Response is an array');
      
      // Map the simple task format to our Task interface
      const tasks = parsedResponse.map((item: { task?: string; description?: string }, index: number) => {
        console.log(`Processing task item ${index}:`, item);
        
        // Validate required fields
        if (!item.task) {
          console.error(`Task item ${index} missing 'task' field:`, item);
        }
        
        if (!item.description) {
          console.error(`Task item ${index} missing 'description' field:`, item);
        }
        
        return {
          id: `task-${index + 1}`,
          title: item.task || 'Untitled Task',
          description: item.description || 'No description provided',
          priority: 3 // Required field
          // category and dependencies are optional, so we don't need to set them
        };
      });
      
      console.log('Successfully parsed tasks:', tasks);
      return tasks;
    }
    
    // If we get here, the response format is unexpected
    console.error('Unexpected response format:', parsedResponse);
    throw new Error('Unexpected response format from OpenAI');
  } catch (error) {
    console.error('Error parsing tasks from response:', error);
    
    if (error instanceof SyntaxError) {
      console.error('JSON parsing error. Response might not be valid JSON:', response);
    }
    
    // Return empty array instead of throwing an error
    return [];
  }
}; 