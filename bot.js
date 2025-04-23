require('dotenv').config(); // Carga las variables de entorno desde .env
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- Configuración ---
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MESSAGE_THRESHOLD = 5; // Número de mensajes antes de que el bot responda
const MAX_HISTORY = 10; // Máximo de mensajes a enviar a Gemini como contexto
// ---------------------

if (!DISCORD_TOKEN || !GEMINI_API_KEY) {
    console.error("Error: Asegúrate de configurar DISCORD_TOKEN y GEMINI_API_KEY en el archivo .env");
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

// Cliente de Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // O el modelo que prefieras

// --- Almacenamiento de Contadores ---
// Guarda cuántos mensajes se han enviado en cada canal desde la última respuesta del bot
const messageCounters = new Map(); // Usamos un Map: channelId -> count

// --- Eventos del Bot ---
client.once('ready', () => {
    console.log(`¡Bot conectado como ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    // Ignorar mensajes del propio bot o de otros bots
    if (message.author.bot) return;

    const channelId = message.channel.id;

    // Incrementar el contador para este canal
    const currentCount = (messageCounters.get(channelId) || 0) + 1;
    messageCounters.set(channelId, currentCount);

    console.log(`Mensaje en ${message.channel.name} (${channelId}). Contador: ${currentCount}`); // Log para depuración

    // Comprobar si se alcanzó el umbral
    if (currentCount >= MESSAGE_THRESHOLD) {
        console.log(`Umbral alcanzado en ${message.channel.name}. Generando respuesta...`);
        messageCounters.set(channelId, 0); // Reiniciar contador

        try {
            // Indicar que el bot está "escribiendo"
            await message.channel.sendTyping();

            // Obtener historial reciente del canal
            const history = await message.channel.messages.fetch({ limit: MAX_HISTORY });
            // Filtrar mensajes vacíos y formatear para Gemini (más reciente primero por defecto)
            const formattedHistory = history.reverse() // Poner el más antiguo primero
                .filter(msg => msg.content) // Asegurarse que hay contenido
                .map(msg => `${msg.author.username}: ${msg.content}`)
                .join('\n');

            // Crear el prompt para Gemini
            const prompt = `Eres un participante más en esta conversación de chat. Aquí están los últimos mensajes:\n\n${formattedHistory}\n\nAhora es tu turno de decir algo relevante y natural a la conversación. Tu nombre de usuario es ${client.user.username}. Tu respuesta:`;

            // Llamar a la API de Gemini
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            if (text) {
                // Enviar la respuesta de Gemini a Discord
                await message.channel.send(text);
                console.log(`Respuesta enviada a ${message.channel.name}.`);
            } else {
                 console.log(`Gemini no generó texto para ${message.channel.name}.`);
            }

        } catch (error) {
            console.error(`Error al procesar mensaje o llamar a Gemini para el canal ${channelId}:`, error);
            // Opcional: Enviar un mensaje de error al canal
            // await message.channel.send("Lo siento, tuve un problema al intentar responder.");
        }
    }
});

// --- Iniciar sesión en Discord ---
client.login(DISCORD_TOKEN);

console.log("Iniciando el bot...");