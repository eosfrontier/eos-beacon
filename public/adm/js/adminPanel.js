$(document).ready(function() {
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

    // Let other scripts know the tree is ready.
    $(document).trigger('audioTreeBuilt');
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
          const $header = $('<div>').addClass(`audio-folder-header audio-folder-header-${node.name.replace('.mp3', '')}`).html(`${linePrefix}<i class="fa fa-folder".></i>&nbsp;${node.name.replace('.mp3', '')}`);
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
  // Use a delegated event handler attached to a static parent (document).
  // This ensures the handler works even for content loaded via AJAX.
  $(document).on('submit', '#add-schedule-form', function(e) {
    e.preventDefault(); // Prevent default form submission

    const $form = $(this);
    const $button = $form.find('button[type="submit"]');
    const broadcastKey = $('#schedule-broadcast-select').val();
    const time = $('#schedule-time-input').val();

    // Temporarily disable the button to prevent spamming
    $button.addClass('disabled').attr("disabled", true);

    // Re-enable the button after a delay
    setTimeout(function() {
      $button.removeClass('disabled').attr("disabled", false);
    }, 2000);

    if (broadcastKey && time && window[broadcastKey]) {
      const newJob = {
        time: time,
        broadcastKey: broadcastKey, // Add the key for easier editing later
        broadcast: JSON.stringify(window[broadcastKey]), // Store the whole object as a string
        sent: false
      };

      socket.emit('addSchedule', newJob);

      // Clear the time input for better user experience
      $('#schedule-time-input').val('');
    } else {
      // If something is wrong, log it and don't leave the button disabled forever
      console.error("Could not add schedule. Broadcast or time was missing.");
    }
  });

  socket.on('sendSchedule', renderSchedule);

});

// --- SCHEDULE MANAGEMENT ---
// These functions are moved to the global scope so they can be called from admin.js

function populateBroadcastsDropdown() {
  const select = $('#schedule-broadcast-select');
  if (!select.length) return; // Don't run if the element doesn't exist
  select.empty();

  // Get all broadcast variables from the window object
  const broadcastKeys = Object.keys(window).filter(key => key.startsWith('bc') && typeof window[key] === 'object' && window[key].title);

  broadcastKeys.sort((a, b) => window[a].title.localeCompare(window[b].title));

  broadcastKeys.forEach(key => {
    const broadcast = window[key];
    const option = $('<option>').val(key).text(broadcast.title);
    select.append(option);
  });
}

function renderSchedule(schedule) {
  const container = $('#schedule-list-container');
  if (!container.length) return; // Don't run if the element doesn't exist
  container.empty();

  if (!schedule || schedule.length === 0) {
    container.html('<p class="text-muted">No broadcasts scheduled.</p>');
    return;
  }

  const list = $('<ul>').addClass('list-group');
  schedule.sort((a, b) => a.time.localeCompare(b.time)).forEach(job => {
    const broadcast = JSON.parse(job.broadcast);
    const item = $('<li>').addClass('list-group-item schedule-text').css({
      'display': 'flex',
      'justify-content': 'space-between',
      'align-items': 'center'
    });
    const removeBtn = $('<button>').addClass('btn-danger btn-xs').html('<i class="fa fa-trash"></i>');

    removeBtn.on('click', function() {
      // Instead of just deleting, move it to the form for editing
      $('#schedule-time-input').val(job.time);
      $('#schedule-broadcast-select').val(job.broadcastKey);
      socket.emit('removeSchedule', job.id); // Then remove it from the list
    });

    const textSpan = $('<span>').html(`<strong>${job.time}</strong> - ${broadcast.title}`);

    // Append text first, then button. Flexbox will handle the alignment.
    item.append(textSpan);
    item.append(removeBtn);
    list.append(item);
  });
  container.append(list);
}