const TelegramBot = require('node-telegram-bot-api')
const Parser = require('rss-parser')

// 创建rss解析器
const parser = new Parser()

// 创建bot
const token = '5855692644:AAFrEAejzFq63pKtY4XmevxOtgfHIi-pFwg'
const bot = new TelegramBot(token, { polling: true })

// 定时拉取的定时器
let intervalId = ""

// 我的用户id
const chatId = 1999271447

// 我的订阅源列表
const rssList = [
    {
        link: 'https://chentiansaber.top/sspai/index',
        mode: 0,
        title: '少数派'
    },
    {
        link: 'https://chentiansaber.top/bilibili/followings/video/7554338',
        mode: 0,
        title: '我关注的UP主'
    },
    {
        link: 'https://www.ruanyifeng.com/blog/atom.xml',
        mode: 1,
        title: '阮一峰的日志'
    },
    {
        link: 'https://chentiansaber.top/gamersky/news',
        mode: 0,
        title: '游民星空'
    }
]

// 所有已请求过的RSSItem，作为key，避免重复数据
// TODO 在本地文件存储即可
const readItemList = []

/**
 * 定时拉取RSS内容，并通过机器人发送
 */
async function requestAllRSSContent() {

    bot.sendMessage(chatId, "Bot正在拼命拉取数据中")

    for (const rss of rssList) {
        let feed = await parser.parseURL(rss.link)
        feed.link = toEscapeMsg(feed.link)
        feed.feedUrl = toEscapeMsg(feed.feedUrl)
        feed.title = toEscapeMsg(feed.title)
        console.log('已请求-->', feed.title)

        for (const item of feed.items) {
            item.title = toEscapeMsg(item.title)
            item.link = toEscapeMsg(item.link)
            item.author = toEscapeMsg(item.author)
            item.content = toEscapeMsg(item.content)
            item.contentSnippet = toEscapeMsg(item.contentSnippet).replace(/\s*/g, "")

            // 对一些非法数据做友好展示
            if (item.author == undefined) {
                item.author = '佚名'
            }

            if (rss.title != undefined) {
                feed.title = rss.title
            }

            // 有些源直接用TG的网页预览就能很好的解析了
            // 有些源可能不行，此时就需要手动的展示标题和内容
            // mode: 0就展示作者和网页
            // mode: 1展示标题和内容，markdown格式
            if (rss.mode == 0) {
                let resMsg = `*${feed.title} \\- __${item.author}__*\n${item.link}`

                bot.sendMessage(chatId, resMsg, { parse_mode: "MarkdownV2" })
            } else if (rss.mode == 1) {
                let resMsg = `*${item.title}*\n`
                    + `*${feed.title} \\- __${item.author}__*\n`
                    + `${item.link}\n\n`
                    + `\`\`\`${item.contentSnippet.substring(0, 100)}……\`\`\``
                bot.sendMessage(chatId, resMsg, { parse_mode: "MarkdownV2" })
            }
        }
    }


    setTimeout(() => {
        bot.sendMessage(chatId, "已全部拉取完毕")
    }, 3000)
}

/**
 * 将文本内容针对Telegram的MarkDowm支持进行转义
 */
function toEscapeMsg(text) {
    if (text == undefined) {
        return text
    }
    return text.replace(/\_/g, '\\_')
        .replace(/\*/g, '\\*')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/\~/g, '\\~')
        .replace(/\`/g, '\\`')
        .replace(/\>/g, '\\>')
        .replace(/\#/g, '\\#')
        .replace(/\+/g, '\\+')
        .replace(/\-/g, '\\-')
        .replace(/\=/g, '\\=')
        .replace(/\|/g, '\\|')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/\./g, '\\.')
        .replace(/\!/g, '\\!')
}

/**
 * 监听 /pull 命令，然后拉取rss内容
 */
bot.onText(/\/pull/, (msg, match) => {
    requestAllRSSContent()
})

/**
 * 监听 /init 命令，然后开启定时拉取
 */
bot.onText(/\/init/, (msg, match) => {
    if (intervalId == "") {
        intervalId = setInterval(() => {
            requestAllRSSContent()
        }, 12 * 60 * 60)
        bot.sendMessage(chatId, "已设置定时器，每12小时更新")
    } else {
        bot.sendMessage(chatId, "当前已经在定时拉取了哦")
    }
})

/**
 * 监听 /end 命令，结束循环拉取
 */
bot.onText(/\/end/, (msg, match) => {
    if (intervalId == "") {
        bot.sendMessage(chatId, "没有正在执行的定时器")
        return
    }
    clearInterval(intervalId)
    intervalId = ""
    bot.sendMessage(chatId, "已清除定时器")
})