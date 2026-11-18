# 🎁 Intercambio Fer y Mafer

App navideña privada para dos personas. Web estática (GitHub Pages) + Firebase (login con Google y base de datos).

## Configuración de Firebase (una sola vez)

1. En https://console.firebase.google.com crea un proyecto (sin Analytics).
2. **Authentication → Comenzar → Google** → habilitar, con tu correo de soporte.
3. **Authentication → Configuración → Dominios autorizados** → agregar `festrebillo.github.io`.
4. **Firestore Database → Crear base de datos** (modo producción, región cercana).
5. **Firestore → Reglas** → pegar el contenido de `firestore.rules` → Publicar.
6. **Configuración del proyecto → Tus apps → Web (`</>`)** → registrar app y copiar el objeto `firebaseConfig` a `js/config.js`.

## Seguridad

- Solo los dos correos de `js/config.js` y `firestore.rules` pueden leer o escribir datos.
- La config de Firebase en el código es pública por diseño; lo que protege los datos son las reglas.
- “Ya lo compré” y las cartas sin abrir se protegen en las reglas, no solo en la pantalla.

## Secciones

Inicio (cuenta regresiva, presupuesto) · Regalos · Restaurantes y planes · Cartas secretas · Adivina el regalo · Playlist · Retos · Propuestas (adviento y galería, activas si ambos votan sí).
