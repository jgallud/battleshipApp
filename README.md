# battleshipApp
Aplicación desarrollada con IA (y alguna pequeña ayuda) del juego de la batalla naval con sockets

## Funcionalidad que incluye
Permite al usuario colocar los barcos donde quiera
Gestionar los turnos (cambia el turno tras disparar, con o sin impacto)
Controla el final de la partida

## Funcionalidad que no incluye
No gestiona múltiples partidas
Controlar el número de barcos que se puede usar
Mejoras visuales y sonoras
No tiene capa lógica en el servidor

# Instalación
Clona el repositorio
```
npm install
npm start
```
Para probar la app, abre dos navegadores con la url http://localhost:3000

# Así se hizo
Para obtener el esquema inicial utilicé GitHub Copilot (o1 preview) el siguiente prompt:
```
createWorkspace create a battleship app with nodejs and socketio in the server, and HTML javascript and CSS in the client
```
Posteriormente utilicé Cline desde VS Code para mejorar la solución.
Para utilizar Cline, instalé el complemento de VS Code y lo configuré para que utilizara Gemini.
Para usar Gemini hay que obtener un API Key de [Google AI Studio](https://aistudio.google.com/) 
