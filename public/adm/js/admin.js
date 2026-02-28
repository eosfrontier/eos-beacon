$(document).ready(function () {
    const admRANK = getCookie('rank');

    // Define the navigation panel structure
    const adminPanels = [
        // { id: /*'BROADCAST', */icon: 'fa-wifi', text: /*'BROADCAST', */rank: 1 },
        { id: 'ACTIVITIES', icon: 'fa-calendar-days', text: 'ACTIVITIES', rank: 1, extraClass: 'btn-outline-success' },
        { id: 'REMINDERS', icon: 'fa-bell', text: 'REMINDERS', rank: 1, extraClass: 'btn-ui-holo-alt' },
        { id: 'SECURITY', icon: 'fa-exclamation-circle', text: 'ALERT LVL', rank: 1, extraClass: 'btn-ui-holo-red' },
        { id: 'KITCHEN', icon: 'fa-cutlery', text: 'KITCHEN', rank: 1, extraClass: 'btn-outline-success' },
        { id: 'SCHEDULE', icon: 'fa-clock', text: 'SCHEDULE', rank: 2, extraClass: 'btn-ui-holo-alt' },
        { id: 'MEDIA', icon: 'fa-photo-film', text: 'MEDIA', rank: 1, extraClass: 'btn-outline-blue' },
        { id: 'BGMUSIC', icon: 'fa-music', text: 'BG MUSIC', rank: 1, extraClass: 'btn-ui-holo-alt' },
        { id: 'TTS', icon: 'fa-comment-dots', text: 'TTS', rank: 2, extraClass: 'btn-ui-holo-alt' },
        { id: 'OVERLORD', icon: 'fa-microchip', text: 'OVERLORD', rank: 4, extraClass: 'btn-ui-holo-red' },
        { id: 'CMD', icon: 'fa-terminal', text: 'OTHER', rank: 4, extraClass: 'btn-ui-holo-red' }
        // Commented out panels can be added here when ready
        // { id: 'MEDICAL', icon: 'fa-medkit', text: 'MEDICAL', rank: 2, extraClass: 'btn-ui-holo-red' },
        // { id: 'ORB', icon: 'fa-opera', text: 'CANOPY', rank: 3 },
    ];

    // Permissions map by rank
    const rankPermissions = {
        '1': [/*'BROADCAST', */'REMINDERS', 'SECURITY', 'KITCHEN', 'ACTIVITIES', 'MEDIA', 'CMD'],
        '2': [/*'BROADCAST', */'REMINDERS', 'SECURITY', 'KITCHEN', 'ACTIVITIES', 'MEDIA', 'BGMUSIC', 'CMD', 'SCHEDULE', 'TTS' /*, 'MEDICAL'*/],
        '3': [/*'BROADCAST', */'REMINDERS', 'SECURITY', 'KITCHEN', 'ACTIVITIES', 'MEDIA', 'BGMUSIC', 'CMD', 'SCHEDULE', 'TTS' /*, 'ORB'*/],
        '4': [/*'BROADCAST', */'REMINDERS', 'SECURITY', 'KITCHEN', 'ACTIVITIES', 'MEDIA', 'BGMUSIC', 'CMD', 'SCHEDULE', 'TTS'/*, 'OVERLORD' , 'MEDICAL', 'ORB'*/]
    };

    function generateCPanel() {
        const cPanelContainer = $('#cPanel-container');
        if (!cPanelContainer.length) return;

        cPanelContainer.empty();
        const userRank = getCookie('rank') || '1';
        const visiblePanels = rankPermissions[userRank] || rankPermissions['1'];

        adminPanels.forEach(panel => {
            if (visiblePanels.includes(panel.id)) {
                const button = $('<button>')
                    .attr('id', `btn-adm${panel.id}`)
                    .addClass('btn adm-nav')
                    .on('click', () => navigateADM(panel.id));

                if (panel.extraClass) {
                    button.addClass(panel.extraClass);
                    // The 'holo' styles need the base 'btn-ui' class, but 'btn-outline-*' does not.
                    if (panel.extraClass.includes('holo')) {
                        button.addClass('btn-ui');
                    }
                } else {
                    // Default button style
                    button.addClass('btn-ui btn-ui-holo');
                }

                button.html(`<i style="font-size:133%" class="fa ${panel.icon}"></i><br/>${panel.text}`);
                cPanelContainer.append(button);
            }
        });

        // Set the first button as active and load its content
        const firstButton = cPanelContainer.find('button.adm-nav').first();
        if (firstButton.length) {
            firstButton.addClass('active');
            const initialPanelId = firstButton.attr('id').replace('btn-adm', '');
            loadAdminPanel(initialPanelId);
        }
    }

    // Handler for the accordion-style sections in activities.html
    $(document).on('click', '.activity-header', function () {
        const $target = $($(this).data('target'));

        // If the target is already visible, do nothing to prevent flicker.
        if ($target.is(':visible')) {
            return;
        }

        // Hide all other content panels.
        $('.activity-content').hide();

        // Show the target panel.
        $target.fadeIn('fast');
    });

    // If the user is logged in, generate the control panel
    if (getCookie('auth') === 'TRUE') {
        if ((!admRANK || admRANK < 1) || (admRANK > 4)) {
            logout();
        } else {
            generateCPanel();
        }
    }
});

