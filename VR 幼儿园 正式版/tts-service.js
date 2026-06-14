// ==========================================
// tts-service.js语音合成服务 (TTS)
// ==========================================
window.speakText = function(text) {
  // 1. 打断之前的语音
  if (window.currentBearAudio) {
    window.currentBearAudio.pause();
    window.currentBearAudio = null;
  }

  // 2. 过滤 emoji
  const cleanText = text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').trim();
  if (!cleanText) return;

  // 3. 请求本地后端 TTS 接口
  const targetVoice = window.AI_CONFIG.VOICE; 
  const ttsApiUrl = `http://localhost:3000/api/tts?text=${encodeURIComponent(cleanText)}&voice=${targetVoice}`;

  const bearVoice = new Audio(ttsApiUrl);
  window.currentBearAudio = bearVoice;

  // 4. 播放音频
  bearVoice.play().catch((err) => {
    console.warn("音频自动播放受阻，采用网页原生语音兜底:", err);
    window.fallbackSpeechSynthesis(cleanText);
  });
};

// 🔐 降级备份函数
window.fallbackSpeechSynthesis = function(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.pitch = 1.6;
  utterance.rate = 1.15;
  window.speechSynthesis.speak(utterance);
};