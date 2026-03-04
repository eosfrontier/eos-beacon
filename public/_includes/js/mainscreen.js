$(document).ready(function () {
  let initialized = 0;
  let clientdevice = "";
  let printresult;
  let lastSecLevel;

  /* these divs WILL constantly be updated, so let's cache the selector first. */
  let countClientsSelector = $('#countClientsCounter');
  let securityLevelSelector = $('#securityAlertLevel');
  let currentPortalStatus = "";

  /* after about half a second, request the dynamicdata HERE. (client->server) */
  setTimeout(function () {
    socket.emit('requestDynamicData');
  }, 800);

  /* This is where our client receives the broadcast from the server side .*/
  socket.on('broadcastReceive', function (location) {

    /* perform the broadcast, client side. */
    broadCast(location);
  });

  /* default sound file */
  const defaultSoundFile = "/sounds/Menu_Select_00.wav";

  /* add soundplayer if screen is wide enough, to prevent mobile phones from constantly beeping. */
  if ($(window).width() > 960) {
    $('#audiocontrol').html('<audio id="default-audio" controls="controls" class="hidden">'
      + '<source src="' + defaultSoundFile + '" type="audio/mpeg">'
      + '</audio>');
  }

  /* (server->client) updates our HTML web page to contain the global dynamicdata, instead of default OR outdated content.*/
  socket.on('updateDynamicData', (dynamicData) => {

    if (lastSecLevel && lastSecLevel !== dynamicData.alertLevel) {
      $('#securityAlertLevel').parents('.block').addClass('flash');
      playPortalAudio();
      setTimeout(function () {
        $('#securityAlertLevel').parents('.block').removeClass('flash');
      }, 2500);
    }
    lastSecLevel = dynamicData.alertLevel;

    securityLevelSelector.html(dynamicData['alertLevel']);
    countClientsSelector.html(dynamicData['countClients']);

    /* updates the portal status to match with the global dynamicdata. */
    updatePortalStatus(dynamicData['portalStatus']);

    /* ..and the same for Orb */
    updateOrbStatus(dynamicData.orbStatus);

    $('#socket-id').html('<span class="holoContrast">InfansExNihilo (89%)</span><br/><span class="holoContrast">HÉRITAGE (11%)</span><br/><span class="text-muted">Ascendancy (disabled)<span><br/><span class="text-muted">ProviDNC (disabled)<span>');

    // First boot! request LAST broadcast and check modular options
    if (initialized == 0) {
      console.log('first boot initialization...');

      const loadPaFeature = async function() {
        if (!dynamicData.voiceEnabled) {
          return;
        }

        try {
          // Dynamically import the PA module. This will handle its own dependencies.
          await import('./_includes/js/pa.js');
        } catch (err) {
          console.error("Failed to load PA feature:", err);
        }
      };

      const onFirstBootReady = async function() {
        const bcKey = dynamicData['lastBC'];
        // The broadcast might not exist on first load, so check for it.
        if (window[bcKey]) {
          broadCast(window[bcKey]);
        }
        await loadPaFeature(); // Load PA scripts after handling the initial broadcast.
        initialized = 1;
      };

      // Check if broadcast variables are loaded yet (they are fetched asynchronously)
      const bcKey = dynamicData['lastBC'];
      if (window[bcKey] || bcKey === 'bcdefault') { // bcdefault is always available
        // Variables are already there, proceed as normal
        onFirstBootReady();
      } else {
        // VARIABLES ARE MISSING (The Race Condition)
        console.warn(`Broadcast variable ${bcKey} not found yet. Queuing...`);
        // We wait for a custom event that we will fire when the fetch is done
        window.addEventListener('broadcastsLoaded', () => onFirstBootReady(), { once: true });
      }
    }
    // Update App Name from config
    if (dynamicData.appName && dynamicData.appDescription) {
      document.title = dynamicData.appName + ' - ' + dynamicData.appDescription;
    }
  });

  /* receive portal status updates here (server->client)*/
  socket.on('portalfrontend', function () {
    $('#portalstatus').addClass('flash');
    playPortalAudio();
    setTimeout(function () {
      $('#portalstatus').removeClass('flash');
    }, 2500);
  });

  socket.on('orbDivFlash', function () {
    $('#orbstatus').addClass('flash');
    playPortalAudio();

    setTimeout(function () {
      $('#orbstatus').removeClass('flash');
    }, 7500);
  })

  /* receive the request to play audio here: (server->client)
    generateBCaudio will determine what happens next. (play or not to play, etc) */
  // The 'playAudioFile' event is now handled by a single listener in functions.js to prevent duplicate playback.


  /* reconnect/disconnect events: what to do when losing/gaining connection. */
  socket.on('connect', function () {
    $('#connStatus').addClass('btn-outline-success').removeClass('btn-outline-danger blinkContent').html('<i class="fa fa-link"></i>&nbsp;CONNECTED');

    $('#socket-id').html('<span class="holoContrast">InfansExNihilo (89%)</span><br/><span class="holoContrast">HÉRITAGE (11%)</span><br/><span class="text-muted">Ascendancy (disabled)<span><br/><span class="text-muted">ProviDNC (disabled)<span>');
    countClientsSelector.show();
    $('#notificationTitleSmall').find('h2').html('Waiting for broadcasts ...');

    $('.disconnectedPopup').empty();
    $('.disconnectedPopup').remove();

    $('#localIP').removeClass('text-muted blinkContent');


    /* ask the server for the current dynamicdata, causing the content to potentially catch up with the rest of the clients */
    setTimeout(function () {
      socket.emit('requestDynamicData');
    }, 800);
  });

  /* on disconnect: mostly flavor text and effects to make it clear that Beacon has no current active connection. */
  socket.on('disconnect', function () {
    $('#connStatus').addClass('btn-outline-danger blinkContent').removeClass('btn-outline-success').html('<i class="fa fa-unlink"></i>&nbsp;OFFLINE');

    $('#socket-id').html('&nbsp;<span class="holoContrast">No active infomorph.</span>');
    countClientsSelector.hide();
    $('#notificationTitleSmall').find('h2').html('Attempting to reconnect...');

    $('#notificationContainer').append(
      '<div class="col-xs-12 col-sm-8 col-md-6 text-center disconnectedPopup">'
      + '<h2 class="text-bold">'
      + '<i class="fa fa-warning holoContrast" style="font-size:24px;"></i> '
      + 'COMMUNICATIONS <span class="holoContrast">OFFLINE</span>'
      + ' <i class="fa fa-warning holoContrast" style="font-size:24px;"></i>'
      + '</h2>'
      + '</div>');

    $('#localIP').addClass('text-muted blinkContent');

    updatePortalStatus("shutdown");
  });

  $(document).ready(function () {
    setInterval('updateClock()', 1000);
  });
});