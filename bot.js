/**
 * WARNING!! Your eyes may bleed because of some shitty code
 * Some features like checking and editing all your notes are
 * not implemented yet.
 * There are still a lot to do but it works...)
 * I am  waiting for all your comments and suggestions!
 * Btw, yeah, bot UI sucks
 */
require('dotenv').config();

/**@todo in future
 * delete unnecessary messages
 * refactor to another lib
 **/

const paths = require('./paths.json');
const states = require(paths.STATES_FILE);
const USERS_FILE = paths.USERS_FILE;
const NOTES_FILE = paths.NOTES_FILE;
const CAT_URL = paths.CAT_URL;
const TOKEN = process.env.BOT_TOKEN || '868898801:AAEZdDClQ8unR4uGPpraHki2LAIf81epEkw';
const {	storage } = require('./utils/db_storage');
const DB = new storage();



const TelegramBot = require('node-telegram-bot-api');
const {
	Calendar
} = require('small_calendar_js')
const request = require('request');
const fs = require("fs");
const emodji = require(paths.EMODJI_FILE)
const fetch = require('node-fetch');

if (!fs.existsSync('config')) { //@todo another check. This is hardcoded dir for a data
	fs.mkdirSync('config')
}

const calendar = new Calendar({
	dayToStartWeek: 1
})

const bot = new TelegramBot(TOKEN, {
	polling: true,
	timeout: 500
});

let USERS = getFileObj(USERS_FILE, getDateFromJSON, {});
let NOTES = getFileObj(NOTES_FILE, getDateFromJSON, []);

function getFileObj(path, callbackParser, errorReturnValue) {
	try {
		let rawdata = fs.readFileSync(path, {
			encoding: 'utf-8'
		});
		return JSON.parse(rawdata, callbackParser);
	} catch (err) {
		return errorReturnValue;
	}
}

function getDateFromJSON(key, value) {
	if (key == 'date') {
		return new Date(value)
	} else {
		return value
	}
}


setInterval(function() {
	let currDate = new Date(Date.now())
	defaultNote.date = currDate
	defaultNote.time.h = currDate.getHours()
	defaultNote.time.m = currDate.getMinutes()
}, 60000)

let start_date = new Date(Date.now())
let defaultNote = {
	text: '',
	date: start_date,
	time: {
		h: start_date.getHours(),
		m: start_date.getMinutes()
	},
	user_id: 0
}

function checkNotes() {
	let currDate = new Date()
	for (let i in NOTES) {
		let curr_note_date = NOTES[i].date
		if (curr_note_date.getDate() == currDate.getDate() &&
			curr_note_date.getHours() == currDate.getHours() &&
			curr_note_date.getMinutes() == currDate.getMinutes()) {
			let reminder_text = `*Напоминание:*\n${NOTES[i].text}`
			let opts = {
				parse_mode: 'markdown'
			}
			bot.sendMessage(NOTES[i].user_id, reminder_text, opts)
			console.log("Send message when dates are equal")
			console.log("Curr date -- " + currDate)
			console.log("Curr note date -- " + curr_note_date)
			NOTES.splice(i, 1)
			saveNotes()
		}
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

// function usersContain(user) {
// 	for (let i in USERS) {
// 		if (USERS[i].id == user.id) {
// 			user.cat_count = USERS[i].cat_count;
// 			USERS[i] = user;
// 			return true;
// 		}
// 	}
// 	return false;
// }

// function DB.saveUser(user) {
// 	let userData = JSON.stringify(USERS, null, '   ')
// 	fs.writeFileSync(USERS_FILE, userData)

// }

function checkUserData(user) {
	user.buffer_note.user_id = user.id;
	DB.getUserById(user.id, (db_user) => {
		if (!db_user) {
			user.cat_count = 0;
			const greetingMsg = 'Привет, это бот для создание напоминалок! Для начала работы боту нужно получить Ваше точное время либо геолокацию в данный момент'
			bot.sendMessage(user.id, greetingMsg);
			getUserTimeOffset(user.id);
			user.buffer_note = defaultNote;
			delete user.is_bot;
			DB.insertUser(user);
		}
		DB.saveUser(user);
	}); 
}

function saveNotes() {
	let notesData = JSON.stringify(NOTES, null, '   ')
	fs.writeFileSync(NOTES_FILE, notesData)
}


function onStartMsg(id) {
	let options = {
		reply_markup: on_start_markup,
		parse_mode: 'markdown'
	};

	bot.sendMessage(id, "*Выбери опцию*", options);
}

function setUserMinuteOffset(user, user_mins) {
	let server_mins = function() {
		let currDate = new Date
		let minutes = currDate.getMinutes()
		let hours = currDate.getHours()
		return hours * 60 + minutes
	}
	user['minute_offset'] = user_mins - server_mins()
	user.state = 0
	checkUserData(user)
	const reply = 'Спасибо, теперь можете начать пользоваться ботом!'
	bot.sendMessage(user.id, reply)
	onStartMsg(user.id)
}

function locationRequest(user_id, lat, long) {
	DB.getUserById(user_id, (user) => {

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
				username: process.env.GEONAMES_API_USERNAME
			}
	}, function(error, response, body) {
		if (response.statusCode != 200) {
			console.error(error)
			bot.sendMessage(user_id, 'Ошибка с определением времени по местоположению')
			user.state = states.Поделится_своим_временем
			DB.saveUser(user)
		} else if (typeof response !== 'undefined') {
			if (response.body.status === undefined) {
				let user_date = new Date(JSON.parse(response.body).time)
				setUserMinuteOffset(user, user_date.getHours() * 60 + user_date.getMinutes())
			}
		}
	})
});
}

