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
var bcdefault = new broadcastObj("Default Broadcast", "bcdefault", 1, "0", "tal");
var bcreset = new broadcastObj("CLEAR SCREEN", "bcdefault", 9, "5", "tal");

/* kitchen crew */
var bcbreakfast1 = new broadcastObj("FIRST Breakfast announcement", "kitchen/bcbreakfast1", 1, "0", "tal");
var bcbreakfast2 = new broadcastObj("SECOND Breakfast announcement", "kitchen/bcbreakfast2", 1, "0", "tal");
var bclunch = new broadcastObj("Lunch announcement", "kitchen/bclunch", 1, "0", "tal");
var bcdinner = new broadcastObj("Dinner announcement", "kitchen/bcdinner", 1, "0", "tal");
var bcdishes = new broadcastObj("Dishes reminder", "kitchen/bcdishes", 1, "0", "tal");

/* Activities */
var bcwedding = new broadcastObj("Wedding", "activities/bcwedding", 98, "0", "tal");
var bcfirstimplantcalibration1 = new broadcastObj("FIRST Match Implant Calibration", "activities/bcfirstimplantcalibration1", 1, "0", "tal");
var bcfirstimplantcalibration2 = new broadcastObj("Implant Calibration 1 Part 2", "activities/bcfirstimplantcalibration2", 1, "0", "tal");
var bcfirstimplantcalibration3 = new broadcastObj("Implant Calibration 1 Part 3", "activities/bcfirstimplantcalibration3", 1, "0", "tal");
var bcfirstimplantcalibration4 = new broadcastObj("Implant Calibration 1 Part 4", "activities/bcfirstimplantcalibration4", 1, "30000", "tal");
var bcsecondimplantcalibration1 = new broadcastObj("SECOND Match Implant Calibration", "activities/bcsecondimplantcalibration1", 1, "0", "tal");
var bcsecondimplantcalibration2 = new broadcastObj("Implant Calibration 2 Part 2", "activities/bcsecondimplantcalibration2", 1, "0", "tal");
var bcsecondimplantcalibration3 = new broadcastObj("Implant Calibration 2 Part 3", "activities/bcsecondimplantcalibration3", 1, "0", "tal");
var bcsecondimplantcalibration4 = new broadcastObj("Implant Calibration 2 Part 4", "activities/bcsecondimplantcalibration4", 1, "0", "tal");
var bcsecondimplantcalibrationFinal = new broadcastObj("Implant Calibration 2 Complete", "activities/bcsecondimplantcalibrationFinal", 1, "0", "tal");
var bcsupportgroups = new broadcastObj("Support Group Assignment", "activities/bcsupportgroups", 1, "0", "tal");
var bcfirstmatches = new broadcastObj("Announcing First Matches", "activities/bcfirstmatches", 1, "0", "tal");
var bcdinnerdate1 = new broadcastObj("Dinner Date & Free Time", "activities/bcdinnerdate1", 1, "0", "tal");
var bcsexed = new broadcastObj("Sexual Education Class (Optional)", "activities/bcsexed", 1, "0", "tal");
var bctangoclass = new broadcastObj("Tango Connection Class (Optional)", "activities/bctangoclass", 1, "0", "tal");
var bcrelationshipend1 = new broadcastObj("First Relationships End", "activities/bcrelationshipend1", 1, "0", "tal");
var bcsecondmatches = new broadcastObj("Second Matches Announced", "activities/bcsecondmatches", 1, "0", "tal");
var bcrelationshipbegin2 = new broadcastObj("Second Relationships Begin", "activities/bcrelationshipbegin2", 1, "0", "tal");
var bcjugglingclass = new broadcastObj("Duo Juggling Class (Optional)", "activities/bcjugglingclass", 1, "0", "tal");
var bcparentingclass = new broadcastObj("Parenting Class (Optional)", "activities/bcparentingclass", 1, "0", "tal");
var bcmeetfamily1 = new broadcastObj("Meet the Family Lunch 1", "activities/bcmeetfamily1", 1, "0", "tal");
var bcsoundtherapy = new broadcastObj("Couples Sound Therapy (Optional)", "activities/bcsoundtherapy", 1, "0", "tal");
var bcballroomclass = new broadcastObj("Ballroom Dancing Class (Optional)", "activities/bcballroomclass", 1, "0", "tal");
var bcdinnerdate2 = new broadcastObj("Final Dinner Date (2nd)", "activities/bcdinnerdate2", 1, "0", "tal");
var bcsinglesparty = new broadcastObj("Support Groups & Singles Party", "activities/bcsinglesparty", 1, "0", "tal");
var bcrelationshipbegin3 = new broadcastObj("Third Relationships Begin", "activities/bcrelationshipbegin3", 1, "0", "tal");
var bckaraoke = new broadcastObj("Karaoke! (Optional)", "activities/bckaraoke", 1, "0", "tal");
var bcbreakfast3 = new broadcastObj("Breakfast (3rd)", "activities/bcbreakfast3", 1, "0", "tal");
var bcsensualworkshop = new broadcastObj("Sensual Exploration Workshop (Optional)", "activities/bcsensualworkshop", 1, "0", "tal");
var bcartclass = new broadcastObj("Art Class (Optional)", "activities/bcartclass", 1, "0", "tal");
var bcmeetfamily2 = new broadcastObj("Meet the Family Lunch 2", "activities/bcmeetfamily2", 1, "0", "tal");
var bcrelationshipend3 = new broadcastObj("Third Relationship Ends", "activities/bcrelationshipend3", 1, "0", "tal");
var bcforevermatch = new broadcastObj("Forever Matches Announced", "activities/bcforevermatch", 1, "0", "tal");

