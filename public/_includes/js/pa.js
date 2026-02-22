const workerOptions = {
    encoderWorkerPath: '/js/opus/encoderWorker.umd.js',
    OggOpusEncoderWasmPath: '/js/opus/OggOpusEncoder.wasm',
    WebMOpusEncoderWasmPath: '/js/opus/WebMOpusEncoder.wasm'
};

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

const isAuthenticated = getCookie('auth');

if (isAuthenticated) {
    $('#pa-broadcast-btn').removeClass('hidden');
}

if (isAuthenticated && navigator.mediaDevices) {


    $('#pa-broadcast-btn').click(function () {
        console.log('click')
        const btn = $(this).find('i');
        if (btn.hasClass('fa-microphone-slash')) {
            // Use the Permissions API to check for microphone access without activating it.
            // This avoids the unnecessary stream creation and the associated deprecation warning.
            navigator.permissions.query({ name: 'microphone' }).then(function (permissionStatus) {
                if (permissionStatus.state === 'denied') {
                    $('#notificationContainer').append(
                        '<div class="col-xs-12 col-sm-8 col-md-6 text-center disconnectedPopup popupBroadcastPA">'
                        + '<h2 class="text-bold" style="color: red;">'
                        + '<i class="fa fa-microphone-slash" style="font-size:24px;"></i> '
                        + 'MICROPHONE ACCESS DENIED<br>Please enable microphone access in your browser settings.'
                        + '</h2>'
                        + '</div>');
                    setTimeout(function () { $('.popupBroadcastPA').empty().remove() }, 5000);
                    return;
                }

                // If permission is 'granted' or 'prompt', enable the PA feature.
                // The actual browser prompt will appear when the user presses spacebar.
                $('#notificationContainer').append(
                    '<div class="col-xs-12 col-sm-8 col-md-6 text-center disconnectedPopup popupBroadcastPA">'
                    + '<h2 class="text-bold">'
                    + '<i class="fa fa-info-circle holoContrast" style="font-size:24px;"></i> '
                    + 'VOICE BROADCAST ENABLED<br>Hold the space bar to record. Broadcast happens on release.'
                    + '</h2>'
                    + '</div>');
                setTimeout(function () { $('.popupBroadcastPA').empty().remove() }, 5000);

                $(window).on('keydown', startRecording);
                $(window).on('keyup', stopRecording);
                btn.removeClass('fa-microphone-slash').addClass('fa-microphone');
            }).catch(function (err) { console.log("Permissions API error: " + err); });
        } else {
            $(window).off('keydown', startRecording);
            $(window).off('keyup', stopRecording);
            btn.removeClass('fa-microphone').addClass('fa-microphone-slash');
            if (mediaRecorder) {
                // Stop the recording but prevent it from being broadcast.
                mediaRecorder.broadcastOnStop = false;
                mediaRecorder.stop();
                socket.emit('cancelPA');
            }
            // Clean up any lingering UI and restore audio.
            $('.popupBroadcastPA').empty().remove();
            duckAudio(false);
        }
    })
}
var mediaRecorder = null;
var recorderState = 'idle'; 
var isSpacePressed = false; // Prevents the 'key repeat' bug
var originalVolumes = new Map(); // Crucial for restoring music volume!

function saveTannoy(stream) {
    try {
        // useAudioWorklet: true is correct here. 
        // Note: This requires the page to be served over HTTPS (or localhost)
        mediaRecorder = new OpusMediaRecorder(stream, { useAudioWorklet: true }, workerOptions);
        
        mediaRecorder.ondataavailable = function (e) {
            if (e.data.size > 0) {
                socket.emit('uploadPA', e.data);
            }
        }

        mediaRecorder.onstop = function () {
            if (stream.getTracks) {
                stream.getTracks().forEach(function (track) { track.stop(); });
            }
            if (this.broadcastOnStop !== false) {
                socket.emit('broadcastPA');
            }
            mediaRecorder = null;
            recorderState = 'idle';
        }

        socket.emit('startPA');
        mediaRecorder.start(1000);
        recorderState = 'recording';

    } catch (err) {
        console.error("OpusMediaRecorder initialization failed:", err);
        duckAudio(false);
        recorderState = 'idle';
    }
}

function startRecording(event) {
    // Only trigger if it's Space (32) AND not a repeat event AND we are idle
    if (event.keyCode == 32 && !event.originalEvent.repeat) {
        if (recorderState === 'idle') {
            recorderState = 'starting';
            duckAudio(true);

            navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                .then(saveTannoy)
                .catch(function (err) {
                    console.log("Microphone error: ", err);
                    duckAudio(false);
                    recorderState = 'idle';
                    $('.popupBroadcastPA').empty().remove();
                });

            $('.popupBroadcastPA').empty().remove();
            $('#notificationContainer').append(
                '<div class="col-xs-12 col-sm-8 col-md-6 text-center disconnectedPopup popupBroadcastPA">'
                + '<h2 class="text-bold">'
                + '<i class="fa fa-microphone" style="font-size:24px; color: red;"></i> '
                + 'RECORDING...<br>Release spacebar to broadcast.'
                + ' <i class="fa fa-microphone" style="font-size:24px; color: red;"></i>'
                + '</h2>'
                + '</div>');
        }
    }
}

function stopRecording(event) {
    if (event.keyCode == 32) {
        // Immediately allow space to be pressed again for the next round
        if (recorderState === 'recording' && mediaRecorder) {
            recorderState = 'stopping';
            duckAudio(false); 
            mediaRecorder.stop();
            $('.popupBroadcastPA').empty().remove();
        } else if (recorderState === 'starting') {
            // Case where user tapped space too fast before mic could even open
            recorderState = 'idle';
            duckAudio(false);
            $('.popupBroadcastPA').empty().remove();
        }
    }
}



/**
 * Dims the volume of other audio sources on the page.
 * @param {boolean} shouldDuck - True to dim audio, false to restore it.
 */
function duckAudio(shouldDuck) {
    if (shouldDuck) {
        originalVolumes.clear();
        // Find all currently playing audio elements we care about
        $('#custom-audio audio, #BCAUDIO audio').each(function () {
            if (!this.paused) {
                originalVolumes.set(this, this.volume);
                $(this).animate({ volume: 0.0 }, 200); // Duck to 0% volume
            }
        });
    } else {
        // Restore volume for all elements we ducked
        originalVolumes.forEach((originalVolume, element) => {
            // jQuery handles cases where the element might have been removed from the DOM.
            $(element).animate({ volume: originalVolume }, 200);
        });
        originalVolumes.clear();
    }
}

console.log('PaJS');