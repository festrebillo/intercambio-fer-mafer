// Configuración de la app. Los datos de Firebase se pegan aquí (no son secretos:
// la seguridad real está en firestore.rules, que solo deja entrar a estos dos correos).

export const firebaseConfig = {
  apiKey: "AIzaSyDUR6OuB9HomyBaTzUA185VXhvUtRJ3alo",
  authDomain: "intercambio-7d421.firebaseapp.com",
  projectId: "intercambio-7d421",
  storageBucket: "intercambio-7d421.firebasestorage.app",
  messagingSenderId: "735275038810",
  appId: "1:735275038810:web:64a657bc1a3c029d8b8063",
};

// Los únicos correos con acceso. Deben coincidir con firestore.rules.
export const USERS = {
  "ferx.scry@gmail.com": { id: "fer", name: "Fer" },
  "fernandarosas251051@gmail.com": { id: "mafer", name: "Mafer" },
};

export const NAMES = { fer: "Fer", mafer: "Mafer" };
