const puppeteer = require("puppeteer");
const PDFMerge = require("pdf-merge");
const runshell = require('./runshell')
const pdfjsLib = require('pdfjs-dist');
const fs = require("fs");
let titleArr = [];
let promiseAllArr = [];

async function genpdf(browser, url, path, isRemove) {
    console.log('......' + path)
    // 打开一个标签页
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: "load"
    });
    // 删除左侧导航，便于生成pdf
    let wh = await page.evaluate((isRemove) => {
        if (isRemove) {
            let leftNavNode = document.querySelector("#table-of-content");
            if (leftNavNode) {
                leftNavNode.remove();
            }
        }
        return {
            width: 1920,
            height: document.documentElement.clientHeight,
            //deviceScaleFactor: window.devicePixelRatio
        };
    },isRemove);
    await page.setViewport(wh);
    // path 路径， format 生成pdf页面格式
    const filepath = "dist/" + path + ".pdf"
    await page.pdf({
        path: filepath,
        margin: {
            top: "60px",
            right: "0px",
            bottom: "60px",
            left: "0px"
        },
        // 生成pdf时是否显示页眉页脚
        displayHeaderFooter: true,
        format: "A4"
    });
    titleArr.push(path)
    promiseAllArr.push(pdfjsLib.getDocument(filepath));
}

async function otherpage(browser) {
    let page = await browser.newPage();

    await page.goto("http://huziketang.mangojuice.top/books/react/lesson1");

    //await page.waitFor(2000);

    let aLinkArr = await page.evaluate(() => {
        console.log(document.body.clientHeight)
        // 隐藏左侧导航，便于生成pdf
        let leftNavNode = document.querySelector("#table-of-content");
        if (leftNavNode) {
            leftNavNode.style.display = "none";
        }
        let aLinks = [...document.querySelectorAll("#table-of-content a")];
        aLinks.splice(0, 1);
        return aLinks.map(a => {
            return {
                href: a.href.trim(),
                text: a.innerText.trim()
            };
        });
    });
    //
    for (let index = 0; index < aLinkArr.length; index++) {
        const element = aLinkArr[index];
        await genpdf(browser, element.href, element.text, true);
    }
}

function mergepdf(filename) {
    const filenameArr = fs.readdirSync("dist/");

    const sortedFilenameArr = filenameArr.sort((str1, str2) => {
        let regex = /^(\d{1,2})\./;
        let a = +str1.match(regex)[1];
        let b = +str2.match(regex)[1];
        return a - b;
    });

    const files = sortedFilenameArr.map(el => {
        return `${__dirname}/dist/${el}`;
    });

    return PDFMerge(files, {
        output: filename
    }).then(buffer => {
        console.log("merge success!");
        //删除文件
        filenameArr.forEach(function (file, index) {
            //var curPath = path + "/" + file;
            fs.unlinkSync(`${__dirname}/dist/${file}`);
        });
        console.log("delete success!");
    });

}

(async () => {
    // 启动浏览器
    const browser = await puppeteer.launch({
        // 无界面 默认为true,改成false,则可以看到浏览器操作，目前生成pdf只支持无界面的操作。
        // headless: false,
        // 开启开发者调试模式，默认false, 也就是平时F12打开的面版
        // devtools: true,
    });
    await genpdf(
        browser,
        "http://huziketang.mangojuice.top/books/react/",
        "0. React 小书",
        false
    );
    await otherpage(browser);
    // 关闭浏览器
    await browser.close();

    let pageIndex = 1
    Promise.all(promiseAllArr).then(result => {
        console.log('starting gen bookmarks!')
        const pageArr = result.map(c => c.numPages);
        let txt = ''
        for (let index = 0; index < pageArr.length; index++) {
            let temp = `BookmarkBegin\r\nBookmarkTitle: ${titleArr[index]}\r\nBookmarkLevel: 1\r\nBookmarkPageNumber: ${pageIndex}\r\n`
            txt += temp
            pageIndex += pageArr[index]
        }
        fs.writeFileSync('bookmarks.txt', txt);
        console.log('completed gen bookmarks!')
        //
        const nobkname = 'React 小书(无书签).pdf'
        const hasbkname = 'React 小书.pdf'
        mergepdf(nobkname).then(buffer => {
            console.log('starting add bookmarks!')
            runshell(`pdftk "${__dirname}/${nobkname}" update_info_utf8 "${__dirname}/bookmarks.txt" output "${__dirname}/${hasbkname}"`).then(() => {
                console.log('completed add bookmarks!')
                fs.unlinkSync(`${__dirname}/${nobkname}`);
                fs.unlinkSync(`${__dirname}/bookmarks.txt`);
                console.log('all completed!')
            })
        })
    })
})();