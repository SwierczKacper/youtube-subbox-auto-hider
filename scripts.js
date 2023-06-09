const HIGHLIGHT_BORDER_STYLE = "3px dotted yellow";

let ignoredVideos = [];
let shouldPerformMagic = true;
let coreSettings = {};

const changeStyleAndMove = (miniature, opacity = 0.1) => {
    miniature.style.opacity = opacity;
    miniature.parentNode.appendChild(miniature);
};

const checkIfArrayContains = (array, value) =>
    array.some(entry => value.toLowerCase().trim().includes(entry.toLowerCase().trim()));

const highlightMiniature = (miniature) => {
    const thumbnail = miniature.querySelector('ytd-thumbnail');
    if(thumbnail.style.border === "") {
        thumbnail.style.border = HIGHLIGHT_BORDER_STYLE;
        thumbnail.style.boxSizing = "border-box";
        miniature.parentNode.insertBefore(miniature, miniature.parentNode.firstChild);
    }
};

const doMagic = (settings) => {
    if(window.location.href.includes("https://www.youtube.com/feed/subscriptions")) {
        console.log('Detected new URL', window.location.href);
        console.log('\n\n\nSub box detected!');
        console.log('Starting checking...');
        document.querySelectorAll('ytd-rich-item-renderer').forEach((miniature) => {
            const ytberName = decodeURI(miniature.querySelector('.ytd-channel-name a').href)
                .replace('https://www.youtube.com/@', '')
                .replace(/https:\/\/www.youtube.com\/(channel|c|user)\//g, '')
                .replace('/c/', '')
                .replace('/user/', '');
            console.log('ytberName', ytberName);
            const videoTitle = miniature.querySelector('#video-title').innerText;

            // Check if it's a short
            if(miniature.querySelector('[overlay-style="SHORTS"]')) {
                console.log('Short detected');
                if(!settings['remove_shorts']) {
                    changeStyleAndMove(miniature);
                } else {
                    miniature.style.display = 'none';
                    return;
                }
            }

            // Check by title
            if(checkIfArrayContains(settings['hide_by_title'], videoTitle)) {
                changeStyleAndMove(miniature);
            }

            // Check if it's a stream or scheduled
            if(miniature.querySelector('[overlay-style="UPCOMING"]')) {
                console.log('Scheduled stream detected');
                if(checkIfArrayContains(settings['hide_stream_if_youtuber'], ytberName)) {
                    changeStyleAndMove(miniature);
                }
                if(checkIfArrayContains(settings['remove_stream_if_youtuber'], ytberName)) {
                    miniature.style.display = 'none';
                    return;
                }
            }

            // TODO: implement verification if live stream
            // TODO: implement verification if premiere

            // Check for specific youtuber
            if(settings['hide_by_title_if_youtuber'].hasOwnProperty(ytberName)) {
                // Check by title
                if(checkIfArrayContains(settings['hide_by_title_if_youtuber'][ytberName], videoTitle)) {
                    if(miniature.parentNode != null) {
                        changeStyleAndMove(miniature);
                    }
                }
            }

            // Check for specific youtuber
            if(settings['remove_by_title_if_youtuber'].hasOwnProperty(ytberName)) {
                // Check by title
                if(checkIfArrayContains(settings['remove_by_title_if_youtuber'][ytberName], videoTitle)) {
                    miniature.style.display = 'none';
                    return;
                }
            }

            // Check if ignored
            if(checkIfArrayContains(ignoredVideos, miniature.querySelector('#thumbnail').href.split('&')[0].replace('https://www.youtube.com/watch?v=', ''))) {
                miniature.style.display = 'none';
                return;
            }

            // Check for automatic watchlist by title
            if(checkIfArrayContains(settings['auto_watchlist_by_title'], videoTitle)) {
                highlightMiniature(miniature);
            }

            // Check for specific youtuber
            if(settings['auto_watchlist_by_title_if_youtuber'].hasOwnProperty(ytberName)) {
                // Check by title
                if(checkIfArrayContains(settings['auto_watchlist_by_title_if_youtuber'][ytberName], videoTitle)) {
                    highlightMiniature(miniature);
                }
            }
        });

        console.log('End of checking!');
        shouldPerformMagic = true;
    }
};

const doMagicLoop = () => {
    setTimeout(() => {
        if(shouldPerformMagic) {
            console.log('Looking for miniatures...');
            if(document.querySelector('#contents > ytd-rich-section-renderer') != null) { // Check if there's a top bar with the title Latest
                if(document.querySelectorAll('ytd-rich-grid-row').length >= 1) { // Check if there's at least 1 row with videos
                    console.log('Found!');
                    shouldPerformMagic = false;
                    const xhr = new XMLHttpRequest;
                    xhr.open("GET", chrome.runtime.getURL("settings.json"));
                    xhr.onreadystatechange = function() {
                        if (this.readyState == 4) {
                            coreSettings = JSON.parse(xhr.responseText);
                            console.log('settings', coreSettings);
                            doMagic(coreSettings);
                        }
                    };
                    xhr.send();
                }
            }
            doMagicLoop();
        }
    }, 2000);
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('new link', window.location.href);

    if(window.location.href.includes("https://www.youtube.com/feed/subscriptions")) {
        chrome.storage.local.get('ysah_ignored_videos', function(result) {
            if(result.ysah_ignored_videos == undefined) {
                chrome.storage.local.set({'ysah_ignored_videos': []});
            } else {
                ignoredVideos = result.ysah_ignored_videos;
            }
            console.log('ignoredVideos', ignoredVideos);
            setTimeout(doMagicLoop, 2000);
        });
    }

    setTimeout(() => {
        sendResponse({status: true});
    }, 1);

    return true;
});
