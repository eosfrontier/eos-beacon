const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const globalSettings = require('./config.js');
const path = require('path');


app.set('view engine', 'ejs');

// 1. Create a function that handles the initialization
async function initializeBroadcastSystem() {
  try {
    // 2. Fetch the data FIRST. This "blocks" the rest of this function.
    const response = await fetch('/get-video-broadcasts');
    const broadcasts = await response.json();

    // 3. Register the variables globally
    broadcasts.forEach(data => {
      window[data.key] = new broadcastObj(
        data.title,
        data.file,
        data.priority,
        data.duration,
        data.colorscheme
      );
    });

    console.log("Initialization Complete: Variables registered.");

    // 4. NOW call the function that handles 'lastBC'
    // This is where you likely call syncAppState() or similar.
    startAppLogic();

  } catch (err) {
    console.error("System failed to initialize:", err);
  }
}

// Start the sequence as soon as the script loads
initializeBroadcastSystem();

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
if (globalSettings.sys.voiceEnabled) {
  express.static.mime.define({ 'audio/ogg;codec=opus': ['opus'] });
}
app.use(express.static('public'));
app.use(express.static('_includes'));
app.get('/', (req, res) =>
  res.sendFile('index.html', { root: __dirname + '/public/' })
);
app.get('/get-video-broadcasts', (req, res) => {
  const directoryPath = path.join(__dirname, 'public', 'broadcasts', 'videos');

  fs.readdir(directoryPath, (err, files) => {
    if (err) return res.status(500).json([]);

    // Map files to a list of Promises so we can read them all at once
    const promises = files
      .filter(file => file.endsWith('.html'))
      .map(file => {
        return new Promise((resolve) => {
          const filePath = path.join(directoryPath, file);
          const key = file.replace('.html', '');

          fs.readFile(filePath, 'utf8', (err, content) => {
            let title = "Untitled Broadcast";
            if (!err) {
              // Match content between <title> and </title>
              const match = content.match(/<title>(.*?)<\/title>/i);
              if (match && match[1]) title = match[1];
            }

            // Return the data object for this broadcast
            resolve({
              key: key,
              title: title,
              file: `videos/${key}`, // Matches your old manual path
              priority: 9,
              duration: "0",
              colorscheme: "0"
            });
          });
        });
      });

    Promise.all(promises).then(broadcastData => {
      res.json(broadcastData);
    });
  });
});
app.get('*', (req, res) =>
  res.sendFile('404.html', { root: __dirname + '/public/' })
);

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

const sanitizeUserString = (str) =>
  str.replace(/[`~$^&*_|=;'",<>\{\}\[\]\\\/]/gi, '');
const syncAppState = () => io.emit('updateDynamicData', applicationState);
const syncConnectionCounter = () => {
  applicationState.countClients = io.engine.clientsCount;
  syncAppState();
};

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

  socket.on('getMedia', function () {

    /*
      getMedia has three seperate folders by default: miscAudio, aliceAudio and daveAudio.
      First, beacon will check if the subfolders actually exist, then read every file and push them into an array.
      Secondly, we push this array to the admin screen to generate the "play audio" buttons
    */
    var miscAudio = [];
    if (fs.existsSync('./public/sounds/audio-misc')) {
      fs.readdir('./public/sounds/audio-misc', (err, files) => {
        files.forEach(file => {
          miscAudio.push(file);
        });
        socket.emit('sendMediaMisc', miscAudio);
      });
    }

    /* copy of misc audio */
    // var aliceAudio = [];
    // if(fs.existsSync('./public/sounds/audio-alice')) {
    //   fs.readdir('./public/sounds/audio-alice', (err, files) => {
    //     files.forEach(file => {
    //       aliceAudio.push(file);
    //     });
    //     socket.emit('sendMediaAlice', aliceAudio);
    //   });
    // }

    // /* copy of misc audio */
    // var daveAudio = [];
    // if(fs.existsSync('./public/sounds/audio-dave')) {
    //   fs.readdir('./public/sounds/audio-dave', (err, files) => {
    //     files.forEach(file => {
    //       daveAudio.push(file);
    //     });
    //     socket.emit('sendMediaDave', daveAudio);
    //   });
    // }

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
