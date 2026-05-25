// storage.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAWAq2AxbvgVZD5lx5H4NbwxyFD2hMgy5E",
  authDomain: "expensemanager-53118.firebaseapp.com",
  projectId: "expensemanager-53118",
  storageBucket: "expensemanager-53118.firebasestorage.app",
  messagingSenderId: "1014753886592",
  appId: "1:1014753886592:web:b10545fe1f482b77548165",
  measurementId: "G-QT7KWHNKMW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

const USERS_KEY = 'expenseTracker:users';
const SESSION_KEY = 'expenseTracker:session';
const CURRENT_VERSION = 1;

export function getDefaultData() {
    return {
        version: CURRENT_VERSION,
        settings: {
            currency: '₹'
        },
        budget: 0,
        transactions: [] 
    };
}

export function getCurrentUser() {
    return sessionStorage.getItem(SESSION_KEY);
}

export async function login(username, password) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        sessionStorage.setItem(SESSION_KEY, username);
        return true;
    }
    return false;
}

export async function register(username, password) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find(u => u.username === username)) {
        return false;
    }
    users.push({ username, password });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    sessionStorage.setItem(SESSION_KEY, username);
    
    // Initialize user doc in Firestore
    await saveData(getDefaultData());
    return true;
}

export function logout() {
    sessionStorage.removeItem(SESSION_KEY);
}

export async function loadData() {
    try {
        const username = getCurrentUser();
        if (!username) return getDefaultData();

        const docRef = doc(db, "users", username);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return getDefaultData();
        }
    } catch (e) {
        console.error("Failed to load Firebase data. Returning default.", e);
        return getDefaultData();
    }
}

export async function saveData(data) {
    try {
        const username = getCurrentUser();
        if (!username) return;

        const docRef = doc(db, "users", username);
        await setDoc(docRef, data);
    } catch (e) {
        console.error("Failed to save data to Firebase.", e);
    }
}

export async function addTransaction(transaction) {
    const username = getCurrentUser();
    if (!username) return;

    const data = await loadData();
    data.transactions.push(transaction);
    await saveData(data);
    return transaction;
}

export async function updateTransaction(transaction) {
    const username = getCurrentUser();
    if (!username) return;

    const data = await loadData();
    const index = data.transactions.findIndex(t => t.id === transaction.id);
    if (index > -1) {
        data.transactions[index] = transaction;
        await saveData(data);
    }
    return transaction;
}

export async function deleteTransaction(id) {
    const username = getCurrentUser();
    if (!username) return;

    const data = await loadData();
    data.transactions = data.transactions.filter(t => t.id !== id);
    await saveData(data);
}

export async function importData(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        await saveData(parsed);
        return true;
    } catch (e) {
        console.error("Import failed:", e);
        return false;
    }
}

export async function resetData() {
    await saveData(getDefaultData());
}
