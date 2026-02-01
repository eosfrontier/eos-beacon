/* configuration. */
SYSTEM_DETAILS = {
  appname: 'AMORE',
  appdescription: 'Affection Management & Organic Relationship Engine. Powered by The Department of Marriage.',
  tagline: 'Matches made, destinies delivered.',
}

/* system settings: This can generally be left alone. */
SYSTEM_SETTINGS = {
  port: 5009, /* declares which port BEACON will run on. By default: 5000. */
  voiceEnabled: true,
  ICDateEnabled: false,
  yearOffset: 44, //Used with OC Date to move us into the future or past
}

/* Settings for defaults that appear on screen. For example, the default security level */
APPLICATION_DEFAULTS = {
  defaultSecurityLevel: "Status: Synchronized - Optimal Pairing Conditions",
  defaultColorScheme: "tal", /* set to '0' for default styling. */
}

/* creating the account object, to re use later */
function accountObj(logincode, loginRank) {
  this.logincode = logincode;
  this.loginRank = loginRank;
}


/*
add entries here to make legit accounts, bound to a five-digit code.
the second digit, which is '1' in our example, determines the user 'rank'. The higher, the better, going from 1 to 4.
a full admin/gamemaster would be:
  VALID_ACCOUNTS.push(new accountObj('00451','4'));
at this time, 1 = general use, 2 = medical, 3 = customs, 4 = admin

*/
const VALID_ACCOUNTS = [
  new accountObj('10191', '1'),
  new accountObj('61021', '2'),
  new accountObj('15101', '3'),
  new accountObj('34471', '4'),
];

/* Send config/settings to main server (( index.js )) */
exports.cfg = SYSTEM_DETAILS;
exports.sys = SYSTEM_SETTINGS;
exports.data = APPLICATION_DEFAULTS;
exports.accounts = VALID_ACCOUNTS;
