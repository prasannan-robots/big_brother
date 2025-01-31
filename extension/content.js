let monitoring = true; // Set monitoring to true initially
let scanning = false;

const hostname = window.location.hostname;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setMonitoring') {
        monitoring = request.monitoring;
        if (monitoring) {
            startScanning();
        } else {
            stopScanning();
        }
    }
});

function startScanning() {
    console.log('Monitoring enabled');
    scanning = true;
    if (hostname.includes('instagram.com')) {
        handleInstagram();
    } else if (hostname.includes('facebook.com')) {
        handleFacebook();
    } else if (hostname.includes('x.com')) {
        handleX();
    }
}

function stopScanning() {
    console.log('Monitoring disabled');
    scanning = false;
}

if (hostname.includes('instagram.com')) {
    chrome.storage.local.get('monitoring', (data) => {
        monitoring = data.monitoring || false;
        if (monitoring) {
            startScanning();
        }
    });
} else if (hostname.includes('facebook.com')) {
    chrome.storage.local.get('monitoring', (data) => {
        monitoring = data.monitoring || false;
        if (monitoring) {
            startScanning();
        }
    });
} else if (hostname.includes('x.com')) {
    chrome.storage.local.get('monitoring', (data) => {
        monitoring = data.monitoring || false;
        if (monitoring) {
            startScanning();
        }
    });
}

function insertCSPMetaTag() {
    const meta = document.createElement('meta');
    meta.httpEquiv = "Content-Security-Policy";
    meta.content = "default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:";
  
    const head = document.getElementsByTagName('head')[0];
    head.appendChild(meta);
}

function handleInstagram() {
    console.log('Handling Instagram-specific');
    const results = [];
    const processedArticles = new Set();

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function scrap(articles) {
        for (const article of articles) {
            if (!scanning) {
                console.log('Scanning stopped');
                break;
            }
            if (processedArticles.has(article)) {
                continue; // Skip already processed articles
            }
            processedArticles.add(article);

            const post = {};
            console.log("Working on", article);
            html2canvas(article, { useCORS: true, willReadFrequently: true }).then((canvas) => {
                post.screenshot = canvas.toDataURL("image/png");
                results.push(post);
                chrome.runtime.sendMessage({ action: 'classifyImage', imageData: post.screenshot }, (response) => {
                    console.log("Got response", response);
                    if (response.isScam) {
                        console.log("Scam Identified");
                        // Modify the article div to alert the user about the scam
                        article.style.border = '2px solid #ff5050';
                        const warning = document.createElement('div');
                        warning.style.color = '#ed4956'; // Instagram's red color
                        warning.style.fontWeight = 'bold';
                        warning.style.padding = '10px';
                        warning.style.marginBottom = '10px';
                        warning.style.borderRadius = '4px';
                        warning.style.backgroundColor = '#fff';
                        warning.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)';
                        warning.style.fontFamily = 'Arial, sans-serif';
                        warning.textContent = '⚠️ Warning: This post is classified as a scam!';
                        article.prepend(warning);
                    }
                });
            });
        }

        // Log the results after capturing all screenshots
        console.log(results);
    }

    async function onDOMContentLoaded() {
        console.log("DOM Content Loaded");
        await delay(200); // Delay of 200ms after DOM content is loaded
        const articles = document.querySelectorAll("article");
        await scrap(articles);
    }

    if (document.readyState === 'loading') {
        document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
    } else {
        onDOMContentLoaded();
    }

    document.addEventListener("scroll", async () => {
        console.log("Scrolled");
        scrap(document.querySelectorAll("article"));
    });
}

