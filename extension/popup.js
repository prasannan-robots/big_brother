document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('toggle');
    const statusElement = document.getElementById('status');

    // Load the monitoring state from storage
    chrome.storage.local.get('monitoring', (data) => {
        const monitoring = data.monitoring || false;
        toggleSwitch.checked = monitoring;
        updateStatus(monitoring);
    });

    toggleSwitch.addEventListener('change', () => {
        const monitoring = toggleSwitch.checked;
        // Store the monitoring state
        chrome.storage.local.set({ monitoring });
        // Send a message to the background script to toggle monitoring
        chrome.runtime.sendMessage({ action: 'toggleMonitoring' }, (response) => {
            console.log(response);
            if (response && response.monitoring !== undefined) {
                updateStatus(response.monitoring);
            } else {
                statusElement.textContent = 'Error: No response from background script';
            }
        });
    });

    function updateStatus(monitoring) {
        if (monitoring) {
            statusElement.textContent = 'Monitoring is ON';
        } else {
            statusElement.textContent = 'Monitoring is OFF';
        }
    }
});