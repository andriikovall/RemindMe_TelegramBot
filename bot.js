/**
 * WARNING!! Your eyes may bleed because of some shitty code
 * Some features like checking and editing all your notes are
 * not implemented yet.
 * There are still a lot to do but it works...)
 * I am  waiting for all your comments and suggestions!
 * Btw, yeah, bot UI sucks
 */

const config_dir = `${__dirname}/../config/`
const bot_token_file = 'bot_token.json'
const users_file = 'users.json'
const notes_file = 'notes.json'

var fs = require("fs");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const TOKEN = require(config_dir + bot_token_file)['token']
// const request = require('request') @todo

var TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(TOKEN, { polling: true, timeout: 500 });

rawdata = fs.readFileSync(config_dir + users_file); //@todo fix this
var USERS = JSON.parse(rawdata ,function(key, value) {
    if (key == "date") {
        return new Date(value)
    } else {
        return value
    }
})


rawdata = fs.readFileSync(config_dir + notes_file);
var NOTES = JSON.parse(rawdata ,function(key, value) {
    if (key == "date") {
        return new Date(value)
    } else {
        return value
    }
})

var start_date = new Date()

var default_note = {
    text: '',
    date: start_date,
    time: {h: start_date.getHours(), m: start_date.getMinutes()},
    user_id: 0
}
setInterval(function() {
    var curr_date = new Date()
    default_note.date = curr_date
    default_note.time.h = curr_date.getHours()
    default_note.time.m = curr_date.getMinutes()
}, 1,44e+7)

function checkNotes() {
    let curr_date = new Date()
    for (let i in NOTES) {
        let curr_note_date = NOTES[i].date
        if (curr_note_date.getUTCDate() == curr_date.getUTCDate() && 
            curr_note_date.getUTCHours() == curr_date.getUTCHours() && 
            curr_note_date.getUTCMinutes() == curr_date.getUTCMinutes()) {
                bot.sendMessage(NOTES[i].user_id, `Напоминание!!\n\n \n\n${NOTES[i].text}\n`)
                console.log("Send message when dates are equal")
                console.log("Curr date -- " + curr_date)
                console.log("Curr note date -- " + curr_note_date)
                NOTES.splice(i, 1)
                saveNotes()
            }
            console.log("curr date" + curr_date)
            console.log('curr_note_date' + curr_note_date)
            console.log('\n')
    }
}

setInterval(checkNotes, 55000)

