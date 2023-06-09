// Listen for when a Tab changes state
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo && changeInfo.status === "complete") {
        chrome.tabs.sendMessage(tabId, {data: tab}, (response) => {
            console.log(response);
        });
    }
});

const ignoreVideo = (info) => {
    console.log(info);

    if (info.pageUrl.includes("https://www.youtube.com/feed/subscriptions")) {
        let videoId = extractVideoId(info.linkUrl);

        chrome.storage.local.get('ysah_ignored_videos', (result) => {
            let ignoredVideos = result.ysah_ignored_videos;
            ignoredVideos.push(videoId);

            const maxCount = 1000;
            if (ignoredVideos.length > maxCount)
                ignoredVideos = ignoredVideos.slice(ignoredVideos.length - maxCount);

            chrome.storage.local.set({'ysah_ignored_videos': ignoredVideos});

            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, {remove_miniature: info.linkUrl.split('&')[0].replace('https://www.youtube.com','')}, (response) => {});
            });
        });
    }
}

const extractVideoId = (url) => {
    return url.split('&')[0].replace('https://www.youtube.com/watch?v=', '');
}

chrome.contextMenus.create({
    id: 'ignore-video',
    title: 'SubBox: Ignore Video',
    contexts: ['link']
});

const contextClick = (info, tab) => {
    ignoreVideo(info);
}

console.log('test123213211');
chrome.contextMenus.onClicked.addListener(contextClick);
