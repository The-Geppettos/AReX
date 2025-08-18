const { spawn } = require("child_process");
const chokidar = require("chokidar");
const path = require("path");

const FORCE_EXIT_TIMEOUT = 5000;
const RESTART_DEBOUNCE = 500;
const LOG_PREFIX = "[dev]";
const ENTRY = path.resolve(__dirname, "start.js");

let watcher = null;
let subProcess = null;
let stopTriggered = false;
let restartTimeout = null;

function startProcess() {
  return new Promise((resolve) => {
    if (stopTriggered) {
      resolve();
      return;
    }

    const buildProcess = spawn("npm", ["run", "--silent", "build"], {
      stdio: "inherit",
    });

    buildProcess.on("exit", (code) => {
      if (stopTriggered) {
        resolve();
        return;
      }

      if (code !== 0) {
        resolve();
        return;
      }

      const startProcess = spawn("node", [ENTRY], {
        stdio: "inherit",
        detached: true,
      });

      startProcess.on("exit", () => {
        subProcess = null;
      });

      subProcess = startProcess;
      resolve();
    });
  });
}

function stopProcess() {
  return new Promise((resolve) => {
    const currentProcess = subProcess;
    subProcess = null;

    if (!currentProcess) {
      resolve();
      return;
    }

    const forceExitTimeout = setTimeout(() => {
      console.warn(
        `${LOG_PREFIX} Process did not stop in time. Force killing...`,
      );
      currentProcess.removeAllListeners("exit");
      currentProcess.kill("SIGKILL");
      resolve();
    }, FORCE_EXIT_TIMEOUT);

    currentProcess.removeAllListeners("exit");
    currentProcess.on("exit", () => {
      clearTimeout(forceExitTimeout);
      resolve();
    });
    currentProcess.kill("SIGTERM");
  });
}

let starting = false;
let stopping = false;

function handleFileChange() {
  if (stopTriggered || stopping || starting) {
    return;
  }

  if (restartTimeout) {
    clearTimeout(restartTimeout);
  }

  restartTimeout = setTimeout(async () => {
    if (stopTriggered) {
      return;
    }

    console.info(`${LOG_PREFIX} File change detected. restarting process...`);

    stopping = true;
    await stopProcess();
    stopping = false;

    if (stopTriggered) {
      return;
    }

    starting = true;
    await startProcess();
    starting = false;
  }, RESTART_DEBOUNCE);
}

async function stop() {
  stopTriggered = true;
  console.info(`${LOG_PREFIX} Stopping server...`);

  if (watcher) {
    try {
      await watcher.close();
    } catch (error) {
      console.error(`${LOG_PREFIX} Error closing watcher: ${error}`);
    }
  }

  await stopProcess();
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

console.info(`${LOG_PREFIX} Starting server...`);
startProcess().then(() => {
  if (stopTriggered) {
    return;
  }

  watcher = chokidar.watch(["src", "../shared"], {
    persistent: true,
  });

  watcher
    .on("error", (error) =>
      console.error(`${LOG_PREFIX} Watcher error: ${error}`),
    )
    .on("ready", () => {
      watcher
        .on("add", handleFileChange)
        .on("change", handleFileChange)
        .on("unlink", handleFileChange);
    });
});
