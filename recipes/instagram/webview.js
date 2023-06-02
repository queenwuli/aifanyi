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

  Ferdium.ipcRenderer.on('service-settings-update', (res, data) => {
    updateSettingData(data);
  });
  Ferdium.ipcRenderer.on('send-info', () => {
    setTimeout(() => {
      document.querySelector(classnameCfg.sendBtn)?.click();
    }, 500);
  });

  const classnameCfg = {
    ipt: '._ab5w ._acrb .xeuugli textarea',
    main: '.x78zum5.xdt5ytf.x1iyjqo2.x6ikm8r.x5yr21d.xh8yej3',
    allMsg: '.x6prxxf.x1fc57z9.x1yc453h.x126k92a',
    friendList: '._abyk',
    friendList2: '.x9f619.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x2lah0s.x193iq5w.xeuugli.xvbhtw8',
    sendBtn: '._acrb .x2lah0s .xjqpnuy',
    sendBtn2: '.x1i10hfl.xjqpnuy.xa49m3k.xqeqjp1.x2hbi6w.xdl72j9.x2lah0s.xe8uvvx.xdj266r.xat24cr.x1mh8g0r.x2lwn1j.xeuugli.x1hl2dhg.xggy1nq.x1ja2u2z.x1t137rt.x1q0g3np.x1lku1pv.x1a2a7pz.x6s0dn4.xjyslct.x1ejq31n.xd10rxx.x1sy0etr.x17r0tee.x9f619.x1ypdohk.x1i0vuye.xwhw2v2.xl56j7k.x17ydfre.x1f6kntn.x2b8uid.xlyipyv.x87ps6o.x14atkfc.x1d5wrs8.x972fbf.xcfux6l.x1qhh985.xm0m39n.xm3z3ea.x1x8b98j.x131883w.x16mih1h.xt0psk2.xt7dq6l.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1n2onr6.xjbqb8w.x1n5bzlp.x173jzuc.x1yc6y37.xfs2ol5',
    groupflagEl: '._ab61 ._acan._acao._acas._aj1-'
  };

  const getMessages = () => {
    const element = document.querySelector('a[href^="/direct/inbox/"]');
    let spanEl = element?.querySelector('.xwmz7sl.xo1l8bm.x1ncwhqj.xyqdw3p.x1mpkggp.xg8j3zb.x1t2a60a')
    Ferdium.setBadge(spanEl ? Ferdium.safeParseInt(spanEl.textContent) : 0);
  };

  Ferdium.loop(getMessages);

  // https://github.com/ferdium/ferdium-recipes/blob/9d715597a600710c20f75412d3dcd8cdb7b3c39e/docs/frontend_api.md#usage-4
  // Helper that activates DarkReader and injects your darkmode.css at the same time
  Ferdium.handleDarkMode(isEnabled => {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    const isDarkModeParam = searchParams.get('theme');
    let changedParams = false;
    if (isEnabled) {
      !isDarkModeParam
        ? searchParams.set('theme', 'dark') && (changedParams = true)
        : null;
    } else {
      isDarkModeParam
        ? searchParams.delete('theme', 'dark') && (changedParams = true)
        : null;
    }
    changedParams
      ? (url.search = searchParams.toString()) &&
        (window.location.href = url.toString())
      : null;
  });

  Ferdium.injectCSS(_path.default.join(__dirname, 'service.css'));
  
  // 是否正在翻译
  let isTranslating = false
  const addKeyDownAndTran = () => {
    document.addEventListener(
      'keydown',
      event => {
        if(event.key === 'Enter') {
          let msg = getIptSendMsg(event.target);
          if(!msg) return
          if(isNumber(msg)) return
          if (!oneworld.settingCfg.tranflag) return;
          if (isGroup() && !oneworld.settingCfg.groupflag) return;
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          if(isTranslating) return;
          isTranslating = true
          handleSendMessage(event.target, msg);
        }
      },
      true,
    );
  };

  const listerFriendList = () => {
    document.addEventListener(
      'click',
      e => {
        if(getFriendView()?.contains(e.target)) {
          addFreshEvent()
        }
        if(getFriendView2()?.contains(e.target)) {
          let timer = setInterval(() => {
            let view = getMainView();
            if (view) {
              addFreshEvent()
              clearInterval(timer)
              timer = null
            }
          }, 200)
        }
        try {
          if(e.target && e.target.className && e.target.className.includes('x1i10hfl xjqpnuy xa49m3k')) {
            let timer = setInterval(() => {
              let view = getMainView();
              if (view) {
                addFreshEvent()
                clearInterval(timer)
                timer = null
              }
            }, 200)
          }
        } catch (error) {
          
        }
        
      },
      true,
    );
  };

  const getMainView = () => {
    return document.querySelector(classnameCfg.main);
  };
  const freshChatList = () => {
    let msgList = document.querySelectorAll(classnameCfg.allMsg);
    for (const msgDiv of msgList) {
      const msg = msgDiv.textContent;
      const check = msgDiv.parentElement.childElementCount === 1;
      if(check) {
        let isOwn = msgDiv.className.includes('x14ctfv');
        if ((oneworld.settingCfg.sendtranslation && !isOwn) || (oneworld.settingCfg.tranflag && isOwn)) {
          // 如果是群聊则跟进群聊开关判断
          if((isGroup() && oneworld.settingCfg.groupflag) || !isGroup()) {
            insterDiv(msgDiv, 'autofanyi', '...', isOwn);
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
    freshChatList2()
  };
  const freshChatList2 = () => {
    let msgList = document.querySelectorAll('.x26u7qi.x126k92a.x16b4vue.xm0m39n.x1qlqyl8.x1fc57z9.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xbfkjp0.xfs7jpi.x1e826z5.xxom0vf.x1vvkbs.x14ctfv');
    for (const msgDiv of msgList) {
      const msg = msgDiv.textContent;
      const check = msgDiv.parentElement.childElementCount === 1;
      if(check) {
        let isOwn = msgDiv.parentElement.parentElement.className.includes('x14ctfv')
        if ((oneworld.settingCfg.sendtranslation && !isOwn) || (oneworld.settingCfg.tranflag && isOwn)) {
          // 如果是群聊则跟进群聊开关判断
          if((isGroup() && oneworld.settingCfg.groupflag) || !isGroup()) {
            insterDiv(msgDiv, 'autofanyi', '...', isOwn);
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
  };

  const addFreshEvent = () => {
    let view = getMainView();
    if (view) {
      freshChatList();
      view.removeEventListener('DOMNodeInserted', freshChatList);
      view.addEventListener('DOMNodeInserted', freshChatList, true);
    }
  };
  Ferdium.initLocalData(settings.localReadData);
  Ferdium.initOneWorld(() => {
    console.log('ready to translation');
    let timer = setInterval(() => {
      let view = getMainView();
      if (view) {
        addFreshEvent()
        clearInterval(timer)
        timer = null
      }
    }, 200)
    listerFriendList()
    addKeyDownAndTran()
  });

  // eslint-disable-next-line unicorn/consistent-function-scoping
  const replaceAllHtml = data => {
    data = data.replace(/<\/?[^>]+>/g, ''); // 过滤所有html
    data = data.replace(/&lt;/gi, '<'); // 过滤所有的&lt;
    data = data.replace(/&gt;/gi, '>'); // 过滤所有的&gt;
    data = data.trim(); // 过滤所有的空格
    return data;
  };

  const getIptSendMsg = (div) => {
    let value = ''
    if(div.tagName === 'TEXTAREA') {
      value = div.value
    }else{
      value = div.textContent
    }
    value = value ? replaceAllHtml(value) : ''
    return value;
  };

  /**发送消息 */
  const handleSendMessage = async (documents, context) => {
    const params = getResData(context, true, true);
    params.isSend = true;
    const res = await Ferdium.getTran(params, oneworld.token);
    if (res.err) {
      isTranslating = false
      console.log(res.err, 'md-error');
      return;
    }
    if (res.body.code === 200 && res.body.data) {
      let result = res.body.data;
      result = result.replace(/</gi, '&lt;');
      result = result.replace(/>/gi, '&gt;');
      if(documents.tagName === 'TEXTAREA') {
        documents.value = result;
        const evt = document.createEvent('HTMLEvents');
        evt.initEvent('input', true, true);
        documents.dispatchEvent(evt);
        document.querySelector(classnameCfg.sendBtn)?.click();
      }else{
        documents.querySelector('span').childNodes[0].textContent = result;
        setTimeout(() => {
          document.querySelector(classnameCfg.sendBtn2).click();
        }, 0);
      }
      isTranslating = false
    }else{
      isTranslating = false
      if(documents.tagName === 'TEXTAREA') {
        documents.value = res.body.msg;
      }else{
        documents.textContent = res.body.msg;
      }
    }
  };

  // 判断是群聊还是私聊, true 群聊
  const isGroup = () => {
    let el = document.querySelector(classnameCfg.groupflagEl)
    let imgs = el?el.querySelectorAll("img"):[]
    return imgs.length > 1
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
      autoFanyi.textContent = res.body.data;
    } else if (res.body.code === 500) {
      autoFanyi.textContent = res.body.msg;
    } else {
      autoFanyi.textContent = '翻译失败';
    }
  };

  const clickFanyi = async (e, isOwn, msg) => {
    let div = getEventTarget(e);
    // let params = getResData(msg, isOwn);
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

  const getFriendView = () => {
    return document.querySelector(classnameCfg.friendList);
  };
  const getFriendView2 = () => {
    return document.querySelector(classnameCfg.friendList2);
  };
  const insterDiv = (parent, className, msg, isOwn) => {
    parent.insertAdjacentHTML(
      'afterEnd',
      `<div class="${className}" style="margin-top:5px;font-size:${oneworld.settingCfg.fontsize}px;color:${oneworld.settingCfg.fontcolor}">${msg}</div>`,
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
