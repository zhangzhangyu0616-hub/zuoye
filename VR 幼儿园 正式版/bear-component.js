// ==========================================
// bear-component.js
// A-Frame 组件注册 (处理小熊动画和位置)
// ==========================================
AFRAME.registerComponent('bear-native-core', {
  init: function () {
    this.mixer = null;
    this.actions = {};
    this.mesh = null;

    this.el.addEventListener('model-loaded', () => {
      const mesh = this.el.getObject3D('mesh');
      if (mesh) {
        this.mesh = mesh;
        mesh.traverse((node) => {
          if (node.isMesh && node.material) {
            if (node.material.emissive) node.material.emissive.setHex(0x000000);
            node.material.needsUpdate = true;
          }
        });

        if (mesh.animations && mesh.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(mesh);
          window.realAnims = mesh.animations.map(anim => anim.name);

          mesh.animations.forEach(clip => {
            clip.tracks = clip.tracks.filter(track => {
              const trackName = track.name.toLowerCase();
              if (trackName.includes('hips') || trackName.includes('root') || trackName.includes('armature') || trackName.includes('node_0')) {
                if (trackName.includes('quaternion') || trackName.includes('position')) {
                  return false; 
                }
              }
              return true; 
            });

            const action = this.mixer.clipAction(clip);
            
            if (clip.name.toLowerCase().includes('walk_formal_loop')) {
              action.setLoop(THREE.LoopRepeat);
              action.clampWhenFinished = false;
            } else {
              action.setLoop(THREE.LoopOnce);
              action.clampWhenFinished = true; 
            }
            
            this.actions[clip.name] = action;
          });

          this.mixer.addEventListener('finished', () => {
            window.isPlayingAnimation = false;
            if (!window.isProcessingAI && window.updateHudStatus) {
              window.updateHudStatus("实时聆听中...");
            }
            this.playDefaultIdle();
          });

          if (window.updateHudStatus) window.updateHudStatus("毫秒级智能AI系统已就绪！");
          this.playDefaultIdle();
        }
      }
    });
  },

  playDefaultIdle: function () {
    if (!this.mixer) return;
    let idleName = window.realAnims.find(name => name.toLowerCase().includes('walk_formal_loop'));
    if (idleName && this.actions[idleName]) {
      this.actions[idleName].reset().fadeIn(0.3).play();
    }
  },

  tick: function (time, timeDelta) {
    this.el.object3D.rotation.set(THREE.MathUtils.degToRad(-90), 0, 0);
    this.el.object3D.position.set(0, 0.5, 2);
    this.el.object3D.scale.set(1.5, 1.5, 1.5);
    
    if (this.mixer) this.mixer.update(timeDelta / 1000);
  },

  playNativeAnim: function (keyword) {
    if (!this.mixer) return;
    let matchedName = window.realAnims.find(name => name.toLowerCase().includes(keyword.toLowerCase()));
    if (!matchedName) return;

    const targetAction = this.actions[matchedName];
    if (targetAction) {
      window.isPlayingAnimation = true;
      targetAction.reset().setLoop(THREE.LoopOnce).clampWhenFinished = true;
      targetAction.play();
    }
  }
});