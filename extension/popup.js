document.getElementById('toggle').addEventListener('click', () => {
    // Send a message to the background script to toggle monitoring
    chrome.runtime.sendMessage({ action: 'toggleMonitoring' }, (response) => {
        const statusElement = document.getElementById('status');
        console.log(response);
        if (response && response.monitoring !== undefined) {
            if (response.monitoring) {
                statusElement.textContent = 'Monitoring is ON';
            } else {
                statusElement.textContent = 'Monitoring is OFF';
            }
        } else {
            statusElement.textContent = 'Error: No response from background script';
        }
    });
});