const { setTimeout } = require('timers');

module.exports = (Ferdium, settings) => {
  let oneworld = {
    token: settings.userData.token,
    settingCfg: {
      ...settings.userData.settingCfg,
      sfrom: settings.sfrom,
      sto: settings.sto,
      jfrom: settings.jfrom,
      jto: settings.jto,
      apiUrl: settings.apiUrl,
    },
  };

  // 文件名
  let classname = {
    ipt: '.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1qx5ct2.x37zpob.xtt52l0.xctk3hg.xxymvpz.xh8yej3.x76ihet.xwmqs3e.x112ta8.xxxdfa6.x1f6kntn.x7whbhp.x1j61x8r._58al.uiTextareaAutogrow.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1qx5ct2.x37zpob.xtt52l0.xctk3hg.xxymvpz.xh8yej3.x76ihet.xwmqs3e.x112ta8.xxxdfa6.x1f6kntn.x7whbhp.x1j61x8r',
    ipt2: '._3-8w._2pi7._5id1._4dv_._58al.uiTextareaAutogrow',//ins评论
    ipt3: '._4u-c.x12peec7.x178xt8z.x13fuv20.xkh9tda.x879a55.x78zum5.xl56j7k.xdt5ytf.xurb0ha.x1sxyh0 .xzsf02u.x1a2a7pz.x1n2onr6.x14wi4xw.notranslate',//facebook评论
    main: '.x1yrsyyn.x6x52a7.x10b6aqq.x1egjynq',
    allMsg: '.x1yrsyyn.x6x52a7.x10b6aqq.x1egjynq .x1y1aw1k.xn6708d.xwib8y2.x1ye3gou.x13faqbe.xt0e3qv',
    friendList: '.x5yr21d.xh8yej3.x78zum5.x1n2onr6.xdt5ytf',
    friendList2: '.x78zum5.xdmi676.x193iq5w.x6ikm8r.x10wlt62.x1n2onr6.xmi5d70.x1fvot60.xo1l8bm.xxio538',
    friendList3: 'nav ul._6no_>div>div:nth-child(3)',
    groupflagEl: '.x5yr21d.xh8yej3.x78zum5.x1n2onr6.xdt5ytf ._4k8w._2tms .x10l6tqk.x6ikm8r.x10wlt62.x13vifvy.x17qophe.xh8yej3.x5yr21d.x1o1ewxj.x3x9cwd.x1e5q0jg.x13rtm0m.xtd80it.x1jgp7su.x1q1rkhy.x18tuezv.x1xuqjiz.xhl3afg.x10cdfl8',
  };

  let localReadData = {}
  // 是否正在翻译
  let isTranslating = false
  let hideLoadTimer = null
  let toBeSentTxt = ''

  Ferdium.ipcRenderer.on('service-settings-update', (_, data) => {
    updateSettingData(data);
    oneworld.settingCfg.apiUrl = data.apiUrl;
    oneworld.settingCfg.historytranslation = data.historytranslation;
  });

  Ferdium.ipcRenderer.on('input-focus', () => {
    document.querySelector(classname.ipt)?.focus()
    document.querySelector(classname.ipt2)?.focus()
    document.querySelector(classname.ipt3)?.focus()
  });
  Ferdium.ipcRenderer.on('send-info', (_, data) => {
    let result = data.result;
    let context = data.word;
    let ipt1 = document.querySelector(classname.ipt)
    let ipt2 = document.querySelector(classname.ipt2)
    let ipt3 = document.querySelector(classname.ipt3)
    let documents = ipt1 || ipt2 || ipt3
    if(!documents) {
      return
    }
    if(oneworld.settingCfg.tranflag && oneworld.settingCfg.secondaryConfirmation) {
      toBeSentTxt = result
      showLoading('翻译成功，请确认后再次按下回车发送', 1)
      hideLoadTimer = setTimeout(() => {
        hideLoading()
        clearTimeout(hideLoadTimer)
        hideLoadTimer = null
      }, 3000)
      documents.setAttribute('data-transleted', 1)
      showChineseTrans(result)
    }else{
      clickSendBtn(documents);
    }
    if(result && result !== context) {
      localReadData[result] = context
    }
  });

  function getMessages() {
    let el = document.querySelector(
      '.x6s0dn4.x9f619.x78zum5.xmix8c7.xl56j7k.x16xo4sp.x1t137rt.x1j85h84.xsyo7zv.x16hj40l.x4p5aij.x1n2onr6.xzolkzo.x12go9s9.x1rnf11y.xprq8jg.xmi5d70.xw23nyj.x63nzvj.x140t73q.xuxw1ft.x2b8uid.x117nqv4.x1q6shm8',
    )
    var elements = document.querySelectorAll('nav ._7pon');
    var secondElement = elements[2];
    let redDotEl = secondElement?.querySelector('.xamhcws.xol2nv.xlxy82.x19p7ews.x14yjl9h.xudhj91.x18nykt9.xww2gxu.x1ejq31n.xd10rxx.x1sy0etr.x17r0tee.x1k90msu.x1qfuztq.x10l6tqk.x13vifvy.x3m8u43.x1hc1fzr.xpkcf2w.xg3ouva.xe5zar4.x1g7atq6') || secondElement?.querySelector('.x19hi10v.x14yjl9h.xudhj91.x18nykt9.xww2gxu.x1lliihq.xols6we.x1v4s8kt')
    if(el) {
      Ferdium.setBadge(el.textContent);
    }else{
      if(redDotEl) {
        Ferdium.setBadge(1);
      }else{
        Ferdium.setBadge(0);
      }
    }
  };

  function loopFunc() {
    getMessages();
  };

  Ferdium.loop(loopFunc);

  //初始化
  Ferdium.initLocalData((res) => {
    let obj = {}
    res.forEach(item => {
      obj[item.key] = item.value
    });
    localReadData = obj;
  }, 3);
  
  Ferdium.initOneWorld(() => {
    console.log('ready to translation');
    listerFriendList()
    addKeyDownAndTran();
  });

  function addKeyDownAndTran() {
    document.addEventListener(
      'keydown',
      event => {
        if(event.key === 'Enter' && event.isTrusted) {
          if(!event.shiftKey) {
            initSendEvent(event.target,event)
          }
        }
      },
      true,
    );
  };

  function initSendEvent(documents, event) {
    let msg = getIptSendMsg(documents);
    if(!msg) return
    if(isNumber(msg)) return
    if (!oneworld.settingCfg.tranflag) return;
    if (isGroup() && !oneworld.settingCfg.groupflag) return;
    if (msg == toBeSentTxt && documents?.getAttribute('data-transleted')) {
      documents.removeAttribute('data-transleted')
      hideChineseTrans()
      return
    }
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if(isTranslating) return;
    isTranslating = true
    showLoading()
    handleSendMessage(documents, msg);
  }

  /**发送消息 */
  async function handleSendMessage(documents, context){
    const params = getResData(context, true, true);
    params.isSend = true;
    const res = await Ferdium.getTran(params, oneworld.token);
    if (res.body.code === 200) {
      let result = res.body.data || '';
      result = result.replace(/</gi, '&lt;');
      result = result.replace(/>/gi, '&gt;');
      result = result.replace(/&#39;/gi, '\'');
      if(documents.tagName === 'TEXTAREA' || documents.tagName === 'INPUT') {
        documents.value = result
        const evt = document.createEvent('HTMLEvents');
        evt.initEvent('input', true, true);
        documents.dispatchEvent(evt);
      }else{
        let els = document.querySelector('.xat24cr.xdj266r.xdpxx8g')?.childNodes || []
        let resultArr = result.split('\n')
        let txtEls = []
        resultArr.forEach(() => {
          txtEls.push([])
        })
        let txtIndex = 0
        for(var i = 0; i < els.length; i++) {
          if(els[i].nodeName === 'SPAN' && !els[i].className){
            txtEls[txtIndex]?.push(els[i])
          }else if(els[i].nodeName === 'BR'){
            txtIndex++
          }
        }
        for(var i = 0; i < txtEls.length; i++) {
          let arr = getArr(resultArr[i])
          for(var j = 0; j < txtEls[i].length; j++){
            if(txtEls[i][j].childNodes[0]) {
              if(arr.length <= txtEls[i].length){
                txtEls[i][j].childNodes[0].textContent = arr[j] || ' '
              }else{
                if(j === txtEls[i].length-1){
                  let arrLefts = arr.slice(-(arr.length - txtEls[i].length))
                  txtEls[i][j].childNodes[0].textContent = arr[j] + arrLefts.join('')
                }else{
                  txtEls[i][j].childNodes[0].textContent = arr[j]
                }
              }
            }
          }
        }
      }
      

      if(oneworld.settingCfg.secondaryConfirmation) {
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
      }else{
        setTimeout(() => {
          clickSendBtn(documents);
          hideLoading()
          isTranslating = false
        },200)
      }
      if(result && result !== context) {
        localReadData[result] = context
      }
    }else{
      isTranslating = false
      showLoading(res.body.msg, 2)
      hideLoadTimer = setTimeout(() => {
        hideLoading()
        clearTimeout(hideLoadTimer)
        hideLoadTimer = null
      }, 3000)
    }
  };

  function getArr(data) {
    let result = []
    if(!data) {
      return result
    }
    let arr = data.split(EMOJISTR)
    arr.forEach((item) => {
      if(item) {
        result.push(item)
      }
    })
    return result
  }

  function clickSendBtn(documents) {
    const event = new KeyboardEvent('keydown', {
      keyCode: 13,
      key: 'Enter',
      code: 'Enter',
      bubbles: true,
      composed: true,
    });
    documents.dispatchEvent(event);
  };

  // type: 0默认 1成功 2 失败 
  function showLoading(txt, type){
    clearTimeout(hideLoadTimer)
    hideLoadTimer = null
    let el = document.querySelector('#aitansLoading')
    let color = type === 1 ? '#FE750A' : (type === 2 ? '#f90606' : '#000');
    txt = txt || '正在翻译中 请勿重复敲击回车按键';
    if(el) {
      el.style.display = 'block'
      el.textContent = txt
      el.style.color = color
    }else{
      el = document.createElement('div');
      el.id = 'aitansLoading'
      el.style.cssText = `width: 100%;font-size:14px;margin:-15px auto 0;text-align:center;background: #fff;color:${color};`;
      el.textContent = txt

      let main = null
      let ipt1 = document.querySelector(classname.ipt)
      let ipt2 = document.querySelector(classname.ipt2)
      if(ipt1) {
        main = document.querySelector('.xeuugli.x2lwn1j.x78zum5.xdt5ytf.x1iyjqo2.x5yr21d.x2izyaf .x5yr21d.xh8yej3')
      }else if(ipt2) {
        main = document.querySelector('._4u-c.x9f619.xexx8yu.x4uap5.x18d9i69.xkhd6sd._9hq')
      }else {
        main = document.querySelector('._4u-c.x9f619.x5yr21d.xr1yuqi.xkrivgy.x4ii5y1.x1gryazu.x889kno._9hq')
      }
      if(main) main.append(el);
    }
  }
  function hideLoading(){
    let el = document.querySelector('#aitansLoading')
    if(el) el.style.display = 'none'
  }

  // AI翻译显示中文翻译
  async function showChineseTrans(msg) {
    let txt = ''
    if(msg) {
      let params = getResData(msg, true);
      let res = await Ferdium.transToChinese(params, oneworld.token);
      if (res.body.code === 200) {
        let result = res.body.data || '';
        result = result.replace(/&#39;/gi, '\'');
        result = result.replaceAll('\n','<br>');
        txt = result;
      } else {
        txt = res.body.msg;
      }
    }
    txt = '中文：'+txt
    let el = document.querySelector('#aitansChinese')
    if(el) {
      el.style.display = 'block'
      el.innerHTML = txt
      el.style.color = oneworld.settingCfg.fontcolor
    }else{
      el = document.createElement('div');
      el.id = 'aitansChinese'
      el.style.cssText = `position: absolute; bottom: 0;font-size:14px;padding: 5px 15px;width: 100%;background: #fff;color:${oneworld.settingCfg.fontcolor};`;
      el.textContent = txt

      let main = null
      let ipt1 = document.querySelector(classname.ipt)
      let ipt2 = document.querySelector(classname.ipt2)
      if(ipt1) {
        main = document.querySelector('.xeuugli.x2lwn1j.x78zum5.xdt5ytf.x1iyjqo2.x5yr21d.x2izyaf .x5yr21d.xh8yej3')
        main.style.position='relative'
      }else if(ipt2) {
        main = document.querySelector('._4u-c.x9f619.xexx8yu.x4uap5.x18d9i69.xkhd6sd._9hq')
      }else {
        main = document.querySelector('._4u-c.x9f619.x5yr21d.xr1yuqi.xkrivgy.x4ii5y1.x1gryazu.x889kno._9hq')
      }
      if(main) main.append(el);
    }
  }
  function hideChineseTrans() {
    let el = document.querySelector('#aitansChinese')
    if(el) el.style.display = 'none'
  }

  /**删除所有HTML */
  // eslint-disable-next-line unicorn/consistent-function-scoping
  function replaceAllHtml(data) {
    data = data.replace(/<\/?[^>]+>/g, ''); // 过滤所有html
    data = data.replace(/&lt;/gi, '<'); // 过滤所有的&lt;
    data = data.replace(/&gt;/gi, '>'); // 过滤所有的&gt;
    data = data.trim(); // 过滤所有的空格
    return data;
  };

  const EMOJISTR = '😁'
  function getIptSendMsg(inputEl) {
    if(!inputEl) {
      return ''
    }
    let value  = ''
    if(inputEl.tagName === 'TEXTAREA' || inputEl.tagName === 'INPUT') {
      value = inputEl.value
    }else{
      if(inputEl.querySelector('br') || inputEl.querySelector('span[data-testid="emoji"]')) {
        let childNodes = inputEl.querySelector('.xat24cr.xdj266r.xdpxx8g')?.childNodes || []
        for(var i = 0; i< childNodes.length ; i++) {
          if(childNodes[i].className.includes('x1xsqp64 xiy17q3 x1o6pynw x19co3pv xdj266r xcwd3tp xat24cr x39eecv x2b8uid')){
            value += EMOJISTR
          }else if(childNodes[i].nodeName == "BR"){
            value += '\n'
          }else{
            value += childNodes[i].textContent
          }
        }
      }else{
        value = inputEl.textContent
      }
    }
    value = value ? replaceAllHtml(value) : ''
    return value;
  };

  //获取主消息列表
  function getMainView() {
    return document.querySelector(classname.main);
  };
  function getFriendView() {
    return document.querySelector(classname.friendList);
  };
  function getFriendView2() {
    return document.querySelector(classname.friendList2)
  }
  function getFriendView3() {
    return document.querySelector(classname.friendList3)
  }

  let timer1;
  let timer2;
  let timer3;
  let timer1Count = 0;
  let timer2Count = 0;
  let timer3Count = 0;
  let maxCount = 5

  //好友列表监听
  function listerFriendList() {
    document.addEventListener(
      'click',
      e => {
        if (getFriendView()?.contains(e.target)) {
          timer1Count = 0
          timer1 && clearInterval(timer1)
          timer1 = setInterval(() => {
            let view = getMainView();
            if(view || timer1Count >= maxCount){
              addFreshEvent()
              clearInterval(timer1)
              timer1 = null
            }
            timer1Count++
          }, 500);
        }
        if (getFriendView2()?.contains(e.target)) {
          timer2Count = 0
          timer2 && clearInterval(timer2)
          timer2 = setInterval(() => {
            let view = getMainView();
            if(view || timer2Count >= maxCount){
              addFreshEvent()
              clearInterval(timer2)
              timer2 = null
              
            }
            timer2Count++
          }, 500);
        }
        if (getFriendView3()?.contains(e.target)) {
          timer3Count = 0
          timer3 && clearInterval(timer3)
          timer3 = setInterval(() => {
            let view = getMainView();
            if(view || timer3Count >= maxCount){
              addFreshEvent()
              clearInterval(timer3)
              timer3 = null
              
            }
            timer3Count++
          }, 1500);
        }

        // 点击发送ins消息
        let sendBtnEl = document.querySelector('div[aria-label="发送"]')
        if(sendBtnEl?.contains(e.target)){
          if(e.isTrusted) {
            initSendEvent(document.querySelector(classname.ipt), e)
          }
        }

        // 点击发送ins评论
        let sendBtnEl2 = document.querySelector('.x12peec7.xbktkl8._5aj7 .xnnlda6._4bl7 ._3bwx')
        if(sendBtnEl2?.contains(e.target)){
          if(e.isTrusted) {
            initSendEvent(document.querySelector(classname.ipt2), e)
          }
        }
      },
      true,
    );
  };

  function addFreshEvent() {
    let view = getMainView();
    if(view) {
      freshChatList();
      view.removeEventListener('DOMNodeInserted', freshChatList);
      view.addEventListener('DOMNodeInserted', freshChatList, true);
      setPlaceholderTxt()
    }
  };
  // 判断是群聊还是私聊, true 群聊
  function isGroup() {
    let els = document.querySelectorAll(classname.groupflagEl)
    if(!els.length) {
      return false
    }
    return els.length > 1
  }
  function freshChatList() {
    let msgList = document.querySelectorAll(classname.allMsg);
    let groupFalg = isGroup()
    for (const msg of msgList) {
      const check = !msg.parentNode.querySelector('.click-fanyi') && !msg.parentNode.querySelector('.autofanyi');
      if (check){
        const isOwn = msg.className?.includes('xu4s07t');
        const text = msg.textContent;
        if ((oneworld.settingCfg.sendtranslation && !isOwn) || (oneworld.settingCfg.tranflag && isOwn)) {
          if((groupFalg && oneworld.settingCfg.groupflag) || !groupFalg) {
            insterDiv(msg, 'autofanyi', '翻译中...', isOwn);
            autoFanyi(text, msg, isOwn);
          }else{
            insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
            msg.parentNode
              .querySelector('.click-fanyi')
              .addEventListener('click', e => clickFanyi(e, isOwn, text), true);
          }
        } else {
          insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
          msg.parentNode
            .querySelector('.click-fanyi')
            .addEventListener('click', e => clickFanyi(e, isOwn, text), true);
        }
      }
    }
  };

  async function clickFanyi(e, isOwn, msg) {
    let div = getEventTarget(e);
    div.innerHTML = '翻译中...';
    if(isNumber(msg)){
      div.innerHTML = msg;
      return
    }
    let localData = localReadData[msg]
    if(localData) {
      localData = localData.replace(/&#39;/gi, '\'');
      localData = localData.replaceAll('\n','<br>');
      div.innerHTML = localData;
      return
    }
    let params = getResData(msg, isOwn, false, true);
    params.isClickTrans = true
    let res = await Ferdium.getTran(params, oneworld.token);
    if (res.body.code === 200) {
      let result = res.body.data || '';
      result = result.replace(/&#39;/gi, '\'');
      if(result) {
        localReadData[msg] = result
      }
      result = result.replaceAll('\n','<br>');
      div.innerHTML = result;
    } else if (res.body.code === 500) {
      div.innerHTML = res.body.msg;
    } else {
      div.innerHTML = '翻译失败';
    }
    div.removeEventListener('click', clickFanyi);
  };

  async function autoFanyi(msg, msgDiv, isOwn) {
    let autoFanyi = msgDiv.parentNode.querySelector('.autofanyi');
    if(!autoFanyi) {
      return
    }
    if(!msg || isNumber(msg)){
      autoFanyi.innerHTML = '';
      return
    }
    let localData = localReadData[msg]
    if(localData) {
      localData = localData.replace(/&#39;/gi, '\'');
      localData = localData.replaceAll('\n','<br>');
      autoFanyi.innerHTML = localData;
      return
    }
    let params = getResData(msg, isOwn);
    let res = await Ferdium.getTran(params, oneworld.token);
    if (res.body.code === 200) {
      let result = res.body.data || '';
      result = result.replace(/&#39;/gi, '\'');
      if(result) {
        localReadData[msg] = result
      }
      result = result.replaceAll('\n','<br>');
      autoFanyi.innerHTML = result
    } else {
      autoFanyi.innerHTML = res.body.msg;
    }
  };

  // 获取事件目标
  function getEventTarget(e) {
    e = window.event || e;
    return e.srcElement || e.target;
  };

  //检测是否全数字
  // eslint-disable-next-line unicorn/consistent-function-scoping
  function isNumber(str) {
    var patrn = /^(-)?\d+(\.\d+)?$/;
    return !(patrn.exec(str) == null || str === '');
  };

  function getResData(msgText, isMe, isSend, isClickTrans) {
    let from, to;
    if(isSend) {
      from = oneworld.settingCfg.sfrom;
      to = oneworld.settingCfg.sto;
    } else if(isClickTrans) {
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
      apiUrl: oneworld.settingCfg.apiUrl,
    };
  };

  function insterDiv(parent, className, msg, isOwn) {
    parent.insertAdjacentHTML(
      'afterEnd',
      `<div class="${className}" style="border-radius: 2px;padding: 0 12px 5px;font-size:${oneworld.settingCfg.fontsize}px;color:${oneworld.settingCfg.fontcolor}">${msg}</div>`,
    );
  };
  function setPlaceholderTxt() {
    let el = document.querySelector(classname.ipt)
    if(!el) {
      return
    }
    const {type, sto, tranflag, groupflag, secondaryConfirmation} = oneworld.settingCfg
    if (!tranflag || (isGroup() && !groupflag)) {
      el.setAttribute('placeholder', '消息不翻译发送')
    }else{
      let transType = settings.packageCfg?.[type] || ''
      let language = settings.tranCfg?.[type]?.[sto] || ''
      let confirmTxt = secondaryConfirmation ? '二次确认' : ''
      el.setAttribute('placeholder', '消息通过['+transType+']翻译成['+language+']'+confirmTxt+'发送')
    }
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
    setPlaceholderTxt()
  };

  window.addEventListener('beforeunload', async () => {
    timer1 && clearInterval(timer1)
    timer2 && clearInterval(timer2)
    timer3 && clearInterval(timer3)
    timer1 = null
    timer2 = null
    timer3 = null
    timer1Count = 0;
    timer2Count = 0;
    timer3Count = 0;
  });
};
