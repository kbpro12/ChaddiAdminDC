import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

console.log("Clearing ALL global commands...");
await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
  body: [],
});
console.log("✅ Global commands cleared!");

console.log("Clearing ALL guild commands...");
await rest.put(
  Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
  { body: [] }
);
console.log("✅ Guild commands cleared!");

console.log("Done! Now run: node register-commands.js");
