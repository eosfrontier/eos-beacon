/*
==== ================================================================= ====
 ==    BROADCASTS.JS                                                    ==
 ==    In this file, we declare the broadcasts by using 'broadcastObj' as our template.
==== ================================================================= ====
 ==    By Thijs Boerma, th.boerma@gmail.com | 2017                      ==
==== ================================================================= ====
*/


/* BROADCAST OBJECTEN */
/* constructor: */
function broadcastObj(title, file, priority, duration, colorscheme, extraData) {
  this.title = title;
  this.file = file;
  this.priority = priority;
  this.duration = duration;
  this.colorscheme = colorscheme;
  // Merge extra data if it exists
  if (extraData && typeof extraData === 'object') {
    Object.assign(this, extraData);
  }
}

// This file defines all static (non-video) broadcasts.
// It is now structured as a single object to prevent polluting the global scope
// and to allow it to be loaded as a module on the server.
const ALL_STATIC_BROADCASTS = {
  /* System broadcasts */
  bcdefault: new broadcastObj("Default Broadcast", "bcdefault", 1, "0", "tal"),
  bcreset: new broadcastObj("CLEAR SCREEN", "bcdefault", 99, "0", "tal"),

  /* kitchen crew */
  // bcdishes: new broadcastObj("Dishes reminder", "kitchen/bcdishes", 1, "0", "tal"),

  /* Activities & Warnings are now dynamically generated from activity_broadcasts_data.js */
  /* Only non-templated activities remain here. */
  bcsinglespartynow: new broadcastObj("Singles Party", "activities/bcsinglespartynow", 1, "0", "tal"),

  /* other PSA's */
  bcmeeting: new broadcastObj("Meeting in Main", "other/bcmeeting", 4, "0", "tal"),
  /* bcgatherforwelcome: new broadcastObj("Gather for Welcome Video", "other/bcgatherforwelcome", 1, "0", "tal"), */

  /* reminders */
  bchydrate: new broadcastObj("Hydration Reminder", "reminders/bchydrate", 1, "600000", "tal"),
  bcsunscreen: new broadcastObj("Sunscreen Reminder", "reminders/bcsunscreen", 1, "600000", "tal"),
  bcthankyou: new broadcastObj("Kindness Reminder", "reminders/bcthankyou", 1, "600000", "tal"),
  bcmorning: new broadcastObj("Morning Reminder", "reminders/bcmorning", 1, "3600000", "tal"),
  bcgotobed: new broadcastObj("Sleep Reminder", "reminders/bcgotobed", 1, "0", "gray"),

  /* Overlord-only */
  bctransmission: new broadcastObj("Transmission Incoming", "overlord/bctransmission", 5, "10000", "tal"),
  bctransmissionend: new broadcastObj("Transmission Ended", "overlord/bctransmissionend", 10, "17500", "tal"),
  bchackattack: new broadcastObj("IT Security Breach", "overlord/bchackattack", 9, "0", "tal"),
};

// Make the data available to Node.js's `require` system if running on the server.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ALL_STATIC_BROADCASTS };
} else {
  // If running in a browser, assign broadcasts to the window object for backward compatibility.
  Object.keys(ALL_STATIC_BROADCASTS).forEach(function(key) {
    window[key] = ALL_STATIC_BROADCASTS[key];
  });
}
