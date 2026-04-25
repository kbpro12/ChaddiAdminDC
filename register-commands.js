import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const commands = [
  new SlashCommandBuilder()
    .setName("op")
    .setDescription("Give operator privileges to a Minecraft player")
    .addStringOption((opt) =>
      opt.setName("player").setDescription("Player name").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("deop")
    .setDescription("Remove operator privileges from a Minecraft player")
    .addStringOption((opt) =>
      opt.setName("player").setDescription("Player name").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("kill")
    .setDescription("Kill a Minecraft player")
    .addStringOption((opt) =>
      opt.setName("player").setDescription("Player name").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("whitelist")
    .setDescription("Manage the Minecraft server whitelist")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a player to the whitelist")
        .addStringOption((opt) =>
          opt.setName("player").setDescription("Player name").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a player from the whitelist")
        .addStringOption((opt) =>
          opt.setName("player").setDescription("Player name").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("Show all whitelisted players")
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a player from the Minecraft server")
    .addStringOption((opt) =>
      opt.setName("player").setDescription("Player name").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Ban reason").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Pardon/unban a player")
    .addStringOption((opt) =>
      opt.setName("player").setDescription("Player name").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a player from the Minecraft server")
    .addStringOption((opt) =>
      opt.setName("player").setDescription("Player name").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Kick reason").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("gamemode")
    .setDescription("Change a player's gamemode")
    .addStringOption((opt) =>
      opt
        .setName("mode")
        .setDescription("Gamemode")
        .setRequired(true)
        .addChoices(
          { name: "Survival", value: "survival" },
          { name: "Creative", value: "creative" },
          { name: "Adventure", value: "adventure" },
          { name: "Spectator", value: "spectator" }
        )
    )
    .addStringOption((opt) =>
      opt.setName("player").setDescription("Player name").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("give")
    .setDescription("Give items to a player")
    .addStringOption((opt) =>
      opt.setName("player").setDescription("Player name").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("item")
        .setDescription("Item ID (e.g. diamond_sword)")
        .setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("Amount (default: 1)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(64)
    ),

  new SlashCommandBuilder()
    .setName("tp")
    .setDescription("Teleport a player to coordinates")
    .addStringOption((opt) =>
      opt.setName("player").setDescription("Player name").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt.setName("x").setDescription("X coordinate").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt.setName("y").setDescription("Y coordinate").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt.setName("z").setDescription("Z coordinate").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("broadcast")
    .setDescription("Send a message to all players on the server")
    .addStringOption((opt) =>
      opt.setName("message").setDescription("Message to broadcast").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("mcstatus")
    .setDescription("Check the Minecraft server status and online players"),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

console.log("Registering slash commands...");
await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
  body: commands,
});
console.log("✅ Slash commands registered successfully!");
