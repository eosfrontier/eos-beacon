const socket = io();
const eosTimeAPI = 'https://api.eosfrontier.space/watchtower/time'
var selector = "";
var target = "";
var clearIsActive = undefined;
var activeColorScheme = '0';
var activeBroadcastPriority = 1;

/* VARS FOR CACHING: We fill these variables with $(html) selectors to save memory in the long run. */
var eosIcDateCache = [];
var clockCache = "";
var ddCache = "";
var dowCache = "";
var icdateCache = "";
var BCaudioCache = "";
var customAudioCache = "";
var notifiContCache = "";
var loopSoundCounter = 1;
var loopSoundTimer;

// To store the state of an interrupted background music playlist
let backgroundPlaylistState = null;

// State object for the current playlist
let playlistState = {
    files: [],
    loopCount: 0,
    volume: 50,
    isActive: false,
    isPaused: false,
    currentIndex: 0,
    loops: 0,
    timeoutId: null,
    resumeTime: 0, // Time to start a track from
    isResuming: false, // Flag for fade-in logic
    duration: 0, // Total duration of the current track
    trackStartedAt: 0, // Server timestamp when the track began
    pausedAtTime: 0, // Elapsed time in ms when pause was triggered
};

let mainScreenLoaded = false;
let playOnLoad = false;
let isScrubbing = false;
let bgMusicTimeUpdateInterval = null;
let adminSliderUpdateInterval = null;


$(document).on('mainScreenLoaded', function() {
    mainScreenLoaded = true;
    if (playOnLoad) {
        console.log('[bgmusic] Main screen loaded, now attempting to play synced music.');
        // This first attempt will be blocked by the browser's autoplay policy
        // if the user hasn't interacted yet. The `unlockAudio` function will
        // handle retrying playback upon the first user interaction.
        playNextTrack();
    }
});

let audioUnlocked = false;
function unlockAudio() {
    if (audioUnlocked) {
        return;
    }
    // Create a dummy audio element and play it. This is the most reliable way
    // to unlock audio playback across all browsers.
    const unlockAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
    unlockAudio.play().then(() => {
        audioUnlocked = true;
        console.log('[audio] Audio unlocked by user interaction.');

        // If a background music playlist was synced and is waiting to play, start it now.
        if (playlistState.isActive && playlistState.isPaused === false && playlistState.loopCount === -1 && playlistState.timeoutId === null) {
            const audioEl = $('#custom-audio').find('audio').get(0);
            if (!audioEl) {
                console.log('[bgmusic] Starting synced playlist after user interaction.');
                playNextTrack();
            }
        }
    }).catch(() => {}); // Ignore errors, the user might need to interact again.
}

/* navigate loads (TARGET).HTML into the MAIN SCREEN div. pretending to go to another page but instead putting it into our existing box.*/
function navigate(target, icDateEnabled, yearOffset) {
  if (target != "") {
    $('#main').empty().load(target + '.html', function() {
        // When the main screen is loaded for the first time, trigger an event
        // so we know the UI is stable.
        if (target === 'mainScreen') {
            $(document).trigger('mainScreenLoaded');
        }
    });
  }
  /* At the loading of the MAIN SCREEN we get the perfect opportunity to do an async time. We can't do this in the time function itself, as that keeps refreshing every 1s*/
  if (icDateEnabled) {
    getEosICTime();
  }
  if (!icDateEnabled){
    getOCDate(yearOffset);
  }
}

/* flashblocks causes a "flash" effect inside the boxes spread over beacon, when for example, a broadcast is received.
this flash should only lasts for a few seconds, by calling the FlashBlocks function again with a small timeout. */
function FlashBlocks(div) {

  if (div == "" || div == undefined) {
    div = '.block';
  }

  /* don't flash mobile devices. */
  if ($(window).width() < 769) {
    return false;
  }

  if ($(div).hasClass('flash')) {
    $(div).removeClass('flash');
  } else {
    $(div).addClass('flash');
  }

}

function getCurrentTime() {
  const currentTime = new Date();
  let currentHours = currentTime.getHours();
  let currentMinutes = currentTime.getMinutes();
  currentMinutes = (currentMinutes < 10 ? "0" : "") + currentMinutes;
  currentHours = (currentHours == 0) ? 12 : currentHours;
  const currentTimeString = currentHours + ":" + currentMinutes + ":" + "&nbsp;ECT";
  return currentTimeString;
}

