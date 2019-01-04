# 爬取html生成pdf

首先看了这篇文章[前端使用puppeteer 爬虫生成《React.js 小书》PDF并合并](https://segmentfault.com/a/1190000016198363)，发现最后的pdf没有书签，很难受，所以主要在此基础上加了加书签的功能。

爬去的示例网站为[React.js 小书](http://huziketang.mangojuice.top/books/react/)，仅做学习交流

## 针对网页生成pdf

使用puppeteer爬取网页并生成pdf

[puppeteer中文文档](https://zhaoqize.github.io/puppeteer-api-zh_CN/)

```js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://news.ycombinator.com', {waitUntil: 'networkidle2'});
  await page.pdf({path: 'hn.pdf', format: 'A4'});

  await browser.close();
})();
```

## 合成pdf

[pdf-merge](https://www.npmjs.com/package/pdf-merge)：合并pdf

依赖于pdftk

## 如何给pdf加上书签

[pdftk](https://www.pdflabs.com/docs/pdftk-man-page/)：一个处理pdf的工具

- 安装后将bin目录添加到环境变量

利用`update_info_utf8`给pdf增加书签：

`pdftk 'd:\OpenSource\My\genpfdforrsb\React 小书(无书签).pdf' update_info_utf8 'd:\OpenSource\My\genpfdforrsb\bookmarks.txt' output 'd:\OpenSource\My\genpfdforrsb\React 小书.pdf'`

## 书签是什么

也就是bookmarks.txt

书签格式:

```
BookmarkBegin
BookmarkTitle: PDF Reference (Version 1.5)
BookmarkLevel: 1
BookmarkPageNumber: 1
BookmarkBegin
BookmarkTitle: Contents
BookmarkLevel: 2
BookmarkPageNumber: 3
```

## 确定书签页码

[pdfjs-dist](https://www.npmjs.com/package/pdfjs-dist)：获取单个pdf页数，用于bookmarks.txt中指定页码

## 生成书签

```js
const pageArr = result.map(c => c.numPages);
let txt = ''
for (let index = 0; index < pageArr.length; index++) {
    let temp = `BookmarkBegin\r\nBookmarkTitle: ${titleArr[index]}\r\nBookmarkLevel: 1\r\nBookmarkPageNumber: ${pageIndex}\r\n`
    txt += temp
    pageIndex += pageArr[index]
}
fs.writeFileSync('bookmarks.txt', txt);
```

## 加上书签

参考`pdf-merge`源码，增加`runshell.js`用于在node中执行`pdftk`的命令

runshell.js如下：

```js
'use strict';
const child = require('child_process');
const Promise = require('bluebird');
const exec = Promise.promisify(child.exec);

module.exports = (scripts) => new Promise((resolve, reject) => {
    exec(scripts)
        .then(resolve)
        .catch(reject);
});
```

执行pdftk update_info_utf8

```js
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
```

- 文件路径需要用双引号

源码：[genpfdforrsb](https://github.com/sunven/genpfdforrsb)

## 问题

合并后的pdf页码不是连续的，还是单个pdf的页码