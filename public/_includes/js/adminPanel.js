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

  /* receive media files from the server and convert the received data into a browsable tree. */
  socket.on('sendAudioTree', function(audioTree) {
    const container = $('#OC-AUDIO'); // Assuming a new container with this ID in your adminPanel.html
    container.empty();
    container.append(buildFileTree(audioTree));

    // Add click handlers for folders
    container.find('.audio-folder-header').on('click', function() {
      $(this).next('.audio-folder-content').slideToggle('fast');
      $(this).find('.fa').toggleClass('fa-folder fa-folder-open');
    });
  });

  function buildFileTree(nodes) {
    const $list = $('<div>').addClass('audio-file-list');
    if (!nodes || nodes.length === 0) {
      return $list.append('<p class="text-muted">No audio files found.</p>');
    }

    nodes.forEach(node => {
      if (node.type === 'folder') {
        const $folder = $('<div>').addClass('audio-folder');
        const $header = $('<div>').addClass('audio-folder-header').html(`<i class="fa fa-folder"></i>&nbsp;${node.name.replace('.mp3', '')}`);
        const $content = $('<div>').addClass('audio-folder-content').hide();
        $content.append(buildFileTree(node.children));
        $folder.append($header, $content);
        $list.append($folder);
      } else if (node.type === 'file') {
        const $fileButton = $('<button>')
          .addClass('btn btn-default btn-audio-file')
          .html(`<i class="fa fa-file-audio"></i>&nbsp;${node.name.replace('.mp3', '')}`)
          .attr('onclick', `broadcastAudio("${node.path}");`);
        $list.append($fileButton);
      }
    });

    return $list;
  }

  socket.emit('getMedia');
});

syncVideoBroadcasts(true, '#auto-video-list');