function onStart(user) {
	user.buffer_note = JSON.parse(JSON.stringify(defaultNote), getDateFromJSON)
	user.buffer_note.user_id = user.id
	user.state = 0
	checkUserData(user)
	getUserTimeOffset(user.id)
	// onStartMsg(user.id)
}


function getMonthName(month) {
	let monthRussianString = calendar.opts.monthNames[month] // @todo fix
	if (monthRussianString.endsWith('т')) {
		monthRussianString += 'а'
	} else {
		monthRussianString = monthRussianString.slice(0, -1)
		monthRussianString += 'я'
	}
	return monthRussianString
}

function dateToRussian(date) { // @todo fix!!!!!!!
	let dayString = calendar.opts.dayNames[getDayNumFromMonday(date.getDay())];
	calendar.ali
	let monthString = getMonthName(date.getMonth())
	let dateString = `${dayString}, ${date.getDate()} ${monthString} ${date.getFullYear()}`
	return dateString
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
	let note = getUserBufferNote(id) //@todo maybe always default note
	if (note == null) {
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
	let note = getUserBufferNote(chat_id);
	if (note == null) {
		bot.editMessageText("error", opts);
	} else {
		let text = noteToStr(note)
		bot.editMessageText(text, opts)
	}

}

function time_menu(chat_id, message_id) {
	DB.getUserById(chat_id, (user) => {
		let reply_markup = getTimeMarkup(user.buffer_note.time.h, user.buffer_note.time.m)
		let opts = {
			chat_id: chat_id,
			message_id: message_id,
			reply_markup: reply_markup
		}
		let text = 'Нажмите на значение, что бы его изменить ' + emodji.finger_down;
		bot.editMessageText(text, opts)
	}) //@todo separate in 2 funcs
}


bot.onText(/start/, function(msg, match) {
	onStart(msg.from);
});


function changeUserBufferMinutes(user_id, minutes) {
	if (isNaN(minutes)) {
		return;
	}
	DB.getUserById(user_id, (user) => {

		user.buffer_note.time.m = minutes;
		user.buffer_note.time.m = checkMinutes(user.buffer_note.time.m);
		checkUserData(user);
	}) //@todo beautify
}

function changeUserBufferHours(user_id, hours) {
	if (isNaN(hours)) {
		return;
	}
	let user = DB.getUserById(user_id)
	user.buffer_note.time.h = hours
	user.buffer_note.time.h = checkHours(user.buffer_note.time.h)
	checkUserData(user)
}

function onTimeChange(user_id) {
	DB.getUserById(user_id, (user) => {

		if (user == null) {
			console.error('user is null: error')
			return
		}
		let reply_markup = getTimeMarkup(user.buffer_note.time.h, user.buffer_note.time.m)
		let opts = {
			reply_markup: reply_markup
		}
		let text = 'Нажмите на значение, что бы его изменить' + emodji.finger_down
		bot.sendMessage(user.id, text, opts)
		user.state = 0
		checkUserData(user)
	})	
}
bot.on('message', function(msg) {
	DB.getUserById(msg.chat.id, (user) => {

		if (user == null) return;
		if (msg.text == 'Передать точное время') {
			if (user.state != states.Поделится_своим_временем) {
			return;
		}
		let reply = 'Отправьте свое точное время в формате \'чч:мм\' или \'чч-мм\' или \'чч мм\' в 24-часовом формате'
		bot.sendMessage(user.id, reply)
		return;
	}
	if ('state' in user) {
		
		if (user.state == states.Изменить_текст) {
			user.buffer_note.text = msg.text
			user.state = 0
			let opts = {
				reply_markup: create_note_markup
			}
			checkUserData(user)
			note_menu_new_msg(user.id)
		} else if (user.state == states.Поделится_своим_временем && msg.text) {
			let time = msg.text
			let err_text = 'Неправильное время'
			if (time.length < 3) {
				bot.sendMessage(msg.chat.id, err_text)
			}
			let time_arr = []
			for (let char of ['-', ':', ' ', '^', '.', '/', '\\', '*', ';', '+', '_', '%', '#', '@', '?']) {
				time_arr = time.split(char)
				if (time_arr.length == 2)
				break
			}
			let h = 0,
			m = 0
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
			let user_mins = h * 60 + m
			setUserMinuteOffset(user, user_mins)
		} else if (user.state == states.Изменить_минуты) {
			changeUserBufferMinutes(msg.chat.id, Number(msg.text))
			onTimeChange(msg.chat.id)
		} else if (user.state == states.Изменить_часы) {
			changeUserBufferHours(msg.chat.id, Number(msg.text))
			onTimeChange(msg.chat.id)
		}
	}
});
});


async function getCatUrl() {
	const res = await fetch(CAT_URL);
	const data = await res.json();
	return data[0].url;
}



async function sendCat(id) {
	const imgUrl = await getCatUrl();
	//@todo cat_count
	bot.sendPhoto(id, imgUrl);
}


bot.onText(/cat/, function(msg) {
	sendCat(msg.chat.id);
});

function getUserTimeOffset(chat_id) {
	let opts = {
		"reply_markup": {
			one_time_keyboard: true,
			resize_keyboard: true,
			keyboard: [
				[{
					text: "Передать геолокацию",
					request_location: true
				}],
				[{
					text: "Передать точное время"
				}]
			]
		}
	};
	const text = "Для коректной работы напоминаний и синхронизацией с сервером необходимо получить Ваш часовой пояс.\n\n\
Вы можете передать нам свою геолокацию для автоматического определения часового пояса, а можете отправить свое точное время в даный момент"
	DB.getUserById(chat_id, (user) => {

		if (user == null) {
			console.error('user is null: getUserTimeOffset error');
			return;
		}
		user['state'] = states.Поделится_своим_временем;
		DB.saveUser(user);
		bot.sendMessage(chat_id, text, opts);
	});

}

bot.onText(/timestamp/, function(msg) {
	getUserTimeOffset(msg.chat.id);
});

const on_start_markup = JSON.stringify({
	inline_keyboard: [
		[{
			text: 'Создать заметку ' + emodji.note,
			callback_data: states.Создать_заметку
		}],
		[{
			text: 'Получить картинку котика) ' + emodji.cat,
			callback_data: states.Получить_котика
		}]
	]
})


const create_note_markup = JSON.stringify({
	inline_keyboard: [
		[{
			text: 'Изменить дату ' + emodji.calendar,
			callback_data: states.Изменить_дату
		}, {
			text: 'Изменить время ' + emodji.clock,
			callback_data: states.Изменить_время
		}],
		[{
			text: 'Изменить текст ' + emodji.writting_hand,
			callback_data: states.Изменить_текст
		}],
		[{
			text: 'Назад',
			callback_data: states.Назад_создание_заметки
		}, {
			text: 'Сохранить заметку' + emodji.check,
			callback_data: states.Добавить_заметку
		}]
	]
})

const change_date_markup = JSON.stringify({
	inline_keyboard: [
		[{
			text: 'Сегодня',
			callback_data: states.Сегодня
		}],
		[{
			text: 'Завтра',
			callback_data: states.Завтра
		}, {
			text: 'Послезавтра',
			callback_data: states.Послезавтра
		}],
		[{
			text: 'Другая дата',
			callback_data: states.Другая_дата
		}],
		[{
			text: 'Назад',
			callback_data: states.Назад_изменение_даты
		}]
	]
})

function getTimeMarkup(h, m) {
	let hours = h.toString().length < 2 ? '0' + h : h
	let minutes = m.toString().length < 2 ? '0' + m : m
	let reply_markup = {
		inline_keyboard: [
			[{
				text: hours,
				callback_data: states.Изменить_часы
			}, {
				text: minutes,
				callback_data: states.Изменить_минуты
			}],
			[{
				text: 'Ок',
				callback_data: states.Назад_изменение_время
			}]
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
	let longitude = msg.location.longitude;
	let latitude = msg.location.latitude;
	DB.getUserById(msg.chat.id, (user) => {

		if (user == null) {
			console.error('user is null: error');
			return;
		}
		if ('state' in user) {
			if (user.state != states.Поделится_своим_временем) {
				return;
			}
			locationRequest(msg.chat.id, latitude, longitude);
		}
		
	});
})

bot.on('polling_error', function(err) {
	console.error(err)
})

function getUserCurrDate(user) {
	let date = new Date(Date.now())
	if (user.minute_offset !== undefined) {
		date.setMinutes(date.getMinutes() - user.minute_offset)
	} else {
		console.warn('Current user date not found')
	}
	return date;
}



bot.on('callback_query', function onCallbackQuery(callbackQuery) {
	const action = callbackQuery.data;
	const msg = callbackQuery.message;
	let text;
	let query_reply_text = ""

	DB.getUserById(msg.chat.id, (user) => {

		if (user == null) {
			console.error('user is null: error')
			return
		}
		if (user.state != 0) {
		bot.answerCallbackQuery(callbackQuery.id, query_reply_text)
		return
	}
	if (action == states.Создать_заметку) {
		note_menu_new_msg(msg.chat.id)
	} else if (action == states.Получить_котика) {
		sendCat(msg.chat.id)
	} else if (action == states.Изменить_дату) {
		let opts = {
			chat_id: msg.chat.id,
			message_id: msg.message_id,
			reply_markup: change_date_markup,
			parse_mode: "markdown"
			
		}
		text = noteToStr(user.buffer_note)
		bot.editMessageText(text, opts)
	} else if (action == states.Назад_создание_заметки) {
		bot.deleteMessage(msg.chat.id, msg.message_id)
		onStartMsg(user.id)
	} else if (action == states.Назад_изменение_даты) {
		user.state = 0
		note_menu_edit_msg(user.id, msg.message_id) //@todo refactor -_-
	} else if (action == states.Изменить_текст) {
		user['state'] = states.Изменить_текст
		text = "Введите текст для заметки"
		bot.sendMessage(user.id, text)
	} else if (action == states.Сегодня) {
		user.buffer_note.date = getUserCurrDate(user)
		note_menu_edit_msg(msg.chat.id, msg.message_id)
	} else if (action == states.Завтра) {
		let date = getUserCurrDate(user)
		date.setDate(date.getDate() + 1)
		user.buffer_note.date = date
		note_menu_edit_msg(msg.chat.id, msg.message_id)
	} else if (action == states.Послезавтра) {
		let date = getUserCurrDate(user)
		date.setDate(date.getDate() + 2)
		user.buffer_note.date = date
		note_menu_edit_msg(msg.chat.id, msg.message_id)
	} else if (action == states.Изменить_время) {
		time_menu(msg.chat.id, msg.message_id)
	} else if (action == states.Назад_изменение_время) {
		user.state = 0
		note_menu_edit_msg(msg.chat.id, msg.message_id)
	} else if (action == states.Добавить_заметку) {
		user.buffer_note.date.setHours(user.buffer_note.time.h)
		user.buffer_note.date.setMinutes(user.buffer_note.time.m - user.minute_offset)
		NOTES.push(user.buffer_note)
		saveNotes()
		user.buffer_note = JSON.parse(JSON.stringify(defaultNote), getDateFromJSON)
		bot.deleteMessage(msg.chat.id, msg.message_id)
		onStartMsg(msg.chat.id)
		query_reply_text = "Заметка создана!"
	} else if (action == states.Отправить_геолокацию) {
		user.state = states.Отправить_геолокацию
	} else if (action.indexOf('_') != -1) {
		let tmp_date = action.split('_')
		let year = tmp_date[0],
		month = tmp_date[1]
		CalendarMenuEditMsg(msg.chat.id, msg.message_id, year, month)
	} else if (action == states.Другая_дата) {
		let currDate = new Date()
		CalendarMenuEditMsg(msg.chat.id, msg.message_id, currDate.getFullYear(), currDate.getMonth())
	} else if (action == states.Изменить_минуты || action == states.Изменить_часы) {
		if (action == states.Изменить_минуты) {
			text = 'Введите минуты'
			user.state = states.Изменить_минуты
		} else {
			text = 'Введите часы'
			user.state = states.Изменить_часы
		}
		bot.sendMessage(user.id, text)
	} else {
		let btn_date = new Date(action)
		if (isValidDate(btn_date) && action != 0) {
			
			user.buffer_note.date.setFullYear(btn_date.getFullYear())
			user.buffer_note.date.setMonth(btn_date.getMonth(), btn_date.getDate())
			note_menu_edit_msg(msg.chat.id, msg.message_id)
		}
	}
	DB.saveUser(user);
});
	bot.answerCallbackQuery(callbackQuery.id, query_reply_text)
});


function CalendarMenuEditMsg(chat_id, message_id, year, _month) {
	let month = calendar.getMonth(year, _month, 1)
	let inline_keyboard = []
	inline_keyboard.push([{
		text: month.month + " " + year.toString(),
		callback_data: 0
	}])
	let dayStrings = []
	month.days.forEach(day => {
		dayStrings.push({
			text: day,
			callback_data: 0
		})
	})
	inline_keyboard.push(dayStrings)
	month.weeks_arr.forEach(week => {
		let week_keyboard = []
		week.forEach(day => {
			let date_text = day != 0 ? new Date(year, _month, day).toDateString() : 0
			let day_text = day != 0 ? day.toString() : '  '
			week_keyboard.push({
				text: day_text,
				callback_data: date_text
			})
		})
		inline_keyboard.push(week_keyboard)
	})

	let new_right_year = Number(year)
	let new_left_year = new_right_year
	let new_right_month = Number(_month) + 1
	if (new_right_month == 12) {
		new_right_month = 0
		new_right_year += 1
	}
	let new_left_month = (_month - 1) < 0 ? 11 : _month - 1
	if (new_left_month == 11)
		new_left_year -= 1
	let right_btn = {
		text: ">>>",
		callback_data: `${new_right_year}_${new_right_month}`
	}
	let left_btn = {
		text: "<<<",
		callback_data: `${new_left_year}_${new_left_month}`
	}
	inline_keyboard.push([left_btn, right_btn])
	inline_keyboard.push([{
		text: 'Назад',
		callback_data: states.Изменить_дату
	}])
	let reply_markup = {}
	reply_markup.inline_keyboard = inline_keyboard
	let options = {
		reply_markup: reply_markup,
		chat_id: chat_id,
		message_id: message_id,
		parse_mode: "markdown"
	}
	bot.editMessageText("*Выберите дату*", options)
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

// hack for heroku

const http = require('http');
http.createServer((req, res) => {
	res.write('Hello World!');
	res.end();
}).listen(process.env.PORT || 8084);