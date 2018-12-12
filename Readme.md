# 爬取html生成pdf

爬去的示例网站为[React.js 小书](http://huziketang.mangojuice.top/books/react/)，仅做学习交流

## reference

[前端使用puppeteer 爬虫生成《React.js 小书》PDF并合并](https://segmentfault.com/a/1190000016198363)

在此基础上增加了书签

## 技术栈

[puppeteer中文文档](https://zhaoqize.github.io/puppeteer-api-zh_CN/)

- 使用puppeteer爬取网页并生成pdf

[pdf-merge](https://www.npmjs.com/package/pdf-merge)

- 依赖于pdftk

- 合并pdf

[pdfjs-dist](https://www.npmjs.com/package/pdfjs-dist)

- 获取pdf页数，以便于生成书签

[pdftk](https://www.pdflabs.com/docs/pdftk-man-page/)

- 安装后添加到环境变量

- 给合并后的pdf添加书签

添加书签命令：

`pdftk 'd:\OpenSource\My\genpfdforrsb\React 小书(无书签).pdf' update_info_utf8 'd:\OpenSource\My\genpfdforrsb\bookmarks.txt' output 'd:\OpenSource\My\genpfdforrsb\React 小书.pdf'`

## 问题

合并后的pdf页码不是连续的，还是单个pdf的页码