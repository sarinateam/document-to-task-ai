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
literally, you need to think like a user and a admin or any other user roles who will be using the system and extract the features accordingly.

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
    
    // We no longer need to check if tasks.length === 0 since parseTasksFromResponse
    // will always return at least one task (either parsed or fallback)
    
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
    
    // Check if the response is an object with a different structure
    // This handles cases where the response might have a different format
    if (typeof parsedResponse === 'object' && parsedResponse !== null) {
      console.log('Response is an object with unknown structure, attempting to extract tasks');
      
      // Try to find an array property that might contain tasks
      const possibleTaskArrays = Object.entries(parsedResponse)
        .filter(([_, value]) => Array.isArray(value) && value.length > 0)
        .map(([key, value]) => ({ key, value }));
      
      console.log('Possible task arrays found:', possibleTaskArrays);
      
      if (possibleTaskArrays.length > 0) {
        // Use the first array that looks like it contains tasks
        const taskArray = possibleTaskArrays[0].value as any[];
        console.log(`Using array from property '${possibleTaskArrays[0].key}' as tasks`);
        
        // Try to map the array items to tasks
        const tasks = taskArray.map((item: any, index: number) => {
          console.log(`Processing task item ${index}:`, item);
          
          // Try to extract task and description from various possible formats
          let taskTitle = '';
          let taskDescription = '';
          
          if (typeof item === 'string') {
            // If the item is just a string, use it as the title
            taskTitle = item;
            taskDescription = 'No description provided';
          } else if (typeof item === 'object') {
            // Try different possible property names
            taskTitle = item.task || item.title || item.name || item.id || `Task ${index + 1}`;
            taskDescription = item.description || item.desc || item.details || 'No description provided';
          } else {
            // Fallback for other types
            taskTitle = `Task ${index + 1}`;
            taskDescription = 'No description provided';
          }
          
          return {
            id: `task-${index + 1}`,
            title: taskTitle,
            description: taskDescription,
            priority: 3 // Required field
          };
        });
        
        console.log('Successfully parsed tasks from object:', tasks);
        return tasks;
      }
    }
    
    // If we get here, the response format is unexpected
    console.error('Unexpected response format:', parsedResponse);
    
    // Instead of throwing an error, try to create a single task from the response
    // This is a fallback to ensure we don't completely fail
    console.log('Attempting to create a fallback task from the response');
    
    let fallbackTask: Task = {
      id: 'task-1',
      title: 'Document Analysis',
      description: 'Analyze the provided document for tasks and requirements',
      priority: 3
    };
    
    // If the response is a string, use it as the description
    if (typeof parsedResponse === 'string') {
      fallbackTask.description = parsedResponse;
    } 
    // If the response is an object, try to extract useful information
    else if (typeof parsedResponse === 'object' && parsedResponse !== null) {
      const stringProps = Object.entries(parsedResponse)
        .filter(([_, value]) => typeof value === 'string')
        .map(([key, value]) => ({ key, value }));
      
      if (stringProps.length > 0) {
        fallbackTask.description = `Document analysis: ${stringProps.map(p => `${p.key}: ${p.value}`).join(', ')}`;
      }
    }
    
    console.log('Created fallback task:', fallbackTask);
    return [fallbackTask];
  } catch (error) {
    console.error('Error parsing tasks from response:', error);
    
    if (error instanceof SyntaxError) {
      console.error('JSON parsing error. Response might not be valid JSON:', response);
    }
    
    // Create a fallback task instead of returning an empty array
    console.log('Creating fallback task due to parsing error');
    return [{
      id: 'task-1',
      title: 'Document Analysis',
      description: 'There was an error parsing the AI response. Please try again or contact support.',
      priority: 3
    }];
  }
}; 