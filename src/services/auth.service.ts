import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { User, UserRole } from "@/types";
import { FIREBASE_COLLECTIONS, ADMIN_EMAILS } from "@/utils/constants";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

/**
 * Inicia sesión con Google
 */
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;

    // Verificar si el usuario ya existe en Firestore
    const userRef = doc(db, FIREBASE_COLLECTIONS.USERS, firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    let user: User;

    if (userSnap.exists()) {
      // Usuario existe, actualizar último login
      await setDoc(
        userRef,
        {
          lastLogin: serverTimestamp(),
        },
        { merge: true },
      );
      user = userSnap.data() as User;
    } else {
      // Nuevo usuario, crear documento
      const role: UserRole = ADMIN_EMAILS.includes(firebaseUser.email || "")
        ? "admin"
        : "customer";
      console.log("signInWithGoogle: ADMIN_EMAILS:", ADMIN_EMAILS);
      console.log("signInWithGoogle: user email:", firebaseUser.email);
      console.log("signInWithGoogle: assigned role:", role);

      user = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || "",
        photoURL: firebaseUser.photoURL || "",
        role,
        createdAt: serverTimestamp() as any,
        lastLogin: serverTimestamp() as any,
      };

      await setDoc(userRef, user);
    }

    return user;
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    throw error;
  }
};

/**
 * Cierra la sesión del usuario
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    throw error;
  }
};

/**
 * Obtiene los datos del usuario desde Firestore
 */
export const getUserData = async (uid: string): Promise<User | null> => {
  try {
    const userRef = doc(db, FIREBASE_COLLECTIONS.USERS, uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const user = userSnap.data() as User;
      console.log("getUserData: user data:", user);
      console.log("getUserData: user role:", user.role);
      return user;
    }

    return null;
  } catch (error) {
    console.error("getUserData: Error al obtener datos del usuario:", error);
    return null;
  }
};

/**
 * Escucha los cambios de autenticación
 */
export const onAuthChange = (
  callback: (user: FirebaseUser | null) => void,
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};
