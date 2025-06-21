import dotenv from "dotenv";
dotenv.config();
import { Client, Events, GatewayIntentBits, IntentsBitField } from "discord.js";
import chazzyNames from "./replies.js";
import Groq from "groq-sdk";

// New Client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on("ready", (c) => {
  console.log(`${c.user.username} is alive`);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) {
    return;
  }
  if (message.mentions.has(client.user)) {
    if (message.content.includes("hello")) {
      message.reply("Hey babes!");
    }
  }
});

client.on("messageCreate", (message) => {
  if (message.author.bot) {
    return;
  }
  if (message.content.toLowerCase().includes("chazzy")) {
    const randomReply =
      chazzyNames[Math.floor(Math.random() * chazzyNames.length)];
    message.reply(randomReply);
  }
});

client.login(process.env.TOKEN);

// Groq instance
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function main() {
  const chatCompletion = await getGroqChatCompletion();
  console.log(chatCompletion.choices[0]?.message?.content || "");
}

export async function getGroqChatCompletion() {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: "Explain the importance of fast language models",
      },
    ],
    model: "llama-3.3-70b-versatile",
  });
}
