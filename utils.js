const http = require('http');
const Promise = require('promise');
const url = require('url');

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

async function getIpInfo() {
  let response = await getRequest('ipinfo.io', '/', { token: ip_info_token });
  return beautify(response);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

exports.beautify = beautify;
exports.getIpInfo = getIpInfo;
exports.sleep = sleep;
