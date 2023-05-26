const { setTimeout } = require('timers');

const _path = _interopRequireDefault(require('path'));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

module.exports = (Ferdium, settings) => {
  let oneworld = {
    token: settings.userData.token,
    settingCfg: {
      ...settings.userData.settingCfg,
      sfrom: settings.sfrom,
      sto: settings.sto,
      jfrom: settings.jfrom,
      jto: settings.jto,
    },
  };

  // 文件名
  let classname = {
    friendList: '.tabs-tab.chatlist-parts',
    ipt: '.input-message-input',
    main: '.bubbles',
    allMsg: '.message.spoilers-container',
    allMsgTimeTxt: '.message.spoilers-container .inner.tgico',
    sendBtn: 'button.send',
    groupflagEl: '.chat-info .bottom .info',
  };
  Ferdium.ipcRenderer.on('service-settings-update', (res, data) => {
    updateSettingData(data);
  });
  Ferdium.ipcRenderer.on('send-info', () => {
    clickSendBtn();
  });

  const telegramVersion = document
    .querySelector('meta[property="og:url"]')
    ?.getAttribute('content');

  const isWebK = telegramVersion?.includes('/k/');

  const webZCount = () => {
    let directCount = 0;
    let groupCount = 0;
    const directCountSelector = document.querySelectorAll(
      '.chat-list .ListItem.private .ChatBadge.unread:not(.muted)',
    );
    const groupCountSelector = document.querySelectorAll(
      '.chat-list .ListItem.group .ChatBadge.unread:not(.muted)',
    );
    for (const badge of directCountSelector) {
      directCount += Ferdium.safeParseInt(badge.textContent);
    }
    for (const badge of groupCountSelector) {
      groupCount += Ferdium.safeParseInt(badge.textContent);
    }
    Ferdium.setBadge(directCount+groupCount, directCount+groupCount);
  };

  const webKCount = () => {
    let directCount = 0;
    let groupCount = 0;
    const elements = document.querySelectorAll('.rp:not(.is-muted)');
    for (const element of elements) {
      const subtitleBadge = element.querySelector('.dialog-subtitle-badge');
      if (subtitleBadge) {
        const parsedValue = Ferdium.safeParseInt(subtitleBadge.textContent);
        if (element.dataset.peerId > 0) {
          directCount += parsedValue;
        } else {
          groupCount += parsedValue;
        }
      }
    }
    Ferdium.setBadge(directCount+groupCount, directCount+groupCount);
  };

  const getMessages = () => {
    if (isWebK) {
      webKCount();
    } else {
      webZCount();
    }
  };

  const getActiveDialogTitle = () => {
    let element;
    element = isWebK
      ? document.querySelector('.top .peer-title')
      : document.querySelector('.chat-list .ListItem .title > h3');
    Ferdium.setDialogTitle(element ? element.textContent : '');
  };

  const loopFunc = () => {
    getMessages();
    getActiveDialogTitle();
  };

  Ferdium.loop(loopFunc);

  Ferdium.injectCSS(_path.default.join(__dirname, 'service.css'));

  //获取好友列表
  function getFriendView() {
    return document.querySelectorAll(classname.friendList);
  };
  function getChatId() {
    let el = document.querySelector('.chatlist-chat.chatlist-chat-bigger.active')
    if(!el) {
      return ''
    }
    let val = el.getAttribute('href')
    val = val?.replace('#','')
    return 'telegram-'+val
  }

  function addFreshEvent() {
    let view = getMainView();
    if (view) {
      reset()
      freshChatList();
      view.removeEventListener('DOMNodeInserted', freshChatList);
      view.addEventListener('DOMNodeInserted', freshChatList, true);
    }
  };
  function moveToBottom() {
    let num = 0
    let timer = setInterval(() => {
      let el = document.querySelector('.bubbles>div')
      if(el) {
        el.scrollTop = el.scrollHeight
      }
      num++
      if(num >= 4) {
        clearInterval(timer)
      }
    },200)
  }
  Ferdium.ipcRenderer.on('chat-settings-update', (res, data) => {
    updateSettingData(data);
    if(data.isReload) {
      setTimeout(() => {
        addFreshEvent()
        moveToBottom()
      }, 0)
    }
  });

  Ferdium.ipcRenderer.on('chat-settings-reload', () => {
    let chatId = getChatId()
    Ferdium.ipcRenderer.send('setChatInfo', chatId, 'telegram')
  });

  //好友列表监听
  function listerFriendList() {
    document.addEventListener(
      'click',
      e => {
        let friendViews = getFriendView()
        for(var i = 0; i < friendViews.length; i++) {
          if(friendViews[i]?.contains(e.target)) {
            let chatId = getChatId()
            Ferdium.ipcRenderer.send('setChatInfo', chatId, 'telegram')
          }
        }
      },
      true,
    );
  };
  // 是否正在翻译
  let isTranslating = false
  function addKeyDownAndTran() {
    document.addEventListener(
      'keydown',
      event => {
        if(event.key === 'Enter') {
          let msg = getIptSendMsg();
          if(!msg) return
          if(isNumber(msg)) return
          if (!oneworld.settingCfg.tranflag) return;
          if (isGroup() && !oneworld.settingCfg.groupflag) return;
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          if(isTranslating) return;
          isTranslating = true
          showLoading()
          handleSendMessage(document.querySelector(classname.ipt), msg);
        }
      },
      true,
    );
  };
  /**发送消息 */
  async function handleSendMessage(documents, context) {
    const params = getResData(context, true, true);
    params.isSend = true;
    const res = await Ferdium.getTran(params, oneworld.token);
    if (res.err) {
      isTranslating = false
      hideLoading()
      console.log(res.err, 'md-error');
      return;
    }
    if (res.body.code === 200 && res.body.data) {
      let result = res.body.data;
      result = result.replace(/</gi, '&lt;');
      result = result.replace(/>/gi, '&gt;');
      result = result.replace(/&#39;/gi, '\'');
      documents.textContent = result;
      const evt = document.createEvent('HTMLEvents');
      evt.initEvent('input', true, true);
      documents.dispatchEvent(evt);
      clickSendBtn();
      isTranslating = false
      hideLoading()
    }else{
      isTranslating = false
      hideLoading()
      documents.textContent = res.body.msg;
    }
  };

  function showLoading(){
    let el = document.querySelector('#aitansLoading')
    if(el) {
      el.style.display = 'block'
    }else{
      const spanEl = document.createElement('span');
      spanEl.id = 'aitansLoading'
      spanEl.style.cssText =
        'font-size:14px;position:absolute;left:46%;bottom:100px;';
        spanEl.textContent = '翻译中...';
      let main = getMainView()
      if(main) main.append(spanEl);
    }
  }
  function hideLoading(){
    let el = document.querySelector('#aitansLoading')
    if(el) el.style.display = 'none'
  }

  //初始化
  Ferdium.initLocalData(settings.localReadData);
  Ferdium.initOneWorld(() => {
    listerFriendList()
    addKeyDownAndTran();
    let hash = window.location.hash
    chatId = hash?.replace('#','')
    if(chatId) Ferdium.ipcRenderer.send('setChatInfo', 'telegram-'+chatId, 'telegram')
  });

  //获取主消息列表
  function getMainView() {
    return document.querySelector(classname.main);
  };
  function getTxt(div) {
    let hasEmoji = div.querySelector('.emoji')
    let text = ''
    if(!hasEmoji) {
      text = div.textContent
      const timeStr = div.querySelector(classname.allMsgTimeTxt).textContent;
      text = text.replaceAll(timeStr,'')
    }else{
      let childNodes = div.childNodes
      for(var i = 0; i< childNodes.length ; i++) {
        if(childNodes[i].nodeName == "#text") {
          if(childNodes[i].textContent)
          text += childNodes[i].textContent
        }else if(childNodes[i].nodeName == "IMG"){
          text += childNodes[i].alt
        }
      }
    }
    return text
  }

  // 判断是群聊还是私聊, true 群聊
  function isGroup() {
    let el = document.querySelector(classname.groupflagEl)
    return !el.textContent || el.textContent.indexOf('members') > -1
  }
  function reset() {
    let autofanyis = document.querySelectorAll('.autofanyi')
    for(var i = 0 ; i < autofanyis.length; i++) {
      if(autofanyis[i].parentNode && autofanyis[i].parentNode.querySelector('.autofanyi')) {
        autofanyis[i].parentNode.removeChild(autofanyis[i].parentNode.querySelector('.autofanyi'))
      }
    }
    let clickFanyis = document.querySelectorAll('.click-fanyi')
    for(var i = 0 ; i < clickFanyis.length; i++) {
      if(clickFanyis[i].parentNode && clickFanyis[i].parentNode.querySelector('.click-fanyi')) {
        clickFanyis[i].parentNode.removeChild(clickFanyis[i].parentNode.querySelector('.click-fanyi'))
      }
    }
  }

  const clickFanyi = async (e, isOwn) => {
    const div = getEventTarget(e);
    let msg = getTxt(div.parentElement.querySelector(classname.allMsg))
    const params = getResData(msg, isOwn);
    const res = await Ferdium.getTran(params, oneworld.token);
    if (res.err) {
      console.log(res.err);
      return;
    }
    div.textContent = res.body.data;
    div.removeEventListener('click', clickFanyi);
  };

  const autoFanyi = async (msg, msgDiv, isOwn) => {
    let autoFanyi = msgDiv.parentNode.querySelector('.autofanyi');
    
    if(!autoFanyi) {
      return
    }
    if(!msg || !msg.trim() || isNumber(msg)){
      autoFanyi.innerHTML = '';
      return
    }
    let params = getResData(msg, isOwn);
    let res = await Ferdium.getTran(params, oneworld.token);
    if (!res.err && res.body.code === 200) {
      let result = res.body.data;
      result = result.replace(/&#39;/gi, '\'');
      autoFanyi.innerHTML = result;
    } else if (res.body.code === 500) {
      autoFanyi.innerHTML = res.body.msg;
    } else {
      autoFanyi.innerHTML = '翻译失败';
    }
  };

  function freshChatList() {
    const msgList = document.querySelectorAll(classname.allMsg);
    let groupFalg = isGroup()
    for (const msg of msgList) {
      const check = !msg.parentNode.querySelector('.autofanyi') && !msg.parentNode.querySelector('.click-fanyi');
      if(check) {
        const isOwn =
          msg.parentElement.parentElement.parentElement.className.includes(
            'is-out',
          );
        if ((oneworld.settingCfg.sendtranslation && !isOwn) || (oneworld.settingCfg.tranflag && isOwn)) {
          // 如果是群聊则跟进群聊开关判断
          if((groupFalg && oneworld.settingCfg.groupflag) || !groupFalg) {
            let text = getTxt(msg)
            insterDiv(msg, 'autofanyi', '...', isOwn);
            autoFanyi(text, msg, isOwn);
          }else{
            insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
            msg.parentNode
              .querySelector('.click-fanyi')
              .addEventListener('click', e => clickFanyi(e, isOwn), true);
          }
        }else{
          insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
          msg.parentNode
            .querySelector('.click-fanyi')
            .addEventListener('click', e => clickFanyi(e, isOwn), true);
        }
      }
    }
  };
  
  function getIptSendMsg() {
    let inputEl = document.querySelector(classname.ipt)
    let value = ''
    if(!inputEl) {
      return ''
    }
    if(inputEl.querySelector('.emoji')) {
      let childNodes = inputEl.childNodes
      for(var i = 0; i< childNodes.length ; i++) {
        if(childNodes[i].nodeName == "#text") {
          value += childNodes[i].textContent
        }else if(childNodes[i].nodeName == "IMG"){
          value += childNodes[i].alt
        }
      }
    }else{
      value = inputEl.textContent
    }
    value = value ? replaceAllHtml(value) : ''
    return value;
  };

  // 获取事件目标
  function getEventTarget(e) {
    e = window.event || e;
    return e.srcElement || e.target;
  };

  function clickSendBtn() {
    const sendBtn = document.querySelector(classname.sendBtn);
    sendBtn?.click();
  };

  //检测是否全数字
  // eslint-disable-next-line unicorn/consistent-function-scoping
  function isNumber(str){
    var patrn = /^(-)?\d+(\.\d+)?$/;
    return !(patrn.exec(str) == null || str === '');
  };

  function getResData(msgText, isMe, isSend) {
    let from, to;
    if (!isSend) {
      from = isMe ? oneworld.settingCfg.sto : oneworld.settingCfg.jfrom;
      to = isMe ? oneworld.settingCfg.sfrom : oneworld.settingCfg.jto;
    } else {
      from = oneworld.settingCfg.sfrom;
      to = oneworld.settingCfg.sto;
    }
    msgText = msgText ? msgText.replace(' ',' ') : ''
    return {
      word: msgText,
      from,
      to,
      type: oneworld.settingCfg.type,
    };
  };

  function insterDiv(parent, className, msg, isOwn){
    parent.insertAdjacentHTML(
      'beforebegin',
      `<div class="${className}" style="word-break: break-all;margin-left:10px;margin-right:10px;margin-bottom: 5px;font-size:${oneworld.settingCfg.fontsize}px;color:${oneworld.settingCfg.fontcolor}">${msg}</div>`,
    );
  };

  /**删除所有HTML */
  // eslint-disable-next-line unicorn/consistent-function-scoping
  function replaceAllHtml(data) {
    data = data.replace(/<\/?[^>]+>/g, ''); // 过滤所有html
    data = data.replace(/&lt;/gi, '<'); // 过滤所有的&lt;
    data = data.replace(/&gt;/gi, '>'); // 过滤所有的&gt;
    data = data.trim(); // 过滤所有的空格
    return data;
  };

  function updateSettingData(data) {
    oneworld.settingCfg.tranflag = data.tranflag;
    oneworld.settingCfg.groupflag = data.groupflag;
    oneworld.settingCfg.type = data.type;
    oneworld.settingCfg.fontsize = data.fontsize;
    oneworld.settingCfg.fontcolor = data.fontcolor;
    oneworld.settingCfg.sfrom = data.sfrom;
    oneworld.settingCfg.sto = data.sto;
    oneworld.settingCfg.jfrom = data.jfrom;
    oneworld.settingCfg.jto = data.jto;
    oneworld.settingCfg.sendtranslation = data.sendtranslation;
  };
};