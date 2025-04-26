require('dotenv').config(); // Carga las variables de entorno desde .env
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai"); // Importar elementos de seguridad

// --- Configuración ---
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MESSAGE_THRESHOLD = 5; // Número de mensajes antes de que el bot responda
const MAX_HISTORY = 30; // Máximo de mensajes a enviar a Gemini como contexto
const BOT_NAME_LOWER = process.env.BOT_NAME.toLowerCase(); // Nombre del bot en minúsculas para comparación
// ---------------------

if (!DISCORD_TOKEN || !GEMINI_API_KEY || !BOT_NAME_LOWER) {
    console.error("Error: Asegúrate de configurar DISCORD_TOKEN, GEMINI_API_KEY y BOT_NAME en el archivo .env");
    process.exit(1);
}

// --- Inicializar Clientes ---
// Cliente de Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Necesario para leer el contenido de los mensajes
    ],
    partials: [Partials.Channel, Partials.Message],
});

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
});

// --- Almacenamiento de Contadores ---
const messageCounters = new Map(); // channelId -> count

// --- Función para generar y enviar respuesta de Gemini ---
async function generateAndSendGeminiResponse(message, isDirectInteraction = false) {
    const channelId = message.channel.id;
    try {
        await message.channel.sendTyping();

        const history = await message.channel.messages.fetch({ limit: MAX_HISTORY });
        const formattedHistory = history.reverse()
            .filter(msg => msg.content)
            .map(msg => `${msg.author.username}: ${msg.content}`)
            .join('\n');

        let prompt;
        const botUsername = client.user.username; // Obtener el nombre de usuario actual del bot

        if (isDirectInteraction) {
            // Prompt específico si es una mención directa o se le habla
            prompt = `Estás participando en esta conversación de chat.
            Eres regio de Monterrey, Nuevo León, México.
            Te han mencionado directamente o el último mensaje parece dirigido a ti (${botUsername}).
            Aquí está el historial reciente:\n\n${formattedHistory}\n\n
            No uses emojis, pero puedes usar palabras como "gg", "LOL", "LMAO", "xd", "F" pero no abuses de estas palabras.
            Actúa como un usuario nerd de reddit o 4chan.
            Cuando te hagan una pregunta, responde de forma natural y relevante a la conversación, si es posible busca en la web para dar una respuesta seria.
            No hagas la respuesta demasiado larga cuando sea una conversación casual, pero tampoco demasiado corta cuando sea una pregunta interesante.
            No tienes que responder a todas las personas del historial de mensajes, solo a la última persona que te mencionó en el último mensaje.
            No uses el nombre de usuario de la persona que te mencionó, solo responde como si fueras un usuario normal.
            `;
        } else {
            // Prompt general para respuestas periódicas
            prompt = `Eres un participante más en esta conversación de chat (${botUsername}). Aquí están los últimos mensajes:\n\n${formattedHistory}\n\nAhora es tu turno de decir algo relevante y natural a la conversación, continuando el flujo. No excedas 40 palabras en la respuesta. Tu nombre de usuario es ${botUsername}. `;
        }

        const result = await model.generateContent(prompt);
        // Manejo de posible bloqueo por seguridad
        if (!result.response) {
             console.log(`Respuesta bloqueada por seguridad o no generada para ${message.channel.name}. Razón: ${result.promptFeedback?.blockReason || 'Desconocida'}`);
             return; // Salir si no hay respuesta
        }
        const response = await result.response;
        const text = response.text();


        if (text) {
            await message.channel.send(text);
            console.log(`Respuesta (${isDirectInteraction ? 'directa' : 'periódica'}) enviada a ${message.channel.name}.`);
        } else {
            console.log(`Gemini no generó texto para ${message.channel.name}.`);
        }

    } catch (error) {
        console.error(`Error al procesar mensaje o llamar a Gemini para el canal ${channelId}:`, error);
    }
}


// --- Eventos del Bot ---
client.once('ready', () => {
    console.log(`¡Bot conectado como ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return; // Ignorar mensajes de bots

    const channelId = message.channel.id;
    const botUserId = client.user.id;
    const messageContentLower = message.content.toLowerCase();

    // --- Comprobar si el bot fue mencionado o si se le habla directamente ---
    const isMentioned = message.mentions.has(botUserId);
    // Comprueba si el mensaje INCLUYE el nombre del bot (menos preciso que la mención)
    const includesName = messageContentLower.includes(BOT_NAME_LOWER);

    // Decidimos si es una interacción directa
    const isDirectInteraction = isMentioned || includesName; // Puedes hacer esta lógica más compleja si necesitas

    if (isDirectInteraction) {
        console.log(`Respondiendo por mención/nombre en ${message.channel.name}.`);
        messageCounters.set(channelId, 0); // Reiniciar contador al responder directamente
        await generateAndSendGeminiResponse(message, true); // Llama a la función indicando que es directa
        return; // Importante: Salir para no procesar como mensaje normal y contar doble
    }

    // --- Lógica original de contador si no hubo interacción directa ---
    const currentCount = (messageCounters.get(channelId) || 0) + 1;
    messageCounters.set(channelId, currentCount);
    console.log(`Mensaje normal en ${message.channel.name} (${channelId}). Contador: ${currentCount}`);

    if (currentCount >= MESSAGE_THRESHOLD) {
        console.log(`Umbral alcanzado en ${message.channel.name}. Generando respuesta periódica...`);
        messageCounters.set(channelId, 0); // Reiniciar contador
        await generateAndSendGeminiResponse(message, false); // Llama a la función indicando que NO es directa
    }
});

// --- Iniciar sesión en Discord ---
client.login(DISCORD_TOKEN);

console.log("Iniciando el bot...");