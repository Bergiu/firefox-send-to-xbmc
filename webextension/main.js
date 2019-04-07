/*
Copyright (c) 2017 Dirk-jan Mollema
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

function createMenus(){
  // Create main menu
  // Delete old menu's if they are there
  if(typeof window.setupmenu != 'undefined'){
    browser.menus.remove(window.setupmenu);
    delete window.setupmenu;
  }
  if(typeof window.separatormenu != 'undefined'){
    browser.menus.remove(window.separatormenu);
    delete window.separatormenu;
  }
  let srvget = browser.storage.local.get('servers');
  srvget.then(function(settings){
    let servers = settings['servers'];
    if(typeof servers == 'undefined' || servers.length == 0){
      window.setupmenu = browser.menus.create({
        title: "Add a server for Send to Kodi",
        contexts: ['audio','video','link'],
        onclick: openSettings
      });
    }else{
      if(servers.length > 1){
        // We remove this useless submenu for now
        // browser.menus.create({
        //   id: "stk-playon",
        //   title: "Play on",
        //   icons: {
        //     "16": 'data/img/play.svg'
        //   },
        //   contexts: ['audio','video','link'],
        // });
        window.sdata = addSendToServers(servers);
        // Add "Edit servers"
        window.separatormenu = browser.menus.create({
          contexts: ['audio','video','link'],
          type: "separator"
        });
        window.setupmenu = browser.menus.create({
          title: "Manage servers",
          contexts: ['audio','video','link'],
          onclick: openSettings
        });
      }else{
        var sdata = new Map();
        sdata.set("1000", servers[0]);
        browser.menus.create({
          id: "1000",
          title: "Send to Kodi",
          icons: {
            "16": 'data/img/play.svg'
          },
          onclick: handleSubMenuClick,
          contexts: ['audio','video','link'],
        });
        window.sdata = sdata;
      }
    }
  });
}

function addSendToServers(servers){
  var sdata = new Map();
  var i = 1000;
  servers.forEach(function (server) {
    sdata.set(i.toString(),server);
    browser.menus.create({
      id: (i++).toString(),
      // parentId: "stk-playon",
      title: server.label,
      onclick: handleSubMenuClick,
      contexts: ['audio','video','link'],
    });
  });
  return sdata;
}



function displayMessage(m_title, message, type) {
  browser.notifications.create({
    type: 'basic',
    message: message,
    title: 'Send to Kodi - ' + m_title
  });
}

// Remove the individual server menus
function removeSendToServers(sdata){
  sdata.forEach(function (server, menuid) {
    browser.menus.remove(menuid);
  });
  browser.menus.remove('stk-playon');
}

// Open settings page
function openSettings(){
  browser.runtime.openOptionsPage();
}

function handleSubMenuClick(clickdata){
  // Determine whether the clicked object was a media object, but ignore images
  if(typeof clickdata['mediaType'] == 'undefined' || clickdata['mediaType'] == 'image'){
    // User clicked a link
    ur = new URL(clickdata['linkUrl']);
    parseUrlPlay(ur.href, ur.pathname, window.sdata.get(clickdata['menuItemId']));
  } else {
    // Audio or video element
    ur = new URL(clickdata['srcUrl']);
    parseUrlPlay(ur.href, ur.pathname, window.sdata.get(clickdata['menuItemId']));
  }
}

function findBestFormat(formats, server) {
  var best = null;
  for (var s in formats) {
      var form = formats[s];
      var url = new URL(form.url);
      var ext = url.pathname.split('.').pop();
      if (/^(mp4|mkv|mov|avi|flv|wmv|asf|mka|ogg|webm|oga|ogv|m3u8)$/.test(ext)) {
          if (server.maxheight === "" || form.height <= server.maxheight) {
              if (best === null) {
                  best = form;
              } else if (best.height === undefined || best.height === null) {
                  best = form;
              } else if (best.height < form.height) {
                  best = form;
              }
          }
      }
  }
  // if best is null, get the best video without extensions
  if (best === null) {
      for (var s in formats) {
          var form = formats[s];
          if (server.maxheight === "" || form.height <= server.maxheight) {
              if (best === null) {
                  best = form;
              } else if (best.height === undefined || best.height === null) {
                  best = form;
              } else if (best.height < form.height) {
                  best = form;
              }
          }
      }
  }
  // if best is null, get the last link
  if (best === null) {
      best = formats[formats.length-1];
  }
  return best;
}

//Parse an url to send
function parseUrlPlay(url, pathname, playhost) {
    //Dont extra check the extension
    var oReq = new XMLHttpRequest();
    oReq.onload = function() {
      if (this.responseText!=="null") {
          var res = JSON.parse(this.responseText);
          if (res.formats !== undefined) {
              var format = findBestFormat(res.formats, playhost);
              sendToKodi(format.url, playhost, format);
          }
      }
    };
    oReq.open("GET", "https://youtube-dl-web.aachen.ml/extract?url="+url);
    oReq.send();
    return;
}

//Send request to Kodi
function sendToKodi(fileurl, server, format) {
  // Construct headers
  serverurl = server.host +':'+server.port;
  postheaders = new Headers();
  postheaders.append('Content-Type','application/json');
  rurl = 'http://' + serverurl + '/jsonrpc';
  if (server.username && server.username !== '') {
    adata = btoa(server.username + ':' + server.password);
    postheaders.append('Authorization','Basic '+ adata);
  }

  var senddata = {
    "jsonrpc":"2.0",
    "method":"Player.Open",
    "params": {
      "item":{
        "file":fileurl
      }
    },
    "id": 1
  };
  displayMessage('Sending', 'Sending to Kodi... - Resolution: '+format.height, 'info');
  rdata = {
    method: 'POST',
    body: JSON.stringify(senddata),
    headers: postheaders,
    credentials: 'include'
  };
  fetch(rurl, rdata).then(handleComplete);
}

//Handle return from Kodi
function handleComplete(resp) {
  if (resp.status == 200) {
    resp.json().then(function(jsondata){
      if (jsondata && jsondata.result) {
        if (jsondata.result == 'OK') {
          displayMessage('Success', 'Sent to Kodi', 'ok');
          return;
        }
      }
      if (typeof jsondata.error !== 'undefined') {
        if (typeof jsondata.error.data !== 'undefined' && jsondata.error.data.stack.message) {
          displayMessage('Kodi Error ' + jsondata.error.code, 'Kodi reported: ' + jsondata.error.data.stack.message + '', 'error');
          return;
        }
        if (typeof jsondata.error.message !== 'undefined') {
          displayMessage('Kodi Error ' + jsondata.error.code, 'Kodi reported: ' + jsondata.error.message + '', 'error');
          return;
        }
        displayMessage('Kodi Error ', 'Kodi reported error code ' + jsondata.error.code + '', 'error');
        return;
      }
    });
  } else {
    if (resp.status === 0) {
      displayMessage('Network error', 'Could not contact Kodi. Check your configuration.', 'error');
    } else {
      displayMessage('Status error ' + resp.status, 'Could not contact Kodi. Check your configuration. HTTP Status: ' + resp.status + ' ' + resp.statusText + '', 'error');
    }
  }
}

function setupButton(){
  browser.tabs.onUpdated.addListener(displayButton);
  browser.pageAction.onClicked.addListener(buttonClick);
}

function displayButton(tabId, changeInfo, tabInfo) {
    var oReq = new XMLHttpRequest();
    oReq.onload = function() {
      if (this.responseText!=="null") {
          browser.pageAction.show(tabId);
      }
    };
    oReq.open("GET", "https://youtube-dl-web.aachen.ml/extract?url="+tabInfo.url);
    oReq.send();
}

function buttonClick(tab){
  // If more than one server, show popup
  if(window.sdata && window.sdata.size > 1) {
    browser.pageAction.setPopup({tabId: tab.id, popup: "data/popup.html"});
    browser.pageAction.openPopup();
  } else {
    // Else, get server data
    let srvget = browser.storage.local.get('servers');
    srvget.then(function(settings){
      let servers = settings['servers'];
      // No servers?
      if(typeof servers == 'undefined' || servers.length == 0){
        openSettings();
      }else{
        parseUrlPlay(tab.url, '', servers[0]);
      }
    });
  }
}

// Main
createMenus();
setupButton();
