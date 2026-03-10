// =============================================
// 🔥 Firebase 설정
// 아래 값들을 본인 Firebase 프로젝트 값으로 교체!
// Firebase Console > 프로젝트 설정 > 일반 > 내 앱
// =============================================

import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, doc, setDoc, getDoc, getDocs,
  deleteDoc, onSnapshot, query, orderBy, addDoc, updateDoc,
  serverTimestamp
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "여기에-API키",
  authDomain: "여기에-프로젝트ID.firebaseapp.com",
  projectId: "여기에-프로젝트ID",
  storageBucket: "여기에-프로젝트ID.firebasestorage.app",
  messagingSenderId: "여기에-숫자",
  appId: "여기에-앱ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
  db, collection, doc, setDoc, getDoc, getDocs,
  deleteDoc, onSnapshot, query, orderBy, addDoc, updateDoc,
  serverTimestamp
};
