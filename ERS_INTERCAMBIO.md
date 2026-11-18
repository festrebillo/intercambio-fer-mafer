# ERS — Intercambio Fer y Mafer (documento vivo)

## Objetivo
App web privada para dos personas (Fer y Mafer) para el intercambio de regalos de Navidad.

## Stack
HTML/CSS/JS sin build, GitHub Pages (repo `festrebillo/intercambio-fer-mafer`), Firebase Auth (Google) + Firestore.

## Requisitos
- RF1 Login con Google restringido a 2 correos (hardcodeados en `js/config.js` y `firestore.rules`).
- RF2 Lista de deseos por persona con link, precio, prioridad; sección “No me regales”.
- RF3 “Ya lo compré” secreto (colección `purchases`, solo la lee el comprador) + presupuesto compartido, gasto privado.
- RF4 Restaurantes/planes con estrellas por persona, estados, botón “Sorprendernos”.
- RF5 Cuenta regresiva a una fecha editable por ambos.
- RF6 Cartas secretas que se abren en fecha elegida (regla de Firestore con `unlockAt <= request.time`).
- RF7 Adivina el regalo (3 pistas), playlist, retos de preguntas.
- RF8 Propuestas: calendario de adviento y galería/línea de tiempo; se activan si ambos votan sí (voto del otro oculto).

## Pendiente
- Construir adviento y galería si ambos aprueban (la galería necesita almacenamiento de fotos: Firebase Storage exige plan Blaze; evaluar alternativa).

## Historial
- v0.1.0 (2026-11-18): primera versión completa de RF1–RF8 (propuestas solo votación).
- v0.2.0 (2026-11-18): sin presupuesto ni precio; Propuestas con invitaciones Aventuras (match de planes) y Juegos (esto o aquello, quiz, cápsula, cupones, bingo).
