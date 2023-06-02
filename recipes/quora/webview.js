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

  const classnameCfg = {
    main: '.q-box.qu-justifyContent--flex-end.qu-px--medium.qu-display--flex.qu-flexDirection--column',
    allMsg: '.q-box.qu-justifyContent--flex-end.qu-px--medium.qu-display--flex.qu-flexDirection--column .q-box.qu-userSelect--text',
    friendList: '.q-click-wrapper.qu-display--block.qu-bg--white.qu-tapHighlight--none.qu-cursor--pointer.ClickWrapper___StyledClickWrapperBox-zoqi4f-0.iyYUZT',
    sendBtn: '.q-click-wrapper.qu-active--textDecoration--none.qu-focus--textDecoration--none.qu-borderRadius--pill.qu-alignItems--center.qu-justifyContent--center.qu-whiteSpace--nowrap.qu-userSelect--none.qu-display--inline-flex.qu-bg--blue.qu-tapHighlight--white.qu-textAlign--center.qu-cursor--pointer.qu-hover--textDecoration--none.ClickWrapper___StyledClickWrapperBox-zoqi4f-0.iyYUZT.base___StyledClickWrapper-lx6eke-1.hIqLpn',
};

  Ferdium.ipcRenderer.on('service-settings-update', (res, data) => {
    updateSettingData(data);
  });
  Ferdium.ipcRenderer.on('send-info', () => {
    document.querySelector(classnameCfg.sendBtn)?.click();
  });

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

  const getMessages = () => {
    
  };

  const getActiveDialogTitle = () => {
    const element = document.querySelector('header .emoji-texttt');

    Ferdium.setDialogTitle(element ? element.textContent : '');
  };

  const loopFunc = () => {
    getMessages();
    getActiveDialogTitle();
  };

  window.addEventListener('beforeunload', async () => {
    Ferdium.releaseServiceWorkers();
  });

  Ferdium.loop(loopFunc);

  /**初始化翻译接口 */
  Ferdium.initLocalData(settings.localReadData);
  Ferdium.initOneWorld(() => {
    console.log('ready to translation');
    setTimeout(() => {
      setTimeForFunc(listerFriendList, 500);
      let mainLoop = setInterval(() => {
        let view = getMainView();
        if (view) {
          addKeyDownAndTran();
          setTimeForFunc(addFreshEvent, 500);
          clearInterval(mainLoop);
        }
      }, 500);
    }, 1500);
  });

  const addKeyDownAndTran = () => {
    document.addEventListener(
      'keydown',
      event => {
        let key = event.key;
        if (!oneworld.settingCfg.tranflag) return;
        if (isGroup() && !oneworld.settingCfg.groupflag) return;
        if (key === 'Enter') {
          const msg = event.target.textContent;
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
    if(!context){
        return
    }
    const params = getResData(context, true, true);
    params.isSend = true;
    const res = await Ferdium.getTran(params, oneworld.token);
    if (res.err) {
      console.log(res.err, 'md-error');
      return;
    }
    const textEl = documents.querySelector('.content');
    if (res.body.code === 500) {
      textEl.textContent = res.body.msg;
    }
    if (res.body.code === 200 && res.body.data) {
      textEl.textContent = res.body.data;
      setTimeout(() => {
        document.querySelector(classnameCfg.sendBtn)?.click();
      }, 500);
    }
  };

  const getMainView = () => {
    return document.querySelector(classnameCfg.main);
  };

  const listerFriendList = () => {
    document.addEventListener(
      'click',
      () => {
        let mainLoop = setInterval(() => {
            let view = getMainView();
            if (view) {
                setTimeForFunc(addFreshEvent, 500);
                clearInterval(mainLoop);
            }
        }, 500);
      },
      true,
    );
  };

  const insterDiv = (parent, className, msg, isOwn) => {
    const reTranEl = document.createElement('span');
    reTranEl.style.cssText =
      'font-size:12px;position:absolute;right:34px;bottom:14px;';
    reTranEl.textContent = '重译';
    reTranEl.addEventListener('click', async () => {
      const text = parent.textContent.slice(
        0,
        Math.max(0, parent.textContent.length - 5),
      );
      const params = getResData(text, isOwn);
      await Ferdium.getTran(params, oneworld.token, true).then(res => {
        parent.parentElement.querySelector(`.${className}`).textContent =
          res.body.data;
      });
    });
    // parent.parentElement.append(reTranEl);
    parent.insertAdjacentHTML(
      'afterEnd',
      `<div class="${className}" style="margin-right:28px;font-size:${oneworld.settingCfg.fontsize}px;color:${oneworld.settingCfg.fontcolor}">${msg}</div>`,
    );
  };

  // 判断是群聊还是私聊, true 群聊
  const isGroup = () => {
    return false
  }

  //自动翻译
  const autoFanyi = async (msg, msgDiv, isOwn, isSend) => {
    
    // 自动翻译时隐藏点击翻译按钮
    let clickfanyi = msgDiv.parentNode.querySelector('.click-fanyi');
    if (clickfanyi) clickfanyi.style.display = 'none';

    let autoFanyi = msgDiv.parentNode.querySelector('.autofanyi');
    if(!autoFanyi) {
      return
    }
    console.log(msg)
    if(!msg || isNumber(msg)){
      autoFanyi.innerHTML = '';
      return
    }
    let params = getResData(msg, isOwn, isSend);
    let res = await Ferdium.getTran(params, oneworld.token);
    if (!res.err && res.body.code == 200) {
      autoFanyi.innerHTML = res.body.data;
    } else if (res.body.code == 500) {
      autoFanyi.innerHTML = res.body.msg;
    } else {
      autoFanyi.innerHTML = '翻译失败';
    }
  };

  /**用户点击其他位置 重新监听页面变化 */
  const addFreshEvent = () => {
    let view = getMainView();
    if (view) {
      freshChatList();
      view.removeEventListener('DOMNodeInserted', freshChatList);
      view.addEventListener('DOMNodeInserted', freshChatList, true);
    }
  };

  /**刷新聊天栏 插入翻译 */
  const freshChatList = (e) => {
    let msgList = document.querySelectorAll(classnameCfg.allMsg);
    console.log(msgList,'fixedMainfixedMainfixedMainfixedMain')
    for (const msg of msgList) {
      const text = msg.textContent;
      const isOwn =
        msg.parentElement.parentElement.parentElement.parentElement.className.includes(
          'qu-bg--blue',
        );
      const check = msg.parentElement.children.length === 1;
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
                .addEventListener('click', e => clickFanyi(e, isOwn));
          }
        } else{
            insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
            msg.parentNode
              .querySelector('.click-fanyi')
              .addEventListener('click', e => clickFanyi(e, isOwn));
        }
      }
    }
  };

  /**请求参数 */
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

  const clickFanyi = async (e, isOwn) => {
    const div = getEventTarget(e);
    const msg = div.parentNode.querySelector(classnameCfg.allMsg).textContent;
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

  // 获取事件目标
  const getEventTarget = e => {
    e = window.event || e;
    return e.srcElement || e.target;
  };

  //检测是否全数字
  const isNumber = str => {
    var patrn = /^(-)?\d+(\.\d+)?$/;
    return !(patrn.exec(str) == null || str === '');
  };
  // 掩饰
  const setTimeForFunc = (func, time) => {
    setTimeout(func, time);
  };
};
