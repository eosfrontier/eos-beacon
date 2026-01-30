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
    const container = $('#OC-AUDIO-LIST'); // Assuming a new container with this ID in your adminPanel.html
    container.empty();
    container.append(buildFileTree(audioTree, ""));

    // Add click handlers for folders
    container.find('.audio-folder-header').on('click', function() {
      $(this).next('.audio-folder-content').slideToggle('fast');
      $(this).find('.fa').toggleClass('fa-folder fa-folder-open');
    });
  });

  /**
   * Recursively checks if a folder node contains any files.
   * @param {object} folderNode - The folder node from the audio tree.
   * @returns {boolean} - True if the folder or any subfolder contains a file.
   */
  function folderHasFiles(folderNode) {
    if (!folderNode.children || folderNode.children.length === 0) {
      return false;
    }

    // Use .some() for a more concise check
    return folderNode.children.some(child =>
      child.type === 'file' || (child.type === 'folder' && folderHasFiles(child))
    );
  }


  function buildFileTree(nodes, prefix) {
    const $list = $('<div>').addClass('audio-file-list');
    if (!nodes || nodes.length === 0) {
      return $list.append('<p class="text-muted">No audio files found.</p>');
    }

    const isSmallScreen = $(window).width() < 769;

    nodes.forEach((node, index) => {
      const isLast = index === nodes.length - 1;
      let linePrefix = "";

      if (!isSmallScreen) {
        linePrefix = prefix + (isLast ? '└─ ' : '├─ ');
      } else {
          // On mobile, only add the dot if it's a nested item.
        linePrefix = prefix ? prefix + '· ' : '';
      }

      if (node.type === 'folder') {
        // Only render the folder if it contains audio files
        if (folderHasFiles(node)) {
          const $folder = $('<div>').addClass('audio-folder');
          const $header = $('<div>').addClass('audio-folder-header').html(`${linePrefix}<i class="fa fa-folder"></i>&nbsp;${node.name.replace('.mp3', '')}`);
          const $content = $('<div>').addClass('audio-folder-content').hide();

          const childPrefix = isSmallScreen ? (prefix + '&nbsp;&nbsp;&nbsp;&nbsp;') : (prefix + (isLast ? '  ' : '│ '));
          $content.append(buildFileTree(node.children, childPrefix));
          $folder.append($header, $content);
          $list.append($folder);
        }
      } else if (node.type === 'file') {
        const $fileContainer = $('<div>').addClass('audio-file-item');
        const $fileButton = $('<button>')
          .addClass('btn btn-default btn-audio-file text-left')
          .html(`<i class="fa fa-file-audio"></i>&nbsp;${node.name.replace('.mp3', '')}`)
          .attr('onclick', `broadcastAudio("${node.path}");`);

        if (isSmallScreen) {
          $fileContainer.addClass('whitespace');
          $fileContainer.append($fileButton);
        } else {
          // Separate the prefix from the button to ensure alignment
          const $prefixSpan = $('<span>').addClass('audio-file-prefix').html(linePrefix);
          $fileContainer.append($prefixSpan, $fileButton);
        }
        $list.append($fileContainer);
      }
    });

    return $list;
  }

  socket.emit('getMedia');
});

syncVideoBroadcasts(true, '#auto-video-list');