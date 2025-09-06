#!/usr/bin/env node

const { Command } = require("commander");
const pkg = require("../package.json");
const { startClient } = require("../src/index");
const { logger } = require("../src/utils/logger");

const program = new Command();

program
  .name("collab")
  .description("CollabFS: Real-time collaborative filesystem sync")
  .version(pkg.version);

// --- Start a new session ---
program
  .command("start")
  .alias("s")
  .description("Start a new collaboration session in the current folder")
  .option("-n, --name <displayName>", "Display name to show to others")
  .option(
    "--server [url]",
    "Server URL to connect to",
    "https://collabfs-central-server.onrender.com"
  ) // 👈 add default
  .action(async (opts) => {
    try {
      await startClient("start", opts);
    } catch (err) {
      logger.error(`[cli] Failed to start session: ${err.message}`);
      process.exit(1);
    }
  });

// --- Join an existing session ---
program
  .command("join")
  .description("Join an existing collaboration session")
  .argument("[sessionId]", "Session ID to join")
  .option("-s, --session <id>", "Session ID to join")
  .option("-n, --name <displayName>", "Display name")
  .option(
    "--server [url]",
    "Server URL to connect to",
    "https://collabfs-central-server.onrender.com"
  ) // 👈 add here too
  .action(async (sessionId, opts) => {
    const id = opts.session || sessionId;
    if (!id) {
      logger.error("[cli] Missing sessionId. Provide it as arg or --session.");
      process.exit(1);
    }
    try {
      await startClient("join", { sessionId: id, ...opts });
    } catch (err) {
      logger.error(`[cli] Failed to join session: ${err.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
