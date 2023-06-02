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
    ipt: 'div[aria-label="发消息"]',
    sendBtn: 'div[aria-label="按 Enter 键发送"]',
    main: '.xc8icb0.x1ja2u2z',
    allMsgWrap: '.x9f619.x1ja2u2z.x193iq5w.xeuugli.x1r8uery.x1iyjqo2.xs83m0k.x78zum5.xdt5ytf.x6ikm8r.x10wlt62.x1n2onr6',
    allMsg: '.x9f619.x1n2onr6.x1ja2u2z.__fb-light-mode',
    allMsgTxt: '.x6prxxf.x1fc57z9.x1yc453h.x126k92a',
    friendList: 'div[aria-label="聊天"]',
    groupflagEl: '.x6s0dn4.xcrg951.xgqcy7u.x1lq5wgf.x78zum5.x2lah0s.x10w6t97.x1qughib.x6ikm8r.x10wlt62.x1y1aw1k.x1sxyh0.xwib8y2.xurb0ha.x1n2onr6.xhtitgo.x7m3og9 .x1lliihq.x193iq5w.x1us19tq.xl1xv1r',
    groupflagEl2: '.x9f619.x1n2onr6.x1ja2u2z.x78zum5.x1r8uery.x1iyjqo2.xs83m0k.xeuugli.x1qughib.x6s0dn4.xozqiw3.x1q0g3np.xykv574.xbmpl8g.x4cne27.xifccgj .x1lliihq.x193iq5w.x1us19tq.xl1xv1r'
  };

  Ferdium.ipcRenderer.on('service-settings-update', (res, data) => {
    updateSettingData(data);
  });
  Ferdium.ipcRenderer.on('send-info', () => {
    setTimeout(() => {
      document.querySelector(classname.sendBtn).click();
    }, 500);
  });

  const getMessages = () => {
    const count = document.querySelector(
      '.x6s0dn4.x3nfvp2.x5yr21d.xl56j7k.xexx8yu.x1mpkggp',
    )?.textContent;
    Ferdium.setBadge(count);
  };

  const getActiveDialogTitle = () => {
    const element = [
      document.querySelector(
        '.cbu4d94t:not(.kr9hpln1) .l9j0dhe7 .pfnyh3mw .g5gj957u .ni8dbmo4.stjgntxs.g0qnabr5.ltmttdrg.ekzkrbhg.mdldhsdk.oo9gr5id',
      ),
      document.querySelector(
        '.j83agx80.cbu4d94t.d6urw2fd.dp1hu0rb.l9j0dhe7.du4w35lb:not(.kr9hpln1) .rq0escxv[role="main"] .t6p9ggj4.tkr6xdv7 .d2edcug0.j83agx80.bp9cbjyn.aahdfvyu.bi6gxh9e .a8c37x1j.ni8dbmo4.stjgntxs.l9j0dhe7.ltmttdrg.g0qnabr5.ojkyduve a.lzcic4wl.gmql0nx0.gpro0wi8.lrazzd5p',
      ),
    ].find(Boolean);

    Ferdium.setDialogTitle(element ? element.textContent : null);
  };

  const loopFunc = () => {
    getMessages();
    getActiveDialogTitle();
  };

  Ferdium.loop(loopFunc);

  //初始化
  Ferdium.initLocalData(settings.localReadData);
  Ferdium.initOneWorld(() => {
    setTimeout(() => {
      console.log('ready to translation');
      setTimeForFunc(listerFriendList, 500);
      let mainLoop = setInterval(() => {
        const main = getMainView();
        if (main) {
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
        if (isGroup(event.target,2) && !oneworld.settingCfg.groupflag) return;
        if (key === 'Enter') {
          let msg = event.target.textContent;
          msg = replaceAllHtml(msg);
          if(!msg) {
            return
          }
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
    const params = getResData(context, true, true);
    params.isSend = true;
    const res = await Ferdium.getTran(params, oneworld.token);
    if (res.err) {
      console.log(res.err, 'md-error');
      return;
    }
    const textEl = documents.querySelector('span').childNodes[0];
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
        document.querySelector(classname.sendBtn).click();
      }, 500);
    }
  };

  /**删除所有HTML */
  // eslint-disable-next-line unicorn/consistent-function-scoping
  const replaceAllHtml = data => {
    if(!data){
      return ''
    }
    data = data.trim()
    data = data.replace(/<\/?[^>]+>/g, ''); // 过滤所有html
    data = data.replace(/&lt;/gi, '<'); // 过滤所有的&lt;
    data = data.replace(/&gt;/gi, '>'); // 过滤所有的&gt;
    data = data.trim(); // 过滤所有的空格
    return data;
  };

  const getIptSendMsg = () => {
    return document.querySelector(classname.ipt).textContent;
  };

  //获取主消息列表
  const getMainView = () => {
    return document.querySelector(classname.main);
  };

  //好友列表监听
  const listerFriendList = () => {
    document.addEventListener(
      'click',
      () => {
        setTimeForFunc(() => {
          addClickLister();
        }, 1000);
      },
      true,
    );
  };

  //监听是否点击到好友列表
  const addClickLister = () => {
    setTimeForFunc(addFreshEvent, 500);
  };

  const addFreshEvent = () => {
    let view = getMainView();
    if (view) {
      freshChatList();
      view.removeEventListener('DOMNodeInserted', freshChatList);
      view.addEventListener('DOMNodeInserted', freshChatList, true);
    }
  };
  // 判断是群聊还是私聊, true 群聊
  const isGroup = (div, type) => {
    let falg = null
    let el = null
    if(!document.querySelector('.x1ey2m1c.x78zum5.x164qtfw.xixxii4.x1vjfegm')) {
      el = document.querySelectorAll(classname.groupflagEl2)
      falg = el && el.length > 1
    }else{
      try {
        let curPanel = null
        if(type == 2) {
          curPanel = div.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode
        }else{
          curPanel = div.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode
        }
        el = curPanel ? curPanel.querySelectorAll(classname.groupflagEl) : null
        falg = el && el.length > 1
      } catch (error) {
        
      }
    }
    return falg
  }
  const freshChatList = () => {
    let msgList = []
    if(!document.querySelector('.x1ey2m1c.x78zum5.x164qtfw.xixxii4.x1vjfegm')) {
      msgList = document.querySelector(classname.allMsgWrap).querySelectorAll(classname.allMsg);
    }else{
      msgList = document.querySelectorAll(classname.allMsg);
    }
    for (const msg of msgList) {
      const isOwn =
        msg.parentElement.style.backgroundColor === 'rgb(0, 132, 255)';
      const text = msg.parentNode.querySelector(classname.allMsgTxt)?.textContent;
      const check = msg.parentNode.childElementCount === 1;
      
      if (check){
        if ((oneworld.settingCfg.sendtranslation && !isOwn) || (oneworld.settingCfg.tranflag && isOwn)) {
          if((isGroup(msg) && oneworld.settingCfg.groupflag) || !isGroup(msg)) {
            insterDiv(msg, 'autofanyi', '...', isOwn);
            autoFanyi(text, msg, isOwn);
          }else{
            insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
            msg.parentNode
              .querySelector('.click-fanyi')
              .addEventListener('click', e => clickFanyi(e, isOwn), true);
          }
        } else {
          insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
          msg.parentNode
            .querySelector('.click-fanyi')
            .addEventListener('click', e => clickFanyi(e, isOwn), true);
        }
      }
    }
  };

  const clickFanyi = async (e, isOwn) => {
    let div = getEventTarget(e);
    let msg = div.parentNode.querySelector(classname.allMsgTxt)?.textContent;
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

  // 获取事件目标
  const getEventTarget = e => {
    e = window.event || e;
    return e.srcElement || e.target;
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
    const reTranEl = document.createElement('span');
    reTranEl.style.cssText =
      'font-size:12px;position:absolute;right:8px;top:25px;';
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
