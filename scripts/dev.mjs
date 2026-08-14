// Starts the dev server on a port that is genuinely free.
//
// Next's own "port in use, trying the next one" check binds a single address.
// When another process on this machine holds 127.0.0.1:3000 while Next binds
// the wildcard (or the other way round), both sockets succeed, Next reports
// that it is ready, and whichever server won the race answers localhost. That
// is how this project ended up pinned to `-p 3001` in package.json.
//
// Probing both stacks before handing the port to Next avoids that entirely and
// keeps the port flexible: PORT wins if set, otherwise the first free port at
// or above 3000. Pass --lan to also bind the wildcard for phone testing.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import net from "node:net";

const lan = process.argv.includes("--lan");

function isFree(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, host);
  });
}

// Every address a server might be holding has to be clear, otherwise the one
// we did not test is exactly the one another process is sitting on. Next binds
// dual-stack, so `::` matters as much as the v4 pair.
const PROBE_HOSTS = ["127.0.0.1", "0.0.0.0", "::"];

async function findPort(start) {
  for (let port = start; port < start + 40; port += 1) {
    const free = await Promise.all(
      PROBE_HOSTS.map((host) => isFree(port, host)),
    );
    if (free.every(Boolean)) return port;
  }
  throw new Error(`No free port found between ${start} and ${start + 40}`);
}

const requested = Number(process.env.PORT);
const port = Number.isInteger(requested)
  ? requested
  : await findPort(Number(process.env.DEV_PORT_START) || 3000);

const args = ["dev", "--turbo", "-p", String(port)];
if (lan) args.push("-H", "0.0.0.0");

console.log(`next dev on port ${port}${lan ? " (bound for LAN)" : ""}`);

// Run Next's own entry point on this Node rather than through a shell.
// `shell: true` concatenates arguments instead of escaping them, which Node
// warns about, and resolving the bin script keeps the command identical on
// Windows and POSIX without needing the .cmd shim.
const child = spawn(
  process.execPath,
  [createRequire(import.meta.url).resolve("next/dist/bin/next"), ...args],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_OPTIONS: `${process.env.NODE_OPTIONS || ""} --no-deprecation`.trim(),
    },
  },
);
child.on("exit", (code) => process.exit(code ?? 0));
