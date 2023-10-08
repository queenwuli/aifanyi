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
  let localRemarkData = settings.localRemarkData
  const classnameCfg = {
    ipt: '#main > footer > div._2lSWV._3cjY2.copyable-area > div > span:nth-child(2) > div > div._1VZX7 > div._3Uu1_',
    main: '#main ._3B19s',
    allMsg: '._21Ahp',
    allLeftMsg: '.message-in ._21Ahp',
    allRightMsg: '.message-out ._21Ahp',
    friendList: '#pane-side',
    friendList2: '.g0rxnol2.g0rxnol2.thghmljt.p357zi0d.rjo8vgbg.ggj6brxn.f8m0rgwh.gfz4du6o.ag5g9lrv.bs7a17vp',
    friendListItem: '._2Ts6i._3RGKj ._21S-L .ggj6brxn.gfz4du6o.r7fjleex.g0rxnol2.lhj4utae.le5p0ye3.l7jjieqr._11JPr',
    sendBtn: '.tvf2evcx.oq44ahr5.lb5m6g5c.svlsagor.p2rjqpw5.epia9gcq',
    groupflagEl: '#main .AmmtE .ggj6brxn.gfz4du6o.r7fjleex.lhj4utae.le5p0ye3._11JPr.selectable-text.copyable-text',
    scrollTopEl: '#main div[aria-label="滚动到底部"]',
    chatIdEl: '._199zF._3j691._2IMPQ ._21S-L>span',
    chatNameEl: '#main .AmmtE .ggj6brxn.gfz4du6o.r7fjleex.g0rxnol2.lhj4utae.le5p0ye3.l7jjieqr._11JPr'
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
    let indirectCount = 0;
    const directCountSelector = document.querySelectorAll('._2H6nH span');
    for (const badge of directCountSelector) {
      // badge.querySelector('svg') 是静音的
      if (!badge.querySelector('svg'))
        indirectCount += Ferdium.safeParseInt(badge.textContent);
    }
    Ferdium.setBadge(indirectCount, indirectCount);
  };

  function getActiveDialogTitle() {
    const element = document.querySelector('header .emoji-texttt');

    Ferdium.setDialogTitle(element ? element.textContent : '');
  };

  function loopFunc() {
    getMessages();
    getActiveDialogTitle();
  };

  Ferdium.loop(loopFunc);

  Ferdium.injectCSS(_path.default.join(__dirname, 'service.css'));

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
    document.querySelector(classnameCfg.ipt)?.focus()
  });
  Ferdium.ipcRenderer.on('send-info', (_, data) => {
    let result = data.result;
    let context = data.word;
    let documents = document.querySelector(classnameCfg.ipt)
    if(!documents) {
      return
    }
    if(oneworld.settingCfg.tranflag && oneworld.settingCfg.secondaryConfirmation) {
      toBeSentTxt = result
      showLoading('翻译成功，请确认后再次按下回车发送', 1)
      hideLoadTimer = setTimeout(() => {
        hideLoading()
        clearTimeout(hideLoadTimer)
        hideLoadTimer = null
      }, 3000)
      documents.setAttribute('data-transleted', 1)
      showChineseTrans(result)
    }else{
      let clickTimer = setTimeout(() => {
        document.querySelector(classnameCfg.sendBtn)?.click();
        clearTimeout(clickTimer)
        clickTimer = null
      }, 200);
    }
    if(result && result !== context) {
      localReadData[result] = context
    }
  });

  //获取好友列表
  function getFriendView() {
    return document.querySelector(classnameCfg.friendList)
  };
  function getFriendView2() {
    return document.querySelector(classnameCfg.friendList2);
  };
  function getChatId() {
    let el = document.querySelector(classnameCfg.chatIdEl)
    if(!el) {
      return ''
    }
    return 'whatsappb-'+el.getAttribute('title')
  }

  function handleChangeSettingData(chatId, isNeedReload, autoMoveToBottom) {
    let curChatSetting = localSettingData[chatId] || defaultSetting.settingCfg
    updateSettingData(curChatSetting)
    if(isNeedReload) {
      addFreshEvent()
      if(autoMoveToBottom) {
        moveToBottom()
      }
    }
    Ferdium.ipcRenderer.send('setChatInfo', chatId, 'whatsappb', curChatSetting)
  }

  let timer1;
  let timer2;
  let timer4;
  let timer5;
  let timer6;
  let timer7;
  let timer8;
  function listerFriendList() {
    document.addEventListener(
      'click',
      (e) => {
        if(getFriendView()?.contains(e.target)) {
          let chatId = getChatId()
          handleChangeSettingData(chatId, true, true)
        }
        
        if(getFriendView2()?.contains(e.target)) {
          // 区分归档和备注
          let archiveEl = document.querySelector('._3YS_f._2A1R8')
          // 归档
          if(archiveEl?.contains(e.target)) {
            timer1 && clearTimeout(timer1);
            timer1 = setTimeout(() => {
              let chatId = getChatId()
              if(chatId) {
                handleChangeSettingData(chatId, true, true)
              }else{
                timer6 && clearTimeout(timer6)
                timer6 = setTimeout(() => {
                  chatId = getChatId()
                  handleChangeSettingData(chatId, true, true)
                  clearTimeout(timer6)
                  timer6 = null
                }, 2000)
              }
              clearTimeout(timer1);
              timer1 = null
            }, 0)
          }else{
            timer7 && clearTimeout(timer7)
            timer7 = setTimeout(() => {
              let chatId = document.querySelector(classnameCfg.chatNameEl)?.getAttribute('data-origin')
              handleChangeSettingData(chatId, true)
              clearTimeout(timer7)
              timer7 = null
            }, 600)
          }
        }

        if(e.target?.className?.includes('iWqod _1MZM5 _2BNs3') && e.target?.textContent==='归档对话') {
          timer2 && clearTimeout(timer2);
          timer2 = setTimeout(() => {
            let chatId = getChatId()
            handleChangeSettingData(chatId, true, true)
            clearTimeout(timer2);
            timer2 = null
          }, 500)
        }
        
        let sendBtnEl = document.querySelector(classnameCfg.sendBtn)
        if(sendBtnEl?.contains(e.target)) {
          if(e.isTrusted) {
            initSendEvent(e)
          }
        }

        let forwardEl = document.querySelector('.lhggkp7q.j2mzdvlq.axi1ht8l.mrtez2t4')
        if(forwardEl?.contains(e.target)) {
          timer5 && clearInterval(timer5);
          timer5 = setInterval(() => {
            let view = getMainView();
            if(view) {
              let chatId = getChatId()
              handleChangeSettingData(chatId, true, true)
              clearInterval(timer5)
              timer5 = null
              view = null
            }
          }, 2000)
        }

        let openNewWindowEl = document.querySelector('.ajs-button.ajs-ok')
        if(openNewWindowEl?.contains(e.target)) {
          timer4 && clearInterval(timer4);
          timer4 = setInterval(() => {
            let view = getMainView();
            if(view) {
              let chatId = getChatId()
              handleChangeSettingData(chatId, true, true)
              clearInterval(timer4)
              timer4 = null
              view = null
            }
          }, 500)
        }

        // 查看更多
        if(e.target?.className?.includes('read-more-button')) {
          let allMsgEl = e.target.parentNode
          if(allMsgEl) {
            timer8 && clearTimeout(timer8)
            timer8 = setTimeout(() => {
              const text = getTxt(allMsgEl);
              const isOwn = allMsgEl.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.className?.includes('message-out');
              if (allMsgEl.parentNode?.querySelector('.autofanyi')) {
                autoFanyi(text, allMsgEl, isOwn);
              }else if (allMsgEl.parentNode?.querySelector('.click-fanyi-translated')) {
                reTranslated(text, allMsgEl, isOwn);
              }
              clearTimeout(timer8);
              timer8 = null
            }, 500)
            
          }
        }
      },
      true,
    );
  };

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
    let documents = document.querySelector(classnameCfg.ipt)
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
    changeInputDisabledStatus(false)
    showLoading()
    handleSendMessage(documents, msg);
  }

  function* streamProcess(array) {
    for (let item of array) {
      const {key, value} = item;
      yield [key, value];
    }
  }
  /**初始化翻译接口 */
  Ferdium.initLocalData((res) => {
    const stream = streamProcess(res);
    const obj = Object.fromEntries(stream);
    localReadData = obj;
  }, 23);

  // 初始化翻译设置
  Ferdium.initTransSettingData((res) => {
    localSettingData = res;
  });
  
  Ferdium.initOneWorld(() => {
    console.log('ready to translation');
    listerFriendList()
    addKeyDownAndTran()
  });

  const EMOJISTR = '😁'
  function getIptSendMsg() {
    let value = ''
    let inputEl = document.querySelector(classnameCfg.ipt)
    if(!inputEl) {
      return ''
    }
    // 只有表情，没有文字不翻译
    if(!inputEl.querySelector('span.selectable-text.copyable-text')) {
      return ''
    }
    let els = inputEl.querySelectorAll('p.selectable-text.copyable-text.iq0m558w')
    if(inputEl.querySelector('span.mpj7bzys.xzlurrtv')) {
      for(var i = 0; i < els.length; i++) {
        let childNodes = els[i].childNodes
        for(var j = 0; j < childNodes.length ; j++) {
          if(childNodes[j].querySelector('span.mpj7bzys.xzlurrtv')) {
            value += EMOJISTR
          }else{
            value += childNodes[j].textContent
          }
        }
        if(i != els.length - 1) {
          value += '\n'
        }
      }
    }else{
      for(var i = 0; i < els.length; i++) {
        if(i === els.length - 1) {
          value += els[i].textContent 
        }else{
          value += els[i].textContent + '\n'
        }
      }
    }
    
    value = value ? replaceAllHtml(value) : ''
    return value;
  };

  /**发送消息 */
  async function handleSendMessage(documents, context) {
    let els = documents.querySelectorAll('p.selectable-text.copyable-text.iq0m558w')
    const params = getResData(context, true, true);
    params.isSend = true;
    const res = await Ferdium.getTran(params, oneworld.token);
    if (res.body.code === 200) {
      let result = res.body.data || '';
      result = result.replace(/&#39;/gi, '\'');
      if(els.length === 1 && !document.querySelector('span.mpj7bzys.xzlurrtv')) {
        let spanEl = documents.querySelector('span.selectable-text.copyable-text')
        if(spanEl) {
          spanEl.childNodes[0].textContent = result
        }
      }else{
        let multiLines = result.split('\n')
        for(var i = 0; i < els.length; i++) {
          let childNodes = els[i].querySelectorAll('span.selectable-text.copyable-text')
          let arr = getArr(multiLines[i])
          for(var j = 0; j < childNodes.length ; j++) {
            if(childNodes[j].childNodes[0]) {
              if(arr.length <= childNodes.length){
                childNodes[j].childNodes[0].textContent = arr[j] || ' '
              }else{
                if(j === childNodes.length-1){
                  let arrLefts = arr.slice(-(arr.length - childNodes.length))
                  childNodes[j].childNodes[0].textContent = arr[j] + arrLefts.join('')
                }else{
                  childNodes[j].childNodes[0].textContent = arr[j]
                }
              }
            }
          }
        }
        if(multiLines.length > els.length && els.length) {
          let lefts = multiLines.slice(-(multiLines.length - els.length))
          lefts.unshift('')
          let childNodes = els[els.length-1].querySelectorAll('span.selectable-text.copyable-text')
          if(childNodes.length && childNodes[childNodes.length-1].childNodes.length) {
            childNodes[childNodes.length-1].childNodes[0].textContent += lefts.join('\n')
          }
        }
      }
      
      if(oneworld.settingCfg.secondaryConfirmation) {
        toBeSentTxt = result
        showLoading('翻译成功，请确认后再次按下回车发送', 1)
        hideLoadTimer = setTimeout(() => {
          hideLoading()
          clearTimeout(hideLoadTimer)
          hideLoadTimer = null
        }, 3000)
        documents.setAttribute('data-transleted', 1)
        isTranslating = false
        changeInputDisabledStatus(true)
        showChineseTrans(result)
      }else{
        let clickTimer = setTimeout(() => {
          document.querySelector(classnameCfg.sendBtn)?.click();
          isTranslating = false
          changeInputDisabledStatus(true)
          hideLoading()
          clearTimeout(clickTimer)
          clickTimer = null
        }, 0);
      }
      if(result && result !== context) {
        localReadData[result] = context
      }
    }else{
      isTranslating = false
      changeInputDisabledStatus(true)
      showLoading(res.body.msg, 2)
      hideLoadTimer = setTimeout(() => {
        hideLoading()
        clearTimeout(hideLoadTimer)
        hideLoadTimer = null
      }, 3000)
    }
  };

  function changeInputDisabledStatus(isEnabled) {
    let documents = document.querySelector(classnameCfg.ipt)
    documents.querySelector('.to2l77zo.gfz4du6o.ag5g9lrv.bze30y65.kao4egtt')?.setAttribute('contenteditable', isEnabled)
  }

  function getArr(data) {
    if(!data) {
      return []
    }
    return data.split(EMOJISTR).filter(Boolean);
  }

  function replaceAllHtml(data) {
    data = data.replace(/<\/?[^>]+>/g, ''); // 过滤所有html
    data = data.replace(/&lt;/gi, '<'); // 过滤所有的&lt;
    data = data.replace(/&gt;/gi, '>'); // 过滤所有的&gt;
    data = data.trim()
    return data;
  };
  function showLoading(txt, type){
    clearTimeout(hideLoadTimer)
    hideLoadTimer = null
    let el = document.querySelector('#aitansLoading')
    let defaultColor = document.body?.className?.includes('dark') ? '#fff' : '#000'
    let color = type === 1 ? '#FE750A' : (type === 2 ? '#f90606' : defaultColor);
    let backgroundColor = type === 1 ? '#ffffff' : 'transparent';
    txt = txt || '正在翻译中 请勿重复敲击回车按键';
    if(el) {
      el.style.display = 'block'
      el.textContent = txt
      el.style.color = color
      el.style.background = backgroundColor
    }else{
      el = document.createElement('span');
      el.id = 'aitansLoading'
      el.style.cssText = `font-size:14px;position:absolute;z-index:999;left: 0;right: 0;padding: 10px 0;text-align: center;bottom:0;color:${color};background:${backgroundColor}`;
      el.textContent = txt
      let main = getMainView()
      if(main) main.append(el);
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
      el = document.createElement('div');
      el.id = 'aitansChinese'
      el.style.cssText = `font-size:14px;padding: 5px 10px;border-radius: 4px;background: #fff;color:${oneworld.settingCfg.fontcolor}`;
      el.innerHTML = txt
      let main = document.querySelector('._3E8Fg')
      if(main) main.append(el);
    }
  }
  function hideChineseTrans() {
    let el = document.querySelector('#aitansChinese')
    if(el) el.style.display = 'none'
  }

  function getMainView() {
    return document.querySelector(classnameCfg.main);
  };
  
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
  function moveToBottom() {
    let btnEl = null
    let num = 0
    let timer = setInterval(() => {
      btnEl = document.querySelector(classnameCfg.scrollTopEl)
      if(btnEl) {
        btnEl.click()
      }else{
        clearInterval(timer)
        timer = null
        btnEl = null
      }
      num++
      if(num >= 3) {
        clearInterval(timer)
        timer = null
        btnEl = null
      }
    },200)
  }

  function insterDiv(parent, className, msg){
    parent.insertAdjacentHTML(
      'afterEnd',
      `<div class="${className}" style="margin-right:28px;font-size:${oneworld.settingCfg.fontsize}px;color:${oneworld.settingCfg.fontcolor}">${msg}</div>`,
    );
  };

  // 判断是群聊还是私聊, true 群聊
  function isGroup() {
    let el = document.querySelector(classnameCfg.groupflagEl)
    if(!el) {
      return false
    }
    let title = el.getAttribute('title')
    if(!title) {
      return false
    }
    if(title.indexOf('群组') > -1 || title.indexOf('您') > -1 || title.indexOf('公告') > -1 || title.indexOf('只有管理员可以发送消息') > -1) {
      return true
    }
    return false
  }

  function emojiToImg(str, msgDiv) {
    if(str.indexOf(EMOJISTR) === -1) {
      return str
    }
    if(!msgDiv) {
      return str
    }
    let index = 0;
    const emojis = msgDiv.querySelectorAll('.emoji');
    let regex = new RegExp(EMOJISTR, "g");
    const replacedStr = str.replace(regex, () => {
      if (index < emojis.length) {
        let str = `<img draggable="${emojis[index].getAttribute('draggable')}" src="${emojis[index].getAttribute('src')}"  class="${emojis[index].getAttribute('class')}" style="${emojis[index].getAttribute('style')}" tabindex="${emojis[index].getAttribute('tabindex')}" />`
        index++
        return str;
      } else {
        return '';
      }
    });
    return replacedStr
  }
    
  //自动翻译
  async function autoFanyi(msg, msgDiv, isOwn) {
    let autoFanyi = msgDiv.parentNode.querySelector('.autofanyi');
    if(!autoFanyi) {
      return
    }
    if(!msg || isNumber(msg)){
      autoFanyi.innerHTML = '';
      return
    }
    let localData = localReadData[msg]
    if(localData) {
      localData = localData.replace(/&#39;/gi, '\'');
      localData = localData.replaceAll('\n','<br>');
      autoFanyi.innerHTML = emojiToImg(localData, msgDiv);
      return
    }
    let params = getResData(msg, isOwn);
    let res = await Ferdium.getTran(params, oneworld.token);
    if (res.body.code == 200) {
      let result = res.body.data || '';
      result = result.replace(/&#39;/gi, '\'');
      if(result) {
        localReadData[msg] = result
      }
      result = result.replaceAll('\n','<br>');
      autoFanyi.innerHTML = emojiToImg(result, msgDiv);
    } else if (res.body.code == 500) {
      autoFanyi.innerHTML = res.body.msg;
    } else {
      autoFanyi.innerHTML = '翻译失败';
    }
  };

  /**用户点击其他位置 重新监听页面变化 */
  function addFreshEvent() {
    let view = getMainView();
    if (view) {
      reset()
      freshChatList();
      view.removeEventListener('DOMNodeInserted', freshChatList);
      view.addEventListener('DOMNodeInserted', freshChatList, true);
    }
  };
  function getTxt(div) {
    if(!div) {
      return ''
    }
    let hasEmoji = div.querySelector('.emoji')
    let text = ''
    if(!hasEmoji) {
      let spanEl = div.querySelector('._11JPr.selectable-text.copyable-text')
      text = spanEl ? spanEl.textContent : '';
    }else{
      let spanEls = div.querySelector('span>span')
      let childNodes =  spanEls ? spanEls.childNodes : []
      for(var i = 0; i< childNodes.length ; i++) {
        let child = childNodes[i]
        if(child.nodeName == "#text") {
          text += child.textContent
        }else if(child.nodeName == "IMG"){
          text += EMOJISTR
        }
      }
    }
    return text
  }

  /**刷新聊天栏 插入翻译 */
  function freshChatList() {
    const leftMsgList = document.querySelectorAll(classnameCfg.allLeftMsg);
    const rightMsgList = document.querySelectorAll(classnameCfg.allRightMsg);
    const groupFalg = isGroup();
    for(const msg of leftMsgList) {
      const check = !msg.parentNode.querySelector('.autofanyi') && !msg.parentNode.querySelector('.click-fanyi');
      if(check) {
        const isOwn = false
        const text = getTxt(msg)
        if(oneworld.settingCfg.sendtranslation && (!groupFalg || (groupFalg && oneworld.settingCfg.groupflag))) {
          initMsgEvent(msg, isOwn, text)
        }else{
          insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
          msg.parentNode.querySelector('.click-fanyi').addEventListener('click', e => clickFanyi(e, isOwn));
        }
      }
    }
    for(const msg of rightMsgList) {
      const check = !msg.parentNode.querySelector('.autofanyi') && !msg.parentNode.querySelector('.click-fanyi');
      if(check) {
        const isOwn = true
        const text = getTxt(msg)
        if(oneworld.settingCfg.tranflag && (!groupFalg || (groupFalg && oneworld.settingCfg.groupflag))) {
          initMsgEvent(msg, isOwn, text)
        }else{
          insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
          msg.parentNode.querySelector('.click-fanyi').addEventListener('click', e => clickFanyi(e, isOwn));
        }
      }
    }
    setPlaceholderTxt()
  };
  function initMsgEvent(msg, isOwn, text) {
    if(oneworld.settingCfg.historytranslation) {
      insterDiv(msg, 'autofanyi selectable-text', '翻译中...', isOwn);
      autoFanyi(text, msg, isOwn);
    }else{
      let localData = localReadData[text]
      if(localData) {
        localData = localData.replace(/&#39;/gi, '\'').replaceAll('\n','<br>');
        insterDiv(msg, 'autofanyi selectable-text', emojiToImg(localData, msg), isOwn);
      }else{
        let timeStamp = convertToTimestamp(msg.parentNode.getAttribute('data-pre-plain-text')) 
        if(timeStamp) {
          let timeDifference = timeStamp - historyTime
          if(timeDifference >= -120000) {
            insterDiv(msg, 'autofanyi selectable-text', '翻译中...', isOwn);
            autoFanyi(text, msg, isOwn);
          }else{
            insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
            msg.parentNode.querySelector('.click-fanyi').addEventListener('click', e => clickFanyi(e, isOwn));
          }
        }else{
          insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
          msg.parentNode.querySelector('.click-fanyi').addEventListener('click', e => clickFanyi(e, isOwn));
        }
      }
    }
  }

  function convertToTimestamp(str) {
    if(!str) {
      return 0;
    }
    let dateTimeRegex = /(\d{1,2}):(\d{2}), (\d{4})年(\d{1,2})月(\d{1,2})日/;
    let timeRegex = /(上午|下午|晚上)?(\d{1,2}):(\d{2})/;
    let dateTimeMatch = str.match(dateTimeRegex);
    let timeMatch = str.match(timeRegex);
    let timestamp = 0; 
    let year, month, day, hour=0, minute=0

    try {
      if(dateTimeMatch) {
        year = parseInt(dateTimeMatch[3]);
        month = parseInt(dateTimeMatch[4]) - 1; // 月份从0开始，所以减去1
        day = parseInt(dateTimeMatch[5]);
      }
      if (timeMatch) {
        hour = parseInt(timeMatch[2]);
        if ((timeMatch[1] === "下午" || timeMatch[1] === "晚上") && hour < 12) {
          hour += 12;
        }
        minute = parseInt(timeMatch[3]);
      }
      const date = new Date(year, month, day, hour, minute);
      timestamp = date.getTime();
    } catch (error) {
      console.log(error,'时间转换错误')
    }

    return timestamp;
  }
  
  async function reTranslated(msg, msgDiv, isOwn) {
    let autoFanyi = msgDiv.parentNode.querySelector('.click-fanyi-translated');
    if(!autoFanyi) {
      return
    }
    if(!msg || isNumber(msg)){
      autoFanyi.innerHTML = '';
      return
    }
    let localData = localReadData[msg]
    if(localData) {
      localData = localData.replace(/&#39;/gi, '\'');
      localData = localData.replaceAll('\n','<br>');
      autoFanyi.innerHTML = emojiToImg(localData, msgDiv);
      return
    }
    let params = getResData(msg, isOwn);
    let res = await Ferdium.getTran(params, oneworld.token);
    if (res.body.code == 200) {
      let result = res.body.data || '';
      result = result.replace(/&#39;/gi, '\'');
      if(result) {
        localReadData[msg] = result
      }
      result = result.replaceAll('\n','<br>');
      autoFanyi.innerHTML = emojiToImg(result, msgDiv);
    } else if (res.body.code == 500) {
      autoFanyi.innerHTML = res.body.msg;
    } else {
      autoFanyi.innerHTML = '翻译失败';
    }
  };

  /**请求参数 */
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

  async function clickFanyi(e, isOwn) {
    const div = getEventTarget(e);
    div.innerHTML = '翻译中...'
    let allMsgEl = div.parentNode?.querySelector(classnameCfg.allMsg)
    const msg = getTxt(allMsgEl);
    if(!msg || isNumber(msg)){
      div.innerHTML = msg;
      return
    }
    let localData = localReadData[msg]
    if(localData) {
      localData = localData.replace(/&#39;/gi, '\'');
      localData = localData.replaceAll('\n','<br>');
      div.innerHTML = emojiToImg(localData, allMsgEl);
      div.className = 'click-fanyi click-fanyi-translated';
      return
    }
    const params = getResData(msg, isOwn, false, true);
    params.isClickTrans = true
    const res = await Ferdium.getTran(params, oneworld.token);
    if (res.body.code == 200) {
      let result = res.body.data || '';
      result = result.replace(/&#39;/gi, '\'');
      if(result) {
        localReadData[msg] = result
      }
      result = result.replaceAll('\n','<br>');
      div.innerHTML = emojiToImg(result, allMsgEl);
      div.className = 'click-fanyi click-fanyi-translated';
    } else if (res.body.code == 500) {
      div.innerHTML = res.body.msg;
    } else {
      div.innerHTML = '翻译失败';
    }
    div.removeEventListener('click', clickFanyi);
  };

  // 获取事件目标
  function getEventTarget(e) {
    e = window.event || e;
    return e.srcElement || e.target;
  };

  //检测是否全数字
  function isNumber(str) {
    var patrn = /^(-)?\d+(\.\d+)?$/;
    return !(patrn.exec(str) == null || str === '');
  };
  function setPlaceholderTxt() {
    let el = document.querySelector(classnameCfg.ipt)?.querySelector('.lhggkp7q.qq0sjtgm.jxacihee.c3x5l3r8.b9fczbqn.t35qvd06.m62443ks.rkxvyd19.c5h0bzs2.bze30y65.kao4egtt')
    if(!el) {
      return
    }
    const {type, sto, tranflag, groupflag, secondaryConfirmation} = oneworld.settingCfg
    if (!tranflag || (isGroup() && !groupflag)) {
      el.textContent = '消息不翻译发送'
    }else{
      let transType = settings.packageCfg?.[type] || ''
      let language = settings.tranCfg?.[type]?.[sto] || ''
      let confirmTxt = secondaryConfirmation ? '二次确认' : ''
      el.textContent = '消息通过['+transType+']翻译成['+language+']'+confirmTxt+'发送'
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
    // Ferdium.releaseServiceWorkers();
    timer4 && clearInterval(timer4);
    timer5 && clearInterval(timer5);
  });
};
window.onerror = function(message, source, lineno, colno, error) {
  // 处理错误，避免应用程序崩溃或白屏
  console.error('渲染进程错误:', message, source, lineno, colno, error);
};