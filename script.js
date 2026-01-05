document.addEventListener('DOMContentLoaded', function() {
  // --- 既存: 落下処理 ('.char') ---
  const chars = document.querySelectorAll('.char');
  
  chars.forEach(char => {
    char.addEventListener('click', function(e) {
      // クリックされた文字の位置を取得
      const rect = this.getBoundingClientRect();
      const charX = rect.left + rect.width / 2;
      const charY = rect.top + rect.height / 2;
      
      // クリックされた文字のテキストを保存
      const charText = this.textContent;
      const thisElement = this;

      // 既存のフェードタイムアウトがあればクリアして、クラスを取り除く（アニメーションをリセット）
      if (thisElement._fadeTimeout) {
        clearTimeout(thisElement._fadeTimeout);
        delete thisElement._fadeTimeout;
      }
      thisElement.classList.remove('fade-in');
      // 強制リフローでアニメーションを確実にリスタートできるようにする
      void thisElement.offsetWidth;
      
      // 落下する要素を作成
      const falling = document.createElement('span');
      falling.className = 'falling';
      falling.textContent = charText;
      falling.style.left = charX + 'px';
      falling.style.top = charY + 'px';
      falling.style.color = getRandomColor();
      falling.style.transform = 'translate(-50%, -50%)';
      
      document.body.appendChild(falling);
      
      // 元の文字を透明にする
      thisElement.style.opacity = '0';
      
      // アニメーション完了後に削除
      setTimeout(() => {
        falling.remove();
      }, 2000);

      // 5秒後に元の文字を表示に戻す（フェードイン付き） — タイムアウトは要素に保持
      thisElement._fadeTimeout = setTimeout(() => {
        // リセットしてから再度クラスを付与してアニメーションを確実に走らせる
        thisElement.classList.remove('fade-in');
        void thisElement.offsetWidth;
        thisElement.classList.add('fade-in');

        // フェードイン完了後にクラスとインラインopacityをクリアして、次回クリックでまたアニメーションできるようにする
        const onAnimEnd = () => {
          thisElement.classList.remove('fade-in');
          thisElement.style.opacity = '';
          thisElement.removeEventListener('animationend', onAnimEnd);
        };
        thisElement.addEventListener('animationend', onAnimEnd);

        delete thisElement._fadeTimeout;
      }, 5000);
    });
  });

  // --- 追加: #spinning-text を1つのブロックとして回転させる（Web Animations API） ---
  const spinning = document.getElementById('spinning-text');
  if (spinning) {
    // 要素を inline-block 化して、回転の中心を文章の中心にする
    spinning.style.display = spinning.style.display || 'inline-block';
    spinning.style.transformOrigin = 'center center';
    spinning.style.willChange = 'transform';

    // 回転回数は data-rotations 属性で指定可能（例: <p id="spinning-text" data-rotations="5">...）
    const defaultRotations = parseInt(spinning.dataset.rotations, 10) || 10;
    const durationPerRotation = 200; // 1回転あたりのミリ秒（調整可）

    spinning.addEventListener('click', function(e) {
      e.stopPropagation();
      // すでに回転中なら無視
      if (this.dataset.animating === '1') return;
      this.dataset.animating = '1';

      const rotations = defaultRotations;
      const totalDuration = durationPerRotation * rotations;

      const anim = this.animate(
        [ { transform: 'rotate(0deg)' }, { transform: `rotate(${360 * rotations}deg)` } ],
        { duration: totalDuration, easing: 'linear' }
      );

      anim.onfinish = () => {
        // 回転完了後のクリーンアップ
        delete this.dataset.animating;
        this.style.transform = '';
      };
    });
  }

  // --- 追加: #lightning-text のクリック処理（背景黒・テキスト白のトグル） ---
  const lightning = document.getElementById('lightning-text');
  if (lightning) {
    lightning.addEventListener('click', function(e) {
      e.stopPropagation();
      // body に lightning-mode クラスをトグル
      document.body.classList.toggle('lightning-mode');
    });
  }

  // --- 追加: #extending-text のクリック処理（文章全体を引き延ばす・戻す） ---
  const extending = document.getElementById('extending-text');
  if (extending) {
    extending.addEventListener('click', function(e) {
      e.stopPropagation();
      // すでにアニメーション中なら無視
      if (this.dataset.animating === '1') return;
      this.dataset.animating = '1';

      // stretching クラスをトグル
      this.classList.toggle('stretching');
    });

    // トランジション終了後にフラグをリセット
    extending.addEventListener('transitionend', function(e) {
      delete this.dataset.animating;
    });
  }

  // --- 変更: #vibrating-text の挙動を「ホールドで振動・離すと停止」に変更 ---
  const vibrating = document.getElementById('vibrating-text');
  if (vibrating) {
    const startVibrate = (e) => {
      // preventDefault はタッチ時の重複イベントを抑えるために使用
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      e && e.stopPropagation();
      vibrating.classList.add('vibrating');
    };

    const stopVibrate = (e) => {
      e && e.stopPropagation();
      vibrating.classList.remove('vibrating');
    };

    if (window.PointerEvent) {
      vibrating.addEventListener('pointerdown', startVibrate);
      ['pointerup', 'pointercancel', 'pointerleave', 'pointerout'].forEach(evt => {
        vibrating.addEventListener(evt, stopVibrate);
      });
      // 要素外でリリースされた時も停止するようにドキュメントで監視
      document.addEventListener('pointerup', stopVibrate);
    } else {
      // PointerEvent 非対応ブラウザ向けのフォールバック
      vibrating.addEventListener('touchstart', startVibrate, { passive: false });
      document.addEventListener('touchend', stopVibrate);
      vibrating.addEventListener('mousedown', startVibrate);
      document.addEventListener('mouseup', stopVibrate);
    }
  }

  // --- 追加: #assembling-text のクリック処理（周囲から「集まる」の文字が現れて中心へ移動） ---
  const assembling = document.getElementById('assembling-text');
  if (assembling) {
    assembling.addEventListener('click', function(e) {
      e.stopPropagation();
      const target = this;
      const textFull = '集まる';
      const rect = target.getBoundingClientRect();
      const endX = rect.left + rect.width / 2;
      const endY = rect.top + rect.height / 2;
      const baseColor = window.getComputedStyle(target).color || '#000';

      const count = 5; // 表示するコピー数
      for (let i = 0; i < count; i++) {
        const particle = document.createElement('span');
        particle.className = 'assembling-particle';
        particle.textContent = textFull;
        particle.style.color = baseColor;

        // 発生位置（角度）を完全ランダムにする（コピーはランダム方向から出現）
        const angle = Math.random() * Math.PI * 2;

        // 終点は要素の周辺（要素と重ならないように半径を確保）
        // ここを縮めて、コピーがターゲットにより近づけるようにする
        const endRadius = Math.max(rect.width, rect.height) / 2 + 10 + Math.random() * 8;
        const targetX = endX + Math.cos(angle) * endRadius;
        const targetY = endY + Math.sin(angle) * endRadius;

        // 開始位置はその外側から（遠くから集まるように）
        const startRadius = endRadius + 80 + Math.random() * 60;
        const startX = endX + Math.cos(angle) * startRadius;
        const startY = endY + Math.sin(angle) * startRadius;

        particle.style.left = startX + 'px';
        particle.style.top = startY + 'px';
        particle.style.opacity = '1';

        document.body.appendChild(particle);

        // 少しゆったりめに（遅めの到着）
        const delay = i * 140; // ステagger を少し長めに
        const anim = particle.animate([
          { left: startX + 'px', top: startY + 'px', transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
          { left: targetX + 'px', top: targetY + 'px', transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }
        ], { duration: 1400, easing: 'cubic-bezier(0.22,1,0.36,1)', delay });

        anim.onfinish = () => {
          // 到着位置を確定させる（アニメーションが終わるとインライン位置に戻ることがあるため）
          particle.style.left = targetX + 'px';
          particle.style.top = targetY + 'px';
          // transform を明示して状態を安定させる
          particle.style.transform = 'translate(-50%, -50%) scale(1)';

          // 到着後のポップとフェードもゆっくりにする（到着位置でフェードアウトする）
          particle.animate([
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(0.94)', opacity: 0.95 }
          ], { duration: 360, easing: 'ease-out' }).onfinish = () => {
            particle.animate([
              { transform: 'translate(-50%, -50%) scale(0.94)', opacity: 0.95 },
              { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 }
            ], { duration: 600, easing: 'ease-in' }).onfinish = () => particle.remove();
          };
        };
      }

      // brief highlight on target
      assembling.classList.add('assemble-hit');
      setTimeout(() => assembling.classList.remove('assemble-hit'), 360);
    });
  }

  // --- 追加: #spliting-text のクリック処理（上下に文字が分割して離れる） ---
  const splitting = document.getElementById('spliting-text');
  if (splitting) {
    splitting.addEventListener('click', function(e) {
      e.stopPropagation();
      const el = this;

      // 連続実行を防ぐ
      if (el._splitTimeout) {
        clearTimeout(el._splitTimeout);
        el._splitTimeout = null;
      }

      // 元要素を非表示にする
      el.style.opacity = '0';

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const txt = el.textContent;
      const cs = window.getComputedStyle(el);

      const makeClone = (pos) => {
        const c = document.createElement('div');
        c.className = 'split-clone ' + pos;
        c.style.left = cx + 'px';
        c.style.top = cy + 'px';
        c.style.color = cs.color;
        c.style.font = cs.font;
        c.style.letterSpacing = cs.letterSpacing;
        c.innerHTML = `<span class="split-text">${txt}</span>`;
        document.body.appendChild(c);
        return c;
      };

      const top = makeClone('top');
      const bottom = makeClone('bottom');

      const dist = 48;
      const up = top.animate([
        { transform: 'translate(-50%, -50%) translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translate(-50%, -50%) translateY(-${dist}px) rotate(-6deg)`, opacity: 0.95 }
      ], { duration: 700, easing: 'cubic-bezier(0.2,0.8,0.2,1)' });

      const down = bottom.animate([
        { transform: 'translate(-50%, -50%) translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translate(-50%, -50%) translateY(${dist}px) rotate(6deg)`, opacity: 0.95 }
      ], { duration: 700, easing: 'cubic-bezier(0.2,0.8,0.2,1)' });

      Promise.all([up.finished, down.finished]).then(() => {
        // 到達位置でフェードアウトする（追加の移動は行わない）
        // 最終 transform を確定させる
        top.style.transform = `translate(-50%, -50%) translateY(-${dist}px) rotate(-6deg)`;
        bottom.style.transform = `translate(-50%, -50%) translateY(${dist}px) rotate(6deg)`;

        // 少し遅延してフェードアウトする
        const fadeDur = 600;
        const fadeDelay = 120;
        const f1 = top.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fadeDur, easing: 'ease-in', delay: fadeDelay });
        const f2 = bottom.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fadeDur, easing: 'ease-in', delay: fadeDelay });
        Promise.all([f1.finished, f2.finished]).then(() => {
          top.remove(); bottom.remove();

          // 粒が消えたあと、2秒後に元の文字をフェードインして復帰させる
          el._splitTimeout = setTimeout(() => {
            el.classList.remove('fade-in');
            void el.offsetWidth;
            el.classList.add('fade-in');
            const onAnimEnd = () => { el.classList.remove('fade-in'); el.style.opacity = ''; el.removeEventListener('animationend', onAnimEnd); };
            el.addEventListener('animationend', onAnimEnd);
            delete el._splitTimeout;
          }, 2000);
        });
      });
    });
  }

  // --- 追加: #collapsing-text のクリック処理（文字が崩れて下に落ちる） ---
  const collapsing = document.getElementById('collapsing-text');
  if (collapsing) {
    collapsing.addEventListener('click', function(e) {
      e.stopPropagation();
      const el = this;

      // 連続実行防止（既存タイムアウトがあればクリア）
      if (el._collapseTimeout) {
        clearTimeout(el._collapseTimeout);
        delete el._collapseTimeout;
      }

      const rect = el.getBoundingClientRect();
      const baseColor = window.getComputedStyle(el).color || '#000';

      // 元の文字を消す
      el.style.opacity = '0';

      // 断片を増やして小さくする
      const count = 90;
      let maxDelay = 0;
      for (let i = 0; i < count; i++) {
        const p = document.createElement('span');
        p.className = 'collapse-particle';

        // 小さめの断片サイズに調整
        const w = 3 + Math.random() * 6;
        const h = 3 + Math.random() * 6;
        p.style.width = w + 'px';
        p.style.height = h + 'px';
        p.style.background = baseColor;
        // 少しだけブラー率を増やして自然な見た目に
        if (Math.random() < 0.4) p.classList.add('collapse-blur');

        // distribute fragments from top → bottom using index fraction for a collapsing wave
        const frac = i / count;
        const jitterX = (Math.random() - 0.5) * rect.width * 0.15; // small horizontal jitter
        const startX = rect.left + rect.width * frac + jitterX;
        // vertical mapped along element height with small jitter
        const jitterY = (Math.random() - 0.5) * Math.min(12, rect.height * 0.08);
        const startY = rect.top + rect.height * frac + jitterY;
        p.style.left = startX + 'px';
        p.style.top = startY + 'px';
        p.style.opacity = '1';

        document.body.appendChild(p);

        // target fall position (below viewport)
        const endY = window.innerHeight + 120 + Math.random() * 500;
        const endX = startX + (Math.random() - 0.5) * 220;
        const rotate = (Math.random() - 0.5) * 720;
        const duration = 900 + Math.random() * 900;
        // stagger the start so top fragments begin earlier and the effect propagates downward
        const delay = frac * 800 + Math.random() * 160;
        if (delay + duration > maxDelay) maxDelay = delay + duration;

        const anim = p.animate([
          { left: startX + 'px', top: startY + 'px', transform: 'translate(-50%, -50%) rotate(0deg) scale(1)', opacity: 1 },
          { left: endX + 'px', top: endY + 'px', transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(0.8)`, opacity: 0 }
        ], { duration, easing: 'cubic-bezier(0.2,0.8,0.2,1)', delay });

        anim.onfinish = () => p.remove();
      }

      // 元の文字は、すべてのアニメーションが終わったあとに少し待ってフェードイン
      el._collapseTimeout = setTimeout(() => {
        el.classList.remove('fade-in');
        void el.offsetWidth;
        el.classList.add('fade-in');
        const onAnimEnd = () => { el.classList.remove('fade-in'); el.style.opacity = ''; el.removeEventListener('animationend', onAnimEnd); };
        el.addEventListener('animationend', onAnimEnd);
        delete el._collapseTimeout;
      }, Math.max(1500, maxDelay + 300));
    });
  }
});

function getRandomColor() {
  const colors = ['#000000ff'];
  return colors[Math.floor(Math.random() * colors.length)];
}