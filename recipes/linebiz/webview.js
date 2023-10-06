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
      apiUrl: settings.apiUrl,
    },
  };

  const classname = {
    friendList: '.chatlist',
    friendList2: 'table.table',
    ipt: '#editor .editor-textarea',
    main: '#content-secondary .p-3.h-100.overflow-y-auto',
    allMsg: '.chat-item-text',
    sendBtn: '#editable-unit input[type="submit"]',
    groupflagEl: '#content-secondary .sub-header .text-info'
  };
  let defaultSetting = JSON.parse(JSON.stringify(oneworld));
  let localSettingData = {}

  let localReadData = {}
  let historyTime = new Date().getTime();
  // 是否正在翻译
  let isTranslating = false
  let hideLoadTimer = null
  let toBeSentTxt = ''
  
  function getMessages() {
    let tipMsgCount = document.querySelector('#__test__chat_menu_CHAT_ROOM_EMPTY .badge')?.textContent || 0;
    tipMsgCount = Number(tipMsgCount)
    Ferdium.setBadge(tipMsgCount);
  };

  Ferdium.loop(getMessages);
  
  Ferdium.injectJSUnsafe(_path.default.join(__dirname, 'webview-unsafe.js'));

  Ferdium.ipcRenderer.on('service-settings-update', (_, data) => {
    updateSettingData(data);
    oneworld.settingCfg.historytranslation = data.historytranslation;
    oneworld.settingCfg.apiUrl = data.apiUrl;
    
    defaultSetting = JSON.parse(JSON.stringify(oneworld))
  });
  Ferdium.ipcRenderer.on('chat-settings-update', (_, data) => {
    if(data.chatId) {
      localSettingData[data.chatId] = data
    }
    updateSettingData(data);
    oneworld.settingCfg.apiUrl = data.apiUrl;
  });
  Ferdium.ipcRenderer.on('chat-settings-reload', (_, data) => {
    oneworld.settingCfg.apiUrl = data;
    let chatId = getChatId()
    handleChangeSettingData(chatId)
  });

  Ferdium.ipcRenderer.on('input-focus', () => {
    document.querySelector(classname.ipt)?.focus()
  });

  Ferdium.ipcRenderer.on('send-info', () => {
    setTimeout(() => {
      document.querySelector(classname.sendBtn)?.click();
    }, 500);
  });

  Ferdium.initLocalData((res) => {
    let obj = {}
    res.forEach(item => {
      obj[item.key] = item.value
    });
    localReadData = obj;
  }, 7);
  Ferdium.initOneWorld(() => {
    console.log('ready to translation');
    listerFriendList()
    addKeyDownAndTran()
  });

  // 初始化翻译设置
  Ferdium.initTransSettingData((res) => {
    localSettingData = res;
  });

  function addKeyDownAndTran() {
    document.addEventListener(
      'keydown',
      event => {
        if(event.key === 'Enter') {
          if(!event.shiftKey) {
            initSendEvent(event)
          }
        }
      },
      true,
    );
  };

  function initSendEvent(event) {
    let documents = document.querySelector(classname.ipt)
    let msg = getIptSendMsg();
    if(!msg) return
    if(isNumber(msg)) return
    if (!oneworld.settingCfg.tranflag) return;
    if (isGroup() && !oneworld.settingCfg.groupflag) return;
    if (msg == toBeSentTxt && documents?.getAttribute('data-transleted')) {
      documents.removeAttribute('data-transleted')
      hideChineseTrans()
      return
    }
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if(isTranslating) return;
    isTranslating = true
    showLoading()
    handleSendMessage(documents, msg);
  }

  
  /**发送消息 */
  async function handleSendMessage(documents, context) {
    const params = getResData(context, true, true);
    params.isSend = true;
    const res = await Ferdium.getTran(params, oneworld.token);
    if (res.body.code === 200) {
      let result = res.body.data || '';
      result = result.replace(/&#39;/gi, '\'');
      documents.value = result;

      const evt = document.createEvent('HTMLEvents');
      evt.initEvent('input', true, true);
      documents.dispatchEvent(evt);

      if(oneworld.settingCfg.secondaryConfirmation) {
        toBeSentTxt = result
        showLoading('翻译成功，请确认后再次按下回车发送', 1)
        hideLoadTimer = setTimeout(() => {
          hideLoading()
          clearTimeout(hideLoadTimer)
          hideLoadTimer = null
        }, 3000)
        documents.setAttribute('data-transleted', 1)
        showChineseTrans(result)
        isTranslating = false
      }else{
        let clickTimer = setTimeout(() => {
          document.querySelector(classname.sendBtn)?.click();
          hideLoading()
          isTranslating = false
          clearTimeout(clickTimer)
          clickTimer = null
        }, 200)
      }
      if(result && result !== context) {
        localReadData[result] = context
      }
    }else{
      isTranslating = false
      showLoading(res.body.msg, 2)
      hideLoadTimer = setTimeout(() => {
        hideLoading()
        clearTimeout(hideLoadTimer)
        hideLoadTimer = null
      }, 3000)
    }
  };

  // eslint-disable-next-line unicorn/consistent-function-scoping
  function replaceAllHtml(data) {
    data = data.replace(/<\/?[^>]+>/g, ''); // 过滤所有html
    data = data.replace(/&lt;/gi, '<'); // 过滤所有的&lt;
    data = data.replace(/&gt;/gi, '>'); // 过滤所有的&gt;
    data = data.trim(); // 过滤所有的空格
    return data;
  };

  function getIptSendMsg() {
    let inputEl = document.querySelector(classname.ipt)
    if(!inputEl) {
      return ''
    }
    let value = inputEl.value
    value = value ? replaceAllHtml(value) : ''
    return value;
  };

   // type: 0默认 1成功 2 失败 
   function showLoading(txt, type){
        clearTimeout(hideLoadTimer)
        hideLoadTimer = null
        let el = document.querySelector('#aitansLoading')
        let color = type === 1 ? '#FE750A' : (type === 2 ? '#f90606' : '#000');
        let backgroundColor = type === 1 ? '#ffffff' : 'transparent';
        txt = txt || '正在翻译中 请勿重复敲击回车按键';
        if(el) {
          el.style.display = 'block'
          el.textContent = txt
          el.style.color = color
          el.style.background = backgroundColor
        }else{
          let box = document.querySelector('#editable-unit')
          if(box) {
            box.insertAdjacentHTML(
                'beforebegin',
                `<div id="aitansLoading" style="text-align: center;font-size:14px;color:${color};background:${backgroundColor};">${txt}</div>`
            );
          };
        }
    }
    function hideLoading(){
        let el = document.querySelector('#aitansLoading')
        if(el) el.style.display = 'none'
    }

  // AI翻译显示中文翻译
  async function showChineseTrans(msg) {
    let txt = ''
    if(msg) {
      let params = getResData(msg, true);
      let res = await Ferdium.transToChinese(params, oneworld.token);
      if (res.body.code === 200) {
        let result = res.body.data || '';
        result = result.replace(/&#39;/gi, '\'');
        result = result.replaceAll('\n','<br>');
        txt = result;
      } else {
        txt = res.body.msg;
      }
    }
    txt = '中文：'+txt
    let el = document.querySelector('#aitansChinese')
    if(el) {
      el.style.display = 'block'
      el.innerHTML = txt
      el.style.color = oneworld.settingCfg.fontcolor
    }else{
      let box = document.querySelector('#editable-unit')
      if(box) {
        box.insertAdjacentHTML(
            'afterend',
            `<div id="aitansChinese" style="word-break: break-all;font-size:14px;padding: 5px 10px;background: #fff;color:${oneworld.settingCfg.fontcolor};">${txt}</div>`
        );
      };
    }
  }
  function hideChineseTrans() {
    let el = document.querySelector('#aitansChinese')
    if(el) el.style.display = 'none'
  }

  // 判断是群聊还是私聊, true 群聊
  function isGroup() {
    let el = document.querySelector(classname.groupflagEl)
    if(!el) {
      return false
    }
    var previousElement = el.previousElementSibling;
    return previousElement?.className?.includes('cursor-pointer') && !!previousElement?.textContent
  }

  function getChatId() {
    let el = document.querySelector('#content-secondary .sub-header .text-truncate')
    if(!el) {
      return ''
    }
    let val = el.textContent
    return 'linebiz-'+val
  }

  function handleChangeSettingData(chatId, isNeedReload) {
    let curChatSetting = localSettingData[chatId] || defaultSetting.settingCfg
    updateSettingData(curChatSetting)
    if(isNeedReload) {
      addFreshEvent()
    }
    Ferdium.ipcRenderer.send('setChatInfo', chatId, 'linebiz', curChatSetting)
  }

  let timer1;
  let timer2;
  let timer1Count = 0;
  let timer2Count = 0;
  let maxCount = 5;
  function listerFriendList(){
    document.addEventListener(
      'click',
      (e) => {
        if(getFriendView()?.contains(e.target)) {
          timer1Count = 0
          timer1 && clearInterval(timer1)
          timer1 = setInterval(() => {
            let view = getMainView();
            if(view || timer1Count >= maxCount){
              let chatId = getChatId()
              handleChangeSettingData(chatId, true)
              clearInterval(timer1)
              timer1 = null
              view = null
            }
            timer1Count++
          },200)
        }
        if(getFriendView2()?.contains(e.target)) {
          timer2Count = 0
          timer2 && clearInterval(timer2)
          timer2 = setInterval(() => {
            let view = getMainView();
            if(view || timer2Count >= maxCount){
              let chatId = getChatId()
              handleChangeSettingData(chatId, true)
              clearInterval(timer2)
              timer2 = null
              view = null
            }
            timer2Count++
          },200)
        }

        const { tagName, target, href } = e.target;
        if (tagName === 'A' && target === '_blank') {
          e.preventDefault();
          e.stopImmediatePropagation();
          window.open(href);
        }

        let sendBtnEl = document.querySelector(classname.sendBtn)
        if(sendBtnEl?.contains(e.target)){
          if(e.isTrusted) {
            initSendEvent(e)
          }
        }
      },
      true,
    );
  };

  function getMainView() {
    return document.querySelector(classname.main);
  };
  function addFreshEvent() {
    let view = getMainView();
    if (view) {
      freshChatList();
      view.removeEventListener('DOMNodeInserted', freshChatList);
      view.addEventListener('DOMNodeInserted', freshChatList, true);
    }
  };

  function freshChatList() {
    let dateGroups = document.querySelectorAll('#content-secondary .p-3.h-100.overflow-y-auto .position-relative')
    const groupFalg = isGroup();
    dateGroups.forEach((item, index) => {
      let msgList = item.querySelectorAll(classname.allMsg);
      if(index === dateGroups.length-1) {
        let time = item.querySelector('.chatsys-date .chatsys-content')?.textContent?.trim()
        if(time === 'Today' || time === '今天' || time === '今日' || time === '오늘' || time === 'วันนี้' || time === 'Hari ini') {
          for (const msg of msgList) {
            const check = !msg.parentNode.querySelector('.autofanyi') && !msg.parentNode.querySelector('.click-fanyi');
            if(check) {
              const isOwn = msg.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.className.includes('chat-reverse');
              let text = msg.textContent?.trim()
              if(((oneworld.settingCfg.sendtranslation && !isOwn) || (oneworld.settingCfg.tranflag && isOwn)) && (!groupFalg || (groupFalg && oneworld.settingCfg.groupflag))) {
                if(oneworld.settingCfg.historytranslation) {
                    insterDiv(msg, 'autofanyi', '翻译中...', isOwn);
                    autoFanyi(text, msg, isOwn);
                }else{
                  let localData = localReadData[text]
                  if(localData) {
                    localData = localData.replace(/&#39;/gi, '\'').replaceAll('\n','<br>');
                    insterDiv(msg, 'autofanyi', localData, isOwn);
                  }else{
                    insterDiv(msg, 'autofanyi', '翻译中...', isOwn);
                    autoFanyi(text, msg, isOwn);
                  }
                }
              }else{
                insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
                msg.parentNode.querySelector('.click-fanyi').addEventListener('click', e => clickFanyi(e, isOwn, text));
              }
            }
          }
        }else{
          initHistoryMsg(msgList, groupFalg)
        }
      }else{
        initHistoryMsg(msgList, groupFalg)
      }
    })
  };

  function initHistoryMsg(msgList, groupFalg) {
    for (const msg of msgList) {
      const check = !msg.parentNode.querySelector('.autofanyi') && !msg.parentNode.querySelector('.click-fanyi');
      if(check) {
        const isOwn = msg.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.className.includes('chat-reverse');
        let text = msg.textContent?.trim()
        if(((oneworld.settingCfg.sendtranslation && !isOwn) || (oneworld.settingCfg.tranflag && isOwn)) && (!groupFalg || (groupFalg && oneworld.settingCfg.groupflag))) {
          if(oneworld.settingCfg.historytranslation) {
              insterDiv(msg, 'autofanyi', '翻译中...', isOwn);
              autoFanyi(text, msg, isOwn);
          }else{
            let localData = localReadData[text]
            if(localData) {
              localData = localData.replace(/&#39;/gi, '\'').replaceAll('\n','<br>');
              insterDiv(msg, 'autofanyi', localData, isOwn);
            }else{
              insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
              msg.parentNode.querySelector('.click-fanyi').addEventListener('click', e => clickFanyi(e, isOwn, text));
            }
          }
        }else{
          insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
          msg.parentNode.querySelector('.click-fanyi').addEventListener('click', e => clickFanyi(e, isOwn, text));
        }
      }
    }
  }

  function convertToTimestamp(div) {
    let el = div.parentNode?.parentNode?.parentNode?.querySelector('.chat-sub')
    if(!el) {
      return 0;
    }
    let str = el.textContent?.trim()
    if(!str) {
      var chatSubElements = div.parentNode?.parentNode?.parentNode?.parentNode?.querySelectorAll('.chat-sub');
      var lastChatSubElement = chatSubElements.length ?chatSubElements[chatSubElements.length - 1] : null;
      str = lastChatSubElement?.textContent?.trim()
    }
    if(!/\d/.test(str)) {
      return 0;
    }
    let timestamp = 0
    try {
      const timeParts = str.split('\n');
      let timeStr = ''
      if(timeParts.length === 1) {
        timeStr = timeParts[0]
      }else{
        timeStr = timeParts[timeParts.length-1]
      }
      
      const [hour, minute] = timeStr.split(':');
      const currentDate = new Date();
      currentDate.setHours(hour);
      currentDate.setMinutes(minute);
      timestamp = currentDate.getTime();
    } catch (error) {
      console.log(error,'时间转换错误')
    }
    return timestamp
  }

  async function autoFanyi(msg, msgDiv, isOwn) {
    let autoFanyi = msgDiv.parentNode.querySelector('.autofanyi');
    if(!autoFanyi) {
      return
    }
    if(!msg || isNumber(msg)){
      autoFanyi.innerHTML = msg;
      return
    }
    let localData = localReadData[msg]
    if(localData) {
      localData = localData.replace(/&#39;/gi, '\'');
      localData = localData.replaceAll('\n','<br>');
      autoFanyi.innerHTML = localData;
      return
    }
    let params = getResData(msg, isOwn);
    let res = await Ferdium.getTran(params, oneworld.token);
    if (res.body.code === 200) {
      let result = res.body.data || '';
      result = result.replace(/&#39;/gi, '\'');
      if(result) {
        localReadData[msg] = result
      }
      result = result.replaceAll('\n','<br>');
      autoFanyi.innerHTML = result;
    } else {
      autoFanyi.innerHTML = res.body.msg;
    }
  };

  async function clickFanyi(e, isOwn, msg) {
    let div = getEventTarget(e);
    div.innerHTML = '翻译中...';
    if(isNumber(msg)){
      div.innerHTML = msg;
      return
    }
    let localData = localReadData[msg]
    if(localData) {
      localData = localData.replace(/&#39;/gi, '\'');
      localData = localData.replaceAll('\n','<br>');
      div.innerHTML = localData;
      return
    }
    let params = getResData(msg, isOwn, false, true);
    params.isClickTrans = true
    let res = await Ferdium.getTran(params, oneworld.token);
    if (res.body.code === 200) {
      let result = res.body.data || '';
      result = result.replace(/&#39;/gi, '\'');
      if(result) {
        localReadData[msg] = result
      }
      result = result.replaceAll('\n','<br>');
      div.innerHTML = result;
    } else {
      div.innerHTML = res.body.msg;
    }
    div.removeEventListener('click', clickFanyi);
  };

  function getFriendView() {
    return document.querySelector(classname.friendList);
  };
  function getFriendView2() {
    return document.querySelector(classname.friendList2);
  };
  function insterDiv(parent, className, msg) {
        parent.insertAdjacentHTML(
        'afterEnd',
        `<div class="${className}" style="text-align: left;padding: 0 0.75rem 0.5rem;user-select: text !important;font-size:${oneworld.settingCfg.fontsize}px;color:${oneworld.settingCfg.fontcolor};">${msg}</div>`,
        );
  };

  function getEventTarget(e) {
    e = window.event || e;
    return e.srcElement || e.target;
  };

  //检测是否全数字
  function isNumber(str) {
    var patrn = /^(-)?\d+(\.\d+)?$/;
    return patrn.exec(str) == null || str == '' ? false : true;
  };

  function getResData(msgText, isMe, isSend, isClickTrans) {
    let from, to;
    if(isSend) {
      from = oneworld.settingCfg.sfrom;
      to = oneworld.settingCfg.sto;
    } else if(isClickTrans) {
      from = isMe ? oneworld.settingCfg.sto : oneworld.settingCfg.jfrom;
      to = isMe ? oneworld.settingCfg.sfrom : oneworld.settingCfg.jto;
    } else {
      from = isMe ? oneworld.settingCfg.sto : oneworld.settingCfg.jfrom;
      to = isMe ? oneworld.settingCfg.sfrom : oneworld.settingCfg.jto;
    }
    return {
      word: msgText,
      from,
      to,
      type: oneworld.settingCfg.type,
      tone: oneworld.settingCfg.tone,
      scene: oneworld.settingCfg.scene,
      apiUrl: oneworld.settingCfg.apiUrl,
    };
  };

  function setPlaceholderTxt() {
    let el = document.querySelector(classname.ipt)
    if(!el) {
      return
    }
    const {type, sto, tranflag, groupflag, secondaryConfirmation} = oneworld.settingCfg
    if (!tranflag || (isGroup() && !groupflag)) {
      el.setAttribute('placeholder', '消息不翻译发送')
    }else{
      let transType = settings.packageCfg?.[type] || ''
      let language = settings.tranCfg?.[type]?.[sto] || ''
      let confirmTxt = secondaryConfirmation ? '二次确认' : ''
      el.setAttribute('placeholder', '消息通过['+transType+']翻译成['+language+']'+confirmTxt+'发送')
    }
  }

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
    oneworld.settingCfg.tone = data.tone;
    oneworld.settingCfg.scene = data.scene;
    oneworld.settingCfg.secondaryConfirmation = data.secondaryConfirmation;
    setPlaceholderTxt()
  };

  window.addEventListener('beforeunload', async () => {
    timer1 && clearInterval(timer1)
    timer1 = null
    timer2 && clearInterval(timer2)
    timer2 = null
  });
};