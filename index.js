const express = require('express');
const app = express();
const http = require('http').Server(app);
const { Server } = require("socket.io");
const io = require('socket.io')(http);
const getMP3Duration = require('get-mp3-duration');
const { parse } = require('csv-parse/sync');
const audioconcat = require('audioconcat');
const fs = require('fs');
const globalSettings = require('./config.js');
const path = require('path');
const axios = require('axios');
const { pipeline } = require('stream/promises');

/**
 * Generates TTS audio from text and saves it to a file.
 * @param {string} text The text to convert to speech.
 * @param {string} lang The language code (e.g., 'en-uk').
 * @param {string} filePath The full path to save the MP3 file.
 * @returns {Promise<void>} A promise that resolves when the file is saved.
 */
async function saveTtsAudio(text, lang, filePath) {
  const { getAudioUrl } = await import('google-tts-api');
  const url = getAudioUrl(text, { lang });
  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'stream'
  });
  await pipeline(response.data, fs.createWriteStream(filePath));
}

// Helper function to convert trailing Roman numerals in a name to words.
function convertRomanNumeralsToWords(name) {
  if (!name) return '';
  const romanMap = {
    'X': 'the tenth',
    'IX': 'the ninth',
    'VIII': 'the eighth',
    'VII': 'the seventh',
    'VI': 'the sixth',
    'V': 'the fifth',
    'IV': 'the fourth',
    'III': 'the third',
    'II': 'the second',
    'I': 'the first',
  };

  // Regex to find a Roman numeral at the end of the string, preceded by a space.
  // The order in the regex is important to match longer numerals first.
  const romanRegex = /\s(X|IX|VIII|VII|VI|V|IV|III|II|I)$/;
  const match = name.match(romanRegex);

  if (match && romanMap[match[1]]) {
    // Replace the Roman numeral part with the word equivalent, with a preceding comma for a natural pause.
    return name.replace(romanRegex, `, ${romanMap[match[1]]}`);
  }

  return name;
}

// Helper function to split text into chunks for TTS generation
function splitText(text, maxLength = 150) {
  if (!text) return [];
  const chunks = [];
  let remainingText = text;

  while (remainingText.length > 0) {
    if (remainingText.length <= maxLength) {
      chunks.push(remainingText);
      break;
    }

    let chunk = remainingText.substring(0, maxLength);
    let splitIndex = -1;

    // Search backwards from the end of the chunk for a good split point.
    // 1. Prioritize sentence-ending punctuation
    for (let i = chunk.length - 1; i >= 0; i--) {
      if ('.!?'.includes(chunk[i])) {
        splitIndex = i + 1;
        break;
      }
    }

    // 2. Then try phrase-ending punctuation
    if (splitIndex === -1) {
      for (let i = chunk.length - 1; i >= 0; i--) {
        if (',;:'.includes(chunk[i])) {
          splitIndex = i + 1;
          break;
        }
      }
    }

    // 3. Finally, try to split at the last space
    if (splitIndex === -1) {
      const lastSpace = chunk.lastIndexOf(' ');
      if (lastSpace > 0) { // Only split if it's not the first character
        splitIndex = lastSpace + 1;
      }
    }

    // If no natural break was found, split at maxLength
    if (splitIndex === -1) {
      splitIndex = maxLength;
    }

    chunks.push(remainingText.substring(0, splitIndex).trim());
    remainingText = remainingText.substring(splitIndex).trim();
  }

  return chunks.filter(chunk => chunk.length > 0);
}

app.engine('html', require('ejs').renderFile);


app.set('view engine', 'ejs');

/**
 * Reads the video broadcast files and extracts their metadata.
 * @returns {Promise<Array>} A promise that resolves with an array of broadcast data objects.
 */
