// content.js
const hostname = window.location.hostname;

if (hostname.includes('instagram.com')) {
    handleInstagram();
} else if (hostname.includes('facebook.com')) {
    handleFacebook();
} else if (hostname.includes('x.com')) {
    handleX();
}

function handleInstagram() {
    console.log('Handling Instagram-specific');
    results = new Set();

    function processArticles(articles) {
        articles.forEach((article, index) => {
            
            if (results.has(article)) return; // Skip already processed articles
            console.log("Processing article:", article);
            try {
                // XPath to locate the image inside the article
                const xpath = "./div[2]/div[2]/div[1]/div/div/div[1]/div/div/div/div/div/div/div/div/div/div[1]/img";
                const imgElement = document.evaluate(
                    xpath,
                    article,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;
                console.log("Processing image:", imgElement);
                if (imgElement) {
                    // Extract the thumbnail URL
                    const thumbnailUrl = imgElement.getAttribute("src");
                    console.log(`Thumbnail URL for post:`, thumbnailUrl);

                    // Add the thumbnail to the results
                    results.add({
                        postIndex: index + 1, // Add post index (optional)
                        thumbnailUrl: thumbnailUrl,
                    });
                }
            } catch (err) {
                console.error(`Error processing article ${index + 1}:`, err);
            }
        });
    }
document.addEventListener("scroll",()=>{
    const initialArticles = document.querySelectorAll("article");
        processArticles(initialArticles);

})
    document.addEventListener("DOMContentLoaded", () => {
        // Set to store processed results
        
    
        // Function to process article elements
       
    
        // MutationObserver to detect new posts
        //const observer = new MutationObserver((mutations) => {
        //     mutations.forEach((mutation) => {
        //         if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        //             const newArticles = Array.from(mutation.addedNodes).filter((node) => 
        //                 node.tagName === "ARTICLE" // Filter new articles
        //             );
        //             processArticles(newArticles); // Process newly added posts
        //         }
        //     });
        // });
    
        // // Observe the main feed container for changes
        // const targetNode = document.querySelector("main"); // Adjust based on Instagram's structure
        // if (targetNode) {
        //     observer.observe(targetNode, {
        //         childList: true, // Watch for added/removed child nodes
        //         subtree: true,   // Watch all descendants
        //     });
        //     console.log("MutationObserver is observing the main feed...");
        // } else {
        //     console.error("Target container for posts not found.");
        // }
    
        // Process any initial articles already loaded
        const initialArticles = document.querySelectorAll("article");
        processArticles(initialArticles);
    
        // Example: Send results to the background script
        console.log("Extracted Results:", Array.from(results));
       // chrome.runtime.sendMessage({ type: "POST_THUMBNAILS", data: Array.from(results) });
    });
    
    // Add Instagram specific logic here
}

function handleFacebook() {
    console.log('Handling Facebook specific logic');
    // Add Facebook specific logic here
}

function handleX() {
    console.log('Handling X specific logic');
    // Add X specific logic here
}