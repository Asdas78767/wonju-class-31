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
  apiKey: "AIzaSyClSG6pXyQQ2-ZtPlaX9Ls459AO5x0g1uA",
  authDomain: "wonjugo-19c4f.firebaseapp.com",
  projectId: "wonjugo-19c4f",
  storageBucket: "wonjugo-19c4f.firebasestorage.app",
  messagingSenderId: "291258015031",
  appId: "1:291258015031:web:cf9726f9bc86c34be2ceb2",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
  db, collection, doc, setDoc, getDoc, getDocs,
  deleteDoc, onSnapshot, query, orderBy, addDoc, updateDoc,
  serverTimestamp
};
