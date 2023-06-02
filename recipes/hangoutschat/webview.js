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
    main: '.BltHke.nH.oy8Mbf.VE9Lyc.bn',
    allMsg: '.Zc1Emd.QIJiHb',
    sendBtn: '.U26fgb.mUbCce.fKz7Od.zFe2Ef.m7Rhac.M9Bg4d',
    groupflagEl: '.LrM3We.x1jjEb',
    ipt: '.T2Ybvb.KRoqRc.editable'
  };
  
  Ferdium.ipcRenderer.on('service-settings-update', (res, data) => {
    updateSettingData(data);
  });
  Ferdium.ipcRenderer.on('send-info', () => {
    let view = getMainView();
    sendBtn(view.querySelector(classnameCfg.ipt))
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
    const directMessageSelector = 'div.V6.CL.su.ahD.X9.Y2 span.akt span.XU';
    const indirectMessageSelector = 'div.V6.CL.V2.X9.Y2 span.akt span.XU';
    // get unread direct messages
    let directCount;
    let indirectCount;

    const directCountSelector = document.querySelector(directMessageSelector);
    if (directCountSelector) {
      directCount = Number(directCountSelector.textContent);
    }

    // get unread indirect messages
    const indirectCountSelector = document.querySelector(
      indirectMessageSelector,
    );
    if (indirectCountSelector) {
      indirectCount = Number(indirectCountSelector.textContent);
    }

    // set Ferdium badge
    Ferdium.setBadge(directCount, indirectCount);
  };

  const getActiveDialogTitle = () => {
    
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
      let mainLoop = setInterval(() => {
        let view = getMainView();
        if (view) {
          addKeyDownAndTran();
          setTimeForFunc(addFreshEvent, 500);
          clearInterval(mainLoop);
        }
      }, 500);
      let mainLoop2 = setInterval(() => {
        let iframeEl = window.frames['gtn-roster-iframe-id']
        let listView = iframeEl?.document.querySelector('div[role="list"]');
        if (listView) {
          listerFriendList(listView)
          clearInterval(mainLoop2);
        }
      }, 500);
      let mainLoop3 = setInterval(() => {
        let iframeEl = window.document.querySelector('.Xt')?.getElementsByTagName('iframe')[0]
        let listView = iframeEl?.contentWindow.document.querySelector('div[role="list"]');
        if (listView) {
          listerFriendList(listView)
          clearInterval(mainLoop3);
        }
      }, 500);
    }, 1500);
  });

  const addKeyDownAndTran = () => {
    let view = getMainView();
    view.addEventListener(
      'keydown',
      event => {
        if(event.code === 'Enter') {
          let msg = event.target.textContent;
          msg = replaceAllHtml(msg);
          if(!msg) return
          if(isNumber(msg)) return
          if (!oneworld.settingCfg.tranflag) return;
          if (isGroup() && !oneworld.settingCfg.groupflag) return;
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          handleSendMessage(event.target, msg);
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
    if (res.body.code === 500) {
      documents.textContent = res.body.msg;
    }
    if (res.body.code === 200 && res.body.data) {
      documents.textContent = res.body.data;
      sendBtn(documents)
    }
  };
  const sendBtn = documents => {
    const event = new KeyboardEvent('keydown', {
      keyCode: 13,
      key: 'Enter',
      code: 'EnterEtra',
      bubbles: true,
      composed: true,
    });
    documents.dispatchEvent(event);
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
    let els = document.querySelectorAll(classnameCfg.main)
    let view = null
    for(var i = 0 ; i < els.length; i++) {
      if(els[i].style.display != 'none') {
        view = els[i]
        break
      }
    }
    if(!view) {
      return null
    }
    let iframeEl = view.getElementsByTagName('iframe')[0]
    if(!iframeEl) {
      return null
    }
    return iframeEl.contentWindow.document;
  };
  const listerFriendList = (el) => {
    el.addEventListener('click', () => {
      let num = 0
      let mainLoop = setInterval(() => {
        let view = getMainView();
        if (view) {
          num ++ 
          addKeyDownAndTran();
          setTimeForFunc(addFreshEvent, 500);
          if(num >5) {
            clearInterval(mainLoop);
          }
        }
      }, 500);
    }, true)
  };
  let escapeHTMLPolicy = null
  if (window.trustedTypes && window.trustedTypes.createPolicy) { // Feature testing
    escapeHTMLPolicy = window.trustedTypes.createPolicy('default', {
          createHTML: (string) => string
      });
  }

  const insterDiv = (parent, className, msg, isOwn) => {
    const htmlStr = escapeHTMLPolicy?.createHTML(`${parent.innerHTML}<div class="${className}" style="font-size:${oneworld.settingCfg.fontsize}px;color:${oneworld.settingCfg.fontcolor}">${msg}</div>`);
    parent.innerHTML = htmlStr
  };

  // 判断是群聊还是私聊, true 群聊
  const isGroup = () => {
    let view = getMainView()
    if(!view) {
      return false
    }
    let el = view.querySelector(classnameCfg.groupflagEl)
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
      autoFanyi.textContent = '';
      return
    }
    let params = getResData(msg, isOwn, isSend);
    let res = await Ferdium.getTran(params, oneworld.token);
    if (!res.err && res.body.code == 200) {
      autoFanyi.textContent = res.body.data;
    } else if (res.body.code == 500) {
      autoFanyi.textContent = res.body.msg;
    } else {
      autoFanyi.textContent = '翻译失败';
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
    let view = getMainView();
    if(!view) {
      return
    }
    let msgList = view.querySelectorAll(classnameCfg.allMsg);
    for (const msg of msgList) {
      const text = msg.textContent ? msg.textContent.trim() : '';
      let myName = document.querySelector('.gb_f.gb_3a.gb_v').getAttribute('aria-label')
      myName = myName?.split('：')?.[1]?.split('(')?.[0]?.trim()
      let name = msg.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.querySelector('.njhDLd.O5OMdc').textContent
      name = name?.trim()
      const isOwn = myName == name;
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
    let msg = div.parentNode.textContent;
    msg = msg.substring(0, msg.length-4)
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


  // document.addEventListener('click', e => {
  //   // @ts-ignore
  //   const { tagName, target, href } = e.target;

  //   if (tagName === 'A' && target === '_blank') {
  //     e.preventDefault();
  //     e.stopImmediatePropagation();
  //     window.open(href);
  //   }
  // });
};
