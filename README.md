# robux-transfer
 
**A Big brains bot made to help you transfer Robux quickly while bypassing the asset price change ratelimit.**

*To use this program, you will need to have* ***Node.JS v13+*** *installed on your machine!*

**Older versions of Node will not work/will have issues since worker threads are not stable until Node v13.**

# Usage

Clone this repository or download it as a zip and extract it somewhere easily accessible.

Open up a terminal, change directory to the folder where you have the program & run ``npm i`` to install the dependencies.

Edit the config to your liking and run the program using ``node main``.

# Config

This program allows you to supply multiple configuration objects inside of ``config.json`` if you desire.

```
[
    {
        "assetId": "", //your shirt/pants/tshirt id
        "cookie": "", //the .ROBLOSECURITY token of the price changing account
        "proxy": "", //proxy for the price changing account
        "tasks": 100, //asynchronous tasks to use for robux checking/purchasing
        "wait": false, //whether or not you want the bot to run at a specific time
        "startTime": "40 * * * *", //cron expression(ignored if wait is false) https://devhints.io/cron
        "filename": "cookies.txt",
        "debug": false //shows extra information about the bot's current status
    }
]
```

# Final note

I am not responsible for what you do with this program nor am I responsible for any losses you may incur while using this program.

Should you encounter any bugs, please create an issue explaining the problem. Please remember to include as much information as possible in your issue. No one likes vague questions.

Need to contact?

Discord: **grango#5298**

Telegram: **@grangus**
