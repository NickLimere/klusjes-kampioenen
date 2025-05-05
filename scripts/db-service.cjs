const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc,
  Timestamp 
} = require('firebase/firestore');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDmxLNsRiJ_1g6EfbHOjeaKxhXw9uqKHBo",
  authDomain: "klusjes-kampioenen.firebaseapp.com",
  projectId: "klusjes-kampioenen",
  storageBucket: "klusjes-kampioenen.appspot.com",
  messagingSenderId: "1012411805485",
  appId: "1:1012411805485:web:c5c0c7c7a3c8f0c0c0c0c0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections
const rewardsCollection = collection(db, 'rewards');

// Reward operations
const createReward = async (reward) => {
  const newReward = {
    ...reward,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  const docRef = await addDoc(rewardsCollection, newReward);
  return docRef.id;
};

module.exports = {
  createReward
}; 