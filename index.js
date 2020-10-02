const TelegramBot = require('node-telegram-bot-api');
const utils = require('./utils.js');
const server = require('./server.js');
const dateformat = require('dateformat');

const env = require('./env-file.json');

const token = env.token;
const chatid = env.chat_id;
const port = env.port;

console.log("Starting SSH-SERVER-BOT with:");
console.log("TOKEN: " + token);
console.log("ID: " + chatid);

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
  bot.sendMessage(msg.chat.id, "Hello! This is your chat id: " + msg.chat.id + "\nYou *are" + (msg.chat.id == chatid ? "" : " NOT") + "* authorized to use this bot.", {parse_mode : "Markdown"});
});

bot.onText(/\/ip/, async (msg) => {
  if(checkChatId(msg)) {
    const ipinfo = await utils.getIpInfo();
    bot.sendMessage(msg.chat.id, ipinfo, {parse_mode : "Markdown"});
  }
})

function onData(data) {

  let match;
  match = data.toString().match(/\/login (.+)/);
  if(match) {
    let arg = JSON.parse(match[1]);
    bot.sendMessage(chatid, `
*New Access*
from: *${arg.ip}*
user: *${arg.user}*
on: *${dateformat(Date.now(), "dd mmmm yyyy")}*
at: *${dateformat(Date.now(), "HH:MM:ss")}*
    `, {parse_mode : "Markdown"});
    console.log(arg);
    return "Access notified"
  }

  return "Command not found";
}

server.startServer(port, onData, "Welcome to SSH-SERVER-BOT server\nHere you can send me useful info that I will send to my owner!\n");

// // Matches "/echo [whatever]"
// bot.onText(/\/echo (.+)/, (msg, match) => {
//   // 'msg' is the received Message from Telegram
//   // 'match' is the result of executing the regexp above on the text content
//   // of the message
//
//   const chatId = msg.chat.id;
//   const resp = match[1]; // the captured "whatever"
//
//   // send back the matched "whatever" to the chat
//   bot.sendMessage(chatId, resp);
// });
