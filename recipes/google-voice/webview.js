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
      clickSendBtn();
    }, 500);
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

  const classnameCfg = {
    ipt: '.ng-valid.md-input.gvMessageEntry-input',
    main: '.list.ng-star-inserted',
    allMsg: '.gvThreadDetails-root .content.ng-star-inserted',
    friendList: '.md-virtual-repeat-scroller',
    sendBtnParent:
      '.layout-align-center-center.layout-column.flex-nogrow.gvMessageEntry-sendContainer',
    sendBtn: 'button.mat-focus-indicator',
    groupflagEl: '.gvThreadItem-selected .gvThreadItem-avatarParticipants .avatar.ng-star-inserted'
  };

  function parseQuery(query) {
    const el = document.querySelector(query);
    return el && Ferdium.safeParseInt(el.textContent);
  }

  const getMessages = () => {
    const el = document.querySelector('.msgCount');
    let count;

    if (el && el.textContent) {
      count = Ferdium.safeParseInt(el.textContent.replace(/[ ()]/gi, ''));
    } else {
      const count_messages = parseQuery(
        'a[gv-test-id="sidenav-calls"] .navItemBadge.ng-star-inserted',
      );
      const count_calls = parseQuery(
        'a[gv-test-id="sidenav-messages"] .navItemBadge.ng-star-inserted',
      );
      const count_voicemails = parseQuery(
        'a[gv-test-id="sidenav-voicemail"] .navItemBadge.ng-star-inserted',
      );
      count = count_messages + count_calls + count_voicemails;
    }

    Ferdium.setBadge(count);
  };

  Ferdium.loop(getMessages);
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

  const listerFriendList = () => {
    document.addEventListener(
      'click',
      e => {
        setTimeForFunc(() => {
          addClickLister(e);
        }, 1000);
      },
      true,
    );
  };

  const addClickLister = e => {
    let parent = getFriendView();
    let target = e.target;
    if (parent && target && parent.contains(target)) {
      addFreshEvent()
    };
  };

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

  const freshChatList = () => {
    let view = getMainView();
    if (!view) return;
    let msgList = document.querySelectorAll(classnameCfg.allMsg);
    for (const msgDiv of msgList) {
      const msg = msgDiv.textContent;
      const check = msgDiv.parentNode.childElementCount === 1;
      const isOwn =
        msgDiv.parentElement.parentElement.className.includes('outgoing');
      if (check) {
        if ((oneworld.settingCfg.sendtranslation && !isOwn) || (oneworld.settingCfg.tranflag && isOwn)) {
          // 如果是群聊则跟进群聊开关判断
          if((isGroup() && oneworld.settingCfg.groupflag) || !isGroup()) {
            insterDiv(msgDiv, 'autofanyi', '...', isOwn);
            autoFanyi(msg, msgDiv, isOwn);
          }else{
            insterDiv(msgDiv, 'click-fanyi', '点击翻译', isOwn);
            msgDiv.parentNode
              .querySelector('.click-fanyi')
              .addEventListener('click', e => clickFanyi(e, isOwn), true);
          }
        } else {
          insterDiv(msgDiv, 'click-fanyi', '点击翻译', isOwn);
          msgDiv.parentNode
            .querySelector('.click-fanyi')
            .addEventListener('click', e => clickFanyi(e, isOwn), true);
        }
      }
    }
  };
  // 判断是群聊还是私聊, true 群聊
  const isGroup = () => {
    let el = document.querySelectorAll(classnameCfg.groupflagEl)
    return el.length > 1
  }
  const autoFanyi = async (msg, msgDiv, isOwn) => {
    // 自动翻译时隐藏点击翻译按钮
    let clickfanyi = msgDiv.parentNode.querySelector('.click-fanyi');
    if (clickfanyi) {
      clickfanyi.removeEventListener('click', clickFanyi);
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
    let params = getResData(msg, false);
    let res = await Ferdium.getTran(params, oneworld.token, isOwn);
    if (!res.err && res.body.code === 200) {
      let result = res.body.data;
      result = result.replace(/&#39;/gi, '\'');
      autoFanyi.innerHTML = result;
    } else if (res.body.code === 500) {
      autoFanyi.textContent = res.body.msg;
    } else {
      autoFanyi.textContent = '翻译失败';
    }
  };

  const clickFanyi = async (e, isOwn) => {
    let div = getEventTarget(e);
    let msg = div.parentNode.querySelector(classnameCfg.allMsg).textContent;
    // let params = getResData(msg);
    let res = await Ferdium.getTran({
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

  const getMainView = () => {
    return document.querySelector(classnameCfg.main);
  };

  const getFriendView = () => {
    return document.querySelector(classnameCfg.friendList);
  };

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
          if(!msg) {
            return
          }
          let ipt = document.querySelector(classnameCfg.ipt);
          handleSendMessage(ipt, msg);
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
  };

  const getIptSendMsg = () => {
    let ipt = document.querySelector(classnameCfg.ipt);
    return ipt.value;
  };

  /**
   * 发送消息
   * !本输入框使用的是textarea  修改innerHtml innerText均无效
   */
  const handleSendMessage = async (documents, context) => {
    let params = getResData(context, true, true);
    params.isSend = true;
    const res = await Ferdium.getTran(params, oneworld.token, true);
    if (res.err) {
      console.log(res.err, 'md-error');
      return;
    }
    let result;
    if (res.body.code === 500) {
      result = res.body.msg;
      documents.value = result;
    }
    if (res.body.code === 200 && res.body.data) {
      result = res.body.data;
      result = result.replace(/</gi, '&lt;'); // 过滤所有的<
      result = result.replace(/>/gi, '&gt;'); // 过滤所有的>
      result = result.replace(/&#39;/gi, '\'');
      documents.value = result;
      const evtInput = window.document.createEvent('HTMLEvents');
      evtInput.initEvent('input', true, true);
      documents.dispatchEvent(evtInput);
      setTimeout(() => {
        clickSendBtn();
      }, 500);
    }
  };

  const clickSendBtn = () => {
    let sendBtn = document
      .querySelector(classnameCfg.sendBtnParent)
      .querySelector(classnameCfg.sendBtn);
    sendBtn.click();
  };

  const insterDiv = (parent, className, msg, isOwn) => {
    const reTranEl = document.createElement('span');
    reTranEl.style.cssText =
      'font-size:12px;position:absolute;right:8px;top:25px;';
    reTranEl.textContent = '重译';
    reTranEl.addEventListener('click', async () => {
      const text = parent.textContent;
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

  const replaceAllHtml = data => {
    if(!data) {
      return ''
    }
    data = data.replace(/<\/?[^>]+>/g, ''); // 过滤所有html
    data = data.replace(/&lt;/gi, '<'); // 过滤所有的&lt;
    data = data.replace(/&gt;/gi, '>'); // 过滤所有的&gt;
    data = data.trim(); // 过滤所有的空格
    return data;
  };
};
