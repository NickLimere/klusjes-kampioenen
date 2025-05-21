import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import type { 
  User, 
  ChoreAssignment, 
  ChoreInstance,
  CompletedChore, 
  Reward, 
  RedeemedReward 
} from './db-types';

// Collections
const usersCollection = collection(db, 'users');
const choreInstancesCollection = collection(db, 'choreInstances');
const choreAssignmentsCollection = collection(db, 'choreAssignments');
const completedChoresCollection = collection(db, 'completedChores');
const rewardsCollection = collection(db, 'rewards');
const redeemedRewardsCollection = collection(db, 'redeemedRewards');

// User operations
export const getUser = async (id: string): Promise<User | null> => {
  const docRef = doc(usersCollection, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() as User : null;
};

export const getUsers = async (): Promise<User[]> => {
  const querySnapshot = await getDocs(usersCollection);
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as User));
};

export const createUser = async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const newUser = {
    ...user,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  const docRef = await addDoc(usersCollection, newUser);
  return docRef.id;
};

export const updateUser = async (id: string, user: Partial<User>): Promise<void> => {
  const docRef = doc(usersCollection, id);
  await updateDoc(docRef, {
    ...user,
    updatedAt: Timestamp.now()
  });
};

export const createUsers = async (users: Omit<User, 'id'>[]): Promise<User[]> => {
  const createdUsers: User[] = [];
  
  for (const user of users) {
    const docRef = await addDoc(usersCollection, {
      ...user,
      createdAt: new Date()
    });
    createdUsers.push({
      ...user,
      id: docRef.id
    });
  }
  
  return createdUsers;
};

// Chore Instance operations
export const getChoreInstance = async (id: string): Promise<ChoreInstance | null> => {
  const docRef = doc(choreInstancesCollection, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() as ChoreInstance : null;
};

export const getChoreInstances = async (): Promise<ChoreInstance[]> => {
  const querySnapshot = await getDocs(choreInstancesCollection);
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as ChoreInstance));
};

export const createChoreInstance = async (instance: Omit<ChoreInstance, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const newInstance = {
    ...instance,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  const docRef = await addDoc(choreInstancesCollection, newInstance);
  return docRef.id;
};

export const updateChoreInstance = async (id: string, instance: Partial<ChoreInstance>): Promise<void> => {
  const docRef = doc(choreInstancesCollection, id);
  await updateDoc(docRef, {
    ...instance,
    updatedAt: Timestamp.now()
  });
};

export const deleteChoreInstance = async (instanceId: string): Promise<void> => {
  // First, delete all assignments related to this chore instance
  const assignmentsQuery = query(choreAssignmentsCollection, where('choreInstanceId', '==', instanceId));
  const assignmentsSnapshot = await getDocs(assignmentsQuery);
  const deletePromises: Promise<void>[] = [];
  assignmentsSnapshot.forEach((assignmentDoc) => {
    deletePromises.push(deleteDoc(doc(choreAssignmentsCollection, assignmentDoc.id)));
  });
  await Promise.all(deletePromises);

  // Then, delete the chore instance itself
  const instanceDocRef = doc(choreInstancesCollection, instanceId);
  await deleteDoc(instanceDocRef);
};

// Chore Assignment operations
export const assignChoreInstance = async (
  choreInstanceId: string,
  userId: string,
  pointsEarned?: number
): Promise<string> => {
  const newAssignment = {
    choreInstanceId,
    userId,

    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    pointsEarned: pointsEarned || 0
  };
  const docRef = await addDoc(choreAssignmentsCollection, newAssignment);
  return docRef.id;
};

export const getUserChoreAssignments = async (userId: string): Promise<(ChoreAssignment & { choreInstance: ChoreInstance | null })[]> => {
  const assignmentsQuery = query(choreAssignmentsCollection, where('userId', '==', userId));
  const assignmentsSnapshot = await getDocs(assignmentsQuery);

  // Helper to fetch a chore instance by ID
  async function getChoreInstance(instanceId: string): Promise<ChoreInstance | null> {
    const docRef = doc(choreInstancesCollection, instanceId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } as ChoreInstance : null;
  }

  const results: (ChoreAssignment & { choreInstance: ChoreInstance | null })[] = [];
  for (const docSnap of assignmentsSnapshot.docs) {
    const assignment = docSnap.data() as ChoreAssignment;
    const choreInstance = assignment.choreInstanceId ? await getChoreInstance(assignment.choreInstanceId) : null;
    results.push({ ...assignment, id: docSnap.id, choreInstance });
  }
  return results;
};

// ADMIN: Fetch all assignments for all users, including their related chore instances
export const getAllChoreAssignments = async (): Promise<(ChoreAssignment & { choreInstance: ChoreInstance | null })[]> => {
  const assignmentsSnapshot = await getDocs(choreAssignmentsCollection);

  async function getChoreInstance(instanceId: string): Promise<ChoreInstance | null> {
    const docRef = doc(choreInstancesCollection, instanceId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } as ChoreInstance : null;
  }

  const results: (ChoreAssignment & { choreInstance: ChoreInstance | null })[] = [];
  for (const docSnap of assignmentsSnapshot.docs) {
    const assignment = docSnap.data() as ChoreAssignment;
    const choreInstance = assignment.choreInstanceId ? await getChoreInstance(assignment.choreInstanceId) : null;
    results.push({ ...assignment, id: docSnap.id, choreInstance });
  }
  return results;
};

export const completeAssignment = async (assignmentId: string, pointsEarned?: number): Promise<void> => {
  // No longer update assignment; all completions tracked in completedChores
  return;
};

// Completed Chore operations
export const completeChore = async (completion: Omit<CompletedChore, 'id'>): Promise<string> => {
  const newCompletion = {
    ...completion,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  const docRef = await addDoc(completedChoresCollection, newCompletion);
  return docRef.id;
};

export const deleteCompletedChore = async (id: string): Promise<void> => {
  const docRef = doc(completedChoresCollection, id);
  await deleteDoc(docRef);
};

export const getUserCompletedChores = async (userId: string): Promise<CompletedChore[]> => {
  const querySnapshot = await getDocs(query(completedChoresCollection, where('userId', '==', userId)));
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as CompletedChore));
};

