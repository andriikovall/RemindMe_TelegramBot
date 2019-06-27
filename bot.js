var fs = require("fs");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const TOKEN = require('./bot_token.json')['token']

var TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(TOKEN, {polling: true, timeout: 500});

rawdata = fs.readFileSync('users.json');  
var USERS = JSON.parse(rawdata)

function usersContain(user) {
    return getUserById(user.id) != undefined
}

function getUserById(id) {
    for (let i in USERS) {
        if (USERS[i].id == id) {
            return USERS[i]
        }
    }
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

function registerUser(user) {
    user.cat_count = 0
}
bot.onText(/start/, function (msg, match) {
    console.log('On start')
    let user = msg.from
    registerUser(user)
});

var HttpClient = function() {
    this.get = function(aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() { 
            if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
                aCallback(anHttpRequest.responseText);
        }

        anHttpRequest.open( "GET", aUrl, true );            
        anHttpRequest.send( null );
    }
}


bot.onText(/cat/, function (msg, match) {
    let user = getUserById(msg.from.id)
    if (user == undefined) {
        user = msg.from
        user.cat_count = 0
    }
    user.cat_count += 1
    checkUserData(user)
    var client = new HttpClient();
    client.get('https://api.thecatapi.com/v1/images/search', function(response) {
        let image_url = JSON.parse(response)[0]['url']
        bot.sendPhoto(user.id, image_url)
    });
});





    


