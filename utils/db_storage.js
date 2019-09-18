const mysql = require('mysql');

function isString (value) {
    return typeof value === 'string' || value instanceof String;
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

    this.getAllUsers = () => {
        con.query("SELECT * FROM users", function (err, result) {
            if (err) throw err;
            console.log(result);
        });
    }  
    
    this.getUserById = (id, callback) => {
        const sql = "SELECT * FROM users where id = " + id;
        con.query(sql, function (err, result) {
            if (err) throw err;
            if (result.length == 0) {
                callback(null);
                return;
            }
            //@todo table_1 users, table_2 buffer_notes but here is a shitcode)
            let userRow = result[0];
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
            callback(userRow);
        });
    }

    this.insertUser = (user) => {
        let userRow = user;
        userRow.buffer_note_date = '"' + user.buffer_note.date.toISOString() + '"';
        userRow.buffer_note_text = user.buffer_note.text;
        userRow.buffer_note_time_h =  user.buffer_note.time.h;
        userRow.buffer_note_time_m =  user.buffer_note.time.m;
        delete userRow.buffer_note;
        let values = '(';
        let keys = '(';
        for (let key in userRow) {
            keys   += key + ',';
            let value = userRow[key];
            if (isString(value)) {
                value = "'" + value + "'";
            }
            values += value + ',';
        }
        keys = keys.slice(0, -1);
        keys += ')';
        values = values.slice(0, -1);
        values += ')';
        const sql = `INSERT INTO users ${keys} VALUES  ${values}`;
        con.query( sql, function (err, result) {
            // if (err) throw err;
            if (result)
                console.log("Number of records inserted: " + result.affectedRows);
            // //@todo table_1 users, table_2 buffer_notes but here is a shitcode)
            // let userRow = result[0];
            // const buffer_note = {
            //     text: userRow.buffer_note_text, 
            //     date: new Date(userRow.buffer_note_date), 
            //     time: {
            //         h: userRow.buffer_note_time_h, 
            //         m: userRow.buffer_note_time_m
            //     }
            // }
            // delete userRow.buffer_note_date;
            // delete userRow.buffer_note_time_h;
            // delete userRow.buffer_note_time_m;
            // delete userRow.buffer_note_text;
            // userRow.buffer_note = buffer_note;
            // console.log(userRow);
            // return userRow;
        });
    }

}

module.exports = {storage};