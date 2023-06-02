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
    friendList: 'li[data-v-7ddefda2]',
    ipt: 'div#inputChat.flex-grow-1',
    main: 'div#chat-right.flex-grow-1.d-flex.flex-column',
    allMsg: '.message',
    ownMsg: '#screen-chat div.right-message.pingme-chatting-color',
    otherSideMsg: '#screen-chat div.left-message',
    sendBtn:
      'button.v-icon.notranslate.v-icon--link.mdi.mdi-36px.mdi-send.theme--light.pingme-color',
  };

  //服务设置更新
  Ferdium.ipcRenderer.on('service-settings-update', (res, data) => {
    updateSettingData(data);
  });
  Ferdium.ipcRenderer.on('send-info', () => {
    setTimeout(() => {
      document.querySelector(classname.sendBtn)?.click();
    }, 500);
  });

  //初始化
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
    }, 500);
  });

  const addKeyDownAndTran = () => {
    document.addEventListener(
      'keydown',
      event => {
        let key = event.key;
        if (!oneworld.settingCfg.tranflag) return;
        if (isGroup() && !oneworld.settingCfg.groupflag) return;
        if (key === 'Enter') {
          let msg = getIptSendMsg();
          msg = replaceAllHtml(msg);
          handleSendMessage(document.querySelector(classname.ipt), msg);
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
  };

  const getIptSendMsg = () => {
    return document.querySelector(classname.ipt).textContent;
  };

  /**发送消息 */
  const handleSendMessage = async (documents, context) => {
    const params = getResData(context, true, true);
    params.isSend = true;
    const res = await Ferdium.getTran(params, oneworld.token);
    if (res.err) {
      console.log(res.err, 'md-error');
      return;
    }
    if (res.body.code === 500) {
      documents.textContent = res.body.msg;
    } else if (res.body.code === 200 && res.body.data) {
      let result = res.body.data;
      result = result.replace(/</gi, '&lt;');
      result = result.replace(/>/gi, '&gt;');
      documents.textContent = result;
      const evt = document.createEvent('HTMLEvents');
      evt.initEvent('input', true, true);
      documents.dispatchEvent(evt);
      setTimeout(() => {
        document.querySelector(classname.sendBtn)?.click();
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

  //添加新事件
  const addFreshEvent = () => {
    let view = getMainView();
    if (view) {
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
      freshChatList();
      view.removeEventListener('DOMNodeInserted', freshChatList);
      view.addEventListener('DOMNodeInserted', freshChatList, true);
    }
  };

  //新的聊天列表
  const freshChatList = () => {
    renderListMe();
    renderListHe();
  };
  const renderListMe = () => {
    const listMsg = document.querySelectorAll(classname.ownMsg);
    for (const msgDiv of listMsg) {
      const msg = msgDiv.textContent;
      let check = !msgDiv.nextSibling
      if(check) {
        if(oneworld.settingCfg.tranflag) {
          insterDiv(msgDiv, 'autofanyi', '...', true);
          autoFanyi(msg, msgDiv, true);
        }else{
          insterDiv(msgDiv, 'click-fanyi', '点击翻译', true);
          msgDiv.parentNode
            .querySelector('.click-fanyi')
            .addEventListener('click', e => clickFanyi(e, true));
        }
      }
    }
  }
  const renderListHe = () => {
    const listMsg = document.querySelectorAll(classname.otherSideMsg);
    for (const msgDiv of listMsg) {
      const msg = msgDiv.textContent;
      let check = msgDiv.parentNode.childElementCount == 2
      if(check) {
        if(oneworld.settingCfg.sendtranslation) {
          insterDiv(msgDiv, 'autofanyi', '...', false);
          autoFanyi(msg, msgDiv, false);
        }else{
          insterDiv(msgDiv, 'click-fanyi', '点击翻译', false);
          msgDiv.parentNode
            .querySelector('.click-fanyi')
            .addEventListener('click', e => clickFanyi(e, false));
        }
      }
    }
  }
  const renderList = (listMsg, isOwn) => {
    for (const msgDiv of listMsg) {
      const msg = msgDiv.textContent;
      let rightEl = msgDiv.querySelector('.right-message')
      let check = false;
      if(isOwn) {
        check = rightEl ? !rightEl.nextSibling : false
      }else{
        check = msgDiv.parentNode.childElementCount == 2
      }
      if (check) {
        if ((oneworld.settingCfg.sendtranslation && !isOwn) || (oneworld.settingCfg.tranflag && isOwn)) {
          insterDiv(msgDiv, 'autofanyi', '...', isOwn);
          autoFanyi(msg, msgDiv, isOwn);
        } else {
          insterDiv(msgDiv, 'click-fanyi', '点击翻译', isOwn);
          msgDiv.parentNode
            .querySelector('.click-fanyi')
            .addEventListener('click', e => clickFanyi(e, isOwn));
        }
      }
    }
  };

  const autoFanyi = async (msg, msgDiv, isOwn) => {
    // 自动翻译时隐藏点击翻译按钮
    let clickfanyi = msgDiv.parentNode.querySelector('.click-fanyi');
    if (clickfanyi) {
      msgDiv.parentNode.querySelector('.click-fanyi').removeEventListener('click', clickFanyi);
      msgDiv.parentNode.removeChild(clickfanyi)
    };

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
    if (!res.err && res.body.code == 200) {
      autoFanyi.innerHTML = res.body.data;
    } else if (res.body.code == 500) {
      autoFanyi.innerHTML = res.body.msg;
    } else {
      autoFanyi.innerHTML = '翻译失败';
    }
  };

  const clickFanyi = async (e, isOwn) => {
    let div = getEventTarget(e);
    let msg = div.previousSibling.textContent;
    const res = await Ferdium.getTran({
      word: msg,
      from: isOwn ? oneworld.settingCfg.sfrom : oneworld.settingCfg.jfrom,
      to: isOwn ? oneworld.settingCfg.sto : oneworld.settingCfg.jto,
      type: oneworld.settingCfg.type,
    }, oneworld.token);
    if (!res.err && res.body.code === 200) {
      div.textContent = res.body.data;
    } else if (res.body.code === 500) {
      div.textContent = res.body.msg;
    } else {
      div.textContent = '翻译失败';
    }
    div.removeEventListener('click', clickFanyi);
  };

  //获取主消息列表
  const getMainView = () => {
    return document.querySelector(classname.main);
  };
  //获取好友列表
  const getFriendView = () => {
    return document.querySelectorAll(classname.friendList);
  };

  const insterDiv = (parent, className, msg, isOwn) => {
    const reTranEl = document.createElement('span');
    reTranEl.style.cssText =
      'font-size:12px;position:absolute;right:0px;top:25px;';
    reTranEl.textContent = '重译';
    reTranEl.addEventListener('click', async () => {
      const text = parent.textContent
      const params = getResData(text, isOwn);
      await Ferdium.getTran(params, oneworld.token, true).then(res => {
        parent.parentElement.querySelector(`.${className}`).textContent =
          res.body.data;
      });
    });
    // parent.parentElement.append(reTranEl);
    parent.parentElement.style.position = 'relative'
    parent.insertAdjacentHTML(
      'afterEnd',
      `<div class="${className}" style="margin-right:28px;font-size:${oneworld.settingCfg.fontsize}px;color:${oneworld.settingCfg.fontcolor}">${msg}</div>`,
    );
  };

  const getEventTarget = e => {
    e = window.event || e;
    return e.srcElement || e.target;
  };

  //检测是否全数字
  const isNumber = str => {
    var patrn = /^(-)?\d+(\.\d+)?$/;
    return patrn.exec(str) == null || str == '' ? false : true;
  };
  // 掩饰
  const setTimeForFunc = (func, time) => {
    setTimeout(func, time);
  };
  const isGroup = () => {
    return false;
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
