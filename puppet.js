const fs = require("fs");
const puppeteer = require("puppeteer");

const configJSON = fs.readFileSync("./config.json", "utf-8");
const configFile = JSON.parse(configJSON);
// console.log(configFile.downloader); // string
var prepend = "https://www.youtube.com";
async function run() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--start-maximized"],
    defaultViewport: null,
  });
  let pages = await browser.pages(); // returns array of all open browser pages
  let page = pages[0];
  await page.goto(configFile.url, {
    waitUntil: "domcontentloaded",
  });

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
  fs.writeFileSync("./config.json", JSON.stringify(obj), "utf-8");
  for (let i = 0; i < newhrefs.length; i++) {
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
    await newPage.waitForSelector("a.link-download");
    await newPage.click("a.link-download");
    let length = await (await browser.pages()).length;
    let npages = await browser.pages();
    console.log(length);
    if (length === 3) {
      await npages[2].close();
      await npages[1].close();
    } else if (length === 2) {
      await npages[1].close();
    }
  }
  //   await newPage.close();
}
run();
