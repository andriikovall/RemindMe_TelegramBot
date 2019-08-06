const usersArr = require('../config/users.json')
const fs = require('fs')
let usersObj = {}
usersArr.forEach(user => {
    usersObj[user.id.toString()] = user
});

fs.writeFileSync('../config/users2.json', JSON.stringify(usersObj, null, '  '))