function getUserBufferNote(id) {
    for (let i in USERS) {
        if (USERS[i].id == id) {
            return USERS[i].buffer_note
        } // @todo replace all for(...) with forEach(...)
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
    return null
}
function checkUserData(user) {
    user.buffer_note.user_id = user.id
    if (!usersContain(user)) {
        user.cat_count = 0
        USERS.push(user)
        const greeting_msg = 'Привет, это бот для создание напоминалок! Можеш начинать им пользоваться)'
        bot.sendMessage(user.id, greeting_msg)
    }
    let user_data = JSON.stringify(USERS, null, '   ')
    fs.writeFileSync(config_dir + users_file, user_data)
}

function saveNotes() {
    let notes_data = JSON.stringify(NOTES, null, '   ')
    fs.writeFileSync(config_dir + notes_file, notes_data)
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
    "Назад_изменение_время": 12,
    "Созать_заметку": 13,
    "Час_+": 14,
    "Час_-": 15,
    "Минуты_+": 16,
    "Минуты_-": 17, 
    "Добавить_заметку": 18
}


function onStartMsg(id) {
    var options = {
        reply_markup: on_start_markup
    };

    bot.sendMessage(id, "Выбери опцию", options);
}

function onStart(user) {
    user.buffer_note = default_note
    checkUserData(user)
    onStartMsg(user.id)
}

function noteToStr(note) {
    let date_str = note.date.toLocaleDateString()
    let str = `Заметка:\n\nТекст: ${note.text}\nДата: ${date_str}\nВремя: ${note.time.h} : ${note.time.m}`
    console.log(str)
    return str
}

function note_menu_new_msg(id) {
    let opts = { // @todo put this into func
        reply_markup: create_note_markup
    }
    let note = getUserBufferNote(id)
    if (note == null)  {
        bot.editMessageText("error", opts)
        return
    } else {
        let text = noteToStr(note)
        bot.sendMessage(id, text, opts)
    }
}

function note_menu_edit_msg(chat_id, message_id) {
    let opts = { // @todo put this into func
        chat_id: chat_id,
        message_id: message_id,
        reply_markup: create_note_markup
    }
    let note = getUserBufferNote(chat_id)
    if (note == null)  {
        bot.editMessageText("error", opts)
    } else {
        let text = noteToStr(note)
        bot.editMessageText(text, opts)
    }
    
}

function time_menu(chat_id, message_id) {
    let user = getUserById(chat_id) //@todo separate in 2 funcs
    let reply_markup = getTimeMarkup(user.buffer_note.time.h, user.buffer_note.time.m)
    let opts = {
        chat_id: chat_id,
        message_id: message_id,
        reply_markup: reply_markup
    }
    let text = 'Выберете время\n\nИли введите\n\n /h "Час"\n/m "Минуты"'
    bot.editMessageText(text, opts)
}

bot.onText(/start/, function (msg, match) {
    onStart(msg.from);
});

bot.onText(/\/h (.+)/, function(msg, match) {
    const hours = Number(match[1]);
    let user = getUserById(msg.chat.id) //@todo separate in 2 funcs
    user.buffer_note.time.h = hours
    user.buffer_note.time.h = checkHours(user.buffer_note.time.h)
    let reply_markup = getTimeMarkup(user.buffer_note.time.h, user.buffer_note.time.m)
    let opts = {
        reply_markup: reply_markup
    }
    let text = 'Выберете время\n\nИли введите\n\n /h "Час"\n/m "Минуты"'
    bot.sendMessage(msg.chat.id, text, opts)
    checkUserData(user)
  });

bot.onText(/\/m (.+)/, function(msg, match) {
    const minutes = Number(match[1]);
    let user = getUserById(msg.chat.id) //@todo separate in 2 funcs
    user.buffer_note.time.m = minutes
    user.buffer_note.time.m = checkMinutes(user.buffer_note.time.m)
    let reply_markup = getTimeMarkup( user.buffer_note.time.h, user.buffer_note.time.m)
    let opts = {
        reply_markup: reply_markup
    }
    let text = 'Выберете время\n\nИли введите\n\n /h "Час"\n/m "Минуты"'
    bot.sendMessage(msg.chat.id, text, opts)
    checkUserData(user)
  });

bot.on('message', function(msg){
    let user = getUserById(msg.chat.id)
    if (user == null) return
    if ('state' in user) {

        if (user.state == keyboard_anwers.Изменить_текст) {
            user.buffer_note.text = msg.text
            user.state = 0
            var opts = {
                reply_markup: create_note_markup
            }
            checkUserData(user)
            note_menu_new_msg(user.id)
        }
    }
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
        bot.sendPhoto(id, image_url) 
    });
}


bot.onText(/cat/, function (msg, match) {
    sendCat(msg.chat.id)
});

const on_start_markup = JSON.stringify({
    inline_keyboard: [
        [{ text: 'Создать заметку', callback_data: keyboard_anwers.Создать_заметку }],
        [{ text: 'Получить картинку котика)', callback_data: keyboard_anwers.Получить_котика }]
    ]
})


const create_note_markup = JSON.stringify({
    inline_keyboard: [
        [{ text: 'Изменить дату', callback_data: keyboard_anwers.Изменить_дату }, { text: 'Изменить время', callback_data: keyboard_anwers.Изменить_время }],
        [{ text: 'Изменить текст', callback_data: keyboard_anwers.Изменить_текст }],
        [{ text: 'Назад', callback_data: keyboard_anwers.Назад_создание_заметки }, { text: 'Добавить заметку', callback_data: keyboard_anwers.Добавить_заметку }]
    ]
})

const change_date_markup = JSON.stringify({
    inline_keyboard: [
        [{ text: 'Сегодня', callback_data: keyboard_anwers.Сегодня }],
        [{ text: 'Завтра', callback_data: keyboard_anwers.Завтра }, { text: 'Послезавтра', callback_data: keyboard_anwers.Послезавтра }],
        [{ text: 'Другая дата', callback_data: keyboard_anwers.Другая_дата }], 
        [{ text: 'Назад', callback_data: keyboard_anwers.Назад_изменение_даты }]
    ]
})

