// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const imageUrl = request.imageUrl;
    classifyImage(imageUrl).then(isScam => {
        if (isScam) {
            alertUser(imageUrl);
        }
    }).catch(error => {
        console.error('Error classifying image:', error);
    });
});

async function classifyImage(imageUrl) {
    try {
        const response = await fetch('http://127.0.0.1:5000/', {
            method: 'POST',
            body: JSON.stringify({ imageUrl }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.isScam; // Assuming the API returns an object with isScam property
    } catch (error) {
        console.error('Error fetching classification:', error);
        throw error;
    }
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