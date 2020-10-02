const net = require('net');
const server = net.createServer();

const ADDRESS = '127.0.0.1';

///use this if you want the api to be accessible from other machines
// const ADDRESS = '0.0.0.0';

async function startServer(port, onData, wellcomeMessage) {
  server.on('connection', (socket) => {
    socket.write(wellcomeMessage);
    socket.on('data', (data) => {
      socket.write(onData(data)+'\n');
    });
  });

  server.listen(
    port,
    ADDRESS,
    () => console.log(`
    =========================================
           +++ Server in funzione +++
      Indirizzo: ${ADDRESS}:${port}
    =========================================
    `)
  );
}

exports.startServer = startServer;
