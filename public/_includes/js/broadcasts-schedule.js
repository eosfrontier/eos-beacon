/**
 * BROADCASTS-SCHEDULE.JS
 * 
 * Define broadcasts that should trigger at a specific time.
 * The time should be in 24-hour "HH:MM:SS" format.
 * The `broadcast` property should be one of the broadcast objects defined in `broadcasts.js`.
 * The `sent` property is used to track if the broadcast has been sent for the day and will be reset automatically.
 */

const scheduledBroadcasts = [
    // Example: Breakfast announcement at 8:00 AM
    { time: '10:00:00', broadcast: bcbreakfast1, sent: false },

    // Example: Second breakfast announcement at 8:30 AM
    { time: '23:59:59', broadcast: bcgotobed, sent: false },

    // // Example: Lunch announcement at 12:30 PM
    // { time: '12:30:00', broadcast: bclunch, sent: false },
];