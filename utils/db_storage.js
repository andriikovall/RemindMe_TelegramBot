const mysql = require('mysql');



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
        con.connect(function() {
        con.query("SELECT * FROM users", function (err, result) {
            if (err) throw err;
            console.log(result);
        });
        })
    }   

}

module.exports = {storage};