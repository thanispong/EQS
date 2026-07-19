export interface Subject {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectPayload {
  name: string;
  description?: string;
}

export interface UpdateSubjectPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}