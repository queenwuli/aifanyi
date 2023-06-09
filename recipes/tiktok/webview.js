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
    main: '.tiktok-d0yksp-DivChatBox',
    allMsg: '.tiktok-1rdxtjl-PText',
    sendBtn: '.tiktok-d7yhdo-StyledSendButton'
  };

  Ferdium.ipcRenderer.on('service-settings-update', (res, data) => {
    updateSettingData(data);
  });
  Ferdium.ipcRenderer.on('send-info', () => {
    setTimeout(() => {
      clickSendBtn();
    }, 500);
  });

  const getMessages = () => {
    const elements = document.querySelector('.tiktok-gszb57-SupMsgBadge');
    let count = elements ? elements.textContent : 0;
    Ferdium.setBadge(count, count);
  };

  const getActiveDialogTitle = () => {
    
  };

  const loopFunc = () => {
    getMessages();
    getActiveDialogTitle();
  };

  Ferdium.loop(loopFunc);

  Ferdium.injectCSS(_path.default.join(__dirname, 'service.css'));

  //初始化
  Ferdium.initLocalData(settings.localReadData);
  Ferdium.initOneWorld(() => {
    setTimeout(() => {
      console.log('ready to translation');
      setTimeForFunc(listerFriendList, 500);
      let mainLoop = setInterval(() => {
        let main = getMainView();
        if (main) {
          addKeyDownAndTran();
          setTimeForFunc(addFreshEvent, 500);
          clearInterval(mainLoop);
        }
      }, 500);
    }, 500);
  });

  //获取主消息列表
  const getMainView = () => {
    return document.querySelector(classname.main);
  };

  //好友列表监听
  const listerFriendList = () => {
    document.addEventListener(
      'click',
      e => {
        setTimeForFunc(addFreshEvent, 500);
      },
      true,
    );
  };

  const addFreshEvent = () => {
    let view = getMainView();
    if (view) {
      freshChatList();
      view.removeEventListener('DOMNodeInserted', freshChatList);
      view.addEventListener('DOMNodeInserted', freshChatList, true);
    }
  };

  const freshChatList = () => {
    const msgList = document.querySelectorAll(classname.allMsg);
    for (const msg of msgList) {
      let text = msg.textContent;
      const check = !msg.parentNode.querySelector('.autofanyi') && !msg.parentNode.querySelector('.click-fanyi');
      const isOwn =
        msg.parentElement.parentElement.className.includes(
          'tiktok-101150x-DivMessageContainer',
        );
      if (check) {
        if ((oneworld.settingCfg.sendtranslation && !isOwn) || (oneworld.settingCfg.tranflag && isOwn)) {
          // 如果是群聊则跟进群聊开关判断
          if((isGroup() && oneworld.settingCfg.groupflag) || !isGroup()) {
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

  const clickFanyi = async (e, isOwn) => {
    const div = getEventTarget(e);
    let msg = div.parentElement.querySelector(classname.allMsg).textContent;
    // const params = getResData(msg, isOwn);
    const res = await Ferdium.getTran({
      word: msg,
      from: isOwn ? oneworld.settingCfg.sfrom : oneworld.settingCfg.jfrom,
      to: isOwn ? oneworld.settingCfg.sto : oneworld.settingCfg.jto,
      type: oneworld.settingCfg.type,
    }, oneworld.token);
    if (res.err) {
      console.log(res.err);
      return;
    }
    div.textContent = res.body.data;
    div.removeEventListener('click', clickFanyi);
  };

  // 判断是群聊还是私聊, true 群聊
  const isGroup = () => {
    return false
  }

  const autoFanyi = async (msg, msgDiv, isOwn) => {
    // 自动翻译时隐藏点击翻译按钮
    let clickfanyi = msgDiv.parentNode.querySelector('.click-fanyi');
    if (clickfanyi) clickfanyi.style.display = 'none';

    let autoFanyi = msgDiv.parentNode.querySelector('.autofanyi');
    
    if(!autoFanyi) {
      return
    }
    if(!msg || isNumber(msg)){
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

  const addKeyDownAndTran = () => {
    document.addEventListener(
      'keydown',
      event => {
        let key = event.key;
        if (!oneworld.settingCfg.tranflag) return;
        if (isGroup() && !oneworld.settingCfg.groupflag) return;
        if (key === 'Enter') {
          let msg = event.target.textContent;
          msg = replaceAllHtml(msg);
          handleSendMessage(event.target, msg);
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
  };

  /**发送消息 */
  const handleSendMessage = async (documents, context) => {
    if(!context) {
      return
    }
    const params = getResData(context, true, true);
    params.isSend = true;
    const res = await Ferdium.getTran(params, oneworld.token);
    if (res.err) {
      console.log(res.err, 'md-error');
      return;
    }
    const textEl = documents.querySelector('span[data-text="true"]')
    if (res.body.code === 500) {
      textEl.textContent = res.body.msg;
    } else if (res.body.code === 200 && res.body.data) {
      let result = res.body.data;
      result = result.replace(/</gi, '&lt;');
      result = result.replace(/>/gi, '&gt;');
      result = result.replace(/&#39;/gi, '\'');
      textEl.textContent = result;
      const evt = document.createEvent('HTMLEvents');
      evt.initEvent('input', true, true);
      documents.dispatchEvent(evt);
      setTimeout(() => {
        clickSendBtn();
      }, 500);
    }
  };
  // 获取事件目标
  const getEventTarget = e => {
    e = window.event || e;
    return e.srcElement || e.target;
  };

  const clickSendBtn = () => {
    let sendBtn = document.querySelector(classname.sendBtn);
    let evtClick = window.document.createEvent('MouseEvents');
    evtClick.initEvent('click', true, true);
    sendBtn.dispatchEvent(evtClick);
  };

  //检测是否全数字
  // eslint-disable-next-line unicorn/consistent-function-scoping
  const isNumber = str => {
    var patrn = /^(-)?\d+(\.\d+)?$/;
    return !(patrn.exec(str) == null || str === '');
  };
  // 掩饰
  // eslint-disable-next-line unicorn/consistent-function-scoping
  const setTimeForFunc = (func, time) => {
    setTimeout(func, time);
  };

  const getResData = (msgText, isMe, isSend) => {
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
    };
  };

  const insterDiv = (parent, className, msg, isOwn) => {
    parent.insertAdjacentHTML(
      'afterEnd',
      `<div class="${className}" style="margin-right:28px;font-size:${oneworld.settingCfg.fontsize}px;color:${oneworld.settingCfg.fontcolor}">${msg}</div>`,
    );
  };

  /**删除所有HTML */
  // eslint-disable-next-line unicorn/consistent-function-scoping
  const replaceAllHtml = data => {
    data = data.replace(/<\/?[^>]+>/g, ''); // 过滤所有html
    data = data.replace(/&lt;/gi, '<'); // 过滤所有的&lt;
    data = data.replace(/&gt;/gi, '>'); // 过滤所有的&gt;
    data = data.trim(); // 过滤所有的空格
    return data;
  };

  const updateSettingData = data => {
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
