chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleMonitoring') {
        monitoring = !monitoring;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'setMonitoring', monitoring });
        });
        sendResponse({ monitoring });
    } else if (request.action === 'classifyImage') {
        classifyImageWithOpenAI(request.imageData).then(isScam => {
            sendResponse({ isScam });
        }).catch(error => {
            console.error('Error classifying image:', error);
            sendResponse({ isScam: false });
        });
        return true; // Indicates that the response will be sent asynchronously
    }
});

async function classifyImageWithOpenAI(imageData) {
    
const response = await fetch('http://127.0.0.1:8000/test', { // Replace with your server URL
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ image_base64: imageData })
});

const result = await response.json();
console.log(result);
    return true;
}

function alertUser(imageUrl) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png', // Ensure you have an icon.png in your extension directory
        title: 'Potential Scam Detected',
        message: `A scam image was detected: ${imageUrl}`,
        priority: 2
    }, (notificationId) => {
        if (chrome.runtime.lastError) {
            console.error('Notification error:', chrome.runtime.lastError);
        }
    });
}