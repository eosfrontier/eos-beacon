let globalAppName = '';
let globalAppDescription = '';
let globalTagline = '';

$(document).ready(function () {

  // Automatically update #appDescriptionHeader whenever it appears in the DOM (e.g. inside broadcasts)
  const observer = new MutationObserver(function () {
    const $header = $('#appDescriptionHeader');
    const $tagline = $('#appTagline');

    if ($header.length && globalAppName) {
      const text = globalAppName + ' - ' + globalAppDescription;
      if ($header.text() !== text) $header.text(text);
    }

    if ($tagline.length && globalTagline) {
      if ($tagline.text() !== globalTagline) $tagline.text(globalTagline);
    }
  });
  if (document.getElementById('main')) observer.observe(document.getElementById('main'), { childList: true, subtree: true });

  /* update all titles, descriptions and the IP adress upper right on load.*/
  socket.on('startConfig', function (port, appName, appDescription, appTagline) {
    globalAppName = appName;
    globalAppDescription = appDescription;
    globalAppName = appName;
    globalTagline = appTagline;
    $('#localIP').html(`MNET\\J2405130:${port}`);
    if (appName) {
      document.title = appName + ' - ' + appDescription;
      $('#appDescriptionHeader').text(appName + ' - ' + appDescription);
      $('#appTitle').text('[' + appName + ']');
      $('#appTagline').text(appTagline);

    }
  });

  /* ForceReset. F5'd the page.*/
  socket.on('F5', function () {

    socket.disconnect();
    location.reload();
  });

  /* First time? Load the mainscreen in after 2500ms..*/
  setTimeout(function () {
    navigate('mainScreen');
  }, 2500);
});