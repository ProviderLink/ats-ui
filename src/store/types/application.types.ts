import type { ApplicationPhase, ApplicationSource } from './enums';

export interface ApplicationCurrentStage {
  stageId: string;
  stageName: string;
  assignedAt: string;
  assignedBy: string;
}

export interface ApplicationAiValidation {
  isValid: boolean;
  score: number;
  reason: string;
  completedAt: string;
}

export interface ApplicationAiScore {
  score: number;
  recommendation: string;
  summary: string;
  strengths: string[];
  concerns: string[];
}

export interface Application {
  _id: string;
  candidateId: string;
  jobId: string;
  clientId: string;
  phase: ApplicationPhase;
  currentStage?: ApplicationCurrentStage | null;
  source: ApplicationSource;
  aiValidation?: ApplicationAiValidation | null;
  aiScore?: ApplicationAiScore | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  rejectionReason?: string | null;
  interviewIds: string[];
  notes?: string | null;
  hiredAt?: string | null;
  hiredBy?: string | null;
  appliedAt: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationFilters {
  jobId?: string;
  candidateId?: string;
  clientId?: string;
  phase?: ApplicationPhase;
  page?: number;
  limit?: number;
}
