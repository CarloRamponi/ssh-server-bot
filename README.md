# ssh-server-bot
Telegram bot that help you manage and control your SSH server

## Dependencies

- nodejs (>= 10)
- jq

## Configuration

- Create a telegram bot and get the token
- Create a user named `sshbot`
  ```
  useradd --create-home sshbot
  ```
- Clone this repo in the ssh bot's home folder (`/home/sshbot`)
- Create the config file `/home/sshbot/env-file.json`
  ```
  {
    "token": "YOUR_TOKEN_HERE",
    "chat_id": "YOUR_CHAT_ID_HERE",
    "ipinfo_token": "YOUR_IP_INFO_TOKEN_HERE",
    "port": 8080
  }
  ```
  Where:
  - `token` is the bot token provided by the botfather,
  - `chat_id` is your chat id (if you don't know it you can leave it blank and the first message you'll send to the bot (`/start`) will let you know your chat id)
  - `ipinfo_token` is the token provided by [ipinfo.io](ipinfo.io)
  - `port` is the port where the TCP server will listen for local events (e.g. SSH connection)
- Run `npm install` in the project folder
- Allow him to run the kill command and the write as root without a password, run `visudo` and add this line at the end of that file
  ```
  sshbot ALL= NOPASSWD: /bin/kill, /usr/bin/write
  ```
  This allows him to kick ssh connections if needed
- Open `/etc/ssh/sshrc` and insert the `./sshrc` content (create the file if needed)
  This will notify the user every time a ssh connection is established
- Create the service file `/lib/systemd/system/ssh-server-bot.service`
  ```
  [Unit]
  Description=SSH SERVER telegram bot.

  [Service]
  Type=simple
  User=sshbot
  WorkingDirectory=/home/sshbot/ssh-server-bot
  ExecStart=/usr/bin/node index.js
  Restart=on-failure
  RestartSec=5s

  [Install]
  WantedBy=multi-user.target
  ```
- Reload systemd services with
  ```
  systemctl daemon-reload
  ```
- Enable and start the newly created service (and check its status)
  ```
  systemctl enable ssh-server-bot
  systemctl start ssh-server-bot
  systemctl status ssh-server-bot
  ```
