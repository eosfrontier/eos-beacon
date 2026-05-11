// API endpoint - works for both local and production proxy
const API_BASE_URL = 'https://api.eosfrontier.space/watchtower';

// Load current settings now that the script is loaded
loadCurrentSettings();

// Sync IC year with OC year input
document.getElementById('ocYear').addEventListener('input', (e) => {
    document.getElementById('icYear').value = e.target.value;
});

async function loadCurrentSettings() {
    const loadingStatus = document.getElementById('loadingStatus');
    loadingStatus.textContent = 'Loading current settings...';

    try {
        const response = await fetch(`${API_BASE_URL}/time/settings`);
        if (response.ok) {
            const data = await response.json();
            const ocDate = formatDateForInput(data.ocEventStartDate);
            const icDate = formatDateForInput(data.icEventStartDate);

            document.getElementById('ocDay').value = ocDate.day;
            document.getElementById('ocMonth').value = numberToMonthName(ocDate.month);
            document.getElementById('ocYear').value = ocDate.year;

            document.getElementById('icDay').value = icDate.day;
            document.getElementById('icMonth').value = numberToMonthName(icDate.month);
            // The IC year should always match the OC year
            document.getElementById('icYear').value = ocDate.year;
            document.getElementById('icStartYear').value = data.icStartYear;

            // Display current dates in DD/MMM/YYYY format
            document.getElementById('ocCurrentDisplay').textContent = `Current: ${ocDate.day}/${numberToMonthName(ocDate.month)}/${ocDate.year}`;
            // The IC year display should also match the OC year
            document.getElementById('icCurrentDisplay').textContent = `Current: ${icDate.day}/${numberToMonthName(icDate.month)}`;
            document.getElementById('icStartYearDisplay').textContent = `/${data.icStartYear}`;

            loadingStatus.textContent = 'Current settings loaded successfully.';
            loadingStatus.style.color = '#28a745';
        } else {
            const error = await response.json();
            loadingStatus.textContent = `Failed to load settings: ${error.error || 'Unknown error'}`;
            loadingStatus.style.color = '#dc3545';
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        loadingStatus.textContent = `Error loading settings: ${error.message}. Make sure the API server is running.`;
        loadingStatus.style.color = '#dc3545';
    }
}

function formatDateForInput(dateString) {
    const date = new Date(dateString);
    return {
        day: date.getDate(),
        month: date.getMonth() + 1, // getMonth() returns 0-11, we want 1-12
        year: date.getFullYear()
    };
}

function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthMap = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
};

function numberToMonthName(monthNum) {
    return monthNames[monthNum - 1];
}

function monthNameToNumber(monthName) {
    return monthMap[monthName] || null;
}

document.getElementById('refreshBtn').addEventListener('click', async () => {
    await loadCurrentSettings();
});

document.getElementById('dateForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const ocDay = document.getElementById('ocDay').value;
    const ocMonthName = document.getElementById('ocMonth').value;
    const ocMonth = monthNameToNumber(ocMonthName);
    const ocYear = document.getElementById('ocYear').value;

    const icDay = document.getElementById('icDay').value;
    const icMonthName = document.getElementById('icMonth').value;
    const icMonth = monthNameToNumber(icMonthName);
    const icYear = document.getElementById('icYear').value;
    const icStartYear = document.getElementById('icStartYear').value;

    // Validate month names
    if (!ocMonth || !icMonth) {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = 'Error: Invalid month name. Please use: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, or Dec';
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
        return;
    }

    // Construct date strings in YYYY-MM-DD format for API
    const ocDateString = `${ocYear}-${ocMonth.toString().padStart(2, '0')}-${ocDay.padStart(2, '0')}`;
    const icDateString = `${icYear}-${icMonth.toString().padStart(2, '0')}-${icDay.padStart(2, '0')}`;

    // Clear any previous messages
    document.getElementById('loadingStatus').textContent = 'Updating settings...';
    document.getElementById('loadingStatus').style.color = '#666';

    try {
        const response = await fetch(`${API_BASE_URL}/time/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ocEventStartDate: new Date(ocDateString + 'T12:00:00').toISOString(),
                icEventStartDate: new Date(icDateString + 'T12:00:00').toISOString(),
                icStartYear: new Number(icStartYear),
            })
        });

        const messageDiv = document.getElementById('message');
        const loadingStatus = document.getElementById('loadingStatus');

        if (response.ok) {
            const data = await response.json();
            messageDiv.textContent = data.message;
            messageDiv.className = 'message success';
            messageDiv.style.display = 'block';
            loadingStatus.textContent = `Settings updated. OC: ${ocDay}/${ocMonthName}/${ocYear}, IC: ${icDay}/${icMonthName}/${icYear}, IC Start Year: ${icStartYear}`;
            loadingStatus.style.color = '#28a745';
        } else {
            const error = await response.json();
            messageDiv.textContent = error.error || 'Failed to update settings';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            loadingStatus.textContent = 'Update failed.';
            loadingStatus.style.color = '#dc3545';
        }
    } catch (error) {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = 'Error: ' + error.message;
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
        document.getElementById('loadingStatus').textContent = 'Update failed due to error.';
        document.getElementById('loadingStatus').style.color = '#dc3545';
    }
});