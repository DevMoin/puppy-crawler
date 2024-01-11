// const puppeteer = require("puppeteer");

import puppeteer from 'puppeteer';

import fs from 'fs';

/* TODO:
        "https://infotechcommunity.com/category/apps/page/2/#primary",
        "https://infotechcommunity.com/category/apps/page/2/#",

*/

let queue = ["https://infotechcommunity.com/"];
let ignore = [];
let initialLink = queue[0];
let done = [];
let external = new Set();
let current = 0;

let metrices = {};

(async () => {
    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({
        headless: false,
    });
    const page = await browser.newPage();

    await page.setRequestInterception(true);

    page.on('request', (req) => {
        // console.log(req.resourceType());
        if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
            // console.log("aborted ", req.resourceType());
            req.abort();
        }
        else {
            req.continue();
        }
    });

    for (let i = current; i < queue.length; i++) {
        //some pages need to be excluded 
        if (ignore.indexOf(queue[i]) !== -1) {
            continue;
        }

        try {
            // start timer
            // Navigate the page to a URL
            let response = await page.goto(queue[i]);
            if (!response.ok()) {
                //add log to response not okay
                continue;
            }
            const headers = response.headers();
            if (!headers['content-type'] || headers['content-type'].indexOf("text/html;") !== 0) {
                //add log to not html response
                continue;
            }
            //end timer
            const gitMetrics = await page.metrics();
            metrices[queue[i]] = gitMetrics;
            // console.log(queue[i], gitMetrics);



            let title = await page.evaluate("document.querySelector('title')?.innerText");
            let links = await page.evaluate(`Array.from(document.querySelectorAll('a')).map(a=>{
                let link = a.href.trim();
                if(link.length){
                let parts = link.split("#");
                return parts[0];
                    }
            })`);
            //
            let _external = links.filter(a => a.length && a.indexOf(initialLink) == -1);
            if (_external.length) {
                // console.log(_external.length, {_external});
                // external.push(..._external);
                for (let ext of _external) {
                    external.add(ext)
                }
            }


            //remove external links
            links = links.filter(a => a.indexOf(initialLink) === 0);
            // console.log(title);
            for (let link of links) {
                if (queue.indexOf(link) == -1) {
                    queue.push(link);
                }
            }

        } catch (e) {
            console.log("got error ", queue[i], e)
        }


        console.log("Done", (i+1)+'/'+queue.length);


        fs.writeFileSync("output.json", JSON.stringify({
            allLinks: queue,
            metrices,
            external
        }));
    }


    fs.writeFileSync("output.json", JSON.stringify({
        allLinks: queue,
        metrices,
        external
    }));


    await browser.close();

    // Set screen size
    // await page.setViewport({ width: 1080, height: 1024 });
    // await page.waitForNavigation({waitUntil: 'networkidle2'})

    // page.evaluate("alert('check kar')");

    // let links = await page.evaluate("Array.from(document.querySelectorAll('a')).map(e=>e.href)");

    // console.log(links);




    // // Type into search box
    // await page.type('.search-box__input', 'automate beyond recorder');

    // // Wait and click on first result
    // const searchResultSelector = '.search-box__link';
    // await page.waitForSelector(searchResultSelector);
    // await page.click(searchResultSelector);

    // // Locate the full title with a unique string
    // const textSelector = await page.waitForSelector(
    //     'text/Customize and automate'
    // );
    // const fullTitle = await textSelector?.evaluate(el => el.textContent);

    // // Print the full title
    // console.log('The title of this blog post is "%s".', fullTitle);

})();