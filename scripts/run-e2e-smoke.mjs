import { spawn } from "node:child_process";

const cwd = process.cwd();
const host = "127.0.0.1";
const port = 3005;
const baseUrl = `http://${host}:${port}`;

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      resolve({
        code: code ?? (signal ? 1 : 0),
        signal,
      });
    });
  });
}

async function waitForServer(url, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url} to become ready.`);
}

async function stopServer(server) {
  if (!server.pid || server.exitCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    const killer = spawn("cmd.exe", ["/c", "taskkill", "/pid", String(server.pid), "/T", "/F"], {
      cwd,
      stdio: "ignore",
      windowsHide: true,
    });
    await waitForExit(killer);
    return;
  }

  server.kill("SIGTERM");
  await waitForExit(server);
}

const server = spawn(
  "node.exe",
  ["node_modules/next/dist/bin/next", "dev", "-H", host, "-p", String(port)],
  {
    cwd,
    env: process.env,
    stdio: "inherit",
    windowsHide: true,
  },
);

let exitCode = 1;

try {
  await waitForServer(baseUrl, 120_000);

  const smoke = spawn(
    "node.exe",
    [
      "node_modules/playwright/cli.js",
      "test",
      "tests/e2e/image2-weekly-flow.spec.ts",
      "--workers=1",
      "--reporter=line",
    ],
    {
      cwd,
      env: {
        ...process.env,
        PLAYWRIGHT_BASE_URL: baseUrl,
        PLAYWRIGHT_SKIP_WEBSERVER: "1",
      },
      stdio: "inherit",
      windowsHide: true,
    },
  );

  const result = await waitForExit(smoke);
  exitCode = result.code;
} finally {
  await stopServer(server);
}

process.exit(exitCode);
