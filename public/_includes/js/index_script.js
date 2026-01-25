$(document).ready(function () {

      /* update all titles, descriptions and the IP adress upper right on load.*/
      socket.on('startConfig', function (port) {
        // $('#localIP').html(settings['localaddress']);
        $('#localIP').html(`MNET\\J2405130:${port}`);
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