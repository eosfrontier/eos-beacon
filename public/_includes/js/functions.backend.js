// The original navigateADM function has been replaced by a new version
// in /public/adm/js/admin.js to support loading modular panels.
function forceReset() {
  socket.emit('forceReset');
}

function cpanelStatus(message) {
  if (message != null && message != "") {
    $('#cPanel-status').empty().html('<span class=\"text-bold\">current broadcast:&nbsp;</span>' + message);
  }
}

function flashAdminTabs() {
  const FlashFn = FlashBlocks;

  FlashFn('.adm-tab');
  setTimeout(function () {
    FlashFn('.adm-tab');
  }, 1200);
}

function updateSecurity(selector) {
  const newSecLevel = $('#' + selector).val();

  if (newSecLevel && newSecLevel != "") {
    socket.emit('updateSecurity', newSecLevel);
    flashAdminTabs();
  }

}

function resetSecurityLevel() {
  socket.emit('resetSecurityLevel');
  flashAdminTabs();
}

function updatePortalStatus(selector) {
  const newStatus = $('#' + selector).val();

  if (newStatus && newStatus != "") {
    socket.emit('updatePortalStatus', newStatus);
    flashAdminTabs();
  }
}

function updateOrbStatus(newStatus) {
  if (newStatus && newStatus != "") {
    socket.emit('updateOrbStatus', newStatus);
    flashAdminTabs();
  }
}

function updateOrbStatusManually(selector) {
  const newStatus = $('#' + selector).val();
  updateOrbStatus(newStatus);
}

// Internet's meest generieke, gecopypaste en gestolen functie allertijden :
function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
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

function logout() {
  setCookie('auth', 'false', '-1');
  location.href = "/adm/index.html";
}