function loadAdminPanel(panelId, callback = null) {
    const panelFile = panelId.toLowerCase();
    const mainContainer = $('#main');

    mainContainer.load(`/adm/panels/${panelFile}.html`, function (response, status, xhr) {
        if (status === "error") {
            mainContainer.load('/adm/404.html');
        } else {
            // Initialize panel-specific scripts
            switch (panelId) {
                case 'ACTIVITIES':
                    // This will populate activity buttons. Assumes activities.html has <div id="auto-activity-list" class="items"></div>
                    syncDynamicBroadcasts(false);
                    break;
                case 'MEDIA':
                    if (socket) socket.emit('getMedia'); // For the audio file browser
                    syncDynamicBroadcasts(true, '#auto-video-list'); // For video broadcast buttons
                    break;
                case 'SCHEDULE':
                    if (socket && typeof populateBroadcastsDropdown === 'function') {
                        populateBroadcastsDropdown();
                        socket.emit('getSchedule');
                    }
                    break;
            }

            // Run callback only if it was provided
            if (typeof callback === 'function') callback();
        }
    });
}

function loadAdminSubPanel(panelId, subPanelId, callback = null) {
    // We pass a function to navigateADM to ensure the sub-panel 
    // logic only runs AFTER the main panel HTML exists.
    navigateADM(panelId, function () {
        $(".hidden-block").hide();
        $(subPanelId).fadeIn();

        if (typeof callback === 'function') callback();
    });
}

function loadAdminSubPanelFolder(panelId, subPanelId, fullClassId) {
    loadAdminSubPanel(panelId, subPanelId, function () {
        const openFolder = function () {
            const $header = $(`.${fullClassId}`);
            if ($header.length) {
                // The click handler is already attached in adminPanel.js.
                // We just need to trigger the click if the folder is not already open.
                if (!$header.next('.audio-folder-content').is(':visible')) {
                    $header.trigger('click');
                }
            } else {
                console.warn(`Could not find element: .${fullClassId}`);
            }
        };

        // If the target element already exists, open it.
        // Otherwise, wait for the 'audioTreeBuilt' event which is fired
        // from adminPanel.js when the audio tree is rendered.
        if ($(`.${fullClassId}`).length > 0) {
            openFolder();
        } else {
            $(document).one('audioTreeBuilt', openFolder);
        }
    });
}



function navigateADM(panelId, callback = null) {
    $('.adm-nav').removeClass('active');
    $(`#btn-adm${panelId}`).addClass('active');
    loadAdminPanel(panelId, callback);
        // Run callback only if it was provided
    if (typeof callback === 'function') callback();
}