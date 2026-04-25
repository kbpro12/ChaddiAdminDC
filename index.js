import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

// ─── Config ────────────────────────────────────────────────────────────────
const BRIDGE_URL = `http://${process.env.MC_BRIDGE_HOST}:${process.env.MC_BRIDGE_PORT}`;
const BRIDGE_SECRET = process.env.MC_BRIDGE_SECRET;
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID;

// ─── Discord Client ─────────────────────────────────────────────────────────
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ─── Helper: Send command to Minecraft plugin ───────────────────────────────
async function sendCommand(command) {
  try {
    const res = await fetch(`${BRIDGE_URL}/command`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Secret": BRIDGE_SECRET,
      },
      body: JSON.stringify({ command }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    throw new Error(`Bridge unreachable: ${err.message}`);
  }
}

// ─── Helper: Check admin role ───────────────────────────────────────────────
function isAdmin(interaction) {
  if (!ADMIN_ROLE_ID) return interaction.member.permissions.has("Administrator");
  return (
    interaction.member.roles.cache.has(ADMIN_ROLE_ID) ||
    interaction.member.permissions.has("Administrator")
  );
}

// ─── Helper: Build response embed ──────────────────────────────────────────
function resultEmbed(success, title, description, command = null) {
  const embed = new EmbedBuilder()
    .setColor(success ? 0x2ecc71 : 0xe74c3c)
    .setTitle(`${success ? "✅" : "❌"} ${title}`)
    .setDescription(description)
    .setTimestamp();

  if (command) embed.addFields({ name: "Command Sent", value: `\`${command}\`` });
  return embed;
}

// ─── Command Handlers ───────────────────────────────────────────────────────
const handlers = {
  async op(interaction) {
    const player = interaction.options.getString("player");
    const cmd = `op ${player}`;
    const result = await sendCommand(cmd);
    return resultEmbed(true, "Operator Granted", `**${player}** is now an operator.`, cmd);
  },

  async deop(interaction) {
    const player = interaction.options.getString("player");
    const cmd = `deop ${player}`;
    await sendCommand(cmd);
    return resultEmbed(true, "Operator Removed", `**${player}** is no longer an operator.`, cmd);
  },

  async kill(interaction) {
    const player = interaction.options.getString("player");
    const cmd = `kill ${player}`;
    await sendCommand(cmd);
    return resultEmbed(true, "Player Killed", `**${player}** has been killed.`, cmd);
  },

  async whitelist(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "list") {
      const result = await sendCommand("whitelist list");
      return resultEmbed(true, "Whitelist", result.output || "No players whitelisted.");
    }

    const player = interaction.options.getString("player");
    const cmd = `whitelist ${sub} ${player}`;
    await sendCommand(cmd);
    const action = sub === "add" ? "added to" : "removed from";
    return resultEmbed(
      true,
      `Whitelist ${sub === "add" ? "Added" : "Removed"}`,
      `**${player}** has been ${action} the whitelist.`,
      cmd
    );
  },

  async ban(interaction) {
    const player = interaction.options.getString("player");
    const reason = interaction.options.getString("reason") || "Banned by admin";
    const cmd = `ban ${player} ${reason}`;
    await sendCommand(cmd);
    return resultEmbed(
      true,
      "Player Banned",
      `**${player}** has been banned.\n**Reason:** ${reason}`,
      cmd
    );
  },

  async unban(interaction) {
    const player = interaction.options.getString("player");
    const cmd = `pardon ${player}`;
    await sendCommand(cmd);
    return resultEmbed(true, "Player Unbanned", `**${player}** has been pardoned.`, cmd);
  },

  async kick(interaction) {
    const player = interaction.options.getString("player");
    const reason = interaction.options.getString("reason") || "Kicked by admin";
    const cmd = `kick ${player} ${reason}`;
    await sendCommand(cmd);
    return resultEmbed(
      true,
      "Player Kicked",
      `**${player}** has been kicked.\n**Reason:** ${reason}`,
      cmd
    );
  },

  async gamemode(interaction) {
    const player = interaction.options.getString("player");
    const mode = interaction.options.getString("mode");
    const cmd = `gamemode ${mode} ${player}`;
    await sendCommand(cmd);
    return resultEmbed(
      true,
      "Gamemode Changed",
      `**${player}**'s gamemode set to **${mode}**.`,
      cmd
    );
  },

  async give(interaction) {
    const player = interaction.options.getString("player");
    const item = interaction.options.getString("item");
    const amount = interaction.options.getInteger("amount") ?? 1;
    const cmd = `give ${player} ${item} ${amount}`;
    await sendCommand(cmd);
    return resultEmbed(
      true,
      "Items Given",
      `Gave **${amount}x ${item}** to **${player}**.`,
      cmd
    );
  },

  async tp(interaction) {
    const player = interaction.options.getString("player");
    const x = interaction.options.getInteger("x");
    const y = interaction.options.getInteger("y");
    const z = interaction.options.getInteger("z");
    const cmd = `tp ${player} ${x} ${y} ${z}`;
    await sendCommand(cmd);
    return resultEmbed(
      true,
      "Player Teleported",
      `**${player}** teleported to \`${x}, ${y}, ${z}\`.`,
      cmd
    );
  },

  async broadcast(interaction) {
    const message = interaction.options.getString("message");
    const cmd = `say ${message}`;
    await sendCommand(cmd);
    return resultEmbed(true, "Message Broadcast", `📢 **"${message}"** sent to all players.`, cmd);
  },

  async mcstatus(interaction) {
    const result = await sendCommand("list");
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("🟢 Minecraft Server Status")
      .setDescription(result.output || "Server is online.")
      .setTimestamp();
    return embed;
  },
};

// ─── Interaction Handler ────────────────────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  if (!handlers[commandName]) return;

  // Permission check
  if (!isAdmin(interaction)) {
    return interaction.reply({
      embeds: [
        resultEmbed(false, "Access Denied", "You need the **Admin** role to use this command."),
      ],
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  try {
    const embed = await handlers[commandName](interaction);
    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    await interaction.editReply({
      embeds: [
        resultEmbed(
          false,
          "Error",
          `Failed to execute command.\n\`\`\`${err.message}\`\`\`\n> Make sure the Minecraft bridge plugin is running.`
        ),
      ],
    });
  }
});

// ─── Ready ──────────────────────────────────────────────────────────────────
client.once("ready", () => {
  console.log(`✅ Bot online as ${client.user.tag}`);
  client.user.setActivity("Minecraft Server", { type: 3 }); // Watching
});

client.login(process.env.DISCORD_TOKEN);
