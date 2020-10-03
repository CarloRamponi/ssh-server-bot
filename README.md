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
  ExecStart=/usr/local/bin/nodemon .

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
