// Command files
import fs from "node:fs";
import path from "node:path";
// Environment variables
import dotenv from "dotenv";
dotenv.config();
import { fileURLToPath } from "node:url";

import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
  REST,
  Routes,
} from "discord.js";

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

client.commands = new Collection();

// Retrieve command files

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
// Grab all the command files from the commands directory
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  // Grab all the command files from the command directory
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  // Grab the SlashCommandBuilder#toJSON() output for each command's data for deployment.
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const commandModule = await import(`file://${filePath}`);
    const command = commandModule.default; // Access the default export

    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

// Rest Module for deploying commands
const rest = new REST().setToken(process.env.TOKEN);

// Deploy commands to Discord
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    // Put method used to fully refresh all commands in the guild with the current set of commands
    const data = await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
})();

// Slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
  console.log(interaction);
});

// Client ready
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
