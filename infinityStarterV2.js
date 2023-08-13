const { spawn, exec, path, Pool, readline } = require('./dependencies/dependencies.js');

const fs = require('fs').promises;

const { stdin: input, stdout: output } = require('process');
const rl = readline.createInterface({ input, output });

const checkInterval = 3 * 60 * 1000;
const sessionsToStart = ['bitget'];

rl.on('SIGINT', async () => {
  rl.question('Are you sure you want to exit? ', async (answer) => {
    if (answer.match(/^y(es)?$/i)) {
      await closeAllSessions();
      rl.close();
      process.exit();
    }
  });
});

console.log(`Запущены сессии: ${sessionsToStart.join(', ')}`);
startSessions();
setInterval(checkStatusFolder, checkInterval);

async function startSessions() {
  for (const sessionName of sessionsToStart) {
    await startScreenSession(sessionName);
  }
}

async function closeAllSessions() {
  for (const sessionName of sessionsToStart) {
    await closeSessions(sessionName)
  }
}

async function checkStatusFolder() { 
  const folderPath = path.join(__dirname, 'status');

  try {
    const files = await fs.readdir(folderPath);

    for (const sessionName of sessionsToStart) {
      const fileExtension = `${sessionName}.txt`;
      const filePath = path.join(folderPath, fileExtension);

      if (files.includes(fileExtension)) {
        try {
          const stats = await fs.stat(filePath);
          const currentTime = Date.now();
          const fileModifiedTime = stats.mtimeMs;

          if (currentTime - fileModifiedTime > checkInterval) {
            await closeSessions(sessionName);
            await startScreenSession(sessionName);
            console.log(`Файл ${fileExtension} перезапущен.`);

          } else {
            console.log(`Файл ${fileExtension} актуален.`);
          }
        } catch (err) {
          console.error(`Ошибка получения информации о файле ${fileExtension}: ${err}`);
        }
      } else {        
        await closeSessions(sessionName);
        await startScreenSession(sessionName);
        console.log(`Файл ${fileExtension} перезапущен.`);
      }
    }
  } catch (err) {
    console.error(`Ошибка чтения папки "status": ${err}`);
  }}

function startScreenSession(sessionName) {
  const command = 'node';
  const args = [`exchange/${sessionName}/${sessionName}.js`];

  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore'
  });

  child.unref();
}

async function closeSessions(sessionName) {
  try {
    const processes = await findProcesses(sessionName);
    for (const pid of processes) {
      await killProcessByPID(pid);
    }
  } catch (err) {
    console.error(`Ошибка при закрытии сессии ${sessionName}: ${err}`);
  }
}

async function findProcesses(sessionName) {
  return new Promise((resolve, reject) => {
    const processCmd = `pgrep -f "node exchange/${sessionName}/${sessionName}.js"`;
    exec(processCmd, (error, stdout, stderr) => {
      if (error) {
        if (error.code === 1) {
          console.log(`Нет активных процессов для сессии ${sessionName}.`);
          resolve([]);
        } else {
          console.error(`Ошибка при поиске процессов: ${error}`);
          reject(error);
        }
      } else {
        const pids = stdout.trim().split('\n');
        resolve(pids);
      }
    });
  });
}

async function killProcessByPID(pid) {
  try {
    while (true) {
      await new Promise((resolve, reject) => {
        const child = spawn('kill', [pid]);

        child.on('error', (error) => {
          console.error(`Ошибка при попытке завершить процесс с PID: ${pid}: ${error}`);
          reject(error);
        });

        child.on('exit', (code) => {
          if (code === 0) {
            console.log(`Процесс с PID: ${pid} успешно закрыт.`);
            resolve();
          } else {
            reject(new Error(`Ошибка при попытке завершить процесс с PID: ${pid}. Код завершения: ${code}`));
          }
        });
      });

      const checkCommand = `ps -p ${pid}`;
      const checkChild = spawn('ps', ['-p', pid]);
      
      const { stdout } = await new Promise((resolve, reject) => {
        let stdout = '';

        checkChild.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        checkChild.stderr.on('data', (data) => {
          console.error(`Ошибка при проверке процесса с PID: ${pid}: ${data.toString()}`);
          reject(data.toString());
        });

        checkChild.on('error', (error) => {
          console.error(`Ошибка при проверке процесса с PID: ${pid}: ${error}`);
          reject(error);
        });

        checkChild.on('exit', (code) => {
          if (code === 0) {
            resolve({ stdout });
          } else {
            reject(new Error(`Ошибка при проверке процесса с PID: ${pid}. Код завершения: ${code}`));
          }
        });
      });

      if (stdout.trim() === '') {
        console.log(`Процесс с PID: ${pid} завершился.`);
        break;
      } else {
        console.log(`Процесс с PID: ${pid} продолжает выполняться.`);
      }
    }
  } catch (error) {
    console.error(`Ошибка при попытке завершить процесс с PID: ${pid}: ${error}`);
  }
}