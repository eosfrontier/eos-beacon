 // This script redefines the broadcast objects for templated activities
    // using the data from activity_broadcasts_data.js.
    // It assumes a global `broadcastObj` constructor is available and that
    // other non-templated broadcast objects are defined elsewhere.
    if (typeof activityBroadcastsData !== 'undefined' && typeof broadcastObj !== 'undefined') {
      const priority = 1; // Default priority for activities
      const duration = 0; // Default duration (no auto-clear)
      const colorscheme = "tal"; // Default colorscheme

      for (const key in activityBroadcastsData) {
        if (Object.hasOwnProperty.call(activityBroadcastsData, key)) {
          const data = activityBroadcastsData[key];

          // Create/overwrite a broadcast object and assign it to the global window object
          // so it's accessible by the onclick handlers (e.g., window.bcartclass).
          window[key] = new broadcastObj(
            data.subtitleText, // Use subtitle for the admin panel title / last broadcast title
            `activities/${key}`, // The 'file' property can act as a unique identifier
            priority,
            duration,
            colorscheme,
            { // The 'extraData' object that will be merged into the broadcast object
              type: "activity",
              activityData: data
            }
          );
        }
      }
    } else {
      console.error("Could not define templated activities: activity_broadcasts_data.js or broadcastObj constructor not found.");
    }