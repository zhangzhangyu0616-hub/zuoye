// ==========================================
// script.js（双页面跳转架构版 - 极简防崩溃）
// ==========================================

let isTransitioning = false;
let currentGazeTarget = null;
let gazeTime = 0;

AFRAME.registerComponent("gaze-selector", {
  init: function () {
    this.raycaster = new THREE.Raycaster();
    this.forward = new THREE.Vector3();
    this.origin = new THREE.Vector3();
    this.hint = document.getElementById("proximity-hint");
    
    // 自动抓取当前页面上的触发靶子（index页面抓苹果，inner页面抓门）
    this.targets = [];
  },

  tick: function (t, dt) {
    if (isTransitioning) return;

    const camera = this.el.sceneEl.camera;
    if (!camera) return;

    // 懒加载：寻找页面上的靶子
    if (this.targets.length === 0) {
      this.targets = Array.from(document.querySelectorAll('.gaze-target'));
    }
    if (this.targets.length === 0) return;

    camera.getWorldDirection(this.forward);
    camera.getWorldPosition(this.origin);
    this.raycaster.set(this.origin, this.forward);

    const target3Ds = this.targets.map(el => el.object3D);
    const hits = this.raycaster.intersectObjects(target3Ds, true);

    // ❌ 如果没有看着靶子，清理计时
    if (hits.length === 0) {
      currentGazeTarget = null;
      gazeTime = 0;
      if (this.hint) this.hint.style.display = "none";
      return;
    }

    // 👀 获取命中对象
    let hitObj = hits[0].object;
    while (hitObj && !hitObj.el) {
      hitObj = hitObj.parent;
    }
    if (!hitObj || !hitObj.el) return;

    const type = hitObj.el.getAttribute("data-switch-target");

    // 更换目标，重新计时
    if (currentGazeTarget !== type) {
      currentGazeTarget = type;
      gazeTime = 0;
      return;
    }

    // ⏱️ 累加凝视时间
    gazeTime += dt;

    if (this.hint) {
      this.hint.style.display = "block";
      const targetName = type === "apple" ? "🍎 苹果 (进入室内)" : "🚪 大门 (返回草地)";
      this.hint.innerText = `👁️ 锁定 ${targetName} ${(gazeTime / 1000).toFixed(1)}s`;
    }

    // 🔒 凝视满 1.2 秒触发过场跳转
    if (gazeTime > 1200) {
      triggerSwitch(type);
      gazeTime = 0;
    }
  }
});

// ==========================================
// 跳转执行逻辑 (黑屏动画释放显存核心)
// ==========================================
function triggerSwitch(type) {
  if (isTransitioning) return;
  isTransitioning = true;
  
  const hint = document.getElementById("proximity-hint");
  if (hint) hint.style.display = "none";

  // 1. 触发黑屏淡出动画
  const fadeOverlay = document.getElementById("fade-overlay");
  if (fadeOverlay) fadeOverlay.style.opacity = "1";

  // 2. 延迟 500ms 等屏幕完全变黑后，进行网页彻底跳转，瞬间释放显存压力！
  setTimeout(() => {
    if (type === "apple") {
      window.location.href = "inner.html"; // 去室内
    } else if (type === "door") {
      window.location.href = "index.html"; // 回室外主页
    }
  }, 500);
}

// 页面加载时的淡入效果
document.addEventListener("DOMContentLoaded", function () {
  const scene = document.querySelector("a-scene");
  if (scene) {
    scene.setAttribute("gaze-selector", "");
  }
  
  // 👉 体验增强：网页加载完毕后，黑屏慢慢变透明消失（淡入效果）
  const fadeOverlay = document.getElementById("fade-overlay");
  if (fadeOverlay) {
    setTimeout(() => {
      fadeOverlay.style.opacity = "0";
    }, 150);
  }
});