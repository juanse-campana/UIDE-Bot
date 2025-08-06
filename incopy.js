// index.js

// --- Importación de Módulos ---
const express = require('express');
const axios = require('axios'); // Para hacer llamadas a la API de Whapi
const dialogflow = require('@google-cloud/dialogflow');

// --- Configuración Inicial ---
const app = express();
app.use(express.json()); // Middleware para parsear el body de las peticiones como JSON

// --- Credenciales y Constantes ---

// Configura la ruta a tu archivo de credenciales de Google
// Node.js lo lee automáticamente si la variable de entorno está configurada
process.env.GOOGLE_APPLICATION_CREDENTIALS = "D:\USUARIO\Nueva carpeta\UNI\UIDE\5to\Inteligencia Artificial\proyecto\newagent-9jkr-160474f4fc90.json";

// Tu ID de Proyecto de Dialogflow
const DIALOGFLOW_PROJECT_ID = "newagent-9jkr";
const DIALOGFLOW_LANGUAGE_CODE = "es";

// Credenciales de Whapi.cloud
const WHAPI_TOKEN = "mt4w8vxzsIuNWh6HPXkbyJi8q1UUb6sd"
const WHAPI_API_URL = "https://gate.whapi.cloud/";

// --- Función para hablar con Dialogflow ---
async function detectIntentText(projectId, sessionId, text, languageCode) {
    const sessionClient = new dialogflow.SessionsClient();
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: text,
                languageCode: languageCode,
            },
        },
    };

    try {
        const responses = await sessionClient.detectIntent(request);
        console.log('Respuesta de Dialogflow detectada');
        const result = responses[0].queryResult;
        return result.fulfillmentText;
    } catch (error) {
        console.error("ERROR en Dialogflow:", error);
        return "Lo siento, tuve un problema para procesar tu solicitud. Inténtalo de nuevo.";
    }
}

// --- Función para enviar un mensaje usando Whapi ---
async function sendWhapiMessage(recipientNumber, messageText) {
    try {
        await axios.post(
            `${WHAPI_API_URL}/messages/text`,
            {
                to: recipientNumber,
                body: messageText,
            },
            {
                headers: {
                    'Authorization': `Bearer ${WHAPI_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log(`Mensaje enviado a ${recipientNumber}`);
    } catch (error) {
        console.error("Error al enviar mensaje vía Whapi:", error.response ? error.response.data : error.message);
    }
}


// --- Ruta que Whapi llamará (Webhook) ---
// ... (todo el código de arriba se queda igual) ...

// REEMPLAZA TU app.post ACTUAL POR ESTE:
app.post("/webhook", async (req, res) => {
    
    console.log("========================================");
    console.log("¡WEBHOOK RECIBIDO! LA CONEXIÓN FUNCIONA.");
    console.log("========================================");

    // Vamos a imprimir el cuerpo completo de la petición que nos envía Whapi
    console.log("CUERPO DE LA PETICIÓN (req.body):");
    console.log(JSON.stringify(req.body, null, 2));

    // Solo para esta prueba, vamos a intentar leer el mensaje y el remitente
    if (req.body.messages && req.body.messages[0] && req.body.messages[0].text) {
        const incomingMsg = req.body.messages[0].text.body;
        const senderNumber = req.body.messages[0].from;
        console.log(`MENSAJE DETECTADO: "${incomingMsg}"`);
        console.log(`REMITENTE: ${senderNumber}`);
    } else {
        console.log("No se pudo encontrar el texto del mensaje en la estructura esperada.");
    }

    // Respondemos OK para que Whapi no siga reintentando
    res.status(200).send({ status: "ok" });
});

// ... (el código de app.listen se queda igual) ...

// --- Iniciar el servidor ---
const PORT = process.env.PORT || 5000; // Usa el puerto 5000 por defecto
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});