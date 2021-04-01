
const extId = "confirmNavi";	
const temporary = browser.runtime.id.endsWith('@temporary-addon'); // debugging?

function log(level, msg) {
	level = level.trim().toLowerCase();
	if (['error','warn'].includes(level)
		|| ( temporary && ['debug','info','log'].includes(level))
	) {
		console[level](extId + '::' + level.toUpperCase() + '::' + msg);
	}
};


const confirmTabs = new Set();
let exception = undefined; 


let dataStore;

async function onBeforeRequest(details) {
	//if(details.frameId === 0){
	if(confirmTabs.has(details.tabId) ){
		log('debug', details.url);
		if( typeof exception === 'undefined') {
			browser.pageAction.setTitle({tabId: details.tabId, title: details.url});
			browser.pageAction.show(details.tabId);
			dataStore = {url: details.url, tabId: details.tabId};
			browser.notifications.create(extId, {
				"type": "basic",
				"iconUrl": browser.runtime.getURL("icon.png"),
				"title": 'Stopped Navigation', 
				"message":  'to ' + details.url + "\nTo continue with the navigation, click on the pageAction icon."
			});
			return {cancel: true};
		}else{
			log('debug', "no exception for tab:" + details.tabId + " url:" + details.url);
			exception = undefined;
		}
	}
	//}

}

browser.webRequest.onBeforeRequest.addListener(
  onBeforeRequest,
  {urls: ['<all_urls>'], types: ['main_frame'] },
  ["blocking"]
);

function onRemoved(tabId, removeInfo) {
	confirmTabs.delete(tabid);
	exception = undefined;
}

browser.tabs.onRemoved.addListener(onRemoved);

browser.browserAction.onClicked.addListener((tab) => {
	if(confirmTabs.has(tab.id)) {
		confirmTabs.delete(tab.id);
		log('debug', 'removed ' + tab.id + ' from confirmTabs');
	}else{
		confirmTabs.add(tab.id);
		log('debug', 'added ' + tab.id + ' to confirmTabs');
	}
});

browser.pageAction.onClicked.addListener(async (tab) => {
  browser.pageAction.hide(tab.id); // verstecken
  log('debug', 'add exception for tabId ' + dataStore.tabId);
  exception = {tabId: dataStore.tabId, url: dataStore.url};
  
 await  browser.tabs.update({url: dataStore.url});
});

