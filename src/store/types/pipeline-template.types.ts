import type { StageShape } from './common';

export interface PipelineTemplate {
  _id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  stages: StageShape[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePipelineTemplateDto {
  name: string;
  description?: string;
  isDefault?: boolean;
  stages: Omit<StageShape, '_id'>[];
}

export interface UpdatePipelineTemplateDto {
  name?: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
  stages?: Omit<StageShape, '_id'>[];
}
