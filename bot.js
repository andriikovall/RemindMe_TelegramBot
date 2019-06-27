var fs = require("fs");
const TOKEN = require('./bot_token.json')['token']

var TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(TOKEN, {polling: true});

rawdata = fs.readFileSync('users.json');  
var USERS = JSON.parse(rawdata)

function usersContain(user) {
    for (let i in USERS) {
        if (USERS[i].id == user.id) {
            USERS[i] = user
            return true
        }
    } return false
}
function checkUserData(user) {
    if (!usersContain(user)) {
        USERS.push(user)
        const greeting_msg = 'Привет, это бот для создание напоминалок! Можеш начинать им пользоваться)'
        bot.sendMessage(user.id, greeting_msg)
    }
    let user_data = JSON.stringify(USERS, null, ' ')
    fs.writeFileSync('users.json', user_data)
}
bot.onText(/start/, function (msg, match) {
    let user = msg.from
    checkUserData(user)
});





    


