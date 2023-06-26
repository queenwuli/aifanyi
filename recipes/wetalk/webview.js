const { setTimeout } = require('timers');

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
  const classnameCfg = {
    box1: '.scaffold-layout__detail.msg__detail',
    box2: '.msg-overlay-conversation-bubble__content-wrapper',
    main: '.scaffold-layout__detail.msg__detail .msg-s-message-list',
    main2: '.msg-overlay-conversation-bubble__content-wrapper .msg-s-message-list',
    ipt: '.msg-form__contenteditable',
    allMsg: '.msg-s-event-listitem__body',
    friendList: '.scaffold-layout__list.msg__list',
    friendList2: '.msg-overlay-list-bubble',
    sendBtn: '.msg-form__send-button',
  };
  function getMessages() {
    let count = 0;
    const element = document.querySelector(
      '.global-nav__primary-item:nth-child(4) .notification-badge__count',
    );
    if (element) {
      count = Ferdium.safeParseInt(element.textContent);
    }
    Ferdium.setBadge(count);
  };
  Ferdium.loop(getMessages);

  Ferdium.ipcRenderer.on('service-settings-update', (res, data) => {
    updateSettingData(data);
  });
  Ferdium.ipcRenderer.on('send-info', () => {
    setTimeout(() => {
      document.querySelector(classnameCfg.sendBtn)?.click();
    }, 500);
  });

  Ferdium.initLocalData(settings.localReadData);
  Ferdium.initOneWorld(() => {
    console.log('ready to translation');
    let timer2 = setInterval(() => {
      let view = getMainView2();
      if (view) {
        addFreshEvent()
        clearInterval(timer2)
        timer2 = null
      }
    }, 200)
    
    listerFriendList()
    addKeyDownAndTran()
  });

  // 是否正在翻译
  let isTranslating = false
  let hideLoadTimer = null
  let toBeSentTxt = ''
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
    let documents = null
    let box1 = document.querySelector(classnameCfg.box1)
    let box2 = document.querySelector(classnameCfg.box2)
    if(box1 && box1.contains(event.target)) {
      documents = box1.querySelector(classnameCfg.ipt)
    }
    if(box2 && box2.contains(event.target)) {
      documents = box2.querySelector(classnameCfg.ipt)
    }
    if(!documents) {
      return
    }
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    let msg = getIptSendMsg(documents);
    if(!msg) return
    if(isNumber(msg)) {
      sendBtnClick(documents)
      return
    }
    if (!oneworld.settingCfg.tranflag) {
      sendBtnClick(documents)
      return
    };
    if (isGroup() && !oneworld.settingCfg.groupflag) {
      sendBtnClick(documents)
      return
    };
    if (msg == toBeSentTxt && documents?.getAttribute('data-transleted')) {
      documents.removeAttribute('data-transleted')
      hideChineseTrans()
      sendBtnClick(documents)
      return
    }
    if(isTranslating) return;
    isTranslating = true
    showLoading(documents)
    handleSendMessage(documents, msg);
  }

  
  /**发送消息 */
  async function handleSendMessage(documents, context){
    const params = getResData(context, true, true);
    params.isSend = true;
    const res = await Ferdium.getTran(params, oneworld.token);
    if (res.body.code === 200) {
      let result = res.body.data || '';
      result = result.replace(/</gi, '&lt;');
      result = result.replace(/>/gi, '&gt;');
      result = result.replace(/&#39;/gi, '\'');
      let arr = result.split('\n')
      let childrens = documents.querySelectorAll('p')
      childrens.forEach((item, index) => {
        item.textContent = arr[index]
      })
      const evt = document.createEvent('HTMLEvents');
      evt.initEvent('input', true, true);
      documents.dispatchEvent(evt);
      
      if(oneworld.settingCfg.type == 8) {
        toBeSentTxt = result
        showLoading(documents, '翻译成功，请确认后再次按下回车发送', 1)
        hideLoadTimer = setTimeout(() => {
          hideLoading()
          clearTimeout(hideLoadTimer)
          hideLoadTimer = null
        }, 3000)
        documents.setAttribute('data-transleted', 1)
        showChineseTrans(documents, result)
      }else{
        setTimeout(() => {
          sendBtnClick(documents)
          hideLoading()
        }, 0);
      }
      isTranslating = false
    }else{
      isTranslating = false
      showLoading(documents, res.body.msg, 2)
      hideLoadTimer = setTimeout(() => {
        hideLoading()
        clearTimeout(hideLoadTimer)
        hideLoadTimer = null
      }, 3000)
    }
  };

  function sendBtnClick(documents) {
    documents.parentNode.parentNode.parentNode.parentNode.querySelector(classnameCfg.sendBtn)?.click();
  }

  // eslint-disable-next-line unicorn/consistent-function-scoping
  function replaceAllHtml(data) {
    data = data.replace(/<\/?[^>]+>/g, ''); // 过滤所有html
    data = data.replace(/&lt;/gi, '<'); // 过滤所有的&lt;
    data = data.replace(/&gt;/gi, '>'); // 过滤所有的&gt;
    data = data.trim(); // 过滤所有的空格
    return data;
  };

  function getIptSendMsg(div) {
    if(!div) {
      return ''
    }
    let value = ''
    let children = div.querySelectorAll('p')
    for(var i = 0; i < children.length; i++) {
      if(i===0){
        value += children[i].textContent
      }else{
        value += '\n' + children[i].textContent
      }
    }
    value = value ? replaceAllHtml(value) : ''
    return value;
  };

   // type: 0默认 1成功 2 失败 
   function showLoading(documents, txt, type){
    let box1 = document.querySelector(classnameCfg.box1)
    let box2 = document.querySelector(classnameCfg.box2)
    let main = null
    if(box1 && box1.contains(documents)) {
      main = getMainView()
    }
    if(box2 && box2.contains(documents)) {
      main = getMainView2()
    }
    clearTimeout(hideLoadTimer)
    hideLoadTimer = null
    let el = main.querySelector('.aitansLoading')
    let color = type === 1 ? '#FE750A' : (type === 2 ? '#f90606' : '#000');
    txt = txt || '正在翻译中 请勿重复敲击回车按键';
    if(el) {
      el.style.display = 'block'
      el.textContent = txt
      el.style.color = color
    }else{
      if(main) {
        main.insertAdjacentHTML(
          'beforeend',
          `<span class="aitansLoading" style="font-size:14px;position:absolute;z-index:999;left:0;right: 0;padding: 5px 10px;margin: 0 auto;border-radius: 4px;text-align:center;bottom:0;color:${color};">${txt}</span>`
        );
      }
    }
  }
  function hideLoading(){
    let els = document.querySelectorAll('.aitansLoading')
    for(var i = 0; i < els.length; i++) {
      els[i].style.display = 'none'
    }
  }

  // AI翻译显示中文翻译
  async function showChineseTrans(documents, msg) {
    let box1 = document.querySelector(classnameCfg.box1)
    let box2 = document.querySelector(classnameCfg.box2)
    let main = null
    if(box1 && box1.contains(documents)) {
      main = box1.querySelector('.msg-form__msg-content-container--scrollable')
    }
    if(box2 && box2.contains(documents)) {
      main = box2.querySelector('.msg-form__msg-content-container--scrollable')
    }
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
    let el = main.querySelector('.aitansChinese')
    if(el) {
      el.style.display = 'block'
      el.innerHTML = txt
    }else{
      if(main) {
        main.insertAdjacentHTML(
          'beforeend',
          `<div class="aitansChinese" style="font-size:14px;padding: 5px 10px;border-radius: 4px;background: #fff;">${txt}</div>`
        );
      }
    }
  }
  function hideChineseTrans() {
    let els = document.querySelectorAll('.aitansChinese')
    for(var i = 0; i < els.length; i++) {
      els[i].style.display = 'none'
    }
  }

  function listerFriendList() {
    document.addEventListener(
      'click',
      e => {
        if(getFriendView()?.contains(e.target)) {
          let timer = setInterval(() => {
            let view = getMainView();
            if (view) {
              addFreshEvent()
              clearInterval(timer)
              timer = null
            }
          }, 200)
        }
        if(getFriendView2()?.contains(e.target)) {
          let timer = setInterval(() => {
            let view = getMainView2();
            if (view) {
              addFreshEvent()
              clearInterval(timer)
              timer = null
            }
          }, 200)
        }
        let newsBtnEl = document.querySelector('.global-nav__primary-item:nth-child(4)')
        if(newsBtnEl?.contains(e.target)) {
          let timer = setInterval(() => {
            let view = getMainView();
            if (view) {
              addFreshEvent()
              clearInterval(timer)
              timer = null
            }
          }, 200)
        }
        
        let sendBtnEls = document.querySelectorAll(classnameCfg.sendBtn)
        for(var i = 0; i < sendBtnEls.length; i++) {
          if(sendBtnEls[i] && sendBtnEls[i].contains(e.target)) {
            if(e.isTrusted) {
              initSendEvent(e)
            }
          }
        }
      },
      true,
    );
  };

  function getFriendView() {
    return document.querySelector(classnameCfg.friendList);
  };
  function getFriendView2() {
    return document.querySelector(classnameCfg.friendList2);
  };
  function isGroup() {
    return false
  }
  function getMainView() {
    return document.querySelector(classnameCfg.main);
  };
  function getMainView2() {
    return document.querySelector(classnameCfg.main2);
  };
  function addFreshEvent() {
    let view = getMainView();
    if (view) {
      freshChatList(1);
      view.removeEventListener('DOMNodeInserted', ()=> {
        freshChatList(1)
      });
      view.addEventListener('DOMNodeInserted', ()=> {
        freshChatList(1)
      }, true);
    }
    let view2 = getMainView2();
    if (view2) {
      freshChatList(2);
      view2.removeEventListener('DOMNodeInserted', ()=> {
        freshChatList(2)
      });
      view2.addEventListener('DOMNodeInserted', ()=> {
        freshChatList(2)
      }, true);
    }
  };
  function freshChatList(type) {
    let msgList = []
    let view = getMainView();
    let view2 = getMainView2();
    if(type === 1) {
      msgList = view ? view.querySelectorAll(classnameCfg.allMsg) : []
    }else{
      msgList = view2 ? view2.querySelectorAll(classnameCfg.allMsg) : []
    }
    let myName = document.querySelector('#thread-detail-jump-target')?.textContent?.trim()
    for (const msgDiv of msgList) {
      const msg = msgDiv.textContent;
      const check = !msgDiv.parentNode.querySelector('.autofanyi') && !msgDiv.parentNode.querySelector('.click-fanyi');
      if(check && msg) {
        let isOwn = msgDiv.parentNode.parentNode.parentNode.parentNode.querySelector('.msg-s-message-group__name')?.textContent?.trim() !== myName;
        if ((oneworld.settingCfg.sendtranslation && !isOwn) || (oneworld.settingCfg.tranflag && isOwn)) {
          // 如果是群聊则跟进群聊开关判断
          if((isGroup() && oneworld.settingCfg.groupflag) || !isGroup()) {
            insterDiv(msgDiv, 'autofanyi', '翻译中...', isOwn);
            autoFanyi(msg, msgDiv, isOwn);
          }else{
            insterDiv(msgDiv, 'click-fanyi', '点击翻译', isOwn);
            msgDiv.parentNode
              .querySelector('.click-fanyi')
              .addEventListener('click', e => clickFanyi(e, isOwn, msg));
          }
        } else {
            insterDiv(msgDiv, 'click-fanyi', '点击翻译', isOwn);
            msgDiv.parentNode
              .querySelector('.click-fanyi')
              .addEventListener('click', e => clickFanyi(e, isOwn, msg));
        }
      }
    }
    setPlaceholderTxt()
  };

  function insterDiv(parent, className, msg) {
    parent.insertAdjacentHTML(
      'afterEnd',
      `<div class="${className}" style="margin-left: calc(40px + 0.8rem + 0.8rem);margin-right:28px;font-size:${oneworld.settingCfg.fontsize}px;color:${oneworld.settingCfg.fontcolor};background: #f3f2ef;display: inline-block;padding:5px">${msg}</div>`,
    );
  };

  async function autoFanyi(msg, msgDiv, isOwn) {
    let autoFanyi = msgDiv.parentNode.querySelector('.autofanyi');
    if(!autoFanyi) {
      return
    }
    if(!msg || isNumber(msg)){
      autoFanyi.innerHTML = msg;
      return
    }
    let params = getResData(msg, isOwn);
    let res = await Ferdium.getTran(params, oneworld.token);
    if (res.body.code === 200) {
      let result = res.body.data || '';
      result = result.replace(/&#39;/gi, '\'');
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
    let params = getResData(msg, isOwn);
    params.isClickTrans = true
    let res = await Ferdium.getTran(params, oneworld.token);
    if (res.body.code === 200) {
      let result = res.body.data || '';
      result = result.replace(/&#39;/gi, '\'');
      result = result.replaceAll('\n','<br>');
      div.innerHTML = result;
    } else {
      div.innerHTML = res.body.msg;
    }
    div.removeEventListener('click', clickFanyi);
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

  function getResData(msgText, isMe, isSend) {
    let from, to;
    if (!isSend) {
      from = isMe ? oneworld.settingCfg.sto : oneworld.settingCfg.jfrom;
      to = isMe ? oneworld.settingCfg.sfrom : oneworld.settingCfg.jto;
    } else {
      from = oneworld.settingCfg.sfrom;
      to = oneworld.settingCfg.sto;
    }
    return {
      word: msgText,
      from,
      to,
      type: oneworld.settingCfg.type,
      tone: oneworld.settingCfg.tone,
      scene: oneworld.settingCfg.scene,
    };
  };

  function setPlaceholderTxt() {
    let els = document.querySelectorAll(classnameCfg.ipt)
    if(!els.length) {
      return
    }
    const {type, sto, tranflag, groupflag} = oneworld.settingCfg
    let transType = settings.packageCfg?.[type] || ''
    let language = settings.tranCfg?.[type]?.[sto] || ''
    for(var i = 0; i < els.length; i++) {
      let placeholderEl = els[i].parentNode.querySelector('.msg-form__placeholder')
      if(placeholderEl) {
        if (!tranflag || (isGroup() && !groupflag)) {
          placeholderEl.setAttribute('data-placeholder', '消息不翻译发送')
        }else{
          placeholderEl.setAttribute('data-placeholder', '消息通过['+transType+']翻译成['+language+']发送')
        }
      }
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
    setPlaceholderTxt()
  };
};
