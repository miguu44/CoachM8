import {initializeApp} from 'firebase/app'
import {initializeFirestore,persistentLocalCache,persistentMultipleTabManager} from 'firebase/firestore'
import {getAuth} from 'firebase/auth'
const e=import.meta.env
const app=initializeApp({apiKey:e.VITE_FB_API_KEY,authDomain:e.VITE_FB_AUTH_DOMAIN,projectId:e.VITE_FB_PROJECT_ID,appId:e.VITE_FB_APP_ID})
export const db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})})
export const auth=getAuth(app)
