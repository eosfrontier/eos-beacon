const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const globalSettings = require('./config.js');
const path = require('path');


app.set('view engine', 'ejs');

/**
 * Reads the video broadcast files and extracts their metadata.
 * @returns {Promise<Array>} A promise that resolves with an array of broadcast data objects.
 */
function getVideoBroadcasts() {
  return new Promise((resolve, reject) => {
    const directoryPath = path.join(__dirname, 'public', 'broadcasts', 'videos');

    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        console.error("Could not read video broadcasts directory:", err);
        return resolve([]); // Resolve with an empty array to handle gracefully
      }

      const promises = files
        .filter(file => file.endsWith('.html'))
        .map(file => {
          return new Promise((resolveFile) => {
            const filePath = path.join(directoryPath, file);
            const key = file.replace('.html', '');

            fs.readFile(filePath, 'utf8', (readErr, content) => {
              let title = "Untitled Broadcast";
              if (!readErr) {
                const match = content.match(/<title>(.*?)<\/title>/i);
                if (match && match[1]) title = match[1];
              }
              resolveFile({
                key: key,
                title: title,
                file: `videos/${key}`,
                priority: 9,
                duration: "0",
                colorscheme: "0"
              });
            });
          });
        });

      Promise.all(promises).then(resolve);
    });
  });
}

// Defaults
const port = process.env.PORT || globalSettings.sys.port;

const defaultSecurityLevel = globalSettings.data.defaultSecurityLevel || 'Code green - All clear';

const defaultAppName = globalSettings.cfg.appname || 'BEACON';
const defaultAppDescription = globalSettings.cfg.appdescription || 'broadcasting & information services. Powered by EOS IT.';
const defaultAppTagline = globalSettings.cfg.tagline || 'Have a productive day.';
const defaultICDateEnabled = globalSettings.sys.ICDateEnabled || false;
const defaultYearOffset = globalSettings.sys.yearOffset || 0;


const applicationState = {
  countClients: 0,
  alertLevel: defaultSecurityLevel,
  lastBC: 'bcdefault',
  portalStatus: 'ok',
  orbStatus: 'active',
  voiceEnabled: globalSettings.sys.voiceEnabled,
  appName: defaultAppName,
  appDescription: defaultAppDescription,
  appTagline: defaultAppTagline,
  ICDateEnabled: globalSettings.sys.ICDateEnabled,
};

// Init: routing
function initializeRouting() {
  if (globalSettings.sys.voiceEnabled) {
    express.static.mime.define({ 'audio/ogg;codec=opus': ['opus'] });
  }
  app.use(express.static('public'));
  app.use(express.static('_includes'));
  app.get('/', (req, res) =>
    res.sendFile('index.html', { root: __dirname + '/public/' })
  );

  // Route to get video broadcasts, now using the shared function
  app.get('/get-video-broadcasts', async (req, res) => {
    const broadcasts = await getVideoBroadcasts();
    res.json(broadcasts);
  });
  app.get('*', (req, res) =>
    res.sendFile('404.html', { root: __dirname + '/public/' })
  );
}

// Init: FlavorText
http.listen(port, () => {
  console.log('\n..\n..');
  console.log('// ' + globalSettings['cfg']['appname'] + ' ////////////');
  console.log('# Initialising ..');
  console.log('# Loading dependancies ..');
  console.log('-------------------------');
  // console.log('# CONNECT DEVICES//USERS TO :');
  // console.log(' ? External IP :\n\t- ' + globalSettings.sys.localaddress);
  // console.log(
  //   ' ? Internal IP :\n\t- localhost:' + port + '\n\t- ' + '127.0.0.1:' + port
  // );
  // console.log('-------------------------');
  console.log(
    'THANK YOU FOR USING ' +
    globalSettings.cfg.appname +
    ' INFORMATION & BROADCASTING SERVICES'
  );
});

