# RemindMe_TelegramBot
A simple reminder telegram bot made with [`node-telegram-bot-api`](https://github.com/yagop/node-telegram-bot-api)

## Building and running

- Make sure you that you have created `config` directory one level upper such files are stored
  - `bot_token.json`
  
        {
            "token": "YOUR_TOKEN"
        }
  - `notes.json`
  
        [{
            "text": "Hello",
            "date": "2019-07-09T14:07:14.943Z",
            "time": {
             "h": 16,
            "m": 10
            },
             "user_id": 123456789
        }]
    Or an emply array

        []
        
  - `users.json`
   
        []
        
    Can be empty to

         
        
- `npm install`
- `npm run` 
  - alternative - `node bot.js`

##### README in work
