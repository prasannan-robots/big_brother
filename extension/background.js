chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'classifyImage') {
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
    // const apiKey = 'YOUR_OPENAI_API_KEY'; // Replace with your OpenAI API key
    // const openai = new OpenAI(apiKey);

    // try {
    //     const response = await openai.createImageClassification({
    //         model: "image-classification-001",
    //         image: imageData,
    //         labels: ["scam", "not_scam"]
    //     });
    //     return response.data.label === "scam";
    // } catch (error) {
    //     console.error('Error classifying image with OpenAI:', error);
    //     return false;
    // }
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