/* function: broadcast . CLIENT SIDE. This is triggered upon RECEIVING a broadcast from the server (index.js) */
function broadCast(location) {

  /* fills in the blanks. */
  if (location['title'] == null) location['title'] = "Untitled Broadcast";
  if (location['file'] == null) location['file'] = "404";
  if (location['priority'] == null) location['priority'] = "1";
  if (location['duration'] == null) location['duration'] = "0";
  if (location['colorscheme'] == null) location['colorscheme'] = "tal";


  /* checks if anything is set in the broadcast call. */
  /*if(location) {*/

  /* Cache the notification container div: This will save us a LOT of requests in the long run. */
  if (notifiContCache == "") { notifiContCache = $("#notificationContainer"); }

  var currentTimeString = getCurrentTime();

  /* weird little optimazation: let the flash function inside our house,
    so we don't end up calling it inside two to four times and then pushing them outside again */
  var FlashFunctie = FlashBlocks;

  /* Hey, I just noticed you loaded a broadcast.HTML file there, let me just.. */
  $.get('/broadcasts/' + location['file'] + '.html')
    .done(function () {

      if (location['priority'] > 0 && !isNaN(location['duration'])) {

        if (location['priority'] < activeBroadcastPriority) {

          return false;

        } else {

          /* if video player exists; kill it, dispose of the body. */
          if ($('#broadcastVideo').length > 0) {
            var oldPlayer = document.getElementById('broadcastVideo');
            videojs(oldPlayer).dispose();
          }

          /* foolproofing: if the color scheme is named DEFAULT instead of zero, make it zero regardless. */
          if (location.colorscheme == 'default') location.colorscheme = '0';
          if (activeColorScheme == 'default') activeColorScheme = '0';

          /* while we're at it, let's check for scary symbols. Just incase. */
          var outString = location.colorscheme.replace(/[`~!@#$%^&*()_|+=?;:'",<>\{\}\[\]\\\/]/gi, '');
          location.colorscheme = outString;

          /* colorscheme. */
          /* is the colorscheme already active, OR is default trying to override default? */
          if ((activeColorScheme == '0' && location.colorscheme == '0') || (activeColorScheme == location.colorscheme)) {
            /* no change..*/

          } else if (activeColorScheme != '0' && location.colorscheme == '0') {
            /* unload the previous colorscheme. Then, load.. */
            $('link[rel=stylesheet][href~="/_includes/css/alert-' + activeColorScheme + '.css"]').remove();
            activeColorScheme = '0';

            /* active = default > broadcast = not-default: */
          } else if (activeColorScheme == '0' && location.colorscheme != '0') {

            $('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '/_includes/css/alert-' + location.colorscheme + '.css'));
            activeColorScheme = location.colorscheme;

          } else if (location.colorscheme != '0' && activeColorScheme != location.colorscheme) {

            /* unload ACTIVE, load LOCATION */
            $('link[rel=stylesheet][href~="/_includes/css/alert-' + activeColorScheme + '.css"]').remove();
            $('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '/_includes/css/alert-' + location.colorscheme + '.css'));
            activeColorScheme = location.colorscheme;
          }

          /* empty the container, then, load the new broadcast. */
          notifiContCache.empty().load('/broadcasts/' + location.file + '.html');


          /* resets priority 99 to 1, so that it can later be overruled. Because 99 equals RESET. */
          if (location.priority == 99) location.priority = 1;

          /* update 'Last broadcast' */
          activeBroadcastPriority = location.priority;

          if (location.title != "") {

            var outString = location.title.replace(/[`~!@#$%^&*()_|+=?;:'",<>\{\}\[\]\\\/]/gi, '');
            location.title = outString;

            $("#lastBroadcastTitle").html("<i class='fa fa-bell'></i>&nbsp;" + location.title);
            $("#lastBroadcastTime").html(currentTimeString);
          }

          /* set the clearBroadcast to ZERO. This prevents a PREVIOUS broadcast reset from triggering on your new broadcast. */
          if (location.duration && location.duration == 0) {
            clearBroadcast(0);
          }

          /* request a 'CLEAR IN XXXX MILISECONDS' */
          if (location.duration && location.duration > 0 && !isNaN(location.duration)) {
            clearBroadcast(location.duration);
          }

          FlashFunctie('.block');
          setTimeout(function () {
            FlashFunctie('.block');
          }, 1500);
        }
      }
    })
    .fail(function () {

      /* INCASE the broadcast IS NOT loaded (for example, an error or a file truly doesnt exist), CLEAR the changes and load 404. */

      if (activeColorScheme != '0' && activeColorScheme != 'default') {
        $('link[rel=stylesheet][href~="/_includes/css/colors-' + activeColorScheme + '.css"]').remove();
      }

      FlashFunctie('.block');
      setTimeout(function () {
        FlashFunctie('.block');
      }, 1500);

      activeColorScheme = '0';
      activeBroadcastPriority = 1;

      notifiContCache.empty().load('/broadcasts/404.html');
    });
  /*}*/

}

/* SEND THE BROADCAST. This is usually put on buttons, but you can use it from the console when you want to. Or anywhere else, really. */
function sendBroadCast(location) {
  var FlashFunctie = FlashBlocks;

  FlashFunctie('.adm-tab');
  setTimeout(function () {
    FlashFunctie('.adm-tab');
  }, 1500);

  socket.emit('broadcastSend', location);
}

/* broadcast from adminpanel to index.js. Sends a "play this file!" request to every connected client. */
function broadcastAudio(audiofile) {
  socket.emit('broadcastAudio', audiofile);
}

/* functie om de duration toch wel werkend te krijgen - oftewel een broadcast CLEAREN na ingestelde tijd.*/
function clearBroadcast(duration) {
  console.log('clear in :' + duration);

  /* reset soundLoopTimer zodat er geen geluiden spelen na een reset */
  clearTimeout(loopSoundTimer);
  loopSoundCounter = 1;

  if (duration != "" && duration != null) {

    /* timer? Gebruik die mooie timer en DAN resetten we de broadcast.*/
    if (clearIsActive != undefined && duration > 0) {
      console.log('clear == active');
      clearTimeout(clearIsActive);
      clearIsActive = setTimeout(function () {
        socket.emit('broadcastSend', bcreset);
        clearIsActive = undefined;
      }, duration);

    } else if (clearIsActive != undefined && duration == 0) {
      console.log('clear == nullified');
      clearTimeout(clearIsActive);
      clearIsActive = undefined;
    } else if (undefined && duration == 0) {

      /* niks doen. */

    } else {
      clearIsActive = setTimeout(function () {
        socket.emit('broadcastSend', bcreset);
        clearIsActive = undefined;
      }, duration);
    }

  } else {

    if (duration === 0) {
      clearTimeout(clearIsActive);
      clearIsActive = undefined;
    } else {
      /* geen timer? Gewoon resetten. */
      socket.emit('broadcastSend', bcreset);
      clearTimeout(clearIsActive);
      clearIsActive = undefined;
    }

  }

}

function generateAudioPlayer(audiofile, repeatcount, volume, startTime = 0, shouldFade = false) {

  if (customAudioCache == "") {
    customAudioCache = $('#custom-audio');
  }

  if (audiofile) {

    let isInterrupting = false;
    // Check if we need to interrupt a background music playlist.
    // We identify background music by loopCount === -1.
    if (playlistState.isActive && playlistState.loopCount === -1 && !playlistState.isPaused) {
        const currentPlaylistFile = playlistState.files[playlistState.currentIndex];
        if (audiofile !== currentPlaylistFile) {
            // It's a one-off sound (or first in a loop), so interrupt.
            if (repeatcount <= 1) {
                isInterrupting = true;
                pausePlaylist();
            } else {
                // It's a new looping sound, so it replaces the current playlist.
                console.log('[audio] New looping sound replacing background playlist.');
                stopAllAudio(); // Simplest way to stop everything and let the new sound play.
            }
        }
    }

    console.log(audiofile);

    if (repeatcount == null || repeatcount == undefined) {
      repeatcount = 1;
    }

    if (volume === undefined || volume === null) {
      volume = 100;
    }

    if (document.getElementById("custom-audio") !== null) {

      console.log('CUSTOM-audio -> play: ' + audiofile + ' * ' + repeatcount + ' time(s). Played ' + loopSoundCounter + ' time(s).');

      if ($(window).width() > 960) {
        // Create the audio element with jQuery
        var audioPlayer = $('<audio id="generatedaudioplayer" controls="controls" class="hidden">'
          + '<source src="/sounds/' + audiofile + '" type="audio/mpeg">'
          + '</audio>').get(0); // .get(0) to access the raw DOM element

        // Clamp volume between 0 and 100 and convert to 0.0-1.0 range
        const cleanVolume = Math.max(0, Math.min(100, volume));
        const targetVolume = cleanVolume / 100;

        if (shouldFade) {
            audioPlayer.volume = 0;
            $(audioPlayer).one('playing', function() {
                $(this).animate({ volume: targetVolume }, 500); // 500ms fade-in
            });
        } else {
            audioPlayer.volume = targetVolume;
        }

        $(audioPlayer).one('loadedmetadata', function () {
            if (startTime > 0 && isFinite(startTime)) {
                this.currentTime = startTime;
            }

            // If it's a background music track, set up timers and slider
            if (playlistState.isActive && playlistState.loopCount === -1) {
                updateBgMusicPanelState();

            // This is a background music track. Report its duration to the server.
            socket.emit('reportBgMusicDuration', { duration: this.duration, index: playlistState.currentIndex });

                const duration = this.duration;
                const timeSlider = document.getElementById('bgmusic-time-slider');
                const durationEl = document.getElementById('bgmusic-duration');

                if (timeSlider && durationEl && !isNaN(duration)) {
                    timeSlider.max = duration;
                    durationEl.textContent = formatTrackTime(duration);
                }

                // Adjust duration if we are resuming from a specific time
                const durationInMs = ((this.duration - this.currentTime) * 1000) + 500;

                if (bgMusicTimeUpdateInterval) clearInterval(bgMusicTimeUpdateInterval);
                bgMusicTimeUpdateInterval = setInterval(updateBgMusicTimeSlider, 500);

                if (playlistState.timeoutId) clearTimeout(playlistState.timeoutId);
                playlistState.timeoutId = setTimeout(() => {
                    if (!playlistState.isActive || playlistState.isPaused) return;
                    socket.emit('nextBgMusicTrack');
                }, durationInMs);
            }
        });

        customAudioCache.empty().append(audioPlayer);
        const playPromise = audioPlayer.play();

        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('[audio] Playback was prevented by the browser. It will start on user interaction.');
                // If this was a background music track, we need to reset its state
                // so that the unlockAudio function can restart it.
                if (playlistState.isActive && playlistState.loopCount === -1) {
                    if (playlistState.timeoutId) {
                        clearTimeout(playlistState.timeoutId);
                        playlistState.timeoutId = null;
                    }
                    if (bgMusicTimeUpdateInterval) {
                        clearInterval(bgMusicTimeUpdateInterval);
                        bgMusicTimeUpdateInterval = null;
                    }
                    $(audioPlayer).remove();
                }
            });
        }

        if (isInterrupting) {
            $(audioPlayer).on('ended', function() {
                resumePlaylist();
            });
        }

        /* repeat? */
        loopSound(audiofile, repeatcount)

      }

    } else {

      if (document.getElementById("default-audio") !== null) {
        console.log('default-audio -> play');

        customAudioCache.empty();
        $('#default-audio').trigger('play');

      }

    }

  } else {

    customAudioCache.empty();
    $('#default-audio').trigger('play');
  }

}

