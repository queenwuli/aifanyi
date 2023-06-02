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
    main: '.im-page--chat-body',
    fixedMain: '.FCWindow.FCConvo.FCWindow--active',
    allMsg: '.im-mess--text.wall_module._im_log_body',
    allMsg2: '.MessageText',
    sendBtn: '.im-send-btn.im-chat-input--send.im-send-btn_static._im_send.im-send-btn_send',
    groupflagEl: '._im_chat_members.im-page--members'
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
    let directs = 0;
    const element = document.querySelectorAll('.left_count');
    if (element.length > 0) {
      directs = Ferdium.safeParseInt(element[0].textContent);
    }

    Ferdium.setBadge(directs);
  };

  const getActiveDialogTitle = () => {
    const element = [
      document.querySelector(
        '.FCWindow--active .FCWindow__title .ConvoTitle__title',
      ),
      document.querySelector('.im-page_history-show ._im_page_peer_name'),
    ].find(Boolean);

    Ferdium.setDialogTitle(element ? element.textContent : null);
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
      let mainLoop2 = setInterval(() => {
        let view = getFixedMainView();
        if (view) {
          addKeyDownAndTran();
          setTimeForFunc(addFreshEvent, 500);
          clearInterval(mainLoop2);
        }
      }, 500);
    }, 1500);
  });

  const addKeyDownAndTran = () => {
    document.addEventListener(
      'keydown',
      event => {
        if (!oneworld.settingCfg.tranflag) return;
        if (isGroup() && !oneworld.settingCfg.groupflag) return;
        let hasSendBtn = event.target.parentNode.querySelector(classnameCfg.sendBtn)
        if(hasSendBtn) {
          if(event.code === 'Enter') {
            let msg = event.target.textContent;
            msg = replaceAllHtml(msg);
            handleSendMessage(event.target, msg, hasSendBtn);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
          }
        }else{
          if (event.code === 'Enter' && event.ctrlKey) {
            let msg = event.target.textContent;
            msg = replaceAllHtml(msg);
            handleSendMessage(event.target, msg, hasSendBtn);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
          }
        }
      },
      true,
    );
  };

  /**发送消息 */
  const handleSendMessage = async (documents, context, hasSendBtn) => {
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
    if (res.body.code === 500) {
      documents.textContent = res.body.msg;
    }
    if (res.body.code === 200 && res.body.data) {
      documents.textContent = res.body.data;
      setTimeout(() => {
        if(hasSendBtn) {
          document.querySelector(classnameCfg.sendBtn)?.click();
        }else{
          const event = new KeyboardEvent('keydown', {
            keyCode: 13,
            key: 'Enter',
            code: 'Enter',
            bubbles: true,
            composed: true,
          });
          documents.dispatchEvent(event);
        }
      }, 500);
    }
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
  const getMainView = () => {
    return document.querySelector(classnameCfg.main);
  };
  const getFixedMainView = () => {
    return document.querySelector(classnameCfg.fixedMain);
  }

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
        let mainLoop2 = setInterval(() => {
          let view = getFixedMainView();
          if (view) {
            setTimeForFunc(addFreshEvent, 500);
            clearInterval(mainLoop2);
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
    let mrginLeft = document.defaultView.getComputedStyle(parent)['marginLeft']
    if(parent.parentElement.className.includes('im-mess_selected')) {
      mrginLeft = '86px'
    }
    // parent.parentElement.append(reTranEl);
    parent.insertAdjacentHTML(
      'afterEnd',
      `<div class="${className}" style="margin-left:${mrginLeft};font-size:${oneworld.settingCfg.fontsize}px;color:${oneworld.settingCfg.fontcolor}">${msg}</div>`,
    );
  };

  // 判断是群聊还是私聊, true 群聊
  const isGroup = () => {
    let el = document.querySelector(classnameCfg.groupflagEl)
    return !!el
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
    if(!msg || isNumber(msg) || !msg.trim()){
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
    let fixedView = getFixedMainView();
    if (view) {
      freshChatList();
      view.removeEventListener('DOMNodeInserted', freshChatList);
      view.addEventListener('DOMNodeInserted', freshChatList, true);
    }
    if (fixedView) {
      freshFixedChatList();
      fixedView.removeEventListener('DOMNodeInserted', freshFixedChatList);
      fixedView.addEventListener('DOMNodeInserted', freshFixedChatList, true);
    }
  };

  /**刷新聊天栏 插入翻译 */
  const freshChatList = (e) => {
    let msgList = document.querySelectorAll(classnameCfg.allMsg);
    for (const msg of msgList) {
      const text = msg.textContent ? msg.textContent.trim() : '';
      const isOwn =
        msg.parentElement.className.includes(
          'im-mess_out',
        );
      const check = !msg.parentNode.querySelector('.click-fanyi') && !msg.parentNode.querySelector('.autofanyi')
      if (check && text) {
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

  // 悬浮窗口翻译
  const freshFixedChatList = (e) => {
    let msgList = document.querySelector(classnameCfg.fixedMain).querySelectorAll(classnameCfg.allMsg2);
    let inputEl = document.querySelector('.FCComposer__emojiHack._emoji_field_wrap .ph_content')
    if(inputEl) {
      inputEl.textContent = 'ctrl+enter发送翻译';
    }
    for (const msg of msgList) {
      const text = msg.textContent ? msg.textContent.trim() : '';
      const isOwn =
        msg.parentElement.parentElement.parentElement.parentElement.className.includes(
          'ConvoMessage--out',
        );
      const check = !msg.parentNode.querySelector('.click-fanyi') && !msg.parentNode.querySelector('.autofanyi')
      if (check && text) {
        try {
          msg.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.style.height = 'auto'
        } catch (error) {
          
        }
        if ((oneworld.settingCfg.sendtranslation && !isOwn) || (oneworld.settingCfg.tranflag && isOwn)) {
          insterDiv(msg, 'autofanyi', '...', isOwn);
          autoFanyi(text, msg, isOwn);
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
    div.style["margin-left"] = '86px'
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
