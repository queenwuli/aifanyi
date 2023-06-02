const { setTimeout } = require('timers');
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
    ipt: '#main > footer > div._2lSWV._3cjY2.copyable-area > div > span:nth-child(2) > div > div._1VZX7 > div._3Uu1_',
    main: '#main ._3B19s',
    allMsg: '._21Ahp',
    allMsgTxt: '._21Ahp > ._11JPr',
    friendList: 'div[data-testid="chat-list"]',
    friendList2: '.g0rxnol2.g0rxnol2.thghmljt.p357zi0d.rjo8vgbg.ggj6brxn.f8m0rgwh.gfz4du6o.ag5g9lrv.bs7a17vp',
    sendBtn: '.tvf2evcx.oq44ahr5.lb5m6g5c.svlsagor.p2rjqpw5.epia9gcq',
    groupflagEl: '#main div[data-testid="chat-subtitle"] .ggj6brxn.gfz4du6o.r7fjleex.lhj4utae.le5p0ye3._11JPr.selectable-text.copyable-text',
    scrollTopEl: '#main div[aria-label="滚动到底部"]',
    readMoreBtn: '#main .read-more-button',
    chatIdEl: '._199zF._3j691._2IMPQ ._21S-L'
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
    let indirectCount = 0;
    const directCountSelector = document.querySelectorAll('._1pJ9J span');
    for (const badge of directCountSelector) {
      // badge.querySelector('svg') 是静音的
      if (!badge.querySelector('svg'))
        indirectCount += Ferdium.safeParseInt(badge.textContent);
    }
    Ferdium.setBadge(indirectCount, indirectCount);
  };

  // inject webview hacking script
  // Ferdium.injectJSUnsafe(_path.default.join(__dirname, 'webview-unsafe.js'));

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

  Ferdium.handleDarkMode(isEnabled => {
    if (isEnabled) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  });

  Ferdium.loop(loopFunc);

  Ferdium.injectCSS(_path.default.join(__dirname, 'service.css'));

  const getMainView = () => {
    return document.querySelector(classnameCfg.main);
  };
  //获取好友列表
  const getFriendView = () => {
    return document.querySelector(classnameCfg.friendList)
  };
  const getFriendView2 = () => {
    return document.querySelector(classnameCfg.friendList2);
  };
  const getChatId = () => {
    let el = document.querySelector(classnameCfg.chatIdEl)
    if(!el) {
      return ''
    }
    return 'waplus-'+el.textContent
  }
  const listerFriendList = () => {
    document.addEventListener(
      'click',
      (e) => {
        if(getFriendView()?.contains(e.target)) {
          let chatId = getChatId()
          Ferdium.ipcRenderer.send('setChatInfo', chatId, 'waplus')
        }
        setTimeout(() => {
          if(getFriendView2()?.contains(e.target)) {
            let chatId = getChatId()
            Ferdium.ipcRenderer.send('setChatInfo', chatId, 'waplus')
          }
        }, 0)
      },
      true,
    );
  };

  // 是否正在翻译
  let isTranslating = false
  const addKeyDownAndTran = () => {
    document.addEventListener(
      'keydown',
      event => {
        if(event.key === 'Enter') {
          let msg = getIptSendMsg();
          if(!msg) return
          if(isNumber(msg)) return
          if (!oneworld.settingCfg.tranflag) return;
          if (isGroup() && !oneworld.settingCfg.groupflag) return;
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          if(isTranslating) return;
          isTranslating = true
          handleSendMessage(document.querySelector(classnameCfg.ipt), msg);
        }
      },
      true,
    );
  };

  /**初始化翻译接口 */
  Ferdium.initLocalData(settings.localReadData);
  Ferdium.initOneWorld(() => {
    console.log('ready to translation');
    listerFriendList()
    addKeyDownAndTran()
  });

  const EMOJISTR = '😁'
  const getIptSendMsg = () => {
    let value = ''
    let txt = ''
    let inputEl = document.querySelector(classnameCfg.ipt)
    if(!inputEl) {
      return value
    }
    let el = inputEl.querySelector('p.selectable-text.copyable-text.iq0m558w')
    if(!el) {
      return value
    }
    let childNodes = el.childNodes
    for(var i = 0; i< childNodes.length ; i++) {
      if(childNodes[i].className.includes("fe5nidar khvhiq1o r5qsrrlp i5tg98hk f9ovudaz przvwfww gx1rr48f gfz4du6o r7fjleex nz2484kf svot0ezm dcnh1tix sxl192xd t3g6t33p")) {
        value += EMOJISTR
      }else{
        value += childNodes[i].textContent
        txt +=childNodes[i].textContent
      }
    }
    if(!txt) {
      return ''
    }
    value = value ? replaceAllHtml(value) : ''
    return value;
  };

  /**发送消息 */
  const handleSendMessage = async (documents, context) => {
    let spanEls = documents.querySelectorAll('span.selectable-text.copyable-text')
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
      result = result.replace(/&#39;/gi, '\'');
      let arr = result.split(EMOJISTR)
      let arr2 = []
      arr.forEach((item) => {
        if(item) {
          arr2.push(item)
        }
      })
      for(var i = 0 ; i < spanEls.length; i++) {
        if(spanEls[i].childNodes[0]) {
          spanEls[i].childNodes[0].textContent = arr2[i]||' '
        }
      }
      setTimeout(() => {
        document.querySelector(classnameCfg.sendBtn)?.click();
        isTranslating = false
      }, 0);
    }else{
      isTranslating = false
      for(var i = 0 ; i < spanEls.length; i++) {
        if(spanEls[i].childNodes[0]) {
          spanEls[i].childNodes[0].textContent = ' '
        }
      }
      let textEl = spanEls[0].childNodes[0]
      textEl.textContent = res.body.msg;
    }
  };
  const replaceAllHtml = data => {
    data = data.replace(/<\/?[^>]+>/g, ''); // 过滤所有html
    data = data.replace(/&lt;/gi, '<'); // 过滤所有的&lt;
    data = data.replace(/&gt;/gi, '>'); // 过滤所有的&gt;
    data = data.trim(); // 过滤所有的空格
    return data;
  };
  
  const moveToBottom = () => {
    let btnEl = null
    let num = 0
    let timer = setInterval(() => {
      btnEl = document.querySelector(classnameCfg.scrollTopEl)
      if(btnEl) {
        btnEl.click()
      }else{
        clearInterval(timer)
      }
      num++
      if(num >= 8) {
        clearInterval(timer)
      }
    },200)
  }

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
    let el = document.querySelector(classnameCfg.groupflagEl)
    if(!el) {
      return false
    }
    if(el.getAttribute('title')?.indexOf('群组') > -1 || el.getAttribute('title')?.indexOf('您') > -1) {
      return true
    }
    return false
  }

  function emojiToImg(str, count, emojis) {
    let index = str.indexOf(EMOJISTR)
    if(index === -1) {
      return str
    }
    if(!emojis[count]) {
      return str
    }
    str = str.replace(EMOJISTR, `<img draggable="${emojis[count].getAttribute('draggable')}" src="${emojis[count].getAttribute('src')}"  class="${emojis[count].getAttribute('class')}" style="${emojis[count].getAttribute('style')}" tabindex="${emojis[count].getAttribute('tabindex')}" />`)
    count++
    return emojiToImg(str, count, emojis)
  }
    
  //自动翻译
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
    if (!res.err && res.body.code == 200) {
      let result = res.body.data;
      result = result.replace(/&#39;/gi, '\'');
      let emojis = msgDiv.parentNode.querySelector(classnameCfg.allMsg).querySelectorAll('.emoji')
      autoFanyi.innerHTML = emojiToImg(result, 0, emojis);
    } else if (res.body.code == 500) {
      autoFanyi.innerHTML = res.body.msg;
    } else {
      autoFanyi.innerHTML = '翻译失败';
    }
  };

  /**用户点击其他位置 重新监听页面变化 */
  const addFreshEvent = async () => {
    let view = getMainView();
    if (view) {
      freshChatList();
      rendReadMoreEvent()
      view.removeEventListener('DOMNodeInserted', freshChatList);
      view.addEventListener('DOMNodeInserted', freshChatList, true);
    }
  };
  Ferdium.ipcRenderer.on('chat-settings-update', (res, data) => {
    updateSettingData(data);
    if(data.isReload) {
      addFreshEvent()
      moveToBottom()
    }
  });

  Ferdium.ipcRenderer.on('chat-settings-reload', () => {
    let chatId = getChatId()
    Ferdium.ipcRenderer.send('setChatInfo', chatId, 'waplus')
  });
  const getTxt = (div) => {
    let hasEmoji = div.querySelector('.emoji')
    let text = ''
    if(!hasEmoji) {
      text = div.querySelector('._11JPr.selectable-text.copyable-text') && div.querySelector('._11JPr.selectable-text.copyable-text').textContent;
    }else{
      let childNodes = div.querySelector('span>span') ? div.querySelector('span>span').childNodes : []
      for(var i = 0; i< childNodes.length ; i++) {
        if(childNodes[i].nodeName == "#text") {
          if(childNodes[i].textContent)
          text += childNodes[i].textContent
        }else if(childNodes[i].nodeName == "IMG"){
          text += EMOJISTR
        }
      }
    }
    return text
  }
  /**刷新聊天栏 插入翻译 */
  const freshChatList = () => {
    const msgList = document.querySelectorAll(classnameCfg.allMsg);
    for (const msg of msgList) {
      const check = !msg.parentNode.querySelector('.autofanyi') && !msg.parentNode.querySelector('.click-fanyi');
      if (check) {
        const isOwn = msg.parentElement.parentElement.parentElement.parentElement.parentElement.className.includes('message-out');
        if ((oneworld.settingCfg.sendtranslation && !isOwn) || (oneworld.settingCfg.tranflag && isOwn)) {
          // 如果是群聊则跟进群聊开关判断
          if((isGroup() && oneworld.settingCfg.groupflag) || !isGroup()) {
            const text = getTxt(msg)
            insterDiv(msg, 'autofanyi selectable-text', '翻译中...', isOwn);
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

  const rendReadMoreEvent = () => {
    let moreELs = document.querySelectorAll(classnameCfg.readMoreBtn)
    for(var i = 0; i < moreELs.length; i++) {
      (function(j){
          moreELs[j].onclick = function () {
            const div = moreELs[j].parentNode
            setTimeout(() => {
				const isOwn = div.parentElement.parentElement.parentElement.parentElement.parentElement.className.includes('message-out');
				const text = getTxt(div);
				if(div.parentNode.querySelector('.autofanyi')){
					autoFanyi(text, div, isOwn);
				}
				if(div.parentNode.querySelector('.click-fanyi-translated')){
					reTranslated(text, div, isOwn);
				}
            },1000)
          }
       })(i);
    }
  }
  
  const reTranslated = async (msg, msgDiv, isOwn) => {
    let autoFanyi = msgDiv.parentNode.querySelector('.click-fanyi-translated');
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
      let result = res.body.data;
      result = result.replace(/&#39;/gi, '\'');
      autoFanyi.innerHTML = result;
    } else if (res.body.code == 500) {
      autoFanyi.innerHTML = res.body.msg;
    } else {
      autoFanyi.innerHTML = '翻译失败';
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
    const msg = div.parentNode.querySelector(classnameCfg.allMsgTxt).textContent;
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
    div.className = 'click-fanyi click-fanyi-translated';
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
};
