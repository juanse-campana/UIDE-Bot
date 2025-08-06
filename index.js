// index.js (Versión Final Depurada)

const express = require('express');
const axios = require('axios');
const dialogflow = require('@google-cloud/dialogflow');

const app = express();
app.use(express.json());

// --- ⬇️ REVISA ESTOS 3 VALORES OTRA VEZ ⬇️ ---
process.env.GOOGLE_APPLICATION_CREDENTIALS = "dflow.json";
const DIALOGFLOW_PROJECT_ID = "newagent-9jkr";
const DIALOGFLOW_LANGUAGE_CODE = "es";

// Credenciales de Whapi.cloud
const WHAPI_TOKEN = "mt4w8vxzsIuNWh6HPXkbyJi8q1UUb6sd"
const WHAPI_API_URL = "https://gate.whapi.cloud/";

async function detectIntentText(projectId, sessionId, text, languageCode) {
    console.log(`[Dialogflow] Intentando detectar intención para el texto: "${text}"`);
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
        const result = responses[0].queryResult;
        console.log(`[Dialogflow] Intención detectada: ${result.intent.displayName}`);
        console.log(`[Dialogflow] Respuesta generada: "${result.fulfillmentText}"`);
        return result.fulfillmentText;
    } catch (error) {
        console.error("==================== ERROR EN DIALOGFLOW ====================");
        console.error(error);
        console.error("===========================================================");
        return "Lo siento, tuve un problema para conectar con el asistente de IA. Por favor, avisa a un administrador.";
    }
}

async function sendWhapiMessage(recipientNumber, messageText) {
    console.log(`[Whapi] Preparando para enviar mensaje a: ${recipientNumber}`);
    try {
        await axios.post(
            `${WHAPI_API_URL}/messages/text`,
            { to: recipientNumber, body: messageText },
            {
                headers: {
                    'Authorization': `Bearer ${WHAPI_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log(`[Whapi] Mensaje enviado exitosamente.`);
    } catch (error) {
        console.error("==================== ERROR EN WHAPI ====================");
        console.error(error.response ? error.response.data : error.message);
        console.error("========================================================");
    }
}

async function sendWhapiMessageWithButtons(recipientNumber, messageText, buttons) {
    console.log(`[Whapi] Preparando para enviar mensaje CON BOTONES a: ${recipientNumber}`);
    
    // ESTA ES LA ESTRUCTURA CORRECTA PARA CADA BOTÓN INDIVIDUAL
    // (Lo descubrimos en el último paso)
    const formattedButtons = buttons.map((btn, index) => ({
        type: "quick_reply",
        title: btn,
        id: `btn_${index}_${Date.now()}`,
        copy_code: "hola",
        phone_number: recipientNumber,
        url: "hola",
        merchant_url: "hola 2"
    }));

    console.log(formattedButtons)
    // -----------------------------------------------------------

    // ESTA ES LA ESTRUCTURA CORRECTA DEL PAYLOAD GENERAL
    // (La que nos dio el error del 'id', lo que significa que la aceptó)
    const payload = {
        to: recipientNumber,
        type: "button",
        body: {
            text: messageText
        },
        action: { // La API necesita esta propiedad 'action'
            buttons: formattedButtons
        }
    };
    // -----------------------------------------------------------

    try {
        // Apuntamos a la URL que SÍ existe: /messages/interactive
        await axios.post(`${WHAPI_API_URL}/messages/interactive`, payload, {
            headers: {
                'Authorization': `Bearer ${WHAPI_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`[Whapi] Mensaje con botones enviado exitosamente.`);
    } catch (error) {
        console.error("[ERROR WHAPI INTERACTIVE]", error.response ? error.response.data : error.message);
    }
}

// --- RUTA PRINCIPAL /webhook (INTELIGENTE) ---
app.post("/webhook", async (req, res) => {
    console.log("---------- INICIO DE PROCESAMIENTO ----------");
    const data = req.body;
    if (data.messages) {
        for (const message of data.messages) {
            if (message.type === "text" && !message.from_me) {
                const incomingMsg = message.text.body;
                const senderNumber = message.from;
                const sessionId = senderNumber;
                
                console.log(`[Webhook] Mensaje recibido de ${senderNumber}: "${incomingMsg}"`);
                
                // 1. Obtenemos la respuesta de Dialogflow
                const dialogflowResponse = await detectIntentText(DIALOGFLOW_PROJECT_ID, sessionId, incomingMsg, DIALOGFLOW_LANGUAGE_CODE);
                
                // 2. Comprobamos si es la señal para enviar botones
                if (dialogflowResponse === "ACTION_WELCOME_BUTTONS") {
                    const welcomeText = "¡Hola! Soy AVA, el Asistente Virtual de Admisiones de la UIDE Loja. 😊\n\n¿Sobre qué te gustaría saber primero?";
                    // WhatsApp permite un máximo de 3 botones de respuesta
                    const buttons = ["Proceso de Admisión", "Costos y Financiamiento", "Becas y Ayudas Financieras", "Oferta Académica", "Reputación y Futuro Profesional"]; 
                    await sendWhapiMessageWithButtons(senderNumber, welcomeText, buttons);
                }else if (dialogflowResponse === "ACCTION_ADMITIONS_BUTTONS") {
                    const welcomeText = "¡Hola! admisiones";
                    // WhatsApp permite un máximo de 3 botones de respuesta
                    const buttons = ["Admisión", "Financiamiento"]; 
                    await sendWhapiMessageWithButtons(senderNumber, welcomeText, buttons);
                }else if (dialogflowResponse === "ACTION_PRICING_BUTTONS") {
                    const welcomeText = "¡Hola! admisiones";
                    // WhatsApp permite un máximo de 3 botones de respuesta
                    const buttons = ["Precio", "Financiamiento"]; 
                    await sendWhapiMessageWithButtons(senderNumber, welcomeText, buttons);
                }else if (dialogflowResponse === "ACTION_BECAS_BUTTONS") {
                    const welcomeText = "¡Hola! admisiones";
                    // WhatsApp permite un máximo de 3 botones de respuesta
                    const buttons = ["Becas", "Financiamiento"]; 
                    await sendWhapiMessageWithButtons(senderNumber, welcomeText, buttons);
                }else if (dialogflowResponse === "ACTION_ACADEMICS_BUTTONS") {
                    const welcomeText = "¡Hola! admisiones";
                    // WhatsApp permite un máximo de 3 botones de respuesta
                    const buttons = ["Academicos", "Financiamiento"]; 
                    await sendWhapiMessageWithButtons(senderNumber, welcomeText, buttons);
                }else if (dialogflowResponse === "ACTION_FUTURE_BUTTONS") {
                    const welcomeText = "¡Hola! admisiones";
                    // WhatsApp permite un máximo de 3 botones de respuesta
                    const buttons = ["futuro", "Financiamiento"]; 
                    await sendWhapiMessageWithButtons(senderNumber, welcomeText, buttons);
                } else if (dialogflowResponse) {
                    // Si es cualquier otra respuesta, la enviamos como texto simple
                    await sendWhapiMessage(senderNumber, dialogflowResponse);
                }
            }
        }
    }
    console.log("---------- FIN DE PROCESAMIENTO ----------\n");
    res.status(200).send({ status: "ok" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});