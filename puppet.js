const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const configJSON = fs.readFileSync("./config.json", "utf-8");
const configFile = JSON.parse(configJSON);
// console.log(configFile.downloader); // string
var prepend = "https://www.youtube.com";
async function run() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath:
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: [
      "--start-maximized",
      "--no-sandbox",
      // "--disable-features=site-per-process",
    ],
    defaultViewport: null,
  });
  let pages = await browser.pages(); // returns array of all open browser pages
  let page = pages[0];
  await page.goto(configFile.url, {
    waitUntil: "domcontentloaded",
  });
  const title = await page.title();
  console.log(title);
  // let downPath = path.resolve("E:", title);
  let hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a#video-title[href]"), (a) => {
      return a.getAttribute("href");
    })
  );

  let newhrefs = hrefs.map((href) => prepend.concat(href));
  let obj = {
    downloader: configFile.downloader,
    hrefs: newhrefs,
    url: configFile.url,
  };
  //   console.log(newhrefs);
  fs.writeFileSync("./config2.json", JSON.stringify(obj), "utf-8");
  for (let i = 0; i < newhrefs.length; i++) {
    try {
      let newPage = await browser.newPage();
      await newPage.goto(configFile.downloader, {
        waitUntil: "domcontentloaded",
      });
      //   await newPage.waitForNavigation();
      await newPage.waitForTimeout(4000);
      await newPage.waitForSelector("input[name='sf_url']");
      await newPage.type("input[name='sf_url']", newhrefs[i]);

      await newPage.waitForSelector("button#sf_submit");
      await newPage.click("button#sf_submit");

      await newPage.waitForTimeout(4000);
      await newPage._client.send("Page.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: path.resolve("E:", "playlist_downloader", title),
      });

      await newPage.waitForTimeout(1000);
      await newPage.waitForSelector("a.link-download");
      await newPage.click("a.link-download");
      await newPage.waitForTimeout(1000);

      let length = await (await browser.pages()).length;
      let npages = await browser.pages();
      console.log(length);
      if (length > 2) {
        for (let k = length - 1; k > 0; k--) await npages[k].close();
      } else if (length === 2) {
        await npages[1].close();
      }
    } catch (e) {
      console.log(e);
      i = i - 1;
    }
  }
  //   await newPage.close();
}
run();
