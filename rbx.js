const request = require("request");
const cheerio = require("cheerio");

module.exports.setShirtPrice = (shirt, cookie, price, proxy) => {
  return new Promise((res, rej) => {
    let req = request.defaults({ timeout: 10000, proxy: `http://${proxy}` });
    req.post(
      `https://itemconfiguration.roblox.com/v1/assets/${shirt}/update-price`,
      {
        headers: {
          Cookie: `.ROBLOSECURITY=${cookie}`,
        },
      },
      (error, response, body) => {
        if (error)
          return rej({ data: "Network error! Retrying...", retry: true });

        let xsrf = response.headers["x-csrf-token"];

        if (!xsrf)
          return rej({ data: "X-CSRF missing! Retrying...", retry: true });

        req.post(
          `https://itemconfiguration.roblox.com/v1/assets/${shirt}/update-price`,
          {
            headers: {
              Cookie: `.ROBLOSECURITY=${cookie}`,
              "X-CSRF-TOKEN": xsrf,
            },
            json: { priceConfiguration: { priceInRobux: price } },
          },
          (error, response, body) => {
            if (error)
              return rej({ data: "Network error! Retrying...", retry: true });

            if (response.statusCode == 403)
              return rej({
                data: `Transfer cookie banned! Status: ${response.statusCode}`,
                retry: true,
                banned: true,
              });

            if (response.statusCode == 429)
              return rej({
                data: `Ratelimited! Status: ${response.statusCode}`,
                retry: true,
                rl: true,
              });

            if (response.statusCode !== 200)
              return rej({
                data: `Status code was not 200! Status: ${response.statusCode}`,
                retry: true,
              });

            res("Success!");
          }
        );
      }
    );
  });
};

module.exports.deleteShirt = (shirt, cookie, proxy) => {
  return new Promise((res, rej) => {
    let req = request.defaults({ timeout: 10000, proxy: `http://${proxy}` });
    req.post(
      `https://www.roblox.com/asset/delete-from-inventory`,
      {
        headers: {
          Cookie: `.ROBLOSECURITY=${cookie}`,
        },
      },
      (error, response, body) => {
        if (error)
          return rej({ data: "Network error! Retrying...", retry: true });

        let xsrf = response.headers["x-csrf-token"];

        if (!xsrf)
          return rej({ data: "X-CSRF missing! Retrying...", retry: true });

        req.post(
          `https://www.roblox.com/asset/delete-from-inventory`,
          {
            headers: {
              Cookie: `.ROBLOSECURITY=${cookie}`,
              "X-CSRF-TOKEN": xsrf,
            },
            json: { assetId: shirt },
            followRedirect: true,
          },
          (error, response, body) => {
            if (error)
              return rej({ data: "Network error! Retrying...", retry: true });

            if (response.statusCode == 403)
              return rej({
                data: `Cookie banned! Status: ${response.statusCode}`,
                retry: true,
                banned: true,
              });

            if (response.statusCode == 429)
              return rej({
                data: `Ratelimited! Status: ${response.statusCode}`,
                retry: true,
                rl: true,
              });

            console.log(response.statusCode);

            if (response.statusCode == 400) return res("Success!"); //returning success on 400 cuz it means the item cant be deleted

            // if (response.statusCode !== 200)
            //   return rej({
            //     data: `Status code was not 200! Status: ${
            //       response.statusCode
            //     } Body: ${JSON.stringify(body)}`,
            //     retry: true,
            //   });

            res(
              `Attempt to delete from inventory resulted in status: ${response.statusCode}`
            );
          }
        );
      }
    );
  });
};

module.exports.buyShirt = (shirt, cookie, price, proxy) => {
  return new Promise((res, rej) => {
    let req = request.defaults({ timeout: 10000, proxy: `http://${proxy}` });
    req.get(
      `https://www.roblox.com/catalog/${shirt}`,
      {
        headers: {
          Cookie: `.ROBLOSECURITY=${cookie}`,
        },
        followRedirect: true,
      },
      (error, response, body) => {
        if (error)
          return rej({ data: "Network error! Retrying...", retry: true });

        let $ = cheerio.load(body);

        let xsrf = body
          .substring(body.lastIndexOf("setToken('") + 10)
          .split("');")[0];
        let expectedSellerId = $("#item-container").attr(
          "data-expected-seller-id"
        );
        let productId = $("#item-container").attr("data-product-id");

        req.post(
          `https://economy.roblox.com/v1/purchases/products/${productId}`,
          {
            headers: {
              Cookie: `.ROBLOSECURITY=${cookie}`,
              "x-csrf-token": xsrf,
            },
            json: {
              expectedCurrency: 1,
              expectedPrice: parseInt(price),
              expectedSellerId: parseInt(expectedSellerId),
            },
          },
          (error, response, body) => {
            if (error)
              return rej({ data: "Network error! Retrying...", retry: true });

            if (response.statusCode !== 200)
              return rej({
                data: `Status code was not 200! Status: ${response.statusCode}`,
                retry: true,
              });

            if (!body.purchased) return res(body.errorMsg);

            res("Success!");
          }
        );
      }
    );
  });
};
