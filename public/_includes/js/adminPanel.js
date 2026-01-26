$(document).ready(function() {
  $('button').on('click', function(e){

    /* extra scripts: add a modifier to prevent disabled buttons from being used regardless. */
    if($(this).attr('disabled')){
      e.stopImmediatePropagation();
      e.preventDefault();
    }

    /* disable buttons temporarily to prevent spamming */
    $('button').addClass('disabled').attr("disabled", true);

    /* remove the disabled modifier after an XXXX amount of miliseconds. */
    setTimeout(function(){
      $('button').removeClass('disabled').attr("disabled", false);
      $('#main').find('.adm-tab').removeClass('flash');
    },3500);
  });


  /* receive media files from the server (audio-misc) and convert the received data into buttons. */
  socket.on('sendMediaMisc', function(resultArray){
    var l = resultArray.length;
    for(var i=0;i<l; i++) {
      /* &apos; is turned into single quotes around the file path by the browser, without, the buttons simply do not work. */
      var clickThis = " onclick=\"broadcastAudio(&apos;/audio-misc/" + resultArray[i] + "&apos;);\"";
      $('#OC-MISC').append('<div class=\"btn btn-default\"' + clickThis +' ><i class=\"fa fa-file-audio-o\"></i>&nbsp;' + resultArray[i] +'</div>');
    }
  });

  // /* first copy of audio-misc for the AI voices. */
  // socket.on('sendMediaDave', function(arrayDave){
  //   var l = arrayDave.length;
  //   for(var i=0;i<l; i++) {
  //     var clickThis = " onclick=\"broadcastAudio(&apos;/audio-dave/" + arrayDave[i] + "&apos;);\"";
  //     $('#OC-DAVE').append('<div class=\"btn btn-default\"' + clickThis +' ><i class=\"fa fa-file-audio-o\"></i>&nbsp;' + arrayDave[i] +'</div>');
  //   }

  // });

  // /* second copy of audio-misc for the AI voices. */
  // socket.on('sendMediaAlice', function(arrayAlice){
  //   var l = arrayAlice.length;
  //   for(var i=0;i<l; i++) {
  //     var clickThis = " onclick=\"broadcastAudio(&apos;/audio-alice/" + arrayAlice[i] + "&apos;);\"";
  //     $('#OC-ALICE').append('<div class=\"btn btn-default\"' + clickThis +' ><i class=\"fa fa-file-audio-o\"></i>&nbsp;' + arrayAlice[i] +'</div>');
  //   }
  // });

  socket.emit('getMedia');
});

syncVideoBroadcasts(true, '#auto-video-list');