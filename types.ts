export enum DifficultyLevel {
  FIRST_GRADE = "First Grade (5-6 years old)",
  ELEMENTARY = "Elementary School",
  MIDDLE_SCHOOL = "Middle School",
  HIGH_SCHOOL = "High School",
  UNDERGRADUATE = "Undergraduate",
  MASTERS = "Master's / PhD Expert"
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface LessonContent {
  title: string;
  summary: string;
  detailedExplanation: string; // Markdown formatted
  analogy: string;
  keyPoints: string[];
  quiz: QuizQuestion[];
}

export interface MessageState {
  type: 'success' | 'error' | 'info';
  text: string;
}

export interface UserSettings {
  textSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
}