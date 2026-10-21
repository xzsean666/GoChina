import type { Plan, PlanData } from './models.js';

export interface CreatePlanInput {
  id?: string;
  name: string;
  description: string;
  priceUsd: string;
  tokenAmount?: string;
  tokenSymbol?: string;
  durationDays: number;
  features: string[];
  quota?: {
    apiCalls?: number;
    bandwidthBytes?: number;
    maxSeats?: number;
  };
  category?: string;
  enabled?: number;
  sortOrder?: number;
}

export interface UpdatePlanInput {
  name?: string;
  description?: string;
  priceUsd?: string;
  tokenAmount?: string;
  tokenSymbol?: string;
  durationDays?: number;
  features?: string[];
  quota?: {
    apiCalls?: number;
    bandwidthBytes?: number;
    maxSeats?: number;
  };
  category?: string;
  enabled?: number;
  sortOrder?: number;
}