/* Activity Warnings */
var bcrelationshipend1_20m = new broadcastObj("First Match Implant Calibration Forms", "activities/bcrelationshipend1_20m", 1, "0", "tal");
var bcrelationshipend1_15m = new broadcastObj("First Match End (15m Warning)", "activities/bcrelationshipend1_15m", 1, "0", "tal");
var bcrelationshipbegin2_10m = new broadcastObj("2nd Rel. Matches being computed", "activities/bcrelationshipbegin2_10m", 1, "0", "tal");
var bcrelationshipbegin2_5m = new broadcastObj("First Matches 2nd Rel.", "activities/bcrelationshipbegin2_5m", 1, "0", "tal");
var bcmeetfamily1_10m = new broadcastObj("Meet Family 1 (10m Warning)", "activities/bcmeetfamily1_10m", 1, "0", "tal");
var bcmeetfamily1_5m = new broadcastObj("Meet Family 1 (5m Warning)", "activities/bcmeetfamily1_5m", 1, "0", "tal");
var bcdinnerdate2_10m = new broadcastObj("Final Dinner 2 (10m Warning)", "activities/bcdinnerdate2_10m", 1, "0", "tal");
var bcdinnerdate2_5m = new broadcastObj("Final Dinner 2 (5m Warning)", "activities/bcdinnerdate2_5m", 1, "0", "tal");
var bcsinglesparty_10m = new broadcastObj("Singles Party (10m Warning)", "activities/bcsinglesparty_10m", 1, "0", "tal");
var bcsinglesparty_5m = new broadcastObj("Singles Party (5m Warning)", "activities/bcsinglesparty_5m", 1, "0", "tal");
var bcrelationshipbegin3_10m = new broadcastObj("Third Begin (10m Warning)", "activities/bcrelationshipbegin3_10m", 1, "0", "tal");
var bcrelationshipbegin3_5m = new broadcastObj("Third Begin (5m Warning)", "activities/bcrelationshipbegin3_5m", 1, "0", "tal");
var bcmeetfamily2_10m = new broadcastObj("Meet Family 2 (10m Warning)", "activities/bcmeetfamily2_10m", 1, "0", "tal");
var bcmeetfamily2_5m = new broadcastObj("Meet Family 2 (5m Warning)", "activities/bcmeetfamily2_5m", 1, "0", "tal");
var bcrelationshipend3_10m = new broadcastObj("Third End (10m Warning)", "activities/bcrelationshipend3_10m", 1, "0", "tal");
var bcrelationshipend3_5m = new broadcastObj("Third End (5m Warning)", "activities/bcrelationshipend3_5m", 1, "0", "tal");
var bcforevermatch_10m = new broadcastObj("Forever Match (10m Warning)", "activities/bcforevermatch_10m", 1, "0", "tal");
var bcforevermatch_5m = new broadcastObj("Forever Match (5m Warning)", "activities/bcforevermatch_5m", 1, "0", "tal");
var bcartclass_5m = new broadcastObj("Art Class (5m Warning)", "activities/bcartclass_5m", 1, "0", "tal");
var bcsexed_5m = new broadcastObj("SexEd Class (5m Warning)", "activities/bcsexed_5m", 1, "0", "tal");
var bcsinglespartynow = new broadcastObj("Singles Party", "activities/bcsinglespartynow", 1, "0", "tal");

/* other PSA's */
// var bctempleservice = new broadcastObj("Tachar Service", "other/bctempleservice", 1, "600000", "tal");
var bcmeeting = new broadcastObj("Meeting in Main", "other/bcmeeting", 4, "0", "tal");
var bcgatherforwelcome = new broadcastObj("Gather for Welcome Video", "other/bcgatherforwelcome", 1, "0", "tal");

