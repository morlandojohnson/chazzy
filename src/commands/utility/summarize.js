import { SlashCommandBuilder } from "discord.js";
import Groq from "groq-sdk";
import { persona } from "../../parameters.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Summarize messages using Groq
async function summarizeMessages(messages) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: persona,
      },
      {
        role: "user",
        content: `Please provide a detailed summary of this Discord conversation:\n\n${messages}`,
      },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 1024,
  });
}

export default {
  data: new SlashCommandBuilder()
    .setName("summarize")
    .setDescription("Summarize recent messages in this channel"),
  async execute(interaction) {
    await interaction.deferReply();

    // fetch the last 100 messages in the channel
    const messages = await interaction.channel.messages.fetch({ limit: 100 });

    // Sort messages by time and format by user and message & filter out bot messages
    const formattedMessages = messages
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
      .filter((message) => !message.author.bot)
      .map((message) => `${message.author.username}: ${message.content}`)
      .join("\n");

    // Summarize the messages using the function from groq.js
    const summary = await summarizeMessages(formattedMessages);
    const summaryText =
      summary.choices[0]?.message?.content || "No summary available.";

    // Split into chunks(discord max message length is 2000 characters)
    const chunks = [];
    for (let i = 0; i < summaryText.length; i += 1900) {
      chunks.push(summaryText.slice(i, i + 1900));
    }
    if (chunks.length === 0) {
      chunks = ["No summary available."];
    }

    try {
      // Send first chunk as reply
      await interaction.editReply(chunks[0]);

      // Send remaining chunks as follow-ups
      for (let i = 1; i < chunks.length; i++) {
        await interaction.followUp(chunks[i]);
      }
    } catch (error) {
      console.error("Error sending summary chunks:", error);
      await interaction.editReply("Error sending summary chunks.");
    }
  },
};
