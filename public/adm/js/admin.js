$(document).ready(function() {
    const admRANK = getCookie('rank');

    // Define the navigation panel structure
    const adminPanels = [
        // { id: /*'BROADCAST', */icon: 'fa-wifi', text: /*'BROADCAST', */rank: 1 },
        { id: 'REMINDERS', icon: 'fa-bell', text: 'REMINDERS', rank: 1, extraClass: 'btn-ui-holo-alt' },
        { id: 'SECURITY', icon: 'fa-exclamation-circle', text: 'ALERT LVL', rank: 1, extraClass: 'btn-ui-holo-red' },
        { id: 'KITCHEN', icon: 'fa-cutlery', text: 'KITCHEN', rank: 1, extraClass: 'btn-outline-success' },
        { id: 'ACTIVITIES', icon: 'fa-calendar-days', text: 'ACTIVITIES', rank: 1, extraClass: 'btn-outline-success' },
        { id: 'SCHEDULE', icon: 'fa-clock', text: 'SCHEDULE', rank: 2, extraClass: 'btn-ui-holo-alt' },
        { id: 'MEDIA', icon: 'fa-photo-film', text: 'MEDIA', rank: 1, extraClass: 'btn-ui-holo-alt' },
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

    // If the user is logged in, generate the control panel
    if (getCookie('auth') === 'TRUE') {
        if ((!admRANK || admRANK < 1) || (admRANK > 4)) {
            logout();
        } else {
            generateCPanel();
        }
    }
});

function loadAdminPanel(panelId) {
    const panelFile = panelId.toLowerCase();
    const mainContainer = $('#main');

    mainContainer.load(`/adm/panels/${panelFile}.html`, function(response, status, xhr) {
        if (status === "error") {
            mainContainer.load('/adm/404.html');
            console.error(`Error loading panel ${panelFile}.html: ${xhr.status} ${xhr.statusText}`);
        } else {
            // After loading, initialize scripts for specific panels.
            switch(panelId) {
                case 'MEDIA':
                    if (socket) socket.emit('getMedia');
                    syncVideoBroadcasts(true, '#auto-video-list');
                    break;
                case 'SCHEDULE':
                    if (socket && typeof populateBroadcastsDropdown === 'function') {
                        populateBroadcastsDropdown();
                        socket.emit('getSchedule');
                    }
                    break;
            }
        }
    });
}

function navigateADM(panelId) {
    $('.adm-nav').removeClass('active');
    $(`#btn-adm${panelId}`).addClass('active');
    loadAdminPanel(panelId);
}