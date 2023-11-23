const { setTimeout } = require('timers');
const _path = _interopRequireDefault(require('path'));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
module.exports = (Ferdium, settings) => {
  let oneworld = {
    settingCfg: {
      ...settings.settingCfg
    },
  };

  const classname = {
    ipt: '.mentions-input>textarea.commentWrite',
    sendBtn: '.cCommentWrite .uButton.writeSubmit',
    main: '.cChatList',
    unreadMessageEl: '.badge-module__badge__Eh36I',
    allMsg: '.txt._messageContent',
    groupflagEl: '.sChatHeaderInfoBox .chatTitle'
  };

  let localReadData = {}
  let historyTime = new Date().getTime();
  // 是否正在翻译
  let isTranslating = false
  let hideLoadTimer = null
  let toBeSentTxt = ''

  function getMessages() {
    let tipMsgCount = document.querySelector(classname.unreadMessageEl)?.textContent || 0;
    tipMsgCount = Number(tipMsgCount)
    Ferdium.setBadge(tipMsgCount);
  };

  let $timer = setInterval(getMessages, 2000);

  Ferdium.injectJSUnsafe(_path.default.join(__dirname, 'index.js'));

  Ferdium.initIpcs({
    'service-settings-update': (data) => {
      updateSettingData(data);
      oneworld.settingCfg.historytranslation = data.historytranslation;
    },
    'send-info': (data) => {
      let result = data.result;
      let context = data.word;
      let documents = document.querySelector(classname.ipt)
      if (!documents) {
        return
      }
      documents.focus()
      document.execCommand("insertText", true, result);
      if (oneworld.settingCfg.tranflag && oneworld.settingCfg.secondaryConfirmation) {
        toBeSentTxt = result
        showLoading('翻译成功，请确认后再次按下回车发送', 1)
        hideLoadTimer = setTimeout(() => {
          hideLoading()
          clearTimeout(hideLoadTimer)
          hideLoadTimer = null
        }, 3000)
        documents.setAttribute('data-transleted', 1)
        showChineseTrans(result)
      } else {
        let clickTimer = setTimeout(() => {
          sendBtn(documents);
          clearTimeout(clickTimer)
          clickTimer = null
        }, 200);
      }
      if (result && result !== context) {
        localReadData[result] = context
      }
    }
  })

  Ferdium.initLocalData({
    recipeIndex: 31,
    transRecordCb: (res) => {
      let obj = {}
      res.forEach(item => {
        obj[item.key] = item.value
      });
      localReadData = obj;
    }
  });
  (() => {
    console.log('ready to translation');
    listerFriendList()
    addKeyDownAndTran()
  })();

  function addKeyDownAndTran() {
    document.addEventListener(
      'keydown',
      event => {
        if (event.key === 'Enter' && event.isTrusted) {
          if (!event.shiftKey) {
            initSendEvent(event)
          }
        }
      },
      true,
    );
  };

  function initSendEvent(event) {
    let documents = document.querySelector(classname.ipt)
    let msg = getIptSendMsg();
    if (!msg) return
    if (isNumber(msg)) return
    if (!oneworld.settingCfg.tranflag) return;
    if (isGroup() && !oneworld.settingCfg.groupflag) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (msg == toBeSentTxt && documents?.getAttribute('data-transleted')) {
      documents.removeAttribute('data-transleted')
      hideChineseTrans()
      sendBtn(documents);
      return
    }
    if (isTranslating) return;
    isTranslating = true
    showLoading()
    handleSendMessage(documents, msg);
  }


  /**发送消息 */
  async function handleSendMessage(documents, context) {
    const params = getResData(context, true, true);
    params.isSend = true;
    const res = await Ferdium.getTran(params);
    if (res.body.code === 200) {
      let result = res.body.data || '';
      result = result.replace(/&#39;/gi, '\'');
      documents.value = result;
      const evt = document.createEvent('HTMLEvents');
      evt.initEvent('input', true, true);
      documents.dispatchEvent(evt);
      if (oneworld.settingCfg.secondaryConfirmation) {
        toBeSentTxt = result
        showLoading('翻译成功，请确认后再次按下回车发送', 1)
        hideLoadTimer = setTimeout(() => {
          hideLoading()
          clearTimeout(hideLoadTimer)
          hideLoadTimer = null
        }, 3000)
        documents.setAttribute('data-transleted', 1)
        showChineseTrans(result)
        isTranslating = false
      } else {
        let clickTimer = setTimeout(() => {
          sendBtn(documents);
          hideLoading()
          isTranslating = false
          clearTimeout(clickTimer)
          clickTimer = null
        }, 200)
      }
      if (result && result !== context) {
        localReadData[result] = context
      }
    } else {
      isTranslating = false
      showLoading(res.body.msg, 2)
      hideLoadTimer = setTimeout(() => {
        hideLoading()
        clearTimeout(hideLoadTimer)
        hideLoadTimer = null
      }, 3000)
    }
  };

  function sendBtn(documents) {
    const event = new KeyboardEvent('keydown', {
      keyCode: 13,
      key: 'Enter',
      code: 'Enter',
      bubbles: true,
      composed: true,
    });
    documents.dispatchEvent(event);
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
    let inputEl = document.querySelector(classname.ipt)
    if (!inputEl) {
      return ''
    }
    let value = inputEl.value
    value = value ? replaceAllHtml(value) : ''
    return value;
  };

  // type: 0默认 1成功 2 失败 
  function showLoading(txt, type) {
    clearTimeout(hideLoadTimer)
    hideLoadTimer = null
    let el = document.querySelector('#aitansLoading')
    let color = type === 1 ? '#FE750A' : (type === 2 ? '#f90606' : '#000');
    txt = txt || '正在翻译中 请勿重复敲击回车按键';
    if (el) {
      el.style.display = 'block'
      el.textContent = txt
      el.style.color = color
    } else {
      el = document.createElement('div');
      el.id = 'aitansLoading'
      el.style.cssText = `z-index: 99;bottom: 120px;text-align:center;position: absolute;font-size: 14px;padding: 5px 10px;color:${color};width: 100%;`;
      el.textContent = txt
      let main = document.querySelector('#wrap')
      if (main) {
        main.append(el);
      }
    }
  }
  function hideLoading() {
    let el = document.querySelector('#aitansLoading')
    if (el) el.style.display = 'none'
  }

  // AI翻译显示中文翻译
  async function showChineseTrans(msg) {
    let txt = ''
    if (msg) {
      let params = getResData(msg, true);
      let res = await Ferdium.transToChinese(params, oneworld.token);
      if (res.body.code === 200) {
        let result = res.body.data || '';
        result = result.replace(/&#39;/gi, '\'');
        result = result.replaceAll('\n', '<br>');
        txt = result;
      } else {
        txt = res.body.msg;
      }
    }
    txt = '中文：' + txt
    let el = document.querySelector('#aitansChinese')
    if (el) {
      el.style.display = 'block'
      el.innerHTML = txt
      el.style.color = oneworld.settingCfg.fontcolor
    } else {
      let main = document.querySelector('#wrap')
      if (main) {
        main.insertAdjacentHTML(
          'beforeend',
          `<div id="aitansChinese" style="z-index: 999;bottom: 120px;left:0;right:0;position: absolute;font-size: 14px;padding: 5px 10px;background: #fff;color:${oneworld.settingCfg.fontcolor};">${txt}</div>`
        );
      };
    }
  }
  function hideChineseTrans() {
    let el = document.querySelector('#aitansChinese')
    if (el) el.style.display = 'none'
  }

  // 判断是群聊还是私聊, true 群聊
  function isGroup() {
    let el = document.querySelector(classname.groupflagEl)?.textContent
    let falg;
    try {
      let arr = el.match(/(\d+)/)
      falg = arr[1] > 1
    } catch (error) {
      
    }
    return !!falg
  }

  function listerFriendList() {
    document.addEventListener(
      'click',
      (e) => {
        if (e.target?.className?.includes('click-fanyi')) {
          clickFanyi(e)
          return
        }
        let sendBtnEl = document.querySelector(classname.sendBtn)
        if (sendBtnEl?.contains(e.target)) {
          if (e.isTrusted) {
            initSendEvent(e)
          }
        }
      },
      true,
    );
  };

  function addFreshEvent() {
    Ferdium.findUntil(classname.main).then(view => {
      if (view) {
        freshChatList();
        view.removeEventListener('DOMNodeInserted', freshChatList);
        view.addEventListener('DOMNodeInserted', freshChatList, true);
      }
    }).catch((err) => {
      console.log(err)
    });
  };
  function freshChatList() {
    const msgList = document.querySelectorAll(classname.allMsg);
    const groupFalg = isGroup();
    for (const msg of msgList) {
      const check = !msg.parentNode.querySelector('.autofanyi') && !msg.parentNode.querySelector('.click-fanyi');
      let text = msg.textContent
      if (check) {
        const isOwn = msg.parentElement.parentElement.parentElement.parentElement.className?.includes('logMy');
        if (((oneworld.settingCfg.sendtranslation && !isOwn) || (oneworld.settingCfg.tranflag && isOwn)) && (!groupFalg || (groupFalg && oneworld.settingCfg.groupflag))) {
          if (oneworld.settingCfg.historytranslation) {
            insterDiv(msg, 'autofanyi', '翻译中...', isOwn);
            autoFanyi(text, msg, isOwn);
          } else {
            let localData = localReadData[text]
            if (localData) {
              localData = localData.replace(/&#39;/gi, '\'').replaceAll('\n', '<br>');
              insterDiv(msg, 'autofanyi', localData, isOwn);
            } else {
              let timeStamp = convertToTimestamp(msg.parentNode.parentNode.parentNode.parentNode.querySelector('._copyTextDate')?.textContent)
              if (timeStamp) {
                let timeDifference = timeStamp - historyTime
                if (timeDifference >= -120000) {
                  insterDiv(msg, 'autofanyi', '翻译中...', isOwn);
                  autoFanyi(text, msg, isOwn);
                } else {
                  insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
                }
              } else {
                insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
              }
            }
          }
        } else {
          insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
        }
      }
    }
  };

  function convertToTimestamp(str) {
    if (!str) {
      return 0;
    }
    let timestamp = 0
    try {
      let date = new Date(str)
      timestamp = date.getTime();
    } catch (error) {
      console.log(error, '时间转换错误')
    }
    return timestamp
  }

  async function autoFanyi(msg, msgDiv, isOwn) {
    let autoFanyi = msgDiv.parentNode.querySelector('.autofanyi');
    if (!autoFanyi) {
      return
    }
    if (!msg || isNumber(msg)) {
      autoFanyi.innerHTML = msg;
      return
    }
    let localData = localReadData[msg]
    if (localData) {
      localData = localData.replace(/&#39;/gi, '\'');
      localData = localData.replaceAll('\n', '<br>');
      autoFanyi.innerHTML = localData;
      return
    }
    let params = getResData(msg, isOwn);
    let res = await Ferdium.getTran(params);
    if (res.body.code === 200) {
      let result = res.body.data || '';
      result = result.replace(/&#39;/gi, '\'');
      if (result) {
        localReadData[msg] = result
      }
      result = result.replaceAll('\n', '<br>');
      autoFanyi.innerHTML = result;
    } else {
      autoFanyi.innerHTML = res.body.msg;
    }
  };
  async function clickFanyi(e) {
    let div = getEventTarget(e);
    div.innerHTML = '翻译中...'
    const msg = div.parentNode?.querySelector(classname.allMsg)?.textContent;
    if (isNumber(msg)) {
      div.innerHTML = msg;
      return
    }
    let localData = localReadData[msg]
    if (localData) {
      localData = localData.replace(/&#39;/gi, '\'');
      localData = localData.replaceAll('\n', '<br>');
      div.innerHTML = localData;
      return
    }
    const isOwn = div.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.getAttribute('data-direction') === 'reverse'
    let params = getResData(msg, isOwn, false, true);
    params.isClickTrans = true
    let res = await Ferdium.getTran(params);
    if (res.body.code === 200) {
      let result = res.body.data || '';
      result = result.replace(/&#39;/gi, '\'');
      if (result) {
        localReadData[msg] = result
      }
      result = result.replaceAll('\n', '<br>');
      div.innerHTML = result;
    } else {
      div.innerHTML = res.body.msg;
    }
  };

  function insterDiv(parent, className, msg) {
    parent.insertAdjacentHTML(
      'afterend',
      `<div class="${className}" style="line-height: 1.25;font-size:${oneworld.settingCfg.fontsize}px;color:${oneworld.settingCfg.fontcolor};font-family: '微软雅黑';">${msg}</div>`,
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

  function getResData(msgText, isMe, isSend, isClickTrans) {
    let from, to;
    if (isSend) {
      from = oneworld.settingCfg.sfrom;
      to = oneworld.settingCfg.sto;
    } else if (isClickTrans) {
      from = isMe ? oneworld.settingCfg.sto : oneworld.settingCfg.jfrom;
      to = isMe ? oneworld.settingCfg.sfrom : oneworld.settingCfg.jto;
    } else {
      from = isMe ? oneworld.settingCfg.sto : oneworld.settingCfg.jfrom;
      to = isMe ? oneworld.settingCfg.sfrom : oneworld.settingCfg.jto;
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
    Ferdium.findUntil(classname.ipt).then(textareaEl => {
      if (textareaEl) {
        const { type, sto, tranflag, groupflag, secondaryConfirmation } = oneworld.settingCfg
        if (!tranflag || (isGroup() && !groupflag)) {
          textareaEl?.setAttribute('placeholder', '消息不翻译发送')
        } else {
          let transType = settings.packageCfg?.[type] || ''
          let language = settings.tranCfg?.[type]?.[sto] || ''
          let confirmTxt = secondaryConfirmation ? '二次确认' : ''
          textareaEl?.setAttribute('placeholder', '消息通过[' + transType + ']翻译成[' + language + ']' + confirmTxt + '发送')
        }
      }
    }).catch((err) => {
      console.log(err)
    });
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
    oneworld.settingCfg.secondaryConfirmation = data.secondaryConfirmation;
    oneworld.settingCfg.audioFrom = data.audioFrom;
    setPlaceholderTxt()
  };

  window.addEventListener('beforeunload', async () => {
    $timer && clearInterval($timer);
  });

  window.addEventListener('load', async () => {
    console.log("onload")
    addFreshEvent();
    setPlaceholderTxt();
  });
};