import { Timestamp } from 'firebase/firestore';

export type UserRole = 'child' | 'admin';

export interface User {
  id: string;
  name: string;
  avatar: string;
  points: number;
  role: UserRole;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Chore {
  id: string;
  title: string;
  description?: string;
  pointValue: number;
  assignedTo: string[];
  recurrence: 'daily' | 'weekly' | 'one-time';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChoreInstance {
  id: string;
  title: string;
  description?: string;
  pointValue: number;
  recurrence: 'daily' | 'weekly' | 'one-time';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChoreAssignment {
  id: string;
  choreInstanceId: string;
  userId: string;
  pointsEarned?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CompletedChore {
  id: string;
  choreInstanceId: string;
  userId: string;
  completedAt: Timestamp;
  pointsEarned: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Reward {
  id: string;
  title: string;
  description?: string;
  icon: string;
  pointCost: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RedeemedReward {
  id: string;
  rewardId: string;
  userId: string;
  redeemedAt: Timestamp;
  status: 'pending' | 'approved' | 'denied';
  updatedAt: Timestamp;
}