const sanitizeUserString = (str) => str.replace(/[`~$^&*_|=;'",<>\{\}\[\]\\\/]/gi, '');
const syncAppState = () => io.emit('updateDynamicData', applicationState);
const syncConnectionCounter = () => {
  applicationState.countClients = io.engine.clientsCount;
  syncAppState();
};

// 1. Create a function that handles the initialization
async function initializeBroadcastSystem() {
  try {
    initializeRouting();

    // 2. Get the video broadcast data directly
    const broadcasts = await getVideoBroadcasts();

    // 3. Register the variables globally on the server
    // Note: `window` is a browser concept. On the server, you'd attach to `global`
    // or manage state differently. For now, this part seems intended for client-side
    // logic that was being run on the server. The key is getting `broadcasts` correctly.
    console.log("Video broadcasts data fetched:", broadcasts.map(b => b.key));
    console.log("Initialization Complete.");

    // 4. Start the main application logic
    // This would be where you might start listening for connections, etc.
    // Since that's already happening below, we'll just log.

  } catch (err) {
    console.error("System failed to initialize:", err);
  }
}

io.on('connection', (socket) => {
  syncConnectionCounter();
  console.log(`\t[IO] ${applicationState.countClients} active client(s).`);

  // initial configdata
  setTimeout(() => socket.emit('startConfig', port, defaultAppName, defaultAppDescription, defaultAppTagline, defaultICDateEnabled, defaultYearOffset), 1000);

  socket.on('updateSecurity', (input) => {
    const _str = sanitizeUserString(input);
    applicationState['alertLevel'] = _str;
    syncAppState();
    console.log('[secLVL] level => ' + _str);
  });

  socket.on('updatePortalStatus', (input) => {
    const _str = sanitizeUserString(input);
    applicationState['portalStatus'] = _str;
    syncAppState();
    io.emit('portalfrontend');
    console.log('[portal] status => ' + _str);
  });

  socket.on('updateOrbStatus', (input) => {
    const _str = sanitizeUserString(input);
    applicationState.orbStatus = _str;
    syncAppState();
    io.emit('orbDivFlash');
    console.log('[orb] status => ' + _str);
  });

  // FORCE RESET ::
  socket.on('forceReset', () => {
    applicationState['lastBC'] = 'bcdefault';
    applicationState['alertLevel'] = defaultSecurityLevel;
    io.emit('F5');
    console.log('[admin] command => FORCE_RESET');
  });

  socket.on('requestDynamicData', () => syncConnectionCounter());

  socket.on('broadcastSend', (value) => {
    // If value.file contains a slash, only take the part after the last one
    // Otherwise, just use value.file as is
    const cleanBCName = value.file.includes('/')
      ? value.file.split('/').pop()
      : value.file;

    applicationState['lastBC'] = cleanBCName;

    syncAppState();
    io.emit('broadcastReceive', value);

    if (value.duration > 1) {
      setTimeout(() => {
        applicationState.lastBC = 'bcdefault';
        console.log('=> last-bc timer cleared.');
      }, value.duration);
    }

    console.log(`[broadcast] sent => ${value.title}`);
  });

  socket.on('disconnect', () => {
    console.log(`\t[IO] ${applicationState.countClients} active client(s).`);
    syncConnectionCounter();
  });

  socket.on('auth', (keycode) => {
    let checkLoginCode = 0;
    let loginRank = 0;

    for (let i in globalSettings.accounts) {
      if (globalSettings.accounts[i].logincode == keycode) {
        checkLoginCode = 1;
        loginRank = globalSettings.accounts[i].loginRank;
      }
    }

    if (checkLoginCode == 1) {
      console.log('(i) succesful auth using', keycode);
      socket.emit('authTrue', keycode, loginRank);
    } else {
      socket.emit('authFalse');
    }
  });

  /* broadcast from adminpanel to index.js. Sends a "play this file!" request to every connected client. */
  socket.on('broadcastAudio', (audiofile) => {
    console.log('[audio] => file: ' + audiofile);
    io.emit('playAudioFile', audiofile);
  });

  /* broadcast from adminpanel to index.js. Sends a "stop all audio!" request to every connected client. */
  socket.on('stopAllAudio', () => {
    console.log('[audio] => stop all audio broadcasted');
    io.emit('stopAllAudio');
  });

  const readAudioDirectory = (dir) => {
    const dirents = fs.readdirSync(dir, { withFileTypes: true });
    const files = dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      const relativePath = '/sounds' + res.split(path.join(__dirname, 'public', 'sounds'))[1].replace(/\\/g, '/');
      if (dirent.isDirectory()) {
        return { name: dirent.name, type: 'folder', path: relativePath, children: readAudioDirectory(res) };
      } else {
        // Only include audio files
        if (['.mp3', '.ogg', '.wav', '.opus'].includes(path.extname(dirent.name).toLowerCase())) {
          return { name: dirent.name, type: 'file', path: relativePath };
        }
        return null;
      }
    });
    // Filter out nulls (non-audio files) and sort with folders first
    return files.filter(Boolean).sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
  };

  socket.on('getMedia', function () {
    const audioDir = path.join(__dirname, 'public', 'sounds', 'audio');
    if (fs.existsSync(audioDir)) {
      try {
        const audioTree = readAudioDirectory(audioDir);
        socket.emit('sendAudioTree', audioTree);
      } catch (err) {
        console.error("Error reading audio directory:", err);
      }
    }
  });

  // optional/legacy PA functionality
  if (globalSettings.sys.voiceEnabled) {

    var pa_name = null;
    var pa_folder = './public/sounds/audio-pa/';

    socket.on('startPA', function () {
      fs.readdir(pa_folder, function (err, files) {
        var cleantime = new Date(new Date().getTime() - 60000);
        if (err) {
          console.log('PA cleanup readdir error: ' + err);
        }
        files.forEach(function (file) {
          if (file) {
            var path = pa_folder + file;
            fs.stat(path, function (err, stat) {
              if (err) {
                console.log('PA cleanup stat error: ' + err);
              }
              if (stat.ctime < cleantime) {
                console.log('[PA] unlinking', path, stat.ctime, cleantime);
                fs.unlink(path, function (err) {
                  if (err) {
                    console.log('PA cleanup unlink error: ' + err);
                  }
                });
              }
            });
          }
        });
      });
      pa_name =
        'PA-' +
        socket.id +
        '-' +
        new Date().toISOString().substring(11, 23).replace(/[:.]/g, '');

      fs.mkdir(pa_folder, { recursive: true }, function (err) {
        if (err) throw err;
        fs.truncate(pa_folder + pa_name + '.opus', function (err) { });
      });
    });
    socket.on('uploadPA', function (data) {
      // TODO: Force maximum length to stop the server from overflowing
      fs.appendFile(pa_folder + pa_name + '.opus', data, function (err) {
        if (err) throw err;
      });
    });
    socket.on('broadcastPA', function () {
      console.log('[audio] => PA: ' + pa_name);
      io.emit('playAudioFile', '/audio-pa/' + pa_name + '.opus');
    });
  }

});

// Start the sequence
initializeBroadcastSystem();
