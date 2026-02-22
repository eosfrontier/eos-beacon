// This script is loaded as a module, allowing for top-level await and import syntax.

// 1. Import dependencies.
// We use a CDN that serves ES modules to resolve the bare module specifiers,
// as browsers can't resolve them from node_modules on their own.
import { MediaRecorder, register } from 'https://esm.sh/extendable-media-recorder';
import { connect } from 'https://esm.sh/extendable-media-recorder-wav-encoder';

// 2. Defer encoder registration until user interaction.
// Registering the encoder on page load creates an AudioContext before any user gesture,
// which can cause it to be "suspended" and interfere with other audio playback, like background music.
let isEncoderRegistered = false;
async function registerEncoder() {
    if (isEncoderRegistered) return true;

    try {
        await register(await connect());
        isEncoderRegistered = true;
        console.log('PA WAV encoder registered successfully on user interaction.');
        return true;
    } catch (err) {
        console.error('Failed to register WAV encoder for PA system:', err);
        return false;
    }
}

// --- All the original PA logic goes below, now at the top level of the module's scope ---

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
        $('#pa-broadcast-btn').click(async function () {
            console.log('click')
            const btn = $(this).find('i');
            if (btn.hasClass('fa-microphone-slash')) {
                // Register the encoder on the first click to enable.
                // This happens after a user gesture, which is required for AudioContext.
                const didRegister = await registerEncoder();
                if (!didRegister) {
                    $('#notificationContainer').append(
                        '<div class="col-xs-12 col-sm-8 col-md-6 text-center disconnectedPopup popupBroadcastPA">'
                        + '<h2 class="text-bold" style="color: red;">'
                        + '<i class="fa fa-exclamation-triangle" style="font-size:24px;"></i> '
                        + 'VOICE BROADCAST FAILED<br>Could not initialize audio encoder.'
                        + '</h2>'
                        + '</div>');
                    setTimeout(function () {
                        $('.popupBroadcastPA').empty().remove()
                    }, 5000);
                    return;
                }

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
                    mediaRecorder.broadcastOnStop = false;
                    mediaRecorder.stop();
                    socket.emit('cancelPA');
                }
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
            // Use the now-polyfilled MediaRecorder to record in WAV format.
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/wav' });

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
            console.error("MediaRecorder (WAV) initialization failed:", err);
            duckAudio(false);
            recorderState = 'idle';
        }
    }

    function startRecording(event) {
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
            if (recorderState === 'recording' && mediaRecorder) {
                recorderState = 'stopping';
                duckAudio(false);
                mediaRecorder.stop();
                $('.popupBroadcastPA').empty().remove();
            } else if (recorderState === 'starting') {
                recorderState = 'idle';
                duckAudio(false);
                $('.popupBroadcastPA').empty().remove();
            }
        }
    }

    function duckAudio(shouldDuck) {
        if (shouldDuck) {
            originalVolumes.clear();
            $('#custom-audio audio, #BCAUDIO audio').each(function () {
                if (!this.paused) {
                    originalVolumes.set(this, this.volume);
                    $(this).animate({ volume: 0.0 }, 200);
                }
            });
        } else {
            originalVolumes.forEach((originalVolume, element) => {
                $(element).animate({ volume: originalVolume }, 200);
            });
            originalVolumes.clear();
        }
    }

    console.log('PaJS with WAV recorder initialized.');