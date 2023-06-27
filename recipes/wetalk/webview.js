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

  Ferdium.ipcRenderer.on('service-settings-update', (res, data) => {
    updateSettingData(data);
  });
  Ferdium.ipcRenderer.on('send-info', () => {
    setTimeout(() => {
      document.querySelector(classnameCfg.sendBtn)?.click();
    }, 500);
  });

  const classnameCfg = {
    main: '#chat-right',
    ipt: '#inputChat',
    allMsg: '.left-message',
    allMsg2: '.right-message',
    friendList: 'aside',
    sendBtn: '#send-button>button'
  };

  function getMessages() {
    let count = 0
    const els = document.querySelectorAll('.v-badge__wrapper');
    for(var i = 0; i < els.length; i++) {
        count+=els[i].textContent
    }
    Ferdium.setBadge(count);
  };

  Ferdium.loop(getMessages);
  
  Ferdium.initLocalData(settings.localReadData);
  Ferdium.initOneWorld(() => {
    console.log('ready to translation');
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
          initSendEvent(event)
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
    showLoading()
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
      documents.textContent = result
      const evt = document.createEvent('HTMLEvents');
      evt.initEvent('input', true, true);
      documents.dispatchEvent(evt);
      if(oneworld.settingCfg.type == 8) {
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
        setTimeout(() => {
          document.querySelector(classnameCfg.sendBtn).click();
          hideLoading()
        }, 0);
      }
      isTranslating = false
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
    let inputEl = document.querySelector(classnameCfg.ipt)
    if(!inputEl) {
      return ''
    }
    let value = inputEl.textContent
    value = value ? replaceAllHtml(value) : ''
    return value;
  };

   // type: 0默认 1成功 2 失败 
   function showLoading(txt, type){
        clearTimeout(hideLoadTimer)
        hideLoadTimer = null
        let el = document.querySelector('#aitansLoading')
        let color = type === 1 ? '#FE750A' : (type === 2 ? '#f90606' : '#000');
        txt = txt || '正在翻译中 请勿重复敲击回车按键';
        if(el) {
            el.style.display = 'block'
            el.textContent = txt
            el.style.color = color
        }else{
            let main = document.querySelector('#screen-chat')
            if(main) {
                main.insertAdjacentHTML(
                    'beforeend',
                    `<span id="aitansLoading" style="font-size:14px;position:absolute;z-index:999;left:0;right: 0;padding: 5px 10px;margin: 0 auto;border-radius: 4px;text-align:center;bottom:30px;color:${color};">${txt}</span>`
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
    }else{
      let main = document.querySelector('#screen-chat')
      if(main) {
        main.insertAdjacentHTML(
            'beforeend',
            `<div id="aitansChinese" style="position:absolute;z-index:999;bottom:0;left:24px;right: 24px;font-size:14px;padding: 5px 10px;background: #fff;">${txt}</div>`
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
    return false
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
        let sendBtnEl = document.querySelector('#send-button')
        if(sendBtnEl && sendBtnEl.contains(e.target)) {
          if(e.isTrusted) {
            initSendEvent(e)
          }
        }
      },
      true,
    );
  };

  function getMainView() {
    return document.querySelector(classnameCfg.main);
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
    let msgList1 = document.querySelectorAll(classnameCfg.allMsg);
    let msgList2 = document.querySelectorAll(classnameCfg.allMsg2);
    for (const msgDiv of msgList1) {
      const msg = msgDiv.textContent;
      const check = !msgDiv.parentNode.querySelector('.autofanyi') && !msgDiv.parentNode.querySelector('.click-fanyi');
      if(check) {
        let isOwn = false;
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
    for (const msgDiv of msgList2) {
        const msg = msgDiv.textContent;
        const check = !msgDiv.parentNode.querySelector('.autofanyi') && !msgDiv.parentNode.querySelector('.click-fanyi');
        if(check) {
          let isOwn = true;
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

  function getFriendView() {
    return document.querySelector(classnameCfg.friendList);
  };
  function insterDiv(parent, className, msg) {
        parent.insertAdjacentHTML(
        'beforeend',
        `<div class="${className}" style="font-size:${oneworld.settingCfg.fontsize}px;color:${oneworld.settingCfg.fontcolor};">${msg}</div>`,
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
    let view = getMainView();
    if(!view) {
      return
    }
    let el = document.querySelector(classnameCfg.ipt)
    if(!el) {
      return
    }
    const {type, sto, tranflag, groupflag} = oneworld.settingCfg
    if (!tranflag || (isGroup() && !groupflag)) {
        el.setAttribute('placeholder', '消息不翻译发送')
    }else{
      let transType = settings.packageCfg?.[type] || ''
      let language = settings.tranCfg?.[type]?.[sto] || ''
      el.setAttribute('placeholder', '消息通过['+transType+']翻译成['+language+']发送')
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
