const net = require('net');
const server = net.createServer();
const { Logger } = require("./logger.js");

const log = new Logger("TCP server");

const ADDRESS = '127.0.0.1';

///use this if you want the api to be accessible from other machines
// const ADDRESS = '0.0.0.0';

async function startServer(port, onData, wellcomeMessage) {
  server.on('connection', (socket) => {
    socket.write(wellcomeMessage);
    socket.on('data', async (data) => {
      log.log(`received: ${data}`)
      let response = await onData(data);
      try { //connection could be already finished, but it's not a problem
        socket.write(response+'\n');
      } catch (error) {}
    });
  });

  server.listen(
    port,
    ADDRESS,
    () => log.log(`
    =========================================
           +++ Server in funzione +++
      Indirizzo: ${ADDRESS}:${port}
    =========================================
    `)
  );
}

exports.startServer = startServer;
