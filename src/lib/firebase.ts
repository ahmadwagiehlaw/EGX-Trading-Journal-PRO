import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBq3TFTwg1tfimFOmsaABQIpjo_LwoHzmQ",
  authDomain: "traingjournal.firebaseapp.com",
  projectId: "traingjournal",
  storageBucket: "traingjournal.firebasestorage.app",
  messagingSenderId: "247894779932",
  appId: "1:247894779932:web:db95865ba0c43825bbd7d9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