async function getVideoBroadcasts() {
  const directoryPath = path.join(__dirname, 'public', 'broadcasts', 'videos');
  try {
    const files = await fs.promises.readdir(directoryPath);
    const htmlFiles = files.filter(file => file.endsWith('.html'));

    const broadcasts = await Promise.all(htmlFiles.map(async (file) => {
      const filePath = path.join(directoryPath, file);
      const key = file.replace('.html', '');
      let title = "Untitled Broadcast";

      try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const match = content.match(/<title>(.*?)<\/title>/i);
        if (match && match[1]) {
          title = match[1];
        }
      } catch (readErr) {
        console.error(`Could not read file ${file}:`, readErr);
        // Continue with the default title
      }

      return {
        key: key,
        title: title,
        file: `videos/${key}`,
        priority: 9,
        duration: "0",
        colorscheme: defaultColorScheme
      };
    }));

    return broadcasts;
  } catch (err) {
    console.error("Could not read video broadcasts directory:", err);
    return []; // Return empty array on error, maintaining graceful failure
  }
}

// Defaults
const port = process.env.PORT || globalSettings.sys.port;
const tmpDir = path.join(__dirname, 'public', 'sounds', 'tmp');

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
    currentIndex: 0,
    trackStartedAt: 0,
    pausedAtTime: 0, // elapsed time in ms when pause was triggered
    volume: 50,
    duration: 0,
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

  // Ensure the temporary directory for TTS exists
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
    console.log('[tts] Created temporary directory for TTS files.');
  }

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
    applicationState.bgMusic.currentIndex = 0;
    applicationState.bgMusic.trackStartedAt = 0;
    applicationState.bgMusic.pausedAtTime = 0;
    applicationState.bgMusic.duration = 0;

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
    io.emit('stopAllAudio');
  });

  socket.on('stopBgMusicOnly', () => {
    console.log('[bgmusic] => stop background music broadcasted');
    // Clear the server state for background music
    applicationState.bgMusic.playlistName = null;
    applicationState.bgMusic.files = [];
    applicationState.bgMusic.isPaused = false;
    applicationState.bgMusic.currentIndex = 0;
    applicationState.bgMusic.trackStartedAt = 0;
    applicationState.bgMusic.pausedAtTime = 0;
    applicationState.bgMusic.duration = 0;
    syncAppState();
    io.emit('bgMusicStopped');
  });

  socket.on('generate-match-audio', async ({
    csvData,
    runNumber,
    matchType
  }) => {
    if (!csvData || !runNumber || !matchType || (runNumber !== '7' && runNumber !== '8')) {
      return socket.emit('match-audio-error', {
        message: 'Invalid data received.'
      });
    }

    const timestamp = Date.now();
    const iRepeatFile = path.join(tmpDir, `match-irepeat-global-${timestamp}.mp3`);

    try {
      const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true
      });

       console.log(`[match-audio] Received request to generate audio for Run ${runNumber}.`);

      // 1. Generate the "I repeat" audio once for the entire batch.
      await saveTtsAudio('I repeat.', 'en-uk', iRepeatFile);
      console.log(`[match-audio] Generated shared 'I repeat' file.`);


      if (!records.length || !records[0].Person1 || !records[0].Person2) {
         return socket.emit('match-audio-error', {
          message: 'CSV must have "Person1" and "Person2" columns.'
        });
      }

      const cleanNameForFile = (name) => {
        if (!name) return '';
        // Remove single quotes, double quotes, and periods
        let clean = name.replace(/['"\.]/g, "");
        // Replace spaces with underscores
        clean = clean.replace(/\s+/g, "_");
        return clean;
      };

      const outputDir = path.join(__dirname, 'public', 'sounds', 'audio', 'Matches', `Run ${runNumber}`, `${matchType} Match`);
      // Clean up existing directory before generating new files.
      if (fs.existsSync(outputDir)) {
        console.log(`[match-audio] Removing existing directory: ${outputDir}`);
        fs.rmSync(outputDir, {
          recursive: true,
          force: true
        });
      }
      fs.mkdirSync(outputDir, {
        recursive: true
      });
      console.log(`[match-audio] Re-created empty directory: ${outputDir}`);

      const generationPromises = records.map(async (row, index) => {
        const id = (index + 1).toString().padStart(2, '0');
        const rowTimestamp = Date.now();

        try {
          const p1_raw = row.Person1;
          const p2_raw = row.Person2;
          const p1_pronoun = row['Person 1 Pronoun'];
          const custom_followup = row['Custom_followup'];

          if (!p1_raw) {
            console.warn(`[match-audio] Skipping row ${index + 1} due to missing Person1 data.`);
            return; // Skip this iteration
          }

          const p1 = convertRomanNumeralsToWords(p1_raw);
          const cleanP1 = cleanNameForFile(p1);
          let fileName;

          if (!p2_raw) {
            // --- UNMATCHED CASE ---
            let speechText;
            if (custom_followup) {
              speechText = `${p1} is UNMATCHED... I repeat... ${p1} is UNMATCHED. ${custom_followup}`;
            } else if (p1_pronoun) {
              speechText = `${p1} is UNMATCHED... I repeat... ${p1} is UNMATCHED. ${p1_pronoun} will be allowed to take remedial classes and reattempt the online programme next year.`;
            } else {
              console.warn(`[match-audio] Skipping unmatched row ${index + 1} because no followup text (pronoun or custom) was provided.`);
              return;
            }

            fileName = `${id}_${cleanP1}_UNMATCHED.mp3`;
            const finalFilePath = path.join(outputDir, fileName);
            let tempChunkFiles = [];

            try {
              const textChunks = splitText(speechText, 150);

              if (textChunks.length === 0) {
                console.warn(`[match-audio] Skipping unmatched row ${index + 1} because speech text is empty.`);
                return;
              }

              tempChunkFiles = await Promise.all(textChunks.map(async (chunk, i) => {
                const tempChunkFile = path.join(tmpDir, `unmatched-chunk-${id}-${i}-${rowTimestamp}.mp3`);
                await saveTtsAudio(chunk, 'en-uk', tempChunkFile);
                return tempChunkFile;
              }));

              await new Promise((res, rej) => {
                audioconcat(tempChunkFiles)
                  .concat(finalFilePath)
                  .on('error', (err, stdout, stderr) => rej(new Error(`[audioconcat] ${err.message} - ${stderr}`)))
                  .on('end', (output) => res(output));
              });
            } finally {
              // Cleanup for unmatched case
              tempChunkFiles.forEach(file => {
                if (fs.existsSync(file)) fs.unlinkSync(file);
              });
            }
          } else if (p2_raw) {
            // --- MATCHED CASE (existing logic) ---
            const p2 = convertRomanNumeralsToWords(p2_raw);
            const cleanP2 = cleanNameForFile(p2);
            fileName = `${id}_${cleanP1}_&_${cleanP2}.mp3`;
            const finalFilePath = path.join(outputDir, fileName);

            const mergedMatchFile = path.join(tmpDir, `match-merged-${id}-${rowTimestamp}.mp3`);
            let tempChunkFiles = [];

            try {
              // 2. Generate audio for the main match text in chunks.
              const matchText = `${p1} is matched with... ${p2}.`;
              const textChunks = splitText(matchText, 150);

              tempChunkFiles = await Promise.all(textChunks.map(async (chunk, i) => {
                const tempChunkFile = path.join(tmpDir, `match-chunk-${id}-${i}-${rowTimestamp}.mp3`);
                await saveTtsAudio(chunk, 'en-uk', tempChunkFile);
                return tempChunkFile;
              }));

              if (tempChunkFiles.length > 0) {
                await new Promise((res, rej) => {
                  audioconcat(tempChunkFiles)
                    .concat(mergedMatchFile)
                    .on('error', (err, stdout, stderr) => rej(new Error(`[audioconcat] ${err.message} - ${stderr}`)))
                    .on('end', (output) => res(output));
                });
              } else {
                return;
              }

              // 3. Merge the final audio: [merged_match, i_repeat, merged_match]
              await new Promise((res, rej) => {
                audioconcat([mergedMatchFile, iRepeatFile, mergedMatchFile])
                  .concat(finalFilePath)
                  .on('error', (err, stdout, stderr) => rej(new Error(`[audioconcat] ${err.message} - ${stderr}`)))
                  .on('end', (output) => res(output));
              });
            } finally {
              // Cleanup for matched case
              if (fs.existsSync(mergedMatchFile)) fs.unlinkSync(mergedMatchFile);
              tempChunkFiles.forEach(file => {
                if (fs.existsSync(file)) fs.unlinkSync(file);
              });
            }
          } else {
            // Case where p2 is blank and pronoun is also blank.
            console.warn(`[match-audio] Skipping row ${index + 1} due to incomplete data (e.g., Person2 is blank but no pronoun provided).`);
            return;
          }

          console.log(`[match-audio] [${id}] Generated: ${fileName}`);

        } catch (err) {
          console.error(`[match-audio] Error processing row ${index + 1}:`, err);
          throw err; // Re-throw to fail the Promise.all
        }
      });


      await Promise.all(generationPromises);

      console.log(`[match-audio] Successfully generated ${records.length} files for Run ${runNumber}.`);
      socket.emit('match-audio-complete', {
        message: `Successfully generated ${records.length} audio files.`
      });

    } catch (err) {
      console.error('[match-audio] A critical error occurred:', err);
      socket.emit('match-audio-error', {
        message: err.message || 'An unknown error occurred.'
      });
    } finally {
      // Cleanup the shared iRepeatFile after everything is done
      if (fs.existsSync(iRepeatFile)) {
        fs.unlinkSync(iRepeatFile);
      };
    }
  });

  socket.on('tts-speak', async (text) => {
    if (!text || typeof text !== 'string') {
      return;
    }

    const timestamp = Date.now();
    const iRepeatFile = path.join(tmpDir, `tts-irepeat-${timestamp}.mp3`);
    const mergedTTSFile = path.join(tmpDir, `tts-merged-${timestamp}.mp3`);
    const finalFilename = `tts-${timestamp}.mp3`;
    const finalFilePath = path.join(tmpDir, finalFilename);
    let tempChunkFiles = [];

    try {
      // 1. Generate "I repeat" audio
      await saveTtsAudio('I repeat.', 'en-uk', iRepeatFile);

      // 2. Generate main text audio in chunks
      const textChunks = splitText(text, 150);
      if (textChunks.length === 0) {
        throw new Error("No text to speak after sanitizing.");
      }

      tempChunkFiles = await Promise.all(textChunks.map(async (chunk, i) => {
        const tempChunkFile = path.join(tmpDir, `tts-chunk-${i}-${timestamp}.mp3`);
        await saveTtsAudio(chunk, 'en-uk', tempChunkFile);
        return tempChunkFile;
      }));

      await new Promise((res, rej) => {
        audioconcat(tempChunkFiles)
          .concat(mergedTTSFile)
          .on('error', (err, stdout, stderr) => rej(new Error(`[audioconcat] ${err.message} - ${stderr}`)))
          .on('end', (output) => res(output));
      });

      // 3. Merge final audio: [merged_tts, i_repeat, merged_tts]
      await new Promise((res, rej) => {
        audioconcat([mergedTTSFile, iRepeatFile, mergedTTSFile])
          .concat(finalFilePath)
          .on('error', (err, stdout, stderr) => rej(new Error(`[audioconcat] ${err.message} - ${stderr}`)))
          .on('end', (output) => res(output));
      });

      console.log(`[tts] Generated speech file: ${finalFilename}`);
      socket.emit('tts-complete'); // Re-enable button on client

      // Broadcast the command to play the temporary audio file
      const publicPath = `tmp/${finalFilename}`;
      io.emit('playAudioPlaylist', [publicPath], 1);

      // Get duration and schedule deletion
      const buffer = fs.readFileSync(finalFilePath);
      const duration = getMP3Duration(buffer); // duration in milliseconds

      setTimeout(() => {
        fs.unlink(finalFilePath, (unlinkErr) => {
          if (unlinkErr) console.error(`[tts] Error deleting temp file ${finalFilename}:`, unlinkErr);
          else console.log(`[tts] Deleted temp file: ${finalFilename}`);
        });
      }, duration + 5000); // Delete 5 seconds after it should have finished
    } catch (err) {
      console.error('[tts] Error generating speech:', err);
      socket.emit('tts-complete'); // Re-enable button on error
    } finally {
      // Cleanup temp files
      if (fs.existsSync(iRepeatFile)) fs.unlinkSync(iRepeatFile);
      if (fs.existsSync(mergedTTSFile)) fs.unlinkSync(mergedTTSFile);
      tempChunkFiles.forEach(file => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      });
    }
  });

  const readAudioDirectory = (dir) => {
    const dirents = fs.readdirSync(dir, {
      withFileTypes: true
    });
    const files = dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      const relativePath = '/sounds' + res.split(path.join(__dirname, 'public', 'sounds'))[1].replace(/\\/g, '/');
      if (dirent.isDirectory()) {
        return {
          name: dirent.name,
          type: 'folder',
          path: relativePath,
          children: readAudioDirectory(res)
        };
      } else {
        // Only include audio files
        if (['.mp3', '.ogg', '.wav', '.opus'].includes(path.extname(dirent.name).toLowerCase())) {
          return {
            name: dirent.name,
            type: 'file',
            path: relativePath
          };
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
      fs.mkdirSync(bgmusicDir, {
        recursive: true
      });
      console.log('[bgmusic] Created missing bgmusic directory.');
      return [];
    }
    try {
      const dirents = fs.readdirSync(bgmusicDir, {
        withFileTypes: true
      });
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

  socket.on('startBgMusicPlaylist', (data) => {
    // Support both old (string) and new (object) format for backward compatibility
    const playlistName = typeof data === 'object' && data !== null ? data.playlistName : data;
    const volume = typeof data === 'object' && data !== null ? data.volume : undefined;

    if (volume !== undefined && volume !== null) {
      const newVolume = Math.max(0, Math.min(100, parseInt(volume, 10)));
      if (!isNaN(newVolume)) {
        applicationState.bgMusic.volume = newVolume;
        console.log(`[bgmusic] Volume set to ${newVolume} with new playlist.`);
      }
    }

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
      applicationState.bgMusic.currentIndex = 0;
      applicationState.bgMusic.trackStartedAt = Date.now();
      applicationState.bgMusic.pausedAtTime = 0;
      applicationState.bgMusic.duration = 0;

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
      const bgMusic = applicationState.bgMusic;
      bgMusic.isPaused = !bgMusic.isPaused;

      if (bgMusic.isPaused) {
        // Store how far into the track we were when we paused.
        bgMusic.pausedAtTime = Date.now() - bgMusic.trackStartedAt;
      } else {
        // Adjust trackStartedAt to account for the time we were paused.
        bgMusic.trackStartedAt = Date.now() - bgMusic.pausedAtTime;
        bgMusic.pausedAtTime = 0;
      }

      console.log(`[bgmusic] Pause state is now: ${applicationState.bgMusic.isPaused}`);
      io.emit('setBgMusicPaused', applicationState.bgMusic.isPaused);
      syncAppState();
    }
  });

  const changeBgMusicTrack = (direction) => {
    const bgMusic = applicationState.bgMusic;
    if (!bgMusic.playlistName) return;

    bgMusic.currentIndex += direction;
    if (bgMusic.currentIndex >= bgMusic.files.length) {
      bgMusic.currentIndex = 0;
    } else if (bgMusic.currentIndex < 0) {
      bgMusic.currentIndex = bgMusic.files.length - 1;
    }

    bgMusic.trackStartedAt = Date.now();
    bgMusic.isPaused = false;
    bgMusic.pausedAtTime = 0;
    bgMusic.duration = 0; // Reset duration for the new track

    console.log(`[bgmusic] Changing to track index: ${bgMusic.currentIndex}`);
    io.emit('changeBgMusicTrack', bgMusic.currentIndex);
    syncAppState();
  };

  socket.on('nextBgMusicTrack', () => changeBgMusicTrack(1));
  socket.on('prevBgMusicTrack', () => changeBgMusicTrack(-1));

  socket.on('seekBgMusic', (timeInSeconds) => {
    const bgMusic = applicationState.bgMusic;
    if (bgMusic.playlistName) {
      const newTime = parseFloat(timeInSeconds);
      if (!isNaN(newTime) && newTime >= 0) {
        bgMusic.trackStartedAt = Date.now() - (newTime * 1000);
        if (bgMusic.isPaused) {
          bgMusic.pausedAtTime = newTime * 1000;
        }
        console.log(`[bgmusic] Seeking to ${newTime}s`);
        // Tell all clients to seek to the new time.
        io.emit('bgMusicSeek', newTime);
        syncAppState(); // Broadcast the updated state to all clients
      }
    }
  });

  socket.on('reportBgMusicDuration', (data) => {
    const bgMusic = applicationState.bgMusic;
    // Only update if the report is for the currently playing track
    if (bgMusic.playlistName && bgMusic.currentIndex === data.index && bgMusic.duration !== data.duration) {
      bgMusic.duration = data.duration;
      console.log(`[bgmusic] Received duration for track ${data.index}: ${data.duration}`);
      // Broadcast this metadata update to all clients
      io.emit('bgMusicMetaUpdate', {
        duration: bgMusic.duration,
        currentIndex: bgMusic.currentIndex
      });
    }
  });

  // optional/legacy PA functionality
  if (globalSettings.sys.voiceEnabled) {
    const pa_folder = path.join(__dirname, 'public', 'sounds', 'audio-pa');

    // Use a Map to store the PA filename for each socket to prevent race conditions
    const paFiles = new Map();

    const cleanupOldPAFiles = async () => {
      try {
        await fs.promises.mkdir(pa_folder, { recursive: true });
        const files = await fs.promises.readdir(pa_folder);
        const cutoffTime = Date.now() - 60000; // 60 seconds ago

        for (const file of files) {
          const filePath = path.join(pa_folder, file);
          try {
            const stat = await fs.promises.stat(filePath);
            if (stat.ctime.getTime() < cutoffTime) {
              console.log('[PA] Unlinking old file:', filePath);
              await fs.promises.unlink(filePath);
            }
          } catch (statErr) {
            // Ignore errors for files that might have been deleted between readdir and stat
            if (statErr.code !== 'ENOENT') {
              console.error(`[PA] Error stating file ${file}:`, statErr);
            }
          }
        }
      } catch (err) {
        console.error('[PA] Cleanup failed:', err);
      }
    };

    socket.on('startPA', async () => {
      // Run cleanup, but don't block the response
      cleanupOldPAFiles();

      const pa_name = `PA-${socket.id}-${Date.now()}.opus`;
      paFiles.set(socket.id, pa_name); // Store filename against socket.id

      const filePath = path.join(pa_folder, pa_name);
      try {
        await fs.promises.writeFile(filePath, ''); // Create empty file
        console.log(`[PA] Started for socket ${socket.id}: ${pa_name}`);
      } catch (err) {
        console.error(`[PA] Could not create file for ${socket.id}:`, err);
      }
    });

    socket.on('uploadPA', async (data) => {
      const pa_name = paFiles.get(socket.id);
      if (!pa_name) {
        console.error(`[PA] Received upload from socket ${socket.id} without starting PA.`);
        return;
      }
      // TODO: Force maximum length to stop the server from overflowing
      const filePath = path.join(pa_folder, pa_name);
      try {
        await fs.promises.appendFile(filePath, data);
      } catch (err) {
        console.error(`[PA] Error appending data for ${socket.id}:`, err);
      }
    });

    socket.on('broadcastPA', () => {
      const pa_name = paFiles.get(socket.id);
      if (pa_name) {
        console.log('[audio] => PA: ' + pa_name);
        // Correct path for static assets
        io.emit('playAudioFile', `/sounds/audio-pa/${pa_name}`);
      } else {
        console.error(`[PA] Received broadcast from socket ${socket.id} without a file.`);
      }
    });

    // Clean up map on disconnect
    socket.on('disconnect', () => paFiles.delete(socket.id));
  }

});

// Start the sequence
initializeBroadcastSystem();