/* medical PSA's */
// var bcmedical = new broadcastObj("Blood Donation Request", "medical/bcmedical", 1, "0", "tal");
// var bcblood = new broadcastObj("Blood Donation Demand", "medical/bcblood", 4, "0", "tal");
// var bcmedbay = new broadcastObj("Medical Personel to Medbay", "medical/bcmedbay", 6, "0", "tal");
// var bcmedicalsupport = new broadcastObj("Insufficient Medical Staff", "medical/bcmedicalsupport", 6, "0", "tal");

/* reminders */
var bchydrate = new broadcastObj("Hydration Reminder", "reminders/bchydrate", 1, "600000", "tal");
var bcsunscreen = new broadcastObj("Sunscreen Reminder", "reminders/bcsunscreen", 1, "600000", "tal");
var bcthankyou = new broadcastObj("Kindness Reminder", "reminders/bcthankyou", 1, "600000", "tal");
// var bctalon = new broadcastObj("Talon Reminder", "reminders/bctalon", 1, "600000", "tal");
var bcmorning = new broadcastObj("Morning Reminder", "reminders/bcmorning", 1, "3600000", "tal");
var bcgotobed = new broadcastObj("Sleep Reminder", "reminders/bcgotobed", 1, "0", "gray");

/* hazards */
// var bcviral = new broadcastObj("Unknown Viral Pathogens detected", "hazards/bcviral", 8, "0", "hazard");
// var bcbiohazard = new broadcastObj("Environmental Hazard detected", "hazards/bcbiohazard", 8, "0", "hazard");
// var bcpsyhazard = new broadcastObj("Psy-hazard detected", "hazards/bcpsyhazard", 8, "0", "psyhazard");
// var bcbomb = new broadcastObj("Bomb Alert", "hazards/bcbomb", 8, "0", "hazard");

/* Shield-Orb */
// var bcorbactivate = new broadcastObj("Orb reactivation", "orb/bcorbactivate", 8, "45000", "tal");
// var bcorbcooldown = new broadcastObj("Orb Cooldown phase", "orb/bcorbcooldown", 8, "0", "psyhazard");

/* confirm hostiles */
// var bchostileoutside = new broadcastObj("Enemy Contact", "hostiles/bchostileoutside", 8, "0", "tal");
// var bchostileinside = new broadcastObj("Enemy Contact", "hostiles/bchostileinside", 8, "0", "attack");

/* portal */
// var bcportalinc = new broadcastObj("Scheduled Incoming Portal Activation", "portal/bcportalinc", 3, "30000", "tal");
// var bcportalincdanger = new broadcastObj("Unscheduled Incoming Portal Activation", "portal/bcportalincdanger", 3, "30000", "tal");
// var bcportalout = new broadcastObj("Portal Outgoing", "portal/bcportalout", 3, "17500", "tal");

// var bcportalinc_voice = new broadcastObj("Scheduled Incoming Portal Activation", "portal/bcportalinc_voice", 3, "30000", "tal");
// var bcportalincdanger_voice = new broadcastObj("Unscheduled Incoming Portal Activation", "portal/bcportalincdanger_voice", 3, "30000", "tal");
// var bcportalout_voice = new broadcastObj("Portal Outgoing", "portal/bcportalout_voice", 3, "17500", "tal");

/* Overlord-only */
var bctransmission = new broadcastObj("Transmission Incoming", "overlord/bctransmission", 5, "10000", "tal");
var bctransmissionend = new broadcastObj("Transmission Ended", "overlord/bctransmissionend", 10, "17500", "tal");
// var bclowpower = new broadcastObj("POWER SUPPLY WARNING", "overlord/bclowpower", 8, "0", "gray");
// var bcreactorcrit = new broadcastObj("Reactor Critical", "overlord/bcreactorcrit", 9, "0", "attack");
var bchackattack = new broadcastObj("IT Security Breach", "overlord/bchackattack", 9, "0", "tal");
// var bcmissionout = new broadcastObj("Strati.OS Mission Alert", "overlord/bcMissionout", 9, "0", "tal");


/* Maati's Eos IT toolbox */
// var bcsystemscan = new broadcastObj("System Diagnostics", "hack/bcsystemscan", 88, "30000", "tal");
// var bcfreezeall = new broadcastObj("ADMIN.OVERRIDE", "hack/bcfreezeall", 100, "0", "gray");

/* VIDEOS */
/* Video Variables are now auto-generated. Simply place an html file in the videos folder that will autoplay your video. 
IMPORTANT: Your file must contain an HTML <title> tag.
This will be used to auto-generate the button name.
*/
