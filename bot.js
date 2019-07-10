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

var requirejs = require('requirejs');
var request = require('request');


var fs = require("fs");
var emodji = require('./emodji.json')
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
        if (curr_note_date.getDate() == curr_date.getDate() && 
            curr_note_date.getHours() == curr_date.getHours() && 
            curr_note_date.getMinutes() == curr_date.getMinutes()) {
                bot.sendMessage(NOTES[i].user_id, `Напоминание!!\n\n \n\n${NOTES[i].text}\n`)//@todo refactor a bit
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
        const greeting_msg = 'Привет, это бот для создание напоминалок!'
        bot.sendMessage(user.id, greeting_msg)
    }
    let user_data = JSON.stringify(USERS, null, '   ')
    fs.writeFileSync(config_dir + users_file, user_data)
}

function saveNotes() {
    let notes_data = JSON.stringify(NOTES, null, '   ')
    fs.writeFileSync(config_dir + notes_file, notes_data)
}
//@todo put in separate JSON file
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
    "Изменить_часы": 14,
    "Изменить_минуты": 15,
    "Минуты_+": 16,
    "Минуты_-": 17, 
    "Добавить_заметку": 18,
    "Отправить_геолокацию": 19,
    "Отправить_время":20, 
    "Календарь_вправо": 21,
    "Календарь_влево": 22 
}


function onStartMsg(id) {
    var options = {
        reply_markup: on_start_markup,
        parse_mode: 'markdown'
    };

    bot.sendMessage(id, "*Выбери опцию*", options);
}

function setUserMinuteOffset(user, user_mins) {
    var server_mins = function() {
        var curr_date = new Date
        var minutes = curr_date.getMinutes()
        var hours = curr_date.getHours()
        return hours * 60 + minutes
    }
    console.log(server_mins())
    console.log(user_mins)
    user['minute_offset'] = user_mins - server_mins()
    user.state = 0
    checkUserData(user)
    var reply = 'Спасибо, теперь можете начать пользоваться ботом!'
    bot.sendMessage(user.id, reply)
    note_menu_new_msg(user.id)
}

function locationRequest(user_id, lat, long) {
    var user = getUserById(user_id)
    if (user == null) {
        console.error('user is null error')
        return
    }
    request({
        uri: "http://api.geonames.org/timezoneJSON",
        method: "POST",
        form: {
            lat: lat, 
            lng: long,
            username: 'ZioVio'
        }
    }, function(error, response, body) {
    if (typeof response !== 'undefined')  {
        if (response.body.status === undefined) {
            //@todo handle errors
            let user_date = new Date(JSON.parse(response.body).time)
            setUserMinuteOffset(user, user_date.getHours() * 60 + user_date.getMinutes())
        }
    }
    })
}

function onStart(user) {
    user.buffer_note = default_note
    user.buffer_note.user_id = user.id
    user.state = 0
    if ('minute_offset' in user) {
        onStartMsg(user.id)
    } else {
        getUserTimeOffset(user.id)
    }
    checkUserData(user)
}

function getMonthName(month) {
    let raw_month = calendar.monthNames[month]
    if (raw_month.endsWith('т')) {
        raw_month += 'а'
    } else {
        raw_month = raw_month.slice(0, -1)
        raw_month += 'я'
    }
    return raw_month
}
function dateToRussian(date) {
    let day_name = calendar.dayNames[getDayNumFromMonday(date.getDay())]
    let month_name = getMonthName(date.getMonth())
    let date_str_rus = `${day_name}, ${date.getDate()} ${month_name} ${date.getFullYear()}`
    return date_str_rus
}

function noteToStr(note) {
    let date_str = dateToRussian(note.date)
    if (note.time.h.toString().length < 2) {
        note.time.h = '0' + note.time.h
    }
    if (note.time.m.toString().length < 2) {
        note.time.m = '0' + note.time.m
    }
    let str = `*Текущая заметка*${emodji.note}\n\n*Дата:* _${date_str}_\n*Время:* _${note.time.h} : ${note.time.m}_\n*Текст:* ${note.text}`
    console.log(str)
    return str
}

