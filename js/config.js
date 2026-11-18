// Configuración de la app. Los datos de Firebase se pegan aquí (no son secretos:
// la seguridad real está en firestore.rules, que solo deja entrar a estos dos correos).

export const firebaseConfig = {
  apiKey: "PEGAR_AQUI",
  authDomain: "PEGAR_AQUI",
  projectId: "PEGAR_AQUI",
  storageBucket: "PEGAR_AQUI",
  messagingSenderId: "PEGAR_AQUI",
  appId: "PEGAR_AQUI",
};

// Los únicos correos con acceso. Deben coincidir con firestore.rules.
export const USERS = {
  "ferx.scry@gmail.com": { id: "fer", name: "Fer" },
  "fernandarosas251051@gmail.com": { id: "mafer", name: "Mafer" },
};

export const NAMES = { fer: "Fer", mafer: "Mafer" };