function getTimeMarkup(h, m) {
    var hours = h >= 10 ? h.toString() : '0' + h.toString()
    var minutes = m >= 10 ? m.toString() : '0' + m.toString()
    let reply_markup = {
        inline_keyboard: [
            [{ text: '+', callback_data: keyboard_anwers["Час_+"] }, { text: '+', callback_data: keyboard_anwers["Минуты_+"] }],
            [{ text: hours, callback_data: 0 }, { text: minutes, callback_data: 0 }],
            [{ text: '-', callback_data: keyboard_anwers["Час_-"] }, { text: '-', callback_data: keyboard_anwers["Минуты_-"] }], 
            [{ text: 'Ок', callback_data: keyboard_anwers.Назад_изменение_даты }]
        ]
    }
    return JSON.stringify(reply_markup)
}

function checkMinutes(min) {
    if (min > 59) {
        min = 0
    } else if (min < 0) {
        min = 59
    }
    return min
}

function checkHours(hour) {
    if (hour > 23) {
        hour = 0
    } else if (hour < 0) {
        hour = 23
    }
    return hour
}


bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    let text;

    if (action == keyboard_anwers.Создать_заметку) {
        note_menu_new_msg(msg.chat.id)
    } else if (action == keyboard_anwers.Получить_котика) {
        sendCat(msg.chat.id)
    } else if (action == keyboard_anwers.Изменить_дату) {
        let opts = {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            reply_markup: change_date_markup
        }
        text = noteToStr(getUserBufferNote(msg.chat.id))
        bot.editMessageText(text,opts)
    } else if (action == keyboard_anwers.Назад_создание_заметки){
        onStartMsg(msg.chat.id)
    } else if (action == keyboard_anwers.Назад_изменение_даты ){ 
        note_menu_edit_msg(msg.chat.id, msg.message_id)
    } else if (action == keyboard_anwers.Изменить_текст) {
        let user = getUserById(msg.chat.id)
        user['state'] = keyboard_anwers.Изменить_текст
        text = "Введите текст для заметки"
        bot.sendMessage(msg.chat.id, text)
        checkUserData(user)
    } else if (action == keyboard_anwers.Сегодня) {
        let user = getUserById(msg.chat.id)
        user.buffer_note.date = new Date()
        checkUserData(user)
        note_menu_edit_msg(msg.chat.id, msg.message_id)
    } else if (action == keyboard_anwers.Завтра) {
        let user = getUserById(msg.chat.id)
        let date = new Date()
        date.setDate(date.getDate() + 1)
        user.buffer_note.date = date
        checkUserData(user)
        note_menu_edit_msg(msg.chat.id, msg.message_id)
    } else if (action == keyboard_anwers.Послезавтра) {
        let user = getUserById(msg.chat.id)
        let date = new Date()
        date.setDate(date.getDate() + 2)
        user.buffer_note.date = date
        checkUserData(user)
        note_menu_edit_msg(msg.chat.id, msg.message_id)
    } else if (action == keyboard_anwers.Изменить_время) {
        time_menu(msg.chat.id, msg.message_id)
    } else if (action == keyboard_anwers["Час_+"]) {
        let user = getUserById(msg.chat.id)
        user.buffer_note.time.h += 1
        user.buffer_note.time.h = checkHours(user.buffer_note.time.h)
        checkUserData(user)
        time_menu(msg.chat.id, msg.message_id)
    } else if (action == keyboard_anwers["Час_-"]) {
        let user = getUserById(msg.chat.id)
        user.buffer_note.time.h -= 1
        user.buffer_note.time.h = checkHours(user.buffer_note.time.h)
        checkUserData(user)
        time_menu(msg.chat.id, msg.message_id)
    } else if (action == keyboard_anwers["Минуты_+"]) {
        let user = getUserById(msg.chat.id)
        user.buffer_note.time.m += 1
        user.buffer_note.time.m = checkMinutes(user.buffer_note.time.m)
        checkUserData(user)
        time_menu(msg.chat.id, msg.message_id)
    } else if (action == keyboard_anwers["Минуты_-"]) {
        let user = getUserById(msg.chat.id)
        user.buffer_note.time.m -= 1
        user.buffer_note.time.m = checkMinutes(user.buffer_note.time.m)
        checkUserData(user)
        time_menu(msg.chat.id, msg.message_id)
    } else if (action == keyboard_anwers.Добавить_заметку) {
        let user = getUserById(msg.chat.id)
        user.buffer_note.date.setHours(user.buffer_note.time.h)
        user.buffer_note.date.setMinutes(user.buffer_note.time.m)
        // user.buffer_note.date = user.buffer_note.date.toUTCString()
        NOTES.push(user.buffer_note)
        saveNotes()
        user.buffer_note = default_note
        checkUserData(user)
        onStartMsg(msg.chat.id)
    }
        
});
    
    




