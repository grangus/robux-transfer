const { Worker } = require("worker_threads");
const chalk = require("chalk");

const configs = require("./config.json");

configs.forEach((config) => {
  const worker = new Worker("./transfer_thread.js", {
    workerData: config,
  });

  worker.on("message", (msg) => {
    if(msg.error) {
        console.log(chalk.red(`[#${config.assetId}] ${msg.data}`));
    } else {
        console.log(chalk.green(`[#${config.assetId}] ${msg.data}`));
    }
  });

  worker.on("error", (err) => {
    console.log(chalk.red(`[#${config.assetId}] ${err}`));
  });

  worker.on("exit", (code) => {
      if(code !== 0) {
          console.log(chalk.magenta(`[#${config.assetId}] Exited with status code: ${code}!`));
      } else {
        console.log(chalk.blue(`[#${config.assetId}] Task completed successfully!`));
      }
  });
});
