export enum TaskCategory {
  UI_DESIGN = 'UI Design',
  UI_DEVELOPMENT = 'UI Development',
  FRONTEND_LOGIC = 'Frontend Logic',
  BACKEND_DEVELOPMENT = 'Backend Development',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category?: TaskCategory;
  priority: number;
  dependencies?: string[];
  estimatedTime?: string;
}

export interface DocumentAnalysisResult {
  tasks: Task[];
  summary?: string;
}

export interface AIModel {
  name: string;
  provider: string;
  modelId: string;
  maxTokens: number;
  temperature: number;
}

export interface AIModelConfig {
  name: string;
  provider: string;
  modelId: string;
  maxTokens: number;
  temperature: number;
}

export interface ErrorResponse {
  error: string;
  details?: string;
  timestamp?: string;
} 