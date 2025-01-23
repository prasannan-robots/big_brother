// content.js

const hostname = window.location.hostname;

if (hostname.includes('instagram.com')) {
    handleInstagram();
} else if (hostname.includes('facebook.com')) {
    handleFacebook();
} else if (hostname.includes('x.com')) {
    handleX();
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
            if (processedArticles.has(article)) {
                continue; // Skip already processed articles
            }
            processedArticles.add(article);

            const post = {};
            console.log("Working on", article);
            await html2canvas(article, { useCORS: true, willReadFrequently: true }).then((canvas) => {
                post.screenshot = canvas.toDataURL("image/png");
                results.push(post);
                chrome.runtime.sendMessage({ action: 'classifyImage', imageData: post.screenshot }, (response) => {
                    if (response.isScam) {
                        console.log("SCam");
                        // Modify the article div to alert the user about the scam
                        article.style.border = '2px solid red';
                        const warning = document.createElement('div');
                        warning.style.color = 'red';
                        warning.style.fontWeight = 'bold';
                        warning.textContent = 'Warning: This post is classified as a scam!';
                        article.prepend(warning);
                    }
                   
                });
            });
            await delay(500); // Delay of 500ms after processing each article
        }

        // Log the results after capturing all screenshots
        console.log(results);
    }

    async function onDOMContentLoaded() {
        console.log("DOM Content Loaded");
        await delay(1000); // Delay of 1000ms after DOM content is loaded
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
        const articles = document.querySelectorAll("article");
        await scrap(articles);
    });
}

function handleFacebook() {
    console.log('Handling Facebook specific logic');
    // Add Facebook specific logic here
}

function handleX() {
    console.log('Handling X specific logic');
    // Add X specific logic here
}