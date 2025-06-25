import dotenv from "dotenv";
dotenv.config();
import { Client, Events, GatewayIntentBits } from "discord.js";
import {
  persona,
  chazzyNames,
  goodnight,
  graded,
  greetings,
  michelle,
} from "./parameters.js";
import Groq from "groq-sdk";

// New Client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on("ready", (c) => {
  console.log(`${c.user.username} is alive`);
});

// Helper function for random replies
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Chazzy greetings
client.on("messageCreate", (message) => {
  if (message.author.bot) {
    return;
  }
  if (message.mentions.has(client.user)) {
    if (message.content.includes("hello") || message.content.includes("hi")) {
      const randomGreeting = getRandomItem(greetings);
      message.reply(randomGreeting);
    }
  }
});

// Chazzy mentions
client.on("messageCreate", (message) => {
  if (message.author.bot) {
    return;
  }
  if (message.content.toLowerCase().includes("chazzy")) {
    const randomReply = getRandomItem(chazzyNames);
    message.reply(randomReply);
  }
  if (message.content.toLowerCase().includes("graded")) {
    const gradedReply = getRandomItem(graded);
    message.reply(gradedReply);
  }
  if (message.content.toLowerCase().includes("michelle")) {
    const michelleReply = getRandomItem(michelle);
    message.reply(michelleReply);
  }
  if (message.mentions.has(client.user)) {
    if (
      message.content.includes("go to bed") ||
      message.content.includes("goodnight") ||
      message.content.includes("bye")
    ) {
      const randomGoodnight = getRandomItem(goodnight);
      message.reply(randomGoodnight);
    }
  }
});

client.login(process.env.TOKEN);

// Groq instance
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function main() {
  const chatCompletion = await getGroqChatCompletion();
  console.log(chatCompletion.choices[0]?.message?.content || "");
}

export async function summarizeMessages(messages) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: persona,
      },
      {
        role: "user",
        content:
          "Please privde a detailed summary of this Discord conversation",
      },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 1024,
  });
}

// Slash commands

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply({
      content: "Secret Pong!",
      flags: MessageFlags.Ephemeral,
    });
  }
});
