import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    getDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD9WEPidE-WllfZnc1MY1lKwCU4qT5DqH4",
    authDomain: "skyline-75fec.firebaseapp.com",
    projectId: "skyline-75fec",
    storageBucket: "skyline-75fec.firebasestorage.app",
    messagingSenderId: "144628898410",
    appId: "1:144628898410:web:72fb07422a2feb96ac8813"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Expose APIs globally for app.js
window.firebaseAPI = {
    auth,
    db,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    signOut,
    collection,
    doc,
    addDoc,
    getDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
};
