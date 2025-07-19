export type UserRole = 'admin' | 'candidate';
export type QuestionType = 'video' | 'text' | 'multiple_choice';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type AssignmentStatus = 'pending' | 'in_progress' | 'completed';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Interview {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
}

export interface Question {
  id: string;
  interview_id: string;
  question_text: string;
  type: QuestionType;
  options?: any; // JSONB field for multiple choice options
  order_index: number;
}

export interface Assignment {
  id: string;
  interview_id: string;
  user_id: string;
  status: AssignmentStatus;
  assigned_at: string;
}

export interface Response {
  id: string;
  assignment_id: string;
  question_id: string;
  data: any; // JSONB field for response data
  created_at: string;
  updated_at: string;
  processing_status?: ProcessingStatus;
}

// Extended types with relations
export interface InterviewWithQuestions extends Interview {
  questions?: Question[];
}

export interface AssignmentWithDetails extends Assignment {
  interview?: InterviewWithQuestions;
  profile?: Profile;
  responses?: Response[];
}

export interface DashboardStats {
  totalCandidates: number;
  totalInterviews: number;
  completedAssignments: number;
  pendingAssignments: number;
} 