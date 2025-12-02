
export type TaxonomyType = 'RTTI' | 'KTI';

export interface TaxonomyDistribution {
  // RTTI
  R?: number;
  T1?: number;
  T2?: number;
  I?: number;
  // KTI
  K?: number;
  T?: number;
}

export interface TestConfiguration {
  taxonomy: TaxonomyType;
  subject: string;
  level: string;
  topics: string;
  learningGoals: string;
  distribution: TaxonomyDistribution;
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
  taxonomyLabel: string; // 'R'|'T1'|'T2'|'I' OR 'K'|'T'|'I'
  type: 'Multiple Choice' | 'Open' | 'Other';
  options?: string[]; // For MC
  points: number;
}

export interface AnswerKeyItem {
  questionId: number;
  answer: string;
  criteria?: string; // For open questions
  explanation: string; // Why is it R/T1... or K/T...?
}

export interface LearningGoalMap {
  goal: string;
  questionIds: number[];
}

export interface TestMatrixItem {
  topic: string;
  // Dynamic counts based on taxonomy
  [key: string]: number | string; 
}

export interface GeneratedTest {
  title: string;
  taxonomy: TaxonomyType;
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
