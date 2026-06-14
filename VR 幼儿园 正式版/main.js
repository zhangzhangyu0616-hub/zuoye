// ==========================================
// main.js 核心业务逻辑 (无感自动唤醒版)
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
  
  const bear = document.getElementById('bear');
  const hud = document.getElementById('vr-hud');
  const hudAnims = document.getElementById('hud-anims');
  const hudSpeech = document.getElementById('hud-speech');
  const dialogueBox = document.getElementById('ai-dialogue-box');
  const aiText = document.getElementById('ai-text');
  
  let recognition = null;
  let bubbleTimer = null;
  let restartTimeout = null;
  let hasStarted = false; // 防重复执行锁

  function showSpeechBubble(text) {
    if (!dialogueBox || !aiText) return;
    clearTimeout(bubbleTimer);
    dialogueBox.style.display = 'block';
    aiText.innerText = text;
    
    bubbleTimer = setTimeout(() => {
      dialogueBox.style.display = 'none';
    }, 7000);
  }

  window.updateHudStatus = function(latestSpeech = "正在实时聆听...") {
    if (!hud) return;
    hud.style.borderColor = "#CCFF02";
    hud.style.color = "#CCFF02";
    if (window.realAnims && window.realAnims.length > 0) {
      if (hudAnims) hudAnims.textContent = window.realAnims.join(' , ');
    }
    if (hudSpeech) hudSpeech.textContent = `"${latestSpeech}"`;
  };

  function safeStartRecognition() {
    if (!recognition) return;
    try {
      recognition.start();
      window.updateHudStatus("实时聆听中...");
    } catch (e) {}
  }

  async function requestAIResponse(userSpeech) {
    showSpeechBubble("多多正在思考中...🤔");

    if (!window.AI_CONFIG || !window.AI_CONFIG.USE_REAL_AI) {
      setTimeout(() => {
        let reply = "听到了！你刚刚说的是：'" + userSpeech + "'。感觉非常有意思！";
        showSpeechBubble(reply);
        if (window.speakText) window.speakText(reply);
        window.isProcessingAI = false;
        safeStartRecognition();
      }, 400);
      return;
    }

    try {
      const response = await fetch(window.AI_CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.AI_CONFIG.API_KEY}`
        },
        body: JSON.stringify({
          model: window.AI_CONFIG.MODEL,
          messages: [
            { role: "system", content: "你是一只生活在VR环境里的小熊,大名叫permpoon，小名叫多多，生日是2023.08.15，喜欢跳舞卖萌耍酷，爸爸叫pond,父亲叫phuwin，父亲和爸爸很恩爱，我是你的姐姐。请用简短、可爱、带有亲和力的语气回答，严禁超过25个字！" },
            { role: "user", content: userSpeech }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        showSpeechBubble(`❌ 服务器开小差了`);
        return; 
      }

      const data = await response.json();
      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        const aiReply = data.choices[0].message.content;
        showSpeechBubble(aiReply);
        if (window.speakText) window.speakText(aiReply);
      } else {
        showSpeechBubble("小熊摇了摇耳朵，不知道怎么回答...");
        if (window.speakText) window.speakText("小熊不知道怎么回答...");
      }

    } catch (error) {
      console.error("AI接入出错:", error);
      showSpeechBubble("网络请求失败，请检查网络...");
    } finally {
      window.isProcessingAI = false;
      setTimeout(() => { safeStartRecognition(); }, 400);
    }
  }

  function startVoice() {
    if (hasStarted) return;

    // 重点：如果在室外页面（没有熊模型的地方），就不用启动声音和麦克风
    if (!bear || !dialogueBox) return;

    hasStarted = true;

    if (hud) hud.style.display = 'block';
    window.updateHudStatus();

    const welcomeMsg = "欢迎来到VR幼儿园！我是多多。";
    showSpeechBubble(welcomeMsg + "🌱");
    if (window.speakText) window.speakText(welcomeMsg);

    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (e) {}

    if ('webkitSpeechRecognition' in window || 'speechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true; 
      recognition.lang = 'zh-CN';

      recognition.onresult = function(event) {
        if (window.isProcessingAI) return;

        let liveText = event.results[event.results.length - 1][0].transcript.trim();
        if (!liveText) return;

        window.updateHudStatus(liveText);

        if (bear) {
            const core = bear.components ? bear.components['bear-native-core'] : null;
            if (core) {
                if (liveText.includes('不要') || liveText.includes('不对') || liveText.includes('不是') || liveText.includes('别') || liveText.includes('不')) {
                  core.playNativeAnim('reject'); 
                } else if (liveText.includes('你好') || liveText.includes('对') || liveText.includes('是的') || liveText.includes('好') || liveText.includes('嗯')) {
                  core.playNativeAnim('nod'); 
                }
            }
        }

        if (event.results[event.results.length - 1].isFinal) {
          window.isProcessingAI = true; 
          try { recognition.stop(); } catch(e) {} 
          requestAIResponse(liveText);
        }
      };

      recognition.onerror = function(event) { 
        if (event.error === 'aborted') {
          window.isProcessingAI = true; 
          setTimeout(() => { window.isProcessingAI = false; }, 1200); 
        }
      };
      
      recognition.onend = function() { 
        if (!window.isProcessingAI) { 
          clearTimeout(restartTimeout);
          restartTimeout = setTimeout(() => { safeStartRecognition(); }, 1000);
        } 
      };
      
      safeStartRecognition();
    }
  }

  // ==== 完美绕过浏览器安全策略 ====
  // 用户的任意一次滑动屏幕、点击屏幕，都会悄悄激活语音功能！
  document.addEventListener('click', startVoice, { once: true });
  document.addEventListener('touchstart', startVoice, { once: true });
  
  // 玩家如果按了屏幕右下角进入VR，同样立刻激活
  const scene = document.querySelector('a-scene');
  if (scene) {
    scene.addEventListener('enter-vr', startVoice, { once: true });
  }

  // 贴心提示：如果进入室内 3 秒后玩家还没碰屏幕，提醒他们一下
  if (bear && dialogueBox) {
    setTimeout(() => {
      if (!hasStarted) {
        showSpeechBubble("👋 随便滑动一下屏幕来唤醒多多吧！");
      }
    }, 3000);
  }
});