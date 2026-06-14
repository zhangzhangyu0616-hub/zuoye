// ==========================================
// config.js全局配置与状态初始化
// ==========================================
window.AI_CONFIG = {
  USE_REAL_AI: true, 
  API_KEY: "sk-6fad8bdee6a44f4884d4cbdfbbe1dab0", 
  API_URL: "https://api.deepseek.com/v1/chat/completions", 
  MODEL: "deepseek-chat",
  VOICE: 'zh-CN-XiaoyiNeural' // 萌萌小童声音色
};

// 全局运行状态控制
window.realAnims = [];
window.isPlayingAnimation = false;
window.isProcessingAI = false; 
window.currentBearAudio = null;