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

/* System broadcasts */
var bcdefault = new broadcastObj("Standby", "bcdefault", 1, "0", "0");
var bcreset = new broadcastObj("Standby", "bcdefault", 99, "0", "0");

/* kitchen crew */
var bclunch = new broadcastObj("Lunch announcement", "kitchen/bclunch", 2, "0", "0");
var bcdinner = new broadcastObj("Dinner announcement", "kitchen/bcdinner", 2, "0", "0");
var bcdishes = new broadcastObj("Dishes reminder", "kitchen/bctbcdishes", 2, "0", "0");

/* other PSA's */
var bctempleservice = new broadcastObj("Tachar Service", "other/bctempleservice", 2, "600000", "0");
var bcmeeting = new broadcastObj("Meeting in Main", "other/bcmeeting", 4, "0", "0");

/* medical PSA's */
var bcmedical = new broadcastObj("Blood Donation Request", "medical/bcmedical", 2, "0", "0");
var bcblood = new broadcastObj("Blood Donation Demand", "medical/bcblood", 4, "0", "0");
var bcmedbay = new broadcastObj("Medical Personel to Medbay", "medical/bcmedbay", 6, "0", "0");
var bcmedicalsupport = new broadcastObj("Insufficient Medical Staff", "medical/bcmedicalsupport", 6, "0", "0");

/* reminders */
var bchydrate = new broadcastObj("Hydration Reminder", "reminders/bchydrate", 1, "600000", "0");
var bcsunscreen = new broadcastObj("Sunscreen Reminder", "reminders/bcsunscreen", 1, "600000", "0");
var bcthankyou = new broadcastObj("Kindness Reminder", "reminders/bcthankyou", 1, "600000", "0");
var bctalon = new broadcastObj("Talon Reminder", "reminders/bctalon", 1, "600000", "0");
var bcmorning = new broadcastObj("Morning Reminder", "reminders/bcmorning", 1, "3600000", "0");
var bcgotobed = new broadcastObj("Sleep Reminder", "reminders/bcgotobed", 1, "10800000", "gray");

/* hazards */
var bcviral = new broadcastObj("Unknown Viral Pathogens detected", "hazards/bcviral", 8, "0", "hazard");
var bcbiohazard = new broadcastObj("Environmental Hazard detected", "hazards/bcbiohazard", 8, "0", "hazard");
var bcpsyhazard = new broadcastObj("Psy-hazard detected", "hazards/bcpsyhazard", 8, "0", "psyhazard");
var bcbomb = new broadcastObj("Bomb Alert", "hazards/bcbomb", 8, "0", "hazard");

/* Shield-Orb */
var bcorbactivate = new broadcastObj("Orb reactivation", "orb/bcorbactivate", 8, "45000", "0");
var bcorbcooldown = new broadcastObj("Orb Cooldown phase", "orb/bcorbcooldown", 8, "0", "psyhazard");

/* confirm hostiles */
var bchostileoutside = new broadcastObj("Enemy Contact", "hostiles/bchostileoutside", 8, "0", "0");
var bchostileinside = new broadcastObj("Enemy Contact", "hostiles/bchostileinside", 8, "0", "attack");

/* portal */
var bcportalinc = new broadcastObj("Scheduled Incoming Portal Activation", "portal/bcportalinc", 3, "30000", "0");
var bcportalincdanger = new broadcastObj("Unscheduled Incoming Portal Activation", "portal/bcportalincdanger", 3, "30000", "0");
var bcportalout = new broadcastObj("Portal Outgoing", "portal/bcportalout", 3, "17500", "0");

var bcportalinc_voice = new broadcastObj("Scheduled Incoming Portal Activation", "portal/bcportalinc_voice", 3, "30000", "0");
var bcportalincdanger_voice = new broadcastObj("Unscheduled Incoming Portal Activation", "portal/bcportalincdanger_voice", 3, "30000", "0");
var bcportalout_voice = new broadcastObj("Portal Outgoing", "portal/bcportalout_voice", 3, "17500", "0");

/* Overlord-only */
var bctransmission = new broadcastObj("Incoming Transmission", "overlord/bctransmission", 5, "0", "0");
var bctransmissionend = new broadcastObj("Incoming Transmission", "overlord/bctransmissionend", 10, "17500", "0");
var bclowpower = new broadcastObj("POWER SUPPLY WARNING", "overlord/bclowpower", 8, "0", "gray");
var bcreactorcrit = new broadcastObj("Reactor Critical", "overlord/bcreactorcrit", 9, "0", "attack");
var bchackattack = new broadcastObj("Security Breach", "overlord/bchackattack", 9, "0", "0");
var bcmissionout = new broadcastObj("Strati.OS Mission Alert", "overlord/bcMissionout", 9, "0", "0");


/* Maati's Eos IT toolbox */
var bcsystemscan = new broadcastObj("System Diagnostics", "hack/bcsystemscan", 88, "30000", "0");
var bcfreezeall = new broadcastObj("ADMIN.OVERRIDE", "hack/bcfreezeall", 100, "0", "gray");

/* VIDEOS */
/* Video Variables are now auto-generated. Simply place an html file in the videos folder that will autoplay your video. 
IMPORTANT: Your file must contain an HTML <title> tag.
This will be used to auto-generate the button name.
*/
