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
  Chore, 
  ChoreAssignment, 
  CompletedChore, 
  Reward, 
  RedeemedReward 
} from './db-types';

// Collections
const usersCollection = collection(db, 'users');
const choresCollection = collection(db, 'chores');
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

// Chore operations
export const getChore = async (id: string): Promise<Chore | null> => {
  const docRef = doc(choresCollection, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() as Chore : null;
};

export const getChores = async (): Promise<Chore[]> => {
  console.log('Fetching chores from Firestore...');
  const querySnapshot = await getDocs(choresCollection);
  const chores = querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as Chore));
  console.log(`Found ${chores.length} chores:`, chores);
  return chores;
};

export const createChore = async (chore: Omit<Chore, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const newChore = {
    ...chore,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  const docRef = await addDoc(choresCollection, newChore);
  return docRef.id;
};

export const updateChore = async (id: string, chore: Partial<Chore>): Promise<void> => {
  const docRef = doc(choresCollection, id);
  await updateDoc(docRef, {
    ...chore,
    updatedAt: Timestamp.now()
  });
};

export const deleteChore = async (id: string): Promise<void> => {
  const docRef = doc(choresCollection, id);
  await deleteDoc(docRef);
};

// Chore Assignment operations
export const assignChore = async (assignment: Omit<ChoreAssignment, 'id' | 'createdAt'>): Promise<string> => {
  const newAssignment = {
    ...assignment,
    createdAt: Timestamp.now()
  };
  const docRef = await addDoc(choreAssignmentsCollection, newAssignment);
  return docRef.id;
};

export const getUserChores = async (userId: string): Promise<Chore[]> => {
  const assignmentsQuery = query(choreAssignmentsCollection, where('userId', '==', userId));
  const assignmentsSnapshot = await getDocs(assignmentsQuery);
  const choreIds = assignmentsSnapshot.docs.map(doc => doc.data().choreId);
  
  const chores: Chore[] = [];
  for (const choreId of choreIds) {
    const chore = await getChore(choreId);
    if (chore) chores.push(chore);
  }
  return chores;
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
  choreId: string,
  startDate?: Date,
  endDate?: Date
): Promise<CompletedChore[]> => {
  let q = query(completedChoresCollection, where('choreId', '==', choreId));
  
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