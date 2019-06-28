var fs = require("fs");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const TOKEN = require('./bot_token.json')['token']
// const request = require('request') @todo

var TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(TOKEN, { polling: true, timeout: 500 });

rawdata = fs.readFileSync('users.json');
var USERS = JSON.parse(rawdata)

var NOTES = require('./notes.json')
const default_note = {
    text: '',
    date: 0,
    user_id: 0
}

function getUserBufferNote(id) {
    for (let i in USERS) {
        if (USERS[i].id == id) {
            return USERS[i].buffer_note
        }
    }
    return null
}

function usersContain(user) {
    for (let i in USERS) {
        if (USERS[i].id == user.id) {
            user.cat_count = USERS[i].cat_count
            USERS[i] = user
            return true
        }
    }
    return false
}

function getUserById(id) {
    for (let i in USERS) {
        if (USERS[i].id == id) {
            return USERS[i]
        }
    }
}
function checkUserData(user) {
    user.buffer_note = default_note
    user.buffer_note.user_id = user.id
    if (!usersContain(user)) {
        user.cat_count = 0
        USERS.push(user)
        const greeting_msg = 'Привет, это бот для создание напоминалок! Можеш начинать им пользоваться)'
        bot.sendMessage(user.id, greeting_msg)
    }
    let user_data = JSON.stringify(USERS, null, '   ')
    fs.writeFileSync('users.json', user_data)
}

var keyboard_anwers = {
    "Создать_заметку": 1,
    "Получить_котика": 2,
    "Изменить_дату": 3,
    "Изменить_время": 4,
    "Изменить_текст": 5,
    "Сегодня": 6,
    "Завтра": 7,
    "Послезавтра": 8,
    "Другая_дата": 9,
    "Назад_создание_заметки": 10,
    "Назад_изменение_даты": 11,
    "Назад_изменение_время": 12
}
console.log(keyboard_anwers.Создать_заметку)

function onStartMsg(id) {
    var options = {
        reply_markup: on_start_markup
    };

    bot.sendMessage(id, "Выбери опцию", options);
}

function onStart(user) {
    checkUserData(user)
    onStartMsg(user.id)
}

bot.onText(/start/, function (msg, match) {
    onStart(msg.from);
});

var HttpClient = function () {
    this.get = function (aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function () {
            if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
                aCallback(anHttpRequest.responseText);
        }

        anHttpRequest.open("GET", aUrl, true);
        anHttpRequest.send(null);
    }
}

function sendCat(id) {
    let user = getUserById(id)
    if (user == undefined) {
        user = msg.from
        user.cat_count = 0
    }
    user.cat_count += 1
    checkUserData(user)
    var client = new HttpClient();
    client.get('https://api.thecatapi.com/v1/images/search', function (response) {
        let image_url = JSON.parse(response)[0]['url']
        bot.sendPhoto(id, image_url) //@todo reply markup and always editing messages
    });
}


bot.onText(/cat/, function (msg, match) {
    sendCat(user.id)
});

var on_start_markup = JSON.stringify({
    inline_keyboard: [
        [{ text: 'Создать заметку', callback_data: keyboard_anwers.Создать_заметку }],
        [{ text: 'Получить картинку котика)', callback_data: keyboard_anwers.Получить_котика }]
    ]
})


var create_note_markup = JSON.stringify({
    inline_keyboard: [
        [{ text: 'Изменить дату', callback_data: keyboard_anwers.Изменить_дату }],
        [{ text: 'Изменить время', callback_data: keyboard_anwers.Изменить_время }],
        [{ text: 'Изменить текст', callback_data: keyboard_anwers.Изменить_текст }],
        [{ text: 'Назад', callback_data: keyboard_anwers.Назад_создание_заметки }]
    ]
})

var change_date_markup = JSON.stringify({
    inline_keyboard: [
        [{ text: 'Сегодня', callback_data: keyboard_anwers.Сегодня }],
        [{ text: 'Завтра', callback_data: keyboard_anwers.Завтра }, { text: 'Послезавтра', callback_data: keyboard_anwers.Послезавтра }],
        [{ text: 'Другая дата', callback_data: keyboard_anwers.Другая_дата }], 
        [{ text: 'Назад', callback_data: keyboard_anwers.Назад_изменение_даты }]
    ]
})


bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    let text;
    // const opts = {
    //     chat_id: msg.chat.id,
    //     message_id: msg.message_id,
    // };

    if (action == keyboard_anwers.Создать_заметку) {
        let opts = { // @todo put this into func
            reply_markup: create_note_markup
        }
        text = JSON.stringify(getUserBufferNote(msg.chat.id))
        if (text == undefined) {
            text = "default debug note"
        }
        bot.sendMessage(msg.chat.id, text, opts)
    } else if (action == keyboard_anwers.Получить_котика) {
        sendCat(msg.chat.id)
    } else if (action == keyboard_anwers.Изменить_дату) {
        let opts = {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            reply_markup: change_date_markup
        }
        text = JSON.stringify(getUserBufferNote(msg.chat.id))
        if (text == undefined) {
            text = "default debug note"
        }
        bot.editMessageText(text,opts)
    } else if (action == keyboard_anwers.Назад_создание_заметки){
        onStartMsg(msg.chat.id)
    } else if (action == keyboard_anwers.Назад_изменение_даты ){
        let opts = { // @todo put this into func
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            reply_markup: create_note_markup
        }
        text = JSON.stringify(getUserBufferNote(msg.chat.id))
        if (text == undefined) {
            text = "default debug note"
        }
        bot.editMessageText(text, opts)
    }


});




