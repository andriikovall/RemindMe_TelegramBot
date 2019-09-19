const mysql = require('mysql');

function isString (value) {
    return typeof value === 'string' || value instanceof String;
}

function userObjToRow(user) {
    let userRow = user;
    userRow.buffer_note_date = user.buffer_note.date.toISOString();
    userRow.buffer_note_text = user.buffer_note.text;
    userRow.buffer_note_time_h =  user.buffer_note.time.h;
    userRow.buffer_note_time_m =  user.buffer_note.time.m;
    delete userRow.buffer_note;
    if (userRow.is_bot) 
        delete userRow.is_bot;
    return userRow;
}

function getKeysAndValuesStrings(obj) {
    let values = '(';
    let keys = '(';
    for (let key in obj) {
        keys   += key + ',';
        let value = obj[key];
        if (isString(value)) {
            value = "'" + value + "'";
        }
        values += value + ',';
    }
    keys = keys.slice(0, -1);
    keys += ')';
    values = values.slice(0, -1);
    values += ')';
    return {keys, values};
}

function getSetString(obj) {
    let str = '';
    for (let key in obj) {
        let value = obj[key];
        if (isString(value)) {
            value = "'" + value + "'";
        }
        str += `${key} = ${value},`;
    }
    str = str.slice(0, -1);
    return str;
}

function userRowToObj(userRow) {
    const buffer_note = {
        text: userRow.buffer_note_text, 
        date: new Date(userRow.buffer_note_date), 
        time: {
            h: userRow.buffer_note_time_h, 
            m: userRow.buffer_note_time_m
        }
    }
    delete userRow.buffer_note_date;
    delete userRow.buffer_note_time_h;
    delete userRow.buffer_note_time_m;
    delete userRow.buffer_note_text;
    userRow.buffer_note = buffer_note;
    return userRow;
}


const storage = function() {
    const con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
    });

    con.connect(function(err) {
        if (err) console.log(err);
        console.log("Connected!");
    });

    this.getAllUsers = (callback) => {
        con.query("SELECT * FROM users", function (err, result) {
            if (err) throw err;
            callback(result);
        });
    };  
    
    this.getUserById = (id, callback) => {
        const sql = "SELECT * FROM users where id = " + id;
        con.query(sql, function (err, result) {
            if (err) throw err;
            if (result.length == 0) {
                callback(null);
                return;
            }
            //@todo table_1 users, table_2 buffer_notes but here is a shitcode)
            const user = userRowToObj(result[0]);
            callback(user);
        });
    };

    this.insertUser = (user) => {
        const userRow = userObjToRow(user);
        const {keys, values} = getKeysAndValuesStrings(userRow);
        const sql = `INSERT INTO users ${keys} VALUES  ${values}`;
        con.query(sql, function (err, result) {
            // if (err) throw err;
            if (result)
                console.log("Number of records inserted: " + result.affectedRows);
        });
    };

    this.saveUser = (user) => {
        const userRow = userObjToRow(user);
        const setStr = getSetString(userRow);
        const sql = `UPDATE users Set ${setStr} WHERE id = ${user.id}`;
        console.log(sql);
        con.query(sql, function (err, result) {
            // if (err) throw err;
            if (result)
                console.log("Number of records inserted: " + result.affectedRows);
        });
    };

};

module.exports = {storage};