function handleFacebook() {
    console.log('Handling Facebook-specific');
    const results = [];
    const processedPosts = new Set();

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function scrap(posts) {
        for (const post of posts) {
            if (!scanning) {
                console.log('Scanning stopped');
                break;
            }
            if (processedPosts.has(post)) {
                continue; // Skip already processed posts
            }
            processedPosts.add(post);

            const postData = {};
            console.log("Working on", post);
            await html2canvas(post, { useCORS: true, willReadFrequently: true }).then((canvas) => {
                postData.screenshot = canvas.toDataURL("image/png");
                results.push(postData);
                chrome.runtime.sendMessage({ action: 'classifyImage', imageData: postData.screenshot }, (response) => {
                    console.log("Got response", response);
                    if (response.isScam) {
                        console.log("Scam Identified");
                        // Modify the post div to alert the user about the scam
                        post.style.border = '2px solid #ff5050';
                        const warning = document.createElement('div');
                        warning.style.color = '#ed4956'; // Facebook's red color
                        warning.style.fontWeight = 'bold';
                        warning.style.padding = '10px';
                        warning.style.marginBottom = '10px';
                        warning.style.borderRadius = '4px';
                        warning.style.backgroundColor = '#fff';
                        warning.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)';
                        warning.style.fontFamily = 'Arial, sans-serif';
                        warning.textContent = '⚠️ Warning: This post is classified as a scam!';
                        post.prepend(warning);
                    }
                });
            });
            await delay(200); // Delay of 200ms after processing each post
        }

        // Log the results after capturing all screenshots
        console.log(results);
    }

    async function onDOMContentLoaded() {
        console.log("DOM Content Loaded");
        await delay(200); // Delay of 200ms after DOM content is loaded
        const posts = document.querySelectorAll("div[data-pagelet='FeedUnit_{n}']"); // Adjust the selector as needed
        await scrap(posts);
    }

    if (document.readyState === 'loading') {
        document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
    } else {
        onDOMContentLoaded();
    }

    document.addEventListener("scroll", async () => {
        console.log("Scrolled");
        scrap(document.querySelectorAll("div[data-pagelet='FeedUnit_{n}']")); // Adjust the selector as needed
    });
}

function handleX() {
    console.log('Handling X-specific');
    const results = [];
    const processedTweets = new Set();

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function scrap(tweets) {
        for (const tweet of tweets) {
            if (!scanning) {
                console.log('Scanning stopped');
                break;
            }
            if (processedTweets.has(tweet)) {
                continue; // Skip already processed tweets
            }
            processedTweets.add(tweet);

            const tweetData = {};
            console.log("Working on", tweet);
            await html2canvas(tweet, { useCORS: true, willReadFrequently: true }).then((canvas) => {
                tweetData.screenshot = canvas.toDataURL("image/png");
                results.push(tweetData);
                chrome.runtime.sendMessage({ action: 'classifyImage', imageData: tweetData.screenshot }, (response) => {
                    console.log("Got response", response);
                    if (response.isScam) {
                        console.log("Scam Identified");
                        // Modify the tweet div to alert the user about the scam
                        tweet.style.border = '2px solid #ff5050';
                        const warning = document.createElement('div');
                        warning.style.color = '#ed4956'; // X's red color
                        warning.style.fontWeight = 'bold';
                        warning.style.padding = '10px';
                        warning.style.marginBottom = '10px';
                        warning.style.borderRadius = '4px';
                        warning.style.backgroundColor = '#fff';
                        warning.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)';
                        warning.style.fontFamily = 'Arial, sans-serif';
                        warning.textContent = '⚠️ Warning: This post is classified as a scam!';
                        tweet.prepend(warning);
                    }
                });
            });
            await delay(200); // Delay of 200ms after processing each tweet
        }

        // Log the results after capturing all screenshots
        console.log(results);
    }

    async function onDOMContentLoaded() {
        console.log("DOM Content Loaded");
        await delay(200); // Delay of 200ms after DOM content is loaded
        const tweets = document.querySelectorAll("article"); // Adjust the selector as needed
        await scrap(tweets);
    }

    if (document.readyState === 'loading') {
        document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
    } else {
        onDOMContentLoaded();
    }

    document.addEventListener("scroll", async () => {
        console.log("Scrolled");
        scrap(document.querySelectorAll("article")); // Adjust the selector as needed
    });
}