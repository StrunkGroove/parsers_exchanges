const WebSocket = require('ws');
const { fetch } = require('fetch-h2');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const winston = require('winston');
const { Pool } = require('pg');
const readline = require('readline');
const { promisify } = require('util');
const copyFrom = require('pg-copy-streams').from;
const pgp = require('pg-promise')();
const { spawn } = require('child_process');
const { exec } = require('child_process');
const { stdin: input, stdout: output } = require('process');

module.exports = {
  WebSocket,
  fetch,
  fs,
  path,
  axios,
  winston,
  Pool,
  readline,
  promisify,
  copyFrom,
  pgp,
  spawn,
  exec,
  input,
  output
};
