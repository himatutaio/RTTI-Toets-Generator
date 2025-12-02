export interface RTTIDistribution {
  R: number;
  T1: number;
  T2: number;
  I: number;
}

export interface TestConfiguration {
  subject: string;
  level: string;
  topics: string;
  learningGoals: string;
  rttiDistribution: RTTIDistribution;
  duration: number; // minutes
  questionCount: number;
  questionTypes: string; // e.g., "70% MC, 30% Open"
  languageLevel: string;
  extraRequirements: string;
}

// Structured response from Gemini
export interface Question {
  id: number;
  text: string;
  rtti: 'R' | 'T1' | 'T2' | 'I';
  type: 'Multiple Choice' | 'Open' | 'Other';
  options?: string[]; // For MC
  points: number;
}

export interface AnswerKeyItem {
  questionId: number;
  answer: string;
  criteria?: string; // For open questions
  explanation: string; // Why is it R/T1/T2/I?
}

export interface LearningGoalMap {
  goal: string;
  questionIds: number[];
}

export interface TestMatrixItem {
  topic: string;
  r: number; // count
  t1: number; // count
  t2: number; // count
  i: number; // count
}

export interface GeneratedTest {
  title: string;
  introduction: string;
  questions: Question[];
  matrix: TestMatrixItem[];
  answers: AnswerKeyItem[];
  goalMapping: LearningGoalMap[];
  analysisInstructions: string;
}

export interface SearchResult {
  title: string;
  uri: string;
}