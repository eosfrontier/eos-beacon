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
function broadcastObj(title, file, priority, duration, colorscheme) {
  this.title = title;
  this.file = file;
  this.priority = priority;
  this.duration = duration;
  this.colorscheme = colorscheme;
}

// This file defines all static (non-video) broadcasts.
// It is now structured as a single object to prevent polluting the global scope
// and to allow it to be loaded as a module on the server.
const ALL_STATIC_BROADCASTS = {
  /* System broadcasts */
  bcdefault: new broadcastObj("Default Broadcast", "bcdefault", 1, "0", "tal"),
  bcreset: new broadcastObj("CLEAR SCREEN", "bcdefault", 99, "0", "tal"),

  /* kitchen crew */
  bcbreakfast1: new broadcastObj("FIRST Breakfast announcement", "kitchen/bcbreakfast1", 1, "0", "tal"),
  bcbreakfast2: new broadcastObj("SECOND Breakfast announcement", "kitchen/bcbreakfast2", 1, "0", "tal"),
  bclunch: new broadcastObj("Lunch announcement", "kitchen/bclunch", 1, "0", "tal"),
  bcdinner: new broadcastObj("Dinner announcement", "kitchen/bcdinner", 1, "0", "tal"),
  bcdishes: new broadcastObj("Dishes reminder", "kitchen/bcdishes", 1, "0", "tal"),

  /* Activities */
  bcwedding: new broadcastObj("Wedding", "activities/bcwedding", 98, "0", "tal"),
  bcfirstimplantcalibration1: new broadcastObj("FIRST Match Implant Calibration", "activities/bcfirstimplantcalibration1", 1, "0", "tal"),
  bcfirstimplantcalibration2: new broadcastObj("Implant Calibration 1 Part 2", "activities/bcfirstimplantcalibration2", 1, "0", "tal"),
  bcfirstimplantcalibration3: new broadcastObj("Implant Calibration 1 Part 3", "activities/bcfirstimplantcalibration3", 1, "0", "tal"),
  bcfirstimplantcalibration4: new broadcastObj("Implant Calibration 1 Part 4", "activities/bcfirstimplantcalibration4", 1, "30000", "tal"),
  bcsecondimplantcalibration1: new broadcastObj("SECOND Match Implant Calibration", "activities/bcsecondimplantcalibration1", 1, "0", "tal"),
  bcsecondimplantcalibration2: new broadcastObj("Implant Calibration 2 Part 2", "activities/bcsecondimplantcalibration2", 1, "0", "tal"),
  bcsecondimplantcalibration3: new broadcastObj("Implant Calibration 2 Part 3", "activities/bcsecondimplantcalibration3", 1, "0", "tal"),
  bcsecondimplantcalibration4: new broadcastObj("Implant Calibration 2 Part 4", "activities/bcsecondimplantcalibration4", 1, "0", "tal"),
  bcsecondimplantcalibrationFinal: new broadcastObj("Implant Calibration 2 Complete", "activities/bcsecondimplantcalibrationFinal", 1, "0", "tal"),
  bcsupportgroups: new broadcastObj("Support Group Assignment", "activities/bcsupportgroups", 1, "0", "tal"),
  bcdinnerdate1: new broadcastObj("Dinner Date & Free Time", "activities/bcdinnerdate1", 1, "0", "tal"),
  bcsexed: new broadcastObj("Sexual Education Class (Optional)", "activities/bcsexed", 1, "0", "tal"),
  bctangoclass: new broadcastObj("Tango Connection Class (Optional)", "activities/bctangoclass", 1, "0", "tal"),
  bcrelationshipend1: new broadcastObj("First Relationships End", "activities/bcrelationshipend1", 1, "0", "tal"),
  bcsecondmatches: new broadcastObj("Second Matches Announced", "activities/bcsecondmatches", 1, "0", "tal"),
  bcrelationshipbegin2: new broadcastObj("Second Relationships Begin", "activities/bcrelationshipbegin2", 1, "0", "tal"),
  bcjugglingclass: new broadcastObj("Duo Juggling Class (Optional)", "activities/bcjugglingclass", 1, "0", "tal"),
  bcparentingclass: new broadcastObj("Parenting Class (Optional)", "activities/bcparentingclass", 1, "0", "tal"),
  bcmeetfamily1: new broadcastObj("Meet the Family Lunch 1", "activities/bcmeetfamily1", 1, "0", "tal"),
  bcsoundtherapy: new broadcastObj("Couples Sound Therapy (Optional)", "activities/bcsoundtherapy", 1, "0", "tal"),
  bcballroomclass: new broadcastObj("Ballroom Dancing Class (Optional)", "activities/bcballroomclass", 1, "0", "tal"),
  bcdinnerdate2: new broadcastObj("Final Dinner Date (2nd)", "activities/bcdinnerdate2", 1, "0", "tal"),
  bcsinglesparty: new broadcastObj("Support Groups & Singles Party", "activities/bcsinglesparty", 1, "0", "tal"),
  bcrelationshipbegin3: new broadcastObj("Third Relationships Begin", "activities/bcrelationshipbegin3", 1, "0", "tal"),
  bckaraoke: new broadcastObj("Karaoke! (Optional)", "activities/bckaraoke", 1, "0", "tal"),
  bcbreakfast3: new broadcastObj("Breakfast (3rd)", "activities/bcbreakfast3", 1, "0", "tal"),
  bcsensualworkshop: new broadcastObj("Sensual Exploration Workshop (Optional)", "activities/bcsensualworkshop", 1, "0", "tal"),
  bcartclass: new broadcastObj("Art Class (Optional)", "activities/bcartclass", 1, "0", "tal"),
  bcmeetfamily2: new broadcastObj("Meet the Family Lunch 2", "activities/bcmeetfamily2", 1, "0", "tal"),
  bcrelationshipend3: new broadcastObj("Third Relationship Ends", "activities/bcrelationshipend3", 1, "0", "tal"),
  bcforevermatch: new broadcastObj("Forever Matches Announced", "activities/bcforevermatch", 1, "0", "tal"),

  /* Activity Warnings */
  bcrelationshipend1_20m: new broadcastObj("First Match Implant Calibration Forms", "activities/bcrelationshipend1_20m", 1, "0", "tal"),
  bcrelationshipend1_15m: new broadcastObj("First Match End (15m Warning)", "activities/bcrelationshipend1_15m", 1, "0", "tal"),
  bcrelationshipbegin2_10m: new broadcastObj("2nd Rel. Matches being computed", "activities/bcrelationshipbegin2_10m", 1, "0", "tal"),
  bcrelationshipbegin2_5m: new broadcastObj("First Matches 2nd Rel.", "activities/bcrelationshipbegin2_5m", 1, "0", "tal"),
  bcrelationshipbegin1_10m: new broadcastObj("2nd Rel. Matches being computed", "activities/bcrelationshipbegin1_10m", 1, "0", "tal"),
  bcrelationshipbegin1_5m: new broadcastObj("First Matches 2nd Rel.", "activities/bcrelationshipbegin1_5m", 1, "0", "tal"),
  bcmeetfamily1_10m: new broadcastObj("Meet Family 1 (10m Warning)", "activities/bcmeetfamily1_10m", 1, "0", "tal"),
  bcmeetfamily1_5m: new broadcastObj("Meet Family 1 (5m Warning)", "activities/bcmeetfamily1_5m", 1, "0", "tal"),
  bcdinnerdate2_10m: new broadcastObj("Final Dinner 2 (10m Warning)", "activities/bcdinnerdate2_10m", 1, "0", "tal"),
  bcdinnerdate2_5m: new broadcastObj("Final Dinner 2 (5m Warning)", "activities/bcdinnerdate2_5m", 1, "0", "tal"),
  bcsinglesparty_10m: new broadcastObj("Singles Party (10m Warning)", "activities/bcsinglesparty_10m", 1, "0", "tal"),
  bcsinglesparty_5m: new broadcastObj("Singles Party (5m Warning)", "activities/bcsinglesparty_5m", 1, "0", "tal"),
  bcrelationshipbegin3_10m: new broadcastObj("Third Begin (10m Warning)", "activities/bcrelationshipbegin3_10m", 1, "0", "tal"),
  bcrelationshipbegin3_5m: new broadcastObj("Third Begin (5m Warning)", "activities/bcrelationshipbegin3_5m", 1, "0", "tal"),
  bcmeetfamily2_10m: new broadcastObj("Meet Family 2 (10m Warning)", "activities/bcmeetfamily2_10m", 1, "0", "tal"),
  bcmeetfamily2_5m: new broadcastObj("Meet Family 2 (5m Warning)", "activities/bcmeetfamily2_5m", 1, "0", "tal"),
  bcrelationshipend3_10m: new broadcastObj("Third End (10m Warning)", "activities/bcrelationshipend3_10m", 1, "0", "tal"),
  bcrelationshipend3_5m: new broadcastObj("Third End (5m Warning)", "activities/bcrelationshipend3_5m", 1, "0", "tal"),
  bcforevermatch_10m: new broadcastObj("Forever Match (10m Warning)", "activities/bcforevermatch_10m", 1, "0", "tal"),
  bcforevermatch_5m: new broadcastObj("Forever Match (5m Warning)", "activities/bcforevermatch_5m", 1, "0", "tal"),
  bcartclass_5m: new broadcastObj("Art Class (5m Warning)", "activities/bcartclass_5m", 1, "0", "tal"),
  bcsexed_5m: new broadcastObj("SexEd Class (5m Warning)", "activities/bcsexed_5m", 1, "0", "tal"),
  bcsinglespartynow: new broadcastObj("Singles Party", "activities/bcsinglespartynow", 1, "0", "tal"),

  /* other PSA's */
  bcmeeting: new broadcastObj("Meeting in Main", "other/bcmeeting", 4, "0", "tal"),
  bcgatherforwelcome: new broadcastObj("Gather for Welcome Video", "other/bcgatherforwelcome", 1, "0", "tal"),

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
