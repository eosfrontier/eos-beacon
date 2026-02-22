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

        btn = $(this).find('i')
        if (btn.hasClass('fa-microphone-slash')) {
            navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function (stream) {
                $('#notificationContainer').append(
                    '<div class="col-xs-12 col-sm-8 col-md-6 text-center disconnectedPopup popupBroadcastPA">'
                    + '<h2 class="text-bold">'
                    + '<i class="fa fa-warning holoContrast" style="font-size:24px;"></i> '
                    + 'VOICE BROADCAST ENABLED<br>Hold the space bar to record, it will be broadcast when you release'
                    + ' <i class="fa fa-warning holoContrast" style="font-size:24px;"></i>'
                    + '</h2>'
                    + '</div>');
                setTimeout(function () { $('.popupBroadcastPA').empty(); $('.popupBroadcastPA').remove() }, 5000)
                if (stream.stop) { stream.stop() }
                if (stream.getTracks) {
                    stream.getTracks().forEach(function (track) {
                        track.stop()
                    })
                }
                $(window).keydown(startRecording)
                $(window).keyup(stopRecording)
            }).catch(function (err) { console.log("Microphone error: " + err) })
            btn.removeClass('fa-microphone-slash').addClass('fa-microphone')
        } else {
            $(window).off('keydown', startRecording)
            $(window).off('keyup', stopRecording)
            btn.removeClass('fa-microphone').addClass('fa-microphone-slash')
            if (mediaRecorder) {
                mediaRecorder.stop()
                mediaRecorder = null
                $('.popupBroadcastPA').empty();
                $('.popupBroadcastPA').remove();
            }
        }
    })
}
var mediaRecorder = null
var runningRecorder = false
function saveTannoy(stream) {
    mediaRecorder = new OpusMediaRecorder(stream, {}, workerOptions)
    mediaRecorder.ondataavailable = function (e) {
        if (e.data.size > 0) {
            socket.emit('uploadPA', e.data)
        }
    }
    mediaRecorder.onstop = function () {
        $('#start-broadcast').attr('disabled', false)
        if (stream.stop) { stream.stop() }
        if (stream.getTracks) {
            stream.getTracks().forEach(function (track) { track.stop() })
        }
        socket.emit('broadcastPA')
    }
    socket.emit('startPA')
    mediaRecorder.start(1000)
}
function startRecording(event) {
    // console.log('keyDown',event.keyCode)
    if (event.keyCode == 32) {
        if (!runningRecorder) {
            runningRecorder = true;
            duckAudio(true); // Duck other audio

            navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                .then(saveTannoy)
                .catch(function (err) {
                    console.log("Microphone error: ", err);
                    // If we can't get the mic, unduck audio and reset
                    duckAudio(false);
                    runningRecorder = false;
                    $('.popupBroadcastPA').empty().remove();
                });

            $('.popupBroadcastPA').empty().remove();
            $('#notificationContainer').append(
                '<div class="col-xs-12 col-sm-8 col-md-6 text-center disconnectedPopup popupBroadcastPA">'
                + '<h2 class="text-bold">'
                + '<i class="fa fa-microphone" style="font-size:24px; color: red;"></i> '
                + 'RECORDING...<br>Release space to broadcast.'
                + ' <i class="fa fa-microphone" style="font-size:24px; color: red;"></i>'
                + '</h2>'
                + '</div>');
        }
    }
    // console.log('keyDown')
}
function stopRecording(event) {
    // console.log('keyUp',event.keyCode)
    if (event.keyCode == 32) {
        if (runningRecorder) {
            duckAudio(false); // Restore other audio
            if (mediaRecorder) {
                mediaRecorder.stop();
                mediaRecorder = null;
            }
            runningRecorder = false;
            $('.popupBroadcastPA').empty().remove();
        }
    }
    // console.log('keyUp')
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
                $(this).animate({ volume: 0.1 }, 200); // Duck to 10% volume
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