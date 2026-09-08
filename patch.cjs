const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');
const search = `      // Laser gun venting reload
      if (w.id === 'laser') {
        if (ws.reloading || (ws.heat ?? 0) <= 0) return;
        ws.reloading = true;
        AUDIO.laserBeam.stop();
        laserBeamMesh.visible = false;
        const reloadDur = (w.reloadTime ?? 2.2) * player.classReloadMultiplier;
        ws.reloadT = reloadDur;
        ws.totalReloadT = reloadDur;
        AUDIO.laserVent.play(1.0);
        pushKillFeed('VENTING PLASMA CORE...');
        return;
      }

      if (ws.reloading || ws.ammo === w.mag || (ws.reserve ?? 0) <= 0) return;
      ws.reloading = true;
      AUDIO.arSpray.stop();
      AUDIO.laserBeam.stop();
      AUDIO.minigunFire.stop();
      laserBeamMesh.visible = false;
      player.continuousShots = 0;
      const reloadDur = (w.reloadTime ?? 2.4) * player.classReloadMultiplier;
      ws.reloadT = reloadDur;
      ws.totalReloadT = reloadDur;

      if (w.id === 'pistol') {
        AUDIO.pistolReload.play(1.0);
      } else if (w.id === 'ar') {
        AUDIO.arReload.play(1.0);
      } else if (w.id === 'shotgun') {
        setTimeout(() => {
          if (player.alive && currentSlot().id === 'shotgun' && ws.reloading) {
            AUDIO.shotgunReload.play(1.0);
          }
        }, 150);
      } else if (w.id === 'sniper') {
        AUDIO.sniperReload.play(1.0);
      } else if (w.id === 'smg') {
        AUDIO.smgReload.play(1.0);
      } else if (w.id === 'lmg') {
        AUDIO.lmgReload.play(1.0);
      } else if (w.id === 'br') {
        AUDIO.brReload.play(1.0);
      } else if (w.id === 'railgun') {
        AUDIO.sniperReload.play(1.0);
      }`;

const replacement = `      // Laser gun venting reload
      if (w.id === 'laser') {
        if (ws.reloading || (ws.heat ?? 0) <= 0) return;
        ws.reloading = true;
        AUDIO.laserBeam.stop();
        laserBeamMesh.visible = false;
        
        ws.heat = 0;
        ws.overheated = false;

        const reloadDur = (w.reloadTime ?? 2.2) * player.classReloadMultiplier;
        ws.reloadT = reloadDur;
        ws.totalReloadT = reloadDur;
        AUDIO.laserVent.play(1.0);
        
        for (let s = 0; s < 12; s++) {
          const pt = new THREE.Vector3(0, 0, -0.6);
          pt.applyMatrix4(vmManager.weaponGroup.matrixWorld);
          const sm = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.02, 0.02),
            new THREE.MeshBasicMaterial({ color: 0xffaa00 })
          );
          sm.position.copy(pt);
          const vel = new THREE.Vector3((Math.random()-0.5)*1.5, (Math.random()-0.5)*1.5, (Math.random()-0.5)*1.5 - 2);
          vel.applyQuaternion(camera.quaternion);
          smokePool.push({ mesh: sm, life: 0.3 + Math.random()*0.3, maxLife: 0.6, vel });
          scene.add(sm);
        }
        return;
      }

      if (ws.reloading || ws.ammo === w.mag || (ws.reserve ?? 0) <= 0) return;
      ws.reloading = true;

      const isTactical = (ws.ammo ?? 0) > 0;
      ws.isTacticalReload = isTactical;
      
      AUDIO.arSpray.stop();
      AUDIO.laserBeam.stop();
      AUDIO.minigunFire.stop();
      laserBeamMesh.visible = false;
      player.continuousShots = 0;
      
      let reloadDur = (w.reloadTime ?? 2.4) * player.classReloadMultiplier;
      if (!isTactical && ['pistol', 'smg', 'ar', 'lmg', 'br'].includes(w.id)) {
        reloadDur *= 1.4; // 40% slower empty reload
      }
      ws.reloadT = reloadDur;
      ws.totalReloadT = reloadDur;

      if (['pistol', 'smg', 'ar', 'lmg', 'br'].includes(w.id)) {
        if (isTactical) AUDIO.reloadTactical.play(1.0);
        else AUDIO.reloadEmpty.play(1.0);
      } else if (w.id === 'shotgun') {
        setTimeout(() => {
          if (player.alive && currentSlot().id === 'shotgun' && ws.reloading) {
            AUDIO.shotgunReload.play(1.0);
          }
        }, 150);
      } else if (w.id === 'sniper' || w.id === 'railgun') {
        AUDIO.sniperReload.play(1.0);
      }`;
      
const newContent = content.replace(search, replacement);
if (newContent === content) {
  console.log("No match found!");
} else {
  fs.writeFileSync('src/App.tsx', newContent);
  console.log("Patch applied!");
}
