const TelegramBot = require('node-telegram-bot-api')
const Parser = require('rss-parser')

// 创建rss解析器
const parser = new Parser()

// 创建bot
const token = '5855692644:AAFrEAejzFq63pKtY4XmevxOtgfHIi-pFwg'
const bot = new TelegramBot(token, { polling: true })

// 我的用户id
const chatId = 1999271447

// 我的订阅源列表
const rssList = [
    { link: 'https://chentiansaber.top/sspai/index', mode: 0 },
    { link: 'https://chentiansaber.top/bilibili/followings/video/7554338', mode: 0 },
    { link: 'https://www.ruanyifeng.com/blog/atom.xml', mode: 1 },
    { link: 'https://chentiansaber.top/gamersky/news', mode: 0 }
]

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

    bot.sendMessage(chatId, "已全部拉取完毕")
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