// loop audio breakout want:
//jquery.min.js:4 Uncaught (in promise) DOMException: play() failed because the user didn't interact with the document first
function loopSound(audiofile, repeatcount) {
  if (loopSoundCounter < repeatcount) {
    loopSoundCounter++;
    loopSoundTimer = setTimeout(() => { generateAudioPlayer(audiofile, repeatcount) }, 2000)
  } else {
    loopSoundCounter = 1
  }
}

/* audio file functie apart */
function generateBCaudio(audiofile) {
  console.log(audiofile);
 
  if ($(window).width() > 960) {
 
    /* cache the audio element if we haven't already. */
    if (BCaudioCache == "") { BCaudioCache = $('#BCAUDIO'); }
 
    const existingAudio = BCaudioCache.find('audio');
 
    const playNewAudio = () => {
      // NEW: Pause background music if it's playing
      let wasBgMusicPlaying = playlistState.isActive && playlistState.loopCount === -1 && !playlistState.isPaused;
      if (wasBgMusicPlaying) {
          pausePlaylist();
      }

      // Create new audio element, initially silent
      const newAudio = $('<audio id="generatedBCAUDIO" controls="controls" class="hidden">'
        + '<source src="' + audiofile + '">'
        + '</audio>').get(0);
 
      newAudio.volume = 0;
      BCaudioCache.html(newAudio); // Replace previous audio element
 
      $(newAudio).on('canplay', function() {
        this.play();
        // Fade in the volume
        $(this).animate({ volume: 1 }, 30);
      });

      // NEW: Resume background music when this one ends
      $(newAudio).on('ended', function() {
          if (wasBgMusicPlaying) {
              resumePlaylist();
          }
      });
    };
 
    if (existingAudio.length > 0 && !existingAudio.get(0).paused) {
      // An audio is playing, fade it out first.
      existingAudio.animate({ volume: 0 }, 1500, function() {
        $(this).remove();
        playNewAudio();
      });
    } else {
      // No audio is playing, just play the new one.
      playNewAudio();
    }
  }
}

function stopAllAudio() {
  socket.emit('stopAllAudio');
}

function stopBgMusicOnly() {
    if (bgMusicTimeUpdateInterval) {
        clearInterval(bgMusicTimeUpdateInterval);
        bgMusicTimeUpdateInterval = null;
    }
    socket.emit('stopBgMusicOnly');
}

socket.on('bgMusicStopped', function() {
    console.log('[bgmusic] Received command to stop background music.');
    // Only act if a background music playlist is active or paused
    if (playlistState.isActive && playlistState.loopCount === -1) {
        if (playlistState.timeoutId) {
            clearTimeout(playlistState.timeoutId);
        }
        if (bgMusicTimeUpdateInterval) {
            clearInterval(bgMusicTimeUpdateInterval);
            bgMusicTimeUpdateInterval = null;
        }

        // Stop and remove the audio element
        if (customAudioCache == "") { customAudioCache = $('#custom-audio'); }
        customAudioCache.find('audio').remove();

        // Reset the state
        playlistState.isActive = false;
        playlistState.isPaused = false;
        playlistState.files = [];
        playlistState.currentIndex = 0;
        playlistState.loops = 0;
        playlistState.timeoutId = null;
        playlistState.resumeTime = 0;

        // This was a hard stop, so clear any saved interruption state too.
        backgroundPlaylistState = null;

        updateBgMusicPanelState();
    }
});

socket.on('stopAllAudio', function() {
    console.log('[audio] Received stopAllAudio command (for interruptions).');

    // If a background playlist was interrupted (by another playlist or a one-off sound)...
    if (backgroundPlaylistState || (playlistState.isPaused && playlistState.loopCount === -1)) {
        console.log('[audio] Cancelling interruption and resuming background music.');

        // Stop all potentially interrupting audio sources with a fade
        if (customAudioCache == "") { customAudioCache = $('#custom-audio'); }
        customAudioCache.find('audio').animate({ volume: 0 }, 300, function() { $(this).remove(); });

        if (BCaudioCache == "") { BCaudioCache = $('#BCAUDIO'); }
        BCaudioCache.find('audio').animate({ volume: 0 }, 300, function() { $(this).remove(); });

        // If the interruption was a temporary playlist, clear its state
        if (backgroundPlaylistState) {
            if (playlistState.timeoutId) clearTimeout(playlistState.timeoutId);
            // Restore the background music state
            playlistState = backgroundPlaylistState;
            backgroundPlaylistState = null;
        }

        // Use a small timeout to allow fades to complete before resuming
        setTimeout(function() {
            resumePlaylist();
        }, 350);
        return;
    }

    // If we get here, no background music was paused.
    // This command should only stop temporary sounds, leaving an active background music playlist untouched.

    // Stop broadcast audio (from generateBCaudio)
    if (BCaudioCache == "") { BCaudioCache = $('#BCAUDIO'); }
    BCaudioCache.find('audio').animate({ volume: 0 }, 500, function() { $(this).remove(); });

    // Check the main audio player.
    if (customAudioCache == "") { customAudioCache = $('#custom-audio'); }
    const audioEl = customAudioCache.find('audio').get(0);

    if (audioEl) {
        // If the currently active playlist is NOT a background music playlist, then it's temporary. Stop it.
        if (playlistState.isActive && playlistState.loopCount !== -1) {
            console.log('[audio] Stopping temporary playlist.');
            $(audioEl).animate({ volume: 0 }, 500, function() {
                $(this).remove();
                // If a temporary playlist was stopped, update its state
                if (playlistState.timeoutId) clearTimeout(playlistState.timeoutId);
                playlistState.isActive = false;
                updateBgMusicPanelState();
            });
        } else if (!playlistState.isActive) {
            // If no playlist is active, any sound in here is a one-off temporary sound.
            console.log('[audio] Stopping one-off temporary audio.');
            $(audioEl).animate({ volume: 0 }, 500, function() { $(this).remove(); });
        }
        // If playlistState.isActive and loopCount IS -1, it's background music, so we do nothing.
    }
});

/* portal status. */
function updatePortalStatus(portalstatus) {

  /* cache the portal status selector here, so that we only have to find it once before running the rest. */
  var portalStatusSelector = $('#portalstatus');

  /* remove animation class, just in case. */
  portalStatusSelector.removeClass('blinkContent');

  if (portalStatusSelector.html() != "" && portalstatus != "" && portalstatus != null) {

    /* switches the portal status between a few select options. Adds 'blinkContent' if the element needs to be animated. */
    if (portalstatus == "unstable") {

      portalStatusSelector.find('.left').html('<span class="portalstatus-icon"><i class="fa fa-angle-double-down"></i></span>');
      portalStatusSelector.find('.right h4').html('Connectivity issues');
      portalStatusSelector.find('.right p').html('Portal network unstable. Package loss may occur.');

    } else if (portalstatus == "multirequest") {

      portalStatusSelector.addClass('blinkContent').find('.left').html('<span class="status-icon"><i class="fa fa-warning"></i></span>');
      portalStatusSelector.find('.right').find('h4').html('Multiple requests');
      portalStatusSelector.find('.right').find('p').html('Multiple external requests detected.<br/>Please stand by.');

    } else if (portalstatus == "shutdown") {

      portalStatusSelector.addClass('blinkContent').find('.left').html('<span class="status-icon"><i class="fa fa-warning"></i></span>');
      portalStatusSelector.find('.right').find('h4').html('!! OFFLINE !!');
      portalStatusSelector.find('.right').find('p').html('Portal services currently unavailable.');

    } else if (portalstatus == "active") {

      portalStatusSelector.addClass('blinkContent').find('.left').html('<span class="status-icon"><i class="fa fa-cog fa-spin"></i></span>');
      portalStatusSelector.find('.right').find('h4').html('Active');
      portalStatusSelector.find('.right').find('p').html('Portal activity detected ...');

    } else if (portalstatus == "maintenance") {

      portalStatusSelector.addClass('blinkContent').find('.left').html('<span class="status-icon"><i class="fa fa-info-circle"></i></span>');
      portalStatusSelector.find('.right').find('h4').html('Maintenance Required');
      portalStatusSelector.find('.right').find('p').html('Safety first.');

    } else {

      portalStatusSelector.find('.left').html('<span class="status-icon"><i class="fa fa-check-circle-o"></i></span>');
      portalStatusSelector.find('.right').find('h4').html('Operational');
      portalStatusSelector.find('.right').find('p').html('Nothing to report.');

    }
  }
}

/* orb status change */
function updateOrbStatus(orbStatus) {
  const _selector = $('#orbstatus');

  _selector.removeClass('blinkContent');
  if (_selector.html() != "" && orbStatus != "" && orbStatus != null) {

    switch (orbStatus) {
      case 'inactive':
        _selector.addClass('blinkContent');
        _selector.find('.top').html('<span class="status-icon"><i class="fa fa-warning"></i></span>');
        _selector.find('.bottom').html('OFFLINE');
        break;

      case 'active':
      default:
        _selector.find('.top').html('<span class="status-icon"><i class="fa fa-check-circle-o"></i></span>');
        _selector.find('.bottom').html('Operational');
        break;
    }

  }

}

/**
 * Starts a shuffled background music playlist.
 * @param {string} playlistName - The name of the folder in public/sounds/bgmusic.
 * @param {number} [volume] - Optional volume level (0-100). Uses last set volume if not provided.
 */
function startBgMusicPlaylist(playlistName, volume) {
    // Pass data as an object to accommodate optional volume
    socket.emit('startBgMusicPlaylist', { playlistName, volume });
}

/**
 * Sends a request to toggle pause/resume for the background music.
 */
function toggleBgMusicPause() {
    socket.emit('toggleBgMusicPause');
}

/**
 * Sends a request to skip to the next background music track.
 */
function nextBgMusicTrack() {
    socket.emit('nextBgMusicTrack');
}

/**
 * Sends a request to go to the previous background music track.
 */
function prevBgMusicTrack() {
    socket.emit('prevBgMusicTrack');
}

/**
 * Sends a request to set the background music volume.
 * @param {number} volume - The volume level from 0 to 100.
 */
function setBgMusicVolume(volume) {
    // Update the label in real-time for responsiveness on the admin panel
    const volumeLabel = document.getElementById('bgmusic-volume-label');
    if (volumeLabel) {
        volumeLabel.textContent = volume;
    }
    socket.emit('setBgMusicVolume', volume);
}

socket.on('playShuffledPlaylist', function(filePaths) {
    // Play the shuffled playlist, looped indefinitely. The server will send a volume update right after.
    // The `playAudioPlaylist` function will handle stopping any previous playlist.
    playAudioPlaylist(filePaths, -1, playlistState.volume);
});

socket.on('changeBgMusicTrack', (newIndex) => {
    // This event is the authoritative command to change the track.
    if (!playlistState.isActive || playlistState.loopCount !== -1) {
        // This client isn't playing background music, so ignore.
        return;
    }
    console.log(`[bgmusic] Received command to change to track index: ${newIndex}`);

    if (bgMusicTimeUpdateInterval) clearInterval(bgMusicTimeUpdateInterval);
    clearTimeout(playlistState.timeoutId);
    $('#custom-audio').find('audio').remove();

    playlistState.currentIndex = newIndex;
    playlistState.resumeTime = 0;
    playNextTrack();
});

document.addEventListener('click', unlockAudio, { once: true });
document.addEventListener('touchstart', unlockAudio, { once: true });

socket.on('syncBgMusic', (serverState) => {
    // Received by a client on connection if a playlist is active on the server.
    console.log('[bgmusic] Syncing initial state from server:', serverState.playlistName);
// Only sync if we are not currently playing a background music playlist.
    if (!playlistState.isActive || playlistState.loopCount !== -1) {
        // Set the local state to match the server.
        if (bgMusicTimeUpdateInterval) {
            clearInterval(bgMusicTimeUpdateInterval);
            bgMusicTimeUpdateInterval = null;
        }

        playlistState.files = serverState.files;
        playlistState.loopCount = -1; // It's a background music playlist
        playlistState.volume = serverState.volume;
        playlistState.currentIndex = serverState.currentIndex;
        playlistState.isActive = true;
        playlistState.isPaused = serverState.isPaused;
        playlistState.loops = 0;
        playlistState.timeoutId = null;
        playlistState.trackStartedAt = serverState.trackStartedAt;
        playlistState.duration = serverState.duration || 0;

        // Calculate the initial playback offset
        const offset = serverState.isPaused ? serverState.pausedAtTime : (Date.now() - serverState.trackStartedAt);
        playlistState.resumeTime = offset / 1000; // convert to seconds

        // Update the UI if the admin panel is open.
        updateBgMusicPanelState();

        // Attempt to play if not paused, respecting the page load state.
        if (!playlistState.isPaused) {
            if (mainScreenLoaded) {
                console.log('[bgmusic] Playlist synced. Attempting to start playback.');
                playNextTrack();
            } else {
                console.log('[bgmusic] Playlist synced. Will start after main screen loads.');
                playOnLoad = true;
            }
        }
    }
});

socket.on('setBgMusicVolume', (volume) => {
    console.log(`[bgmusic] Volume update received: ${volume}`);
    // Always update the state volume for the background music context.
    // This ensures if we start a new playlist, it has the right volume.
    playlistState.volume = volume;

    // If the current active playlist is background music, adjust its volume now.
    if (playlistState.isActive && playlistState.loopCount === -1) {
        const audioEl = $('#custom-audio').find('audio').get(0);
        if (audioEl) {
            audioEl.volume = volume / 100;
        }
    }

    // Always update the panel if it's visible.
    updateBgMusicPanelState();
});

socket.on('setBgMusicPaused', (isPaused) => {
    // Only act on background music playlists
    if (!playlistState.isActive || playlistState.loopCount !== -1) {
        console.log('[bgmusic] "pause/resume" command ignored: not a background music playlist.');
        return;
    }

    // If state is already correct, do nothing.
    if (playlistState.isPaused === isPaused) return;
    console.log(`[bgmusic] "pause/resume" command received. Setting paused to: ${isPaused}`);

    const audioEl = $('#custom-audio').find('audio').get(0);
    playlistState.isPaused = isPaused;

    if (isPaused) { // It's playing, so pause
        if (bgMusicTimeUpdateInterval) {
            clearInterval(bgMusicTimeUpdateInterval);
            bgMusicTimeUpdateInterval = null;
        }

        if (audioEl) {
            $(audioEl).animate({ volume: 0 }, 500, function() {
                this.pause();
            });
        }
        if (playlistState.timeoutId) {
            clearTimeout(playlistState.timeoutId);
            playlistState.timeoutId = null;
        }
    } else { // It's paused, so resume
        if (audioEl) {
            const targetVolume = playlistState.volume / 100;
            audioEl.volume = 0;
            audioEl.play();
            $(audioEl).animate({ volume: targetVolume }, 500);

            const remainingTime = (audioEl.duration - audioEl.currentTime) * 1000;
            if (playlistState.timeoutId) clearTimeout(playlistState.timeoutId);
            if (bgMusicTimeUpdateInterval) clearInterval(bgMusicTimeUpdateInterval);
            bgMusicTimeUpdateInterval = setInterval(updateBgMusicTimeSlider, 500);
            playlistState.timeoutId = setTimeout(() => {
                if (!playlistState.isActive || playlistState.isPaused) return;
                socket.emit('nextBgMusicTrack');
            }, remainingTime + 500);
        } else {
            // No audio element, means we were paused between tracks. Just start the next one.
            playlistState.isResuming = true;
            playNextTrack();
        }
    }
    updateBgMusicPanelState();
});

socket.on('bgMusicSeek', (timeInSeconds) => {
    // Only act if we are currently playing a background music playlist.
    if (playlistState.isActive && playlistState.loopCount === -1) {
        if (playlistState.isPaused) {
            // If paused, just update the resumeTime. The server state is already updated.
            // When the user hits play, it will resume from this new time.
            playlistState.resumeTime = timeInSeconds;
            console.log(`[bgmusic] Seek while paused. New resume time: ${timeInSeconds}s.`);
            updateBgMusicPanelState();
        } else {
            const audioEl = $('#custom-audio').find('audio').get(0);
            if (audioEl) {
                console.log(`[bgmusic] Seeking to ${timeInSeconds}s.`);
                audioEl.currentTime = timeInSeconds;

                // We also need to reset the timeout that schedules the next track.
                if (playlistState.timeoutId) clearTimeout(playlistState.timeoutId);
                const remainingTime = (audioEl.duration - audioEl.currentTime) * 1000;
                playlistState.timeoutId = setTimeout(() => {
                    if (!playlistState.isActive || playlistState.isPaused) return;
                    socket.emit('nextBgMusicTrack');
                }, remainingTime + 500);
            }
        }
    }
});

socket.on('bgMusicMetaUpdate', (data) => {
    // This event is just for updating the UI, not for changing playback state.
    if (playlistState.isActive && playlistState.loopCount === -1 && playlistState.currentIndex === data.currentIndex) {
        console.log(`[bgmusic] Received metadata update. Duration: ${data.duration}`);
        playlistState.duration = data.duration;
        updateBgMusicPanelState();
    }
});

function formatTrackTime(totalSeconds) {
    if (isNaN(totalSeconds) || totalSeconds < 0) {
        return "0:00";
    }
    totalSeconds = Math.floor(totalSeconds);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function setScrubbing(scrubbing) {
    isScrubbing = scrubbing;
    if (scrubbing && bgMusicTimeUpdateInterval) {
        clearInterval(bgMusicTimeUpdateInterval);
        bgMusicTimeUpdateInterval = null;
    }
    if (scrubbing && adminSliderUpdateInterval) {
        clearInterval(adminSliderUpdateInterval);
        adminSliderUpdateInterval = null; // Corrected typo here
    } else if (!scrubbing) {
        // When scrubbing stops, restart the appropriate interval if a playlist is active and not paused
        if (playlistState.isActive && playlistState.loopCount === -1 && !playlistState.isPaused) {
            // Determine if we are on the client page (with local audio) or admin panel (no local audio)
            const audioEl = $('#custom-audio').find('audio').get(0);
            if (audioEl && !isNaN(audioEl.duration)) {
                // Client page, update local audio slider
                if (!bgMusicTimeUpdateInterval) {
                    bgMusicTimeUpdateInterval = setInterval(updateBgMusicTimeSlider, 500);
                }
            } else {
                // Admin panel, update based on server state
                if (!adminSliderUpdateInterval) {
                    adminSliderUpdateInterval = setInterval(updateAdminSlider, 500);
                }
            }
        }
    }
}

function seekBgMusic(timeInSeconds) {
    // Optimistically update the local state to prevent rubber-banding for the active user.
    // The server will broadcast the authoritative state to all clients.
    const newTime = parseFloat(timeInSeconds);
    if (!isNaN(newTime)) {
        if (playlistState.isPaused) {
            playlistState.pausedAtTime = newTime * 1000;
        } else if (playlistState.trackStartedAt > 0) {
            // This mimics the server's calculation to keep the UI in sync locally.
            playlistState.trackStartedAt = Date.now() - (newTime * 1000);
        }
    }
    socket.emit('seekBgMusic', timeInSeconds); // Inform the server of the change.
}

function onBgMusicSliderInput(timeInSeconds) {
    const currentTimeEl = document.getElementById('bgmusic-current-time');
    if (currentTimeEl) {
        currentTimeEl.textContent = formatTrackTime(timeInSeconds);
    }
}

function updateBgMusicTimeSlider() {
    if (isScrubbing || !playlistState.isActive || playlistState.loopCount !== -1 || playlistState.isPaused) {
        return;
    }

    const timeSlider = document.getElementById('bgmusic-time-slider');
    const currentTimeEl = document.getElementById('bgmusic-current-time');
    const audioEl = $('#custom-audio').find('audio').get(0);

    if (!timeSlider || !currentTimeEl || !audioEl || isNaN(audioEl.duration)) {
        return;
    }

    timeSlider.value = audioEl.currentTime;
    currentTimeEl.textContent = formatTrackTime(audioEl.currentTime);
}

/**
 * Updates the admin panel slider by calculating progress from server-synced timestamps.
 * This is used when the page does not have a local audio element to reference.
 */
function updateAdminSlider() {
    if (isScrubbing || !playlistState.isActive || playlistState.loopCount !== -1 || playlistState.isPaused) {
        return;
    }

    const timeSlider = document.getElementById('bgmusic-time-slider');
    const currentTimeEl = document.getElementById('bgmusic-current-time');

    // Only calculate if we have a valid start time
    if (playlistState.trackStartedAt > 0) {
        // Calculate time based on server-synced state.
        const offset = Date.now() - playlistState.trackStartedAt;
        const currentTime = offset / 1000;

        if (timeSlider && currentTimeEl && currentTime <= timeSlider.max) {
            timeSlider.value = currentTime;
            currentTimeEl.textContent = formatTrackTime(currentTime);
        }
    }
}

/* CLOCK */
function updateClock() {
  var currentTime = new Date();
  var dow = eosIcDateCache.iDayName.toUpperCase();
  var dd = eosIcDateCache.iDay
  var icdate = eosIcDateCache.iMonthName.toUpperCase() + ' ' + eosIcDateCache.iYear + eosIcDateCache.iYearAfter
  /*var mm = currentTime.getMonth()+1;*/ /*January is 0!*/
  // if(dd < 10){
  //   dd='0'+dd;
  // }

  // if (dd == 29) {
  //   dd    = '8';
  //   dow   = 'FRIDAY';
  // } else if (dd == 30) {
  //   dd    = '9';
  //   dow   = 'SATURDAY';
  // } else if (dd == 01) {
  //   dd    = '10';
  //   dow   = 'SUNDAY';
  // } else {
  //   dd    = '8';
  //   dow   = 'FRIDAY';
  // }

  var currentHours = currentTime.getHours();
  var currentMinutes = currentTime.getMinutes();
  var currentSeconds = currentTime.getSeconds();

  /* Pad the minutes and seconds with leading zeros, if required */
  currentHours = (currentHours < 10 ? "0" : "") + currentHours;
  currentMinutes = (currentMinutes < 10 ? "0" : "") + currentMinutes;
  currentSeconds = (currentSeconds < 10 ? "0" : "") + currentSeconds;

  /* Compose the string for display */
  var currentTimeString = "[&nbsp;" + currentHours + ":" + currentMinutes + ":" + currentSeconds + "&nbsp;ECT&nbsp;]";

  /* put the target HTML elements into a var we can keep reusing; that way the function will only need to look up each element ONCE. */
  if (clockCache == "") { clockCache = $("#clock"); }
  if (ddCache == "") { ddCache = $("#dd"); }
  if (dowCache == "") { dowCache = $("#dow"); }
  if (icdateCache == "") { icdateCache = $("#icdate"); }

  /* apply clock to cached element. */
  clockCache.html(currentTimeString);
  ddCache.html(dd);
  dowCache.html(dow);
  icdateCache.html(icdate);
}

async function getOCDate(yearOffset = 0) {
// We create a "Fake" fetch by resolving a Promise immediately
    return Promise.resolve().then(() => {
        const now = new Date();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const months = ['january', 'february', 'march', 'april', 'may', 'june', 
                        'july', 'august', 'september', 'october', 'november', 'december'];

        const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

        // This is the data object that emulates your API response
        return {
            "iYear": now.getFullYear() + yearOffset,
            "iYearBefore": "",
            "iYearAfter": "",
            "iDay": now.getDate(),
            "iMonth": now.getMonth() + 1,
            "iDayOfWeek": dayOfWeek,
            "iDayName": days[now.getDay()],
            "iMonthName": months[now.getMonth()]
        };
    })
    .then(data => { 
        // Performs the assignment inside the function exactly like the original
        eosIcDateCache = data; 
    });
}


async function getEosICTime() {
    fetch(eosTimeAPI)
      .then(response => response.json())
      .then(data => { eosIcDateCache = data });
}
// console.log("IC Date: ". eosIcDateCache);
// Function to register video variables globally without necessarily building buttons
async function syncVideoBroadcasts(buildButtons = false, targetContainer = '.items') {
  try {
    const response = await fetch('/get-video-broadcasts');
    const broadcasts = await response.json();

    broadcasts.forEach(data => {
      // Register the variable globally
      window[data.key] = new broadcastObj(
        data.title,
        data.file,
        6,
        data.duration,
        data.colorscheme = "tal"
      );

      if (buildButtons) {
        // Now uses the specific container we passed in
        const container = document.querySelector(targetContainer);
        if (container) {
          const btn = document.createElement('button');
          btn.className = 'btn btn-ui btn-ui-holo';
          btn.innerHTML = `<i class="fa fa-file-video"></i>&nbsp;IC:&nbsp;${data.title}`;
          btn.onclick = () => sendBroadCast(window[data.key]);
          container.appendChild(btn);
        }
      }
    });

    window.dispatchEvent(new Event('broadcastsLoaded'));
  } catch (e) {
    console.error("Failed to sync broadcasts", e);
  }
}

/**
 * Plays a list of audio files sequentially.
 * @param {string[]} audioFiles - An array of paths to the audio files.
 * @param {number} [loopCount=1] - How many times to loop the playlist. -1 for infinite.
 * @param {number} [volume=100] - The volume for the playlist, from 0 to 100.
 */
function playAudioPlaylist(audioFiles, loopCount = 1, volume = 100) {
    // If a background playlist is active and we're starting a temporary one...
    if (playlistState.isActive && playlistState.loopCount === -1 && loopCount !== -1) {
        console.log('[playlist] Interrupting background music for a temporary playlist.');
        // This is a playlist interruption. We should pause the current bg music.
        // The pausePlaylist function already saves the state we need (isPaused, resumeTime).
        pausePlaylist();
        // Now, save the entire paused state.
        backgroundPlaylistState = { ...playlistState };
    } else if (loopCount === -1) {
        // A new background playlist is starting, so clear any saved interruption state.
        backgroundPlaylistState = null;
    }

    // Stop any existing playlist timer before starting a new one.
    // The audio element is already handled by pausePlaylist if it was an interruption.
    if (playlistState.isActive) {
        clearTimeout(playlistState.timeoutId);
    }

    // Initialize new playlist state
    playlistState.files = audioFiles;
    playlistState.loopCount = loopCount;
    playlistState.volume = volume;
    playlistState.isActive = true;
    playlistState.isPaused = false;
    playlistState.currentIndex = 0;
    playlistState.loops = 0;
    playlistState.timeoutId = null;
    playlistState.resumeTime = 0;
    playlistState.isResuming = false;

    playNextTrack();
    // Update panel state after a short delay to ensure DOM is ready
    setTimeout(updateBgMusicPanelState, 100);
}

/**
 * Pauses the currently active playlist.
 */
function pausePlaylist() {
    if (playlistState.isActive && !playlistState.isPaused) {
        console.log('[playlist] Pausing playlist for interruption.');

        playlistState.isPaused = true;
        if (playlistState.timeoutId) {
            clearTimeout(playlistState.timeoutId);
            playlistState.timeoutId = null;
        }

        if (customAudioCache == "") { customAudioCache = $('#custom-audio'); }
        const customAudio = customAudioCache.find('audio');
        if (customAudio.length > 0) {
            playlistState.resumeTime = customAudio.get(0).currentTime;
            // Fade out and remove
            $(customAudio).animate({ volume: 0 }, 500, function() {
                $(this).remove();
            });
        } else {
            playlistState.resumeTime = 0; // Paused between tracks
        }
    }
}

/**
 * Resumes a paused playlist from the next track.
 */
function resumePlaylist() {
    if (playlistState.isActive && playlistState.isPaused) {
        console.log('[playlist] Resuming playlist.');
        playlistState.isPaused = false;
        playlistState.isResuming = true;
        // Replay the current track from where it left off.
        playNextTrack();
    }
}

/**
 * The core logic for playing the next track in the playlistState.
 */
function playNextTrack() {
    if (!playlistState.isActive || playlistState.isPaused) {
        return; // Stop execution if playlist is stopped or paused
    }

    if (playlistState.currentIndex >= playlistState.files.length) {
        playlistState.loops++;
        if (playlistState.loopCount !== -1 && playlistState.loops >= playlistState.loopCount) {
            playlistState.isActive = false; // Playlist finished

            // Check if we need to resume a background playlist.
            if (backgroundPlaylistState) {
                console.log('[playlist] Temporary playlist finished. Resuming background music.');
                // Restore the state. This state is already marked as paused and has resumeTime.
                playlistState = backgroundPlaylistState;
                backgroundPlaylistState = null; // Clear saved state

                // resumePlaylist will set isPaused=false and call playNextTrack again.
                resumePlaylist();
                return;
            }

            updateBgMusicPanelState(); // Update panel to show playlist has ended
            return; // All loops have been completed for a non-interrupting playlist
        }
        playlistState.currentIndex = 0; // Start from the beginning
    }

    const relativePath = playlistState.files[playlistState.currentIndex];
    const startTime = playlistState.resumeTime;
    const shouldFade = !!playlistState.isResuming;

    if (shouldFade) {
        playlistState.isResuming = false; // Consume the flag
    }

    generateAudioPlayer(relativePath, 1, playlistState.volume, startTime, shouldFade);
    playlistState.resumeTime = 0; // Consume resume time
}

/**
 * Updates the admin panel to show the current background music status.
 * This function is safe to call on any page, as it checks for the panel's existence.
 */
function updateBgMusicPanelState() {
    const statusContainer = document.getElementById('bgmusic-status');
    if (!statusContainer) return;

    const playlistNameEl = document.getElementById('bgmusic-current-playlist');
    const trackNameEl = document.getElementById('bgmusic-current-track');
    const pauseButton = document.getElementById('bgmusic-pause-btn');
    const prevButton = document.getElementById('bgmusic-prev-btn');
    const nextButton = document.getElementById('bgmusic-next-btn');
    const volumeSlider = document.getElementById('bgmusic-volume-slider');
    const volumeLabel = document.getElementById('bgmusic-volume-label');
    const timeSlider = document.getElementById('bgmusic-time-slider');
    const currentTimeEl = document.getElementById('bgmusic-current-time');
    const durationEl = document.getElementById('bgmusic-duration');

    // Check if a background music playlist is active
    if (playlistState.isActive && playlistState.loopCount === -1) {
        const currentTrackPath = playlistState.files[playlistState.currentIndex];
        const pathParts = currentTrackPath.split('/'); // e.g., ["bgmusic", "ambient", "track1.mp3"]
        const playlistName = pathParts.length > 1 ? pathParts[1] : 'Unknown';
        const trackName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'Unknown';

        playlistNameEl.textContent = playlistName;
        trackNameEl.textContent = decodeURIComponent(trackName); // Decode for display

        if (pauseButton) {
            if (playlistState.isPaused) {
                pauseButton.innerHTML = '<i class="fa fa-play"></i>&nbsp;Resume';
                pauseButton.classList.remove('btn-warning');
                pauseButton.classList.add('btn-success');
            } else {
                pauseButton.innerHTML = '<i class="fa fa-pause"></i>&nbsp;Pause';
                pauseButton.classList.remove('btn-success');
                pauseButton.classList.add('btn-warning');
            }
        }

        if (volumeSlider) {
            volumeSlider.value = playlistState.volume;
            volumeSlider.disabled = false;
        }
        if (volumeLabel) {
            volumeLabel.textContent = playlistState.volume;
        }

        if (timeSlider) {
            timeSlider.disabled = false;
            // On initial load/sync, set the slider value.
            if (!isScrubbing) {
                // On admin panel, we must calculate current time from server timestamps
                let currentTime = 0;
                if (playlistState.isPaused) {
                    currentTime = playlistState.pausedAtTime / 1000;
                } else if (playlistState.trackStartedAt > 0) {
                    const offset = Date.now() - playlistState.trackStartedAt;
                    currentTime = offset / 1000;
                }

                timeSlider.value = currentTime;
                if (currentTimeEl) {
                    currentTimeEl.textContent = formatTrackTime(currentTime);
                }
            }
        }

        // Update duration from the synced state
        const duration = playlistState.duration || 0;
        if (timeSlider && duration > 0) {
            timeSlider.max = duration;
        }
        if (durationEl) {
            durationEl.textContent = formatTrackTime(duration);
        }

        // Start an interval to update the slider on the admin panel
        // This won't run on the client page because the elements don't exist there.
        if (!adminSliderUpdateInterval && timeSlider) {
            adminSliderUpdateInterval = setInterval(updateAdminSlider, 500);
        }

        statusContainer.style.display = 'block';
        prevButton.disabled = false;
        nextButton.disabled = false;
        pauseButton.disabled = false;
    } else {
        // Stop the admin slider interval if no playlist is active
        if (adminSliderUpdateInterval) {
            clearInterval(adminSliderUpdateInterval);
            adminSliderUpdateInterval = null;
        }

        statusContainer.style.display = 'none';
        // Also disable buttons if no playlist is active
        if (prevButton) prevButton.disabled = true;
        if (nextButton) nextButton.disabled = true;
        if (pauseButton) pauseButton.disabled = true;
        if (volumeSlider) volumeSlider.disabled = true;
        if (timeSlider) {
            timeSlider.disabled = true;
            timeSlider.value = 0;
            timeSlider.max = 100;
        }
        if (currentTimeEl) currentTimeEl.textContent = "0:00";
        if (durationEl) durationEl.textContent = "0:00";
    }
}