function note_menu_new_msg(id) {
    let opts = { // @todo put this into func
        reply_markup: create_note_markup,
        parse_mode: "markdown"
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
        reply_markup: create_note_markup,
        parse_mode: "markdown"
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
    let text = 'Нажмите на значение, что бы его изменить ' + emodji.finger_down
    bot.editMessageText(text, opts)
}


bot.onText(/start/, function (msg, match) {
    onStart(msg.from);
});


function changeUserBufferMinutes(user_id, minutes) {
    if (isNaN(minutes)) {
        return
    }
    let user = getUserById(user_id) 
    user.buffer_note.time.m = minutes
    user.buffer_note.time.m = checkMinutes(user.buffer_note.time.m)
}

function changeUserBufferHours(user_id,   hours) {
    if (isNaN(hours)) {
        return
    }
    let user = getUserById(user_id) 
    user.buffer_note.time.h = hours
    user.buffer_note.time.h = checkHours(user.buffer_note.time.h)
}

function onTimeChange(user) {
    checkUserData(user)
    let reply_markup = getTimeMarkup(user.buffer_note.time.h, user.buffer_note.time.m)
    let opts = {
        reply_markup: reply_markup
    }
    let text = 'Нажмите на значение, что бы его изменить'
    bot.sendMessage(user.id, text, opts)
    checkUserData(user)
}
bot.on('message', function(msg){
    let user = getUserById(msg.chat.id)
    if (user == null) return
    if (msg.text == 'Передать точное время') {
        user.state = keyboard_anwers.Отправить_время
        checkUserData(user)
        var  reply = 'Отправьте свое точное время в формате \'чч:мм\' или \'чч-мм\' или \'чч мм\''
        bot.sendMessage(user.id, reply)
        return;
    }
    if ('state' in user) {

        if (user.state == keyboard_anwers.Изменить_текст) {
            user.buffer_note.text = msg.text
            user.state = 0
            var opts = {
                reply_markup: create_note_markup
            }
            checkUserData(user)
            note_menu_new_msg(user.id)
        } else if (user.state == keyboard_anwers.Отправить_время) {
            let time = msg.text // @todo fix
            let err_text = 'Неправильное время'
            if (time.length < 3) {
                bot.sendMessage(msg.chat.id, err_text)
            }
            let time_arr = []
            for (let char of ['-', ':', ' ', '^', '.', '/', '\\', '*']) {
                time_arr = time.split(char)
                if (time_arr.length == 2)
                    break        
            }
            var h = 0, m = 0
            if (time_arr.length != 2) {
                bot.sendMessage(msg.chat.id, err_text)
                return
            }
            h = Number(time_arr[0])
            m = Number(time_arr[1])
            if (isNaN(h) || isNaN(m)) {
                bot.sendMessage(msg.chat.id, err_text)
                return
            }
            var user_mins = h * 60 + m
            setUserMinuteOffset(user, user_mins)
        } else if (user.state == keyboard_anwers.Изменить_минуты) {
            changeUserBufferMinutes(msg.chat.id, Number(msg.text))
            onTimeChange(user)
        } else if (user.state == keyboard_anwers.Изменить_часы) {
            changeUserBufferHours  (msg.chat.id, Number(msg.text))
            onTimeChange(user)
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

function getUserTimeOffset(chat_id) {
    var opts = {
        "reply_markup": {
            one_time_keyboard: true,
            resize_keyboard: true,
            keyboard: [[{
                text: "Передать геолокацию",
                request_location: true
            }], [{text: "Передать точное время"}]]
        }
    };
    var text = "Для коректной работы напоминаний и синхронизацией с сервером необходимо получить Ваш часовой пояс.\n\n\
Вы можете передать нам свою геолокацию для автоматического определения часового пояса, а можете отправить свое точное время в даный момент"
    bot.sendMessage(chat_id, text, opts)
}

bot.onText(/timestamp/, function (msg, match) {
    getUserTimeOffset(msg.chat.id)
});

const on_start_markup = JSON.stringify({
    inline_keyboard: [
        [{ text: 'Создать заметку ' + emodji.note, callback_data: keyboard_anwers.Создать_заметку, request_location: true }],
        [{ text: 'Получить картинку котика) ' + emodji.cat, callback_data: keyboard_anwers.Получить_котика, request_location: true }]
    ]
})


const create_note_markup = JSON.stringify({
    inline_keyboard: [
        [{ text: 'Изменить дату ' + emodji.calendar, callback_data: keyboard_anwers.Изменить_дату }, { text: 'Изменить время ' + emodji.clock, callback_data: keyboard_anwers.Изменить_время }],
        [{ text: 'Изменить текст ' + emodji.writting_hand, callback_data: keyboard_anwers.Изменить_текст }],
        [{ text: 'Назад', callback_data: keyboard_anwers.Назад_создание_заметки }, { text: 'Добавить заметку' + emodji.check, callback_data: keyboard_anwers.Добавить_заметку }]
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
    var hours = h.toString().length < 2 ? '0' + h : h
    var minutes = m.toString().length < 2 ? '0' + m : m
    let reply_markup = {
        inline_keyboard: [
            [{ text: hours, callback_data: keyboard_anwers.Изменить_часы }, { text: minutes, callback_data: keyboard_anwers.Изменить_минуты }],
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

bot.on('location', function(msg) {
    var longitude = msg.location.longitude
    var latitude = msg.location.latitude
    console.group('Location')
    console.log("Recieved location")
    console.log(latitude)
    console.log(longitude)
    console.groupEnd()
    locationRequest(msg.chat.id, latitude, longitude)
})

bot.on('polling_error', function(err) {
    console.log(err)
})


bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    let text;
    let query_reply_text = ""

    if (action == keyboard_anwers.Создать_заметку) {
        note_menu_new_msg(msg.chat.id)
    } else if (action == keyboard_anwers.Получить_котика) {
        sendCat(msg.chat.id)
    } else if (action == keyboard_anwers.Изменить_дату) {
        let opts = {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            reply_markup: change_date_markup,
            parse_mode: "markdown"
            
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
        user.buffer_note.date.setMinutes(user.buffer_note.time.m - user.minute_offset) 
        NOTES.push(user.buffer_note)
        saveNotes()
        user.buffer_note = default_note
        checkUserData(user)
        onStartMsg(msg.chat.id)
        query_reply_text = "Заметка создана!"
    } else if (action == keyboard_anwers.Отправить_геолокацию) {
        var user = getUserById(msg.chat.id)
        if (user == null) {
            console.error("User is null: error")
            return
        } else {
            user.state = keyboard_anwers.Отправить_геолокацию
            checkUserData(user)
        }
    } else if (action.indexOf('_') != -1) {
        var tmp_date = action.split('_')
        var year = tmp_date[0], month = tmp_date[1]
        console.log(year, month)
        CalendarMenuEditMsg(msg.chat.id, msg.message_id, year, month)
    } else if (action == keyboard_anwers.Другая_дата) {
        var curr_date = new Date()
        CalendarMenuEditMsg(msg.chat.id, msg.message_id, curr_date.getFullYear(), curr_date.getMonth())
    } else if (action == keyboard_anwers.Изменить_минуты || action == keyboard_anwers.Изменить_часы) {
        let user = getUserById(msg.chat.id)
        if (user == null) {
            console.error('user is null: error')
            return
        } if (action == keyboard_anwers.Изменить_минуты) {
            text = 'Введите минуты'
            user.state = keyboard_anwers.Изменить_минуты
        } else {
            text = 'Введите часы'
            user.state = keyboard_anwers.Изменить_часы
        }
        checkUserData(user)
        bot.sendMessage(user.id, text)
    } else {
        var btn_date = new Date(action)
        if (isValidDate(btn_date) && action != 0) {
            var user = getUserById(msg.chat.id)
            if (user == null) {
                console.error("User is null: error")
                return 
            } else {
                user.buffer_note.date.setFullYear(btn_date.getFullYear())
                user.buffer_note.date.setMonth(btn_date.getMonth(), btn_date.getDate())
                checkUserData(user)
                note_menu_edit_msg(msg.chat.id, msg.message_id)
            }
        }
    }
        

    bot.answerCallbackQuery(callbackQuery.id, query_reply_text)
        
});

function CalendarMenuEditMsg(chat_id, message_id, year, month) {
    var options = {
        reply_markup: getMonthMarkup(year, month),
        chat_id: chat_id, 
        message_id: message_id,
        parse_mode: "markdown"
    }
    bot.editMessageText("*Выберите дату*", options)
}




// bot.sendMessage(379946182, "test calendar", options)

var calendar = new Calendar()
function Calendar() {
    this.dayNames   = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    this.monthNames = [
        "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ]
}
function getMonthMarkup(year, month) {
    var inline_keyboard = []
    var days_btns = []
    var month_btn = [{text: calendar.monthNames[month] + " " + year, callback_data: 0}]
    inline_keyboard.push(month_btn)
    calendar.dayNames.forEach(element => {
        days_btns.push({text: element, callback_data: 0})
    });
    inline_keyboard.push(days_btns)
    var date = new Date(year, month)
    var day = date.getDay()
    var array_of_days = new Array(5)
    for (var i = 0; i < 6; i++) {
        array_of_days[i] = new Array(7)
        for (let j = 0; j < 7; j++) {
            array_of_days[i][j] = {text: ' ', callback_data: 0}
        }
    }
    i = getDayNumFromMonday(day)
    let day_counter = 1
    array_of_days[0][i].text = '1'
    array_of_days.forEach(element => {
        var week_is_in_month = false
        for (;i < 7; i++) {
            date.setDate(day_counter)
            if (date.getMonth() == month) {
                week_is_in_month = true
                element[i].text = (day_counter).toString()
                element[i].callback_data = new Date(year, month, day_counter).toDateString()
                day_counter++
            }
        }

        i = 0
        if (week_is_in_month)
            inline_keyboard.push(element)
    })
    var new_right_year = Number(year)
    var new_left_year = new_right_year
    var new_right_month = Number(month) + 1
    if (new_right_month == 12) {
        new_right_month = 0
        new_right_year += 1
    }
    var new_left_month = (month - 1) < 0 ? 11 : month - 1
    if (new_left_month == 11) 
        new_left_year -= 1 
    var right_btn = {text: ">>>", callback_data: `${new_right_year}_${new_right_month}`}
    var left_btn =  {text: "<<<", callback_data: `${new_left_year}_${new_left_month}`}
    inline_keyboard.push([left_btn, right_btn])
    inline_keyboard.push([{text: 'Назад', callback_data: keyboard_anwers.Изменить_дату}])
    var reply_markup = {}
    reply_markup.inline_keyboard = inline_keyboard
    return JSON.stringify(reply_markup)
}

function isValidDate(date) {
	return Object.prototype.toString.call(date) === '[object Date]' && date.getTime() === date.getTime()
}

    


function getDayNumFromMonday(day_number) {
    if (day_number == 0) {
        return 6
    } else {
        return day_number - 1
    }
}

    




