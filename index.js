const TelegramBot = require('node-telegram-bot-api');
const utils = require('./utils.js');
const server = require('./server.js');
const dateformat = require('dateformat');
const { exec } = require('child_process');
const figlet = require('figlet');

const env = require('./env-file.json');

const { Logger } = require("./logger.js");

const log = new Logger("TelegramBot");

const token = env.token;
const chatid = env.chat_id;
const port = env.port;
const kick_text = env.kick_text;

log.log("Starting SSH-SERVER-BOT with:");
log.log("TOKEN: " + token);
log.log("ID: " + chatid);

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

bot.on("polling_error", (err) => console.log(err));

function checkChatId(msg) {
  if(msg.chat.id != chatid) {
    bot.sendMessage(msg.chat.id, 'Unauthorized');
    return false;
  }
  return true;
}

bot.onText(/\/start/, (msg) => {
  log.log("Received /start from " + msg.chat.id)
  bot.sendMessage(msg.chat.id, "Hello! This is your chat id: " + msg.chat.id + "\nYou *are" + (msg.chat.id == chatid ? "" : " NOT") + "* authorized to use this bot.", {parse_mode : "Markdown"});
});

bot.onText(/\/ip/, async (msg) => {
  if(checkChatId(msg)) {
    const ipinfo = await utils.getIpInfo();
    bot.sendMessage(msg.chat.id, ipinfo, {parse_mode : "Markdown"});
  }
});

bot.onText(/\/local/, async (msg) => {
  if(checkChatId(msg)) {
    const local = utils.getLocalIp();
    bot.sendMessage(msg.chat.id, local, {parse_mode : "Markdown"});
  }
});

bot.onText(/\/help/, async (msg) => {
  if(checkChatId(msg)) {
    let helpmsg = `Available commands:
/help ~ displays this help message
/ip ~ displays info about server's ip address
/local ~ displays info about server's local ip addresses
/reboot ~ reboots the server
/status ~ displays the status of sshd service
/staccah ~ shuts down sshd service (emergency mode (open sessions won't be ended))
/riattaccah ~ starts sshd service (exit emergency mode)`;
    bot.sendMessage(chatid, helpmsg, {parse_mode : "Markdown"});
  }
});

bot.onText(/\/status/, async (msg) => {
  if(checkChatId(msg)) {
    exec('systemctl status sshd', (err, stdout, stderr) => {
      let message;
      if(err) {
        message = "SSHD status:\n🔴 *Not running*";
      } else {
        message = "SSHD status:\n🟢 *Running*";
      }

      bot.sendMessage(chatid, message, {parse_mode : "Markdown"});
    })
  }
});

bot.onText(/\/staccah/, async (msg) => {
  if(checkChatId(msg)) {
    exec('sudo systemctl stop sshd', (err, stdout, stderr) => {
      if(err) {
        bot.sendMessage(chatid, "Unable to stop sshd server\nI think you should call the [police](tel:112)", {parse_mode : "Markdown"});
      } else {
        bot.sendMessage(chatid, "Sshd server successfully stopped\nYou are safe for now.", {parse_mode : "Markdown"});
      }
    })
  }
});

bot.onText(/\/riattaccah/, async (msg) => {
  if(checkChatId(msg)) {
    exec('sudo systemctl start sshd', (err, stdout, stderr) => {
      if(err) {
        bot.sendMessage(chatid, "Unable to start sshd server\nYou locked yourself out lol\nMaybe /reboot ?", {parse_mode : "Markdown"});
      } else {
        bot.sendMessage(chatid, "Sshd server successfully start\nTry to connect and let me know if it's working.", {parse_mode : "Markdown"});
      }
    })
  }
});

bot.onText(/\/reboot/, async (msg) => {
  if(checkChatId(msg)) {
    bot.sendMessage(msg.chat.id, "Rebooting...", {parse_mode : "Markdown"});
    exec(`sudo reboot`, (err, stdout, stderr) => {
      if(err) {
        log.log(err, stdout, stderr);
        bot.sendMessage(chatid, "Reboot request failed 😔");
      }
    });
  }
})

bot.on('callback_query', (query) => {

  let match;

  match = query.data.match(/\/kick (.+)/);
  if(match) {

    let args = match[1].split(" ");

    let pid = args[0];
    let user = args[1];
    let tty = args[2];

    figlet(kick_text, (err, data) => {

      if(err) {
        data = `\n\n *** ${kick_text} *** \n\n`;
      }

      exec(`echo "${data}" | sudo write ${user} ${tty} ; sleep 2; sudo kill -9 ${pid}`, (err, stdout, stderr) => {
        
        if(err) {
          log.log(err, stdout, stderr);
          bot.sendMessage(chatid, "Unable to kick this user 😔");
        } else {
          bot.sendMessage(chatid, "User successfully kicked 😇");
        }

        bot.answerCallbackQuery(query.id);
      });

    })
  }


  match = query.data.match(/\/ipinfo (.+)/);
  if(match) {

    let ip = match[1].trim();

    utils.getIpInfo(ip).then((result) => {

      bot.sendMessage(chatid, result, {parse_mode : "Markdown"});

      bot.answerCallbackQuery(query.id);
    }).catch((error) => {

      log.log(error);

      bot.answerCallbackQuery(query.id);
    });

  }

});

function onData(data) {

  let match;
  match = data.toString().match(/\/login (.+)/);
  if(match) {
    let arg = JSON.parse(match[1]);

    let kick_btn = {
      text: 'Kick 👞🍑',
      callback_data: `/kick ${arg.pid} ${arg.user} ${arg.tty}`
    };

    let ipinfo_btn = {
      text: 'IP info',
      callback_data: `/ipinfo ${arg.ip}`
    };

    var messageText = "*New Access*\n" + utils.beautify({
      from: arg.ip,
      user: arg.user,
      on: dateformat(Date.now(), "dd mmmm yyyy"),
      at: dateformat(Date.now(), "HH:MM:ss")
    });

    bot.sendMessage(chatid, messageText, {
      parse_mode : "Markdown",
      reply_markup: {
        inline_keyboard: [
          [ ipinfo_btn ],
          [ kick_btn ]
        ]
      }
    }).then((message) => {
      try {
        const pid = parseInt(arg.pid);

        utils.waitForProcess(pid).then((value) => {
          bot.editMessageText(messageText + "\n(Session ended)", {
            chat_id: chatid,
            message_id: message.message_id,
            parse_mode : "Markdown",
            reply_markup: {
              inline_keyboard: [
                [ ipinfo_btn ]
              ]
            }
          })
        });
      } catch (e) {
        console.log(e);
      }
    });

    return "Access notified";
  }

  return "Command not found";
}

server.startServer(port, onData, "Welcome to SSH-SERVER-BOT server\nHere you can send me useful info that I will send to my owner!\n");

bot.sendMessage(chatid, "I'm online!");