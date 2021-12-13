const http = require('http');
const Promise = require('promise');
const url = require('url');
const { exec } = require('child_process');
const { networkInterfaces } = require('os');

const env = require('./env-file.json');
const ip_info_token = env.ipinfo_token;

function getRequest(hostname, path, params) {
  return new Promise((resolve, reject) => {

    const requestUrl = url.parse(url.format({
      protocol: 'http',
      hostname: hostname,
      pathname: path,
      query: params
    }));

    const options = {
      hostname: requestUrl.hostname,
      path: requestUrl.path,
      method: 'GET',
    }

    http.get(options, (resp) => {
      let data = '';

      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        let parsedData = JSON.parse(data);
        resolve(parsedData);
      });

    }).on("error", (err) => {
      console.log("Error: " + err.message);
      reject(err);
    });
  })
}

function beautify(obj) {
  return Object.keys(obj).map((key) => key + ": *" + obj[key] + "*").join('\n');
}

async function getIpInfo(ip) {
  if(ip) {
    let response = await getRequest('ipinfo.io', '/' + ip, { token: ip_info_token });
    return beautify(response);
  } else {
    let response = await getRequest('ipinfo.io', '/', { token: ip_info_token });
    return beautify(response);
  }
}

function getLocalIp() {
  const nets = networkInterfaces();
  const results = Object.create(null); // Or just '{}', an empty object
  
  for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
          // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
          if (/*net.family === 'IPv4' &&*/ !net.internal) {
              if (!results[name]) {
                  results[name] = [];
              }
              results[name].push(net.address);
          }
      }
  }

  return beautify(results);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function waitForProcess(pid) {
  return new Promise((resolve, reject) => {
    exec(`tail --pid=${pid} -f /dev/null`, (err, stdout, stderr) => {
      if(err) {
        reject(err);
      } else {
        resolve();
      }
    })
  });
}

exports.beautify = beautify;
exports.getIpInfo = getIpInfo;
exports.sleep = sleep;
exports.waitForProcess = waitForProcess;
exports.getLocalIp = getLocalIp;
