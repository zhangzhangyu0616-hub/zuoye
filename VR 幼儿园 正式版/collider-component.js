// ==========================================
// collider-component.js (高精度相机追踪 & 胸口探测版)
// 专治 WASD 和头部移动导致的穿模
// ==========================================
AFRAME.registerComponent('simple-collider', {
  schema: {
    objects: { type: 'string', default: '.collidable' }, 
    radius: { type: 'number', default: 0.3 }             
  },

  init: function () {
    this.raycaster = new THREE.Raycaster();
    this.prevLocalPos = new THREE.Vector3();
    this.worldDirection = new THREE.Vector3();

    this.prevLocalPos.copy(this.el.object3D.position);
  },

  tick: function () {
    const obj3D = this.el.object3D;
    const currentLocalPos = obj3D.position;

    const moveDistance = currentLocalPos.distanceTo(this.prevLocalPos);

    if (moveDistance < 0.001) return;

    if (moveDistance > 1.0) {
      this.prevLocalPos.copy(currentLocalPos);
      return;
    }

    const localDirection = new THREE.Vector3().subVectors(currentLocalPos, this.prevLocalPos).normalize();
    this.worldDirection.copy(localDirection).transformDirection(obj3D.parent.matrixWorld).normalize();

    const worldPos = new THREE.Vector3();
    obj3D.getWorldPosition(worldPos);

    // ✨ 核心修正：将射线的发射点从“眼睛”下调 0.6 米，降到“胸口”高度 ✨
    // 这样不仅能测高墙，也能拦住比较矮的桌子或苹果！
    worldPos.y -= 0.6; 

    const origin = worldPos.clone().sub(this.worldDirection.clone().multiplyScalar(moveDistance));

    this.raycaster.set(origin, this.worldDirection);

    const collidableMeshes = [];
    document.querySelectorAll(this.data.objects).forEach(el => {
      if (el.object3D) collidableMeshes.push(el.object3D);
    });

    const intersects = this.raycaster.intersectObjects(collidableMeshes, true);

    if (intersects.length > 0 && intersects[0].distance < (moveDistance + this.data.radius)) {
      // 💥 发生碰撞
      obj3D.position.copy(this.prevLocalPos);
    } else {
      // ✅ 安全通过
      this.prevLocalPos.copy(currentLocalPos);
    }
  }
});