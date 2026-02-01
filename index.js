const express = require('express');
const app = express();
const http = require('http').Server(app);
const { Server } = require("socket.io");
const io = require('socket.io')(http);
const fs = require('fs');
const globalSettings = require('./config.js');
const path = require('path');

app.engine('html', require('ejs').renderFile);


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
                colorscheme: defaultColorScheme
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

const scheduleFilePath = path.join(__dirname, 'schedule.json');
const defaultColorScheme = globalSettings.data.defaultColorScheme || '0';

const defaultSecurityLevel = globalSettings.data.defaultSecurityLevel || 'Code green - All clear';

const defaultAppName = globalSettings.cfg.appname || 'BEACON';
const defaultAppDescription = globalSettings.cfg.appdescription || 'broadcasting & information services. Powered by EOS IT.';
const defaultAppTagline = globalSettings.cfg.tagline || 'Have a productive day.';
const defaultICDateEnabled = globalSettings.sys.ICDateEnabled || false;
const defaultYearOffset = globalSettings.sys.yearOffset || 0;


const applicationState = {
  countClients: 0,
  schedule: [],
  alertLevel: defaultSecurityLevel,
  lastBC: 'bcdefault',
  portalStatus: 'ok',
  orbStatus: 'active',
  voiceEnabled: globalSettings.sys.voiceEnabled,
  appName: defaultAppName,
  appDescription: defaultAppDescription,
  appTagline: defaultAppTagline,
  ICDateEnabled: globalSettings.sys.ICDateEnabled,
  bgMusic: {
    playlistName: null,
    files: [],
    isPaused: false,
    volume: 50,
  },
};

// --- Schedule Management ---

function loadSchedule() {
  try {
    if (fs.existsSync(scheduleFilePath)) {
      const data = fs.readFileSync(scheduleFilePath, 'utf8');
      applicationState.schedule = JSON.parse(data);
      console.log('[schedule] Schedule loaded from schedule.json');
    } else {
      fs.writeFileSync(scheduleFilePath, '[]', 'utf8');
      applicationState.schedule = [];
      console.log('[schedule] Created empty schedule.json');
    }
  } catch (err) {
    console.error('[schedule] Error loading schedule.json:', err);
    applicationState.schedule = [];
  }
}

function saveSchedule() {
  try {
    fs.writeFileSync(scheduleFilePath, JSON.stringify(applicationState.schedule, null, 2), 'utf8');
  } catch (err) {
    console.error('[schedule] Error saving schedule.json:', err);
  }
}

let lastCheckedDate = new Date().getDate();

function checkSchedule() {
  const now = new Date();
  const currentDate = now.getDate();

  // Reset 'sent' flag at the start of a new day
  if (currentDate !== lastCheckedDate) {
    applicationState.schedule.forEach(job => job.sent = false);
    lastCheckedDate = currentDate;
  }

  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  applicationState.schedule.forEach(job => {
    if (job.time === currentTime && !job.sent) {
      io.emit('broadcastReceive', JSON.parse(job.broadcast)); // We store broadcast as a string
      job.sent = true;
      console.log(`[schedule] Fired scheduled broadcast: ${JSON.parse(job.broadcast).title}`);
    }
  });
}

// Init: routing
function initializeRouting() {
  if (globalSettings.sys.voiceEnabled) {
    express.static.mime.define({ 'audio/ogg;codec=opus': ['opus'] });
  }
  app.get('/', (req, res) => res.render(path.join(__dirname, 'public', 'index.html'), {
    defaultColorScheme,
    defaultAppName,
    defaultAppDescription
  }));
  app.get('/adm/', (req, res) => res.render(path.join(__dirname, 'public', 'adm', 'index.html'), {
    defaultColorScheme,
    defaultAppName,
    defaultAppDescription
  }));
  app.use(express.static(path.join(__dirname, 'public')));

  // Route to get video broadcasts, now using the shared function
  app.get('/get-video-broadcasts', async (req, res) => {
    const broadcasts = await getVideoBroadcasts();
    res.json(broadcasts);
  });
  app.get('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  });
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
  loadSchedule();
  setInterval(checkSchedule, 1000); // Check schedule every second
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
  setTimeout(() => socket.emit('startConfig', port, defaultAppName, defaultAppDescription, defaultAppTagline, defaultICDateEnabled, defaultYearOffset, defaultColorScheme), 1000);

  // Send current bg music state to the connecting client
  if (applicationState.bgMusic.playlistName) {
    socket.emit('syncBgMusic', applicationState.bgMusic);
  }

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

  // --- Schedule Socket Listeners ---
  socket.on('getSchedule', () => {
    socket.emit('sendSchedule', applicationState.schedule);
  });

  socket.on('addSchedule', (newJob) => {
    newJob.id = Date.now(); // Simple unique ID
    // newJob already contains broadcastKey from the client
    applicationState.schedule.push(newJob);
    saveSchedule();
    io.emit('sendSchedule', applicationState.schedule); // Send updated schedule to all clients
  });

  socket.on('removeSchedule', (jobId) => {
    applicationState.schedule = applicationState.schedule.filter(job => job.id !== jobId);
    saveSchedule();
    io.emit('sendSchedule', applicationState.schedule); // Send updated schedule to all clients
  });

  // RESET SECURITY LEVEL ::
  socket.on('resetSecurityLevel', () => {
    applicationState['alertLevel'] = defaultSecurityLevel;
    syncAppState();
    console.log('[admin] command => RESET_SECURITY_LEVEL to: ' + defaultSecurityLevel);
  });

  // FORCE RESET ::
  socket.on('forceReset', () => {
    applicationState['lastBC'] = 'bcdefault';
    applicationState['alertLevel'] = defaultSecurityLevel;

    // Clear background music state on the server
    applicationState.bgMusic.playlistName = null;
    applicationState.bgMusic.files = [];
    applicationState.bgMusic.isPaused = false;

    io.emit('stopAllAudio');
    io.emit('F5');
    console.log('[admin] command => FORCE_RESET');
    syncAppState();
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
    applicationState.bgMusic.playlistName = null;
    applicationState.bgMusic.files = [];
    applicationState.bgMusic.isPaused = false;
    syncAppState();
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

  // --- Background Music Playlist ---
  function getBgMusicPlaylists() {
    const bgmusicDir = path.join(__dirname, 'public', 'sounds', 'bgmusic');
    if (!fs.existsSync(bgmusicDir)) {
        fs.mkdirSync(bgmusicDir, { recursive: true });
        console.log('[bgmusic] Created missing bgmusic directory.');
        return [];
    }
    try {
        const dirents = fs.readdirSync(bgmusicDir, { withFileTypes: true });
        return dirents
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
    } catch (err) {
        console.error("[bgmusic] Error reading bgmusic directory:", err);
        return [];
    }
  }

  socket.on('getBgMusicPlaylists', () => {
    const playlists = getBgMusicPlaylists();
    socket.emit('sendBgMusicPlaylists', playlists);
  });

  socket.on('startBgMusicPlaylist', (playlistName) => {
    const playlistDir = path.join(__dirname, 'public', 'sounds', 'bgmusic', playlistName);
    if (!fs.existsSync(playlistDir)) {
      console.error(`[bgmusic] Playlist folder not found: ${playlistName}`);
      return;
    }

    try {
      let files = fs.readdirSync(playlistDir);
      files = files.filter(file => ['.mp3', '.ogg', '.wav', '.opus'].includes(path.extname(file).toLowerCase()));

      if (files.length === 0) {
        console.log(`[bgmusic] No audio files found in playlist: ${playlistName}`);
        return;
      }

      // Fisher-Yates shuffle
      for (let i = files.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [files[i], files[j]] = [files[j], files[i]];
      }

      const filePaths = files.map(file => `bgmusic/${playlistName}/${file}`);
      applicationState.bgMusic.playlistName = playlistName;
      applicationState.bgMusic.files = filePaths;
      applicationState.bgMusic.isPaused = false;

      console.log(`[bgmusic] Starting shuffled playlist: ${playlistName}`);
      io.emit('playShuffledPlaylist', filePaths);
      // Also broadcast the current volume setting for this playlist
      io.emit('setBgMusicVolume', applicationState.bgMusic.volume);
      syncAppState();
    } catch (err) {
      console.error(`[bgmusic] Error starting playlist ${playlistName}:`, err);
    }
  });

  socket.on('setBgMusicVolume', (volume) => {
    const newVolume = Math.max(0, Math.min(100, parseInt(volume, 10)));
    applicationState.bgMusic.volume = newVolume;
    console.log(`[bgmusic] Volume set to: ${newVolume}`);
    io.emit('setBgMusicVolume', newVolume);
    syncAppState();
  });

  socket.on('toggleBgMusicPause', () => {
    if (applicationState.bgMusic.playlistName) {
      applicationState.bgMusic.isPaused = !applicationState.bgMusic.isPaused;
      console.log(`[bgmusic] Pause state is now: ${applicationState.bgMusic.isPaused}`);
      io.emit('setBgMusicPaused', applicationState.bgMusic.isPaused);
      syncAppState();
    }
  });

  socket.on('nextBgMusicTrack', () => {
    console.log('[bgmusic] Skipping to next track.');
    io.emit('nextBgMusicTrack');
  });

  socket.on('prevBgMusicTrack', () => {
    console.log('[bgmusic] Going to previous track.');
    io.emit('prevBgMusicTrack');
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