export const getChoreCompletionHistory = async (
  choreInstanceId: string,
  startDate?: Date,
  endDate?: Date
): Promise<CompletedChore[]> => {
  let q = query(completedChoresCollection, where('choreInstanceId', '==', choreInstanceId));
  
  if (startDate && endDate) {
    q = query(q, 
      where('completedAt', '>=', Timestamp.fromDate(startDate)),
      where('completedAt', '<=', Timestamp.fromDate(endDate))
    );
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as CompletedChore));
};

export const getUserCompletionStreak = async (userId: string): Promise<number> => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const querySnapshot = await getDocs(query(
    completedChoresCollection,
    where('userId', '==', userId),
    where('completedAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
  ));
  
  const completions = querySnapshot.docs.map(doc => doc.data() as CompletedChore);
  return calculateStreak(completions);
};

const calculateStreak = (completions: CompletedChore[]): number => {
  if (completions.length === 0) return 0;
  
  const dates = completions
    .map(c => c.completedAt.toDate())
    .sort((a, b) => b.getTime() - a.getTime());
  
  let streak = 1;
  let currentDate = new Date(dates[0]);
  currentDate.setHours(0, 0, 0, 0);
  
  for (let i = 1; i < dates.length; i++) {
    const nextDate = new Date(dates[i]);
    nextDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor(
      (currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (diffDays === 1) {
      streak++;
      currentDate = nextDate;
    } else if (diffDays > 1) {
      break;
    }
  }
  
  return streak;
};

// Reward operations
export const getReward = async (id: string): Promise<Reward | null> => {
  const docRef = doc(rewardsCollection, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() as Reward : null;
};

export const getRewards = async (): Promise<Reward[]> => {
  const querySnapshot = await getDocs(rewardsCollection);
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as Reward));
};

export const createReward = async (reward: Omit<Reward, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const newReward = {
    ...reward,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  const docRef = await addDoc(rewardsCollection, newReward);
  return docRef.id;
};

export const updateReward = async (id: string, reward: Partial<Reward>): Promise<void> => {
  const docRef = doc(rewardsCollection, id);
  await updateDoc(docRef, {
    ...reward,
    updatedAt: Timestamp.now()
  });
};

export const deleteReward = async (id: string): Promise<void> => {
  const docRef = doc(rewardsCollection, id);
  await deleteDoc(docRef);
};

// Redeemed Reward operations
export const redeemReward = async (redemption: Omit<RedeemedReward, 'id' | 'updatedAt'>): Promise<string> => {
  const newRedemption = {
    ...redemption,
    updatedAt: Timestamp.now()
  };
  const docRef = await addDoc(redeemedRewardsCollection, newRedemption);
  return docRef.id;
};

export const updateRedeemStatus = async (id: string, status: 'approved' | 'denied'): Promise<void> => {
  const docRef = doc(redeemedRewardsCollection, id);
  await updateDoc(docRef, {
    status,
    updatedAt: Timestamp.now()
  });
};

export const getUserRedeemedRewards = async (userId: string): Promise<RedeemedReward[]> => {
  const querySnapshot = await getDocs(query(redeemedRewardsCollection, where('userId', '==', userId)));
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as RedeemedReward));
};

export const getAllRedeemedRewards = async (): Promise<RedeemedReward[]> => {
  const querySnapshot = await getDocs(redeemedRewardsCollection);
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as RedeemedReward));
};