import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
const firebaseConfig = {
    apiKey: "AIzaSyCUigVLDfsEluMbfN0K9w2n4j4pxKFKQoc",
    authDomain: "inventory-management-app-3acac.firebaseapp.com",
    projectId: "inventory-management-app-3acac",
    storageBucket: "inventory-management-app-3acac.appspot.com",
    messagingSenderId: "821640435326",
    appId: "1:821640435326:web:0ac9e2689c543779ebea2f",
    measurementId: "G-DNQ9HY488Q"
 };
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);const storage = getStorage(app);

export { firestore, storage };