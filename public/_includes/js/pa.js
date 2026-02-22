const workerOptions = {
    OggOpusEncoderWasmPath: 'https://cdn.jsdelivr.net/npm/opus-media-recorder@latest/OggOpusEncoder.wasm',
    WebMOpusEncoderWasmPath: 'https://cdn.jsdelivr.net/npm/opus-media-recorder@latest/WebMOpusEncoder.wasm'
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
var mediaRecorder = null
var recorderState = 'idle'; // 'idle', 'starting', 'recording', 'stopping'

function saveTannoy(stream) {
    mediaRecorder = new OpusMediaRecorder(stream, { useAudioWorklet: true }, workerOptions)
    mediaRecorder.ondataavailable = function (e) {
        if (e.data.size > 0) {
            socket.emit('uploadPA', e.data);
        }
    }
    mediaRecorder.onstop = function () {
        // Stop the stream to release the microphone
        if (stream.getTracks) {
            stream.getTracks().forEach(function (track) { track.stop(); });
        }

        // Broadcast unless explicitly told not to (e.g., by cancellation).
        if (this.broadcastOnStop !== false) {
            // Now that the final data chunk has been sent, tell the server to broadcast.
            socket.emit('broadcastPA');
        }

        // Fully reset state now that we're done.
        mediaRecorder = null;
        recorderState = 'idle';
    }
    socket.emit('startPA');
    mediaRecorder.start(1000);
    recorderState = 'recording';
}

function startRecording(event) {
    if (event.keyCode == 32) {
        // Prevent starting a new recording while one is already in progress.
        if (recorderState === 'idle') {
            recorderState = 'starting'; // Tentative state
            duckAudio(true); // Duck other audio

            navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                .then(saveTannoy)
                .catch(function (err) {
                    console.log("Microphone error: ", err);
                    // If we can't get the mic, fully reset state.
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
        // Only initiate a stop if we are actively recording.
        if (recorderState === 'recording' && mediaRecorder) {
            recorderState = 'stopping';
            duckAudio(false); // Restore other audio
            mediaRecorder.stop();
            $('.popupBroadcastPA').empty().remove();
        }
    }
}

var originalVolumes = new Map();

/**
 * Dims the volume of other audio sources on the page.
 * @param {boolean} shouldDuck - True to dim audio, false to restore it.
 */
function duckAudio(shouldDuck) {
    if (shouldDuck) {
        originalVolumes.clear();
        // Find all currently playing audio elements we care about
        $('#custom-audio audio, #BCAUDIO audio').each(function() {
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