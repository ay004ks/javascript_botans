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

        // 発生位置は直前の状態（startOffset 30..60）を維持しつつ、到達位置を中央により近づける
        const endRadiusBase = Math.max(rect.width, rect.height) / 6 + 1; // さらに中心寄り
        const endRadiusJitter = Math.random() * 2; // 小さなジッター
        const endRadius = endRadiusBase + endRadiusJitter;
        const targetX = endX + Math.cos(angle) * endRadius;
        const targetY = endY + Math.sin(angle) * endRadius;

        // 発生位置（開始位置）を中心から離す（例: 80..140 のレンジ）
        const startOffsetMin = 80;
        const startOffsetMax = 140;
        const startRadius = endRadius + startOffsetMin + Math.random() * (startOffsetMax - startOffsetMin);
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

      // 要素の座標を取得してサイズを固定（レイアウトずれ防止）
      const rect = el.getBoundingClientRect();
      el.style.width = rect.width + 'px';
      el.style.height = rect.height + 'px';
      el.style.boxSizing = 'border-box';
      el.style.display = el.style.display || 'inline-block';

      // 元要素を非表示にする（表示だけ消す、レイアウトは維持）
      el.style.opacity = '0';

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
            const onAnimEnd = () => { 
              el.classList.remove('fade-in'); 
              el.style.opacity = '';
              // 復帰時に固定していたサイズを解除して、通常のレスポンシブに戻す
              el.style.width = '';
              el.style.height = '';
              el.style.boxSizing = '';
              el.style.display = '';
              el.removeEventListener('animationend', onAnimEnd); 
            };
            el.addEventListener('animationend', onAnimEnd);
            delete el._splitTimeout;
          }, 2000);
        });
      });
    });
  }

  // --- 追加: #bouncing-text のクリック処理（上下に弾みながら画面外に移動） ---
  const bouncing = document.getElementById('bouncing-text');
  if (bouncing) {
    bouncing.addEventListener('click', function(e) {
      e.stopPropagation();
      const el = this;

      // 連続実行防止
      if (el._bounceTimeout) {
        clearTimeout(el._bounceTimeout);
        delete el._bounceTimeout;
      }
      // 既に残っているクローンを削除して重複を防ぐ
      document.querySelectorAll('.bouncing-clone').forEach(c => c.remove());

      // 固定サイズでレイアウトずれを防ぐ
      const rect = el.getBoundingClientRect();
      el.style.width = rect.width + 'px';
      el.style.height = rect.height + 'px';
      el.style.boxSizing = 'border-box';
      el.style.display = el.style.display || 'inline-block';

      // 元を見えなくする（画面外から戻るまで表示させない）
      el.style.opacity = '0';
      el.classList.add('temp-invisible');

      // クローンを作成してアニメーション
      const clone = document.createElement('div');
      clone.className = 'bouncing-clone';
      clone.style.left = (rect.left + rect.width / 2) + 'px';
      clone.style.top = (rect.top + rect.height / 2) + 'px';
      clone.style.color = window.getComputedStyle(el).color;
      clone.style.font = window.getComputedStyle(el).font;
      clone.innerHTML = `<span>${el.textContent}</span>`;
      document.body.appendChild(clone);

      // 総移動距離（左へオフスクリーン）
      const endLeft = -120;
      const startLeft = rect.left + rect.width / 2;
      const totalMove = endLeft - startLeft; // negative => move left

      // アニメーション: 左へ一定速度で移動しつつ、スムーズに上下に弾ませる（サンプリング生成）
      const duration = 2000; // 6秒
      // バウンス回数をここで調整
      const bounceCount = 6;
      const frames = [];
      const baseAmp = 28;
      // サンプル数（多いほど滑らか） - bounceCount に応じて増やす
      const sampleCount = Math.max(60, bounceCount * 20);
      for (let s = 0; s <= sampleCount; s++) {
        const t = s / sampleCount; // 0..1
        const leftPos = startLeft + totalMove * t;
        // 垂直方向は sin 波で滑らかな上下運動（減衰なし）
        // 最初の挙動を上方向にするために符号を反転する
        const vertical = -Math.sin(Math.PI * bounceCount * t) * baseAmp;
        const topPos = rect.top + rect.height / 2 + vertical;
        frames.push({ offset: t, left: leftPos + 'px', top: topPos + 'px', transform: 'translate(-50%, -50%)' });
      }
      // 最後はオフスクリーンへ落とす（下に少し落として終わる）
      frames.push({ offset: 1, left: endLeft + 'px', top: (rect.top + rect.height / 2 + 40) + 'px', transform: 'translate(-50%, -50%)' });

      // 横移動の速度減衰を消すためイージングを linear に設定
      const endHold = 600; // 終了時に一瞬止める時間（ms）
      const anim = clone.animate(frames, { duration, easing: 'linear' });

      anim.onfinish = () => {
        // 最後の位置で短く停止してから、右側から再入場して元の位置に戻るシーケンスを実行
        setTimeout(() => {
          // 現在のクローンを削除
          clone.remove();

          // 右側オフスクリーンから入ってくるクローンを作成
          const returnClone = document.createElement('div');
          returnClone.className = 'bouncing-clone';
          const startRight = window.innerWidth + 120;
          const targetLeft = startLeft; // 元の中心へ戻す
          returnClone.style.left = startRight + 'px';
          returnClone.style.top = (rect.top + rect.height / 2) + 'px';
          returnClone.style.color = window.getComputedStyle(el).color;
          returnClone.style.font = window.getComputedStyle(el).font;
          returnClone.innerHTML = `<span>${el.textContent}</span>`;
          document.body.appendChild(returnClone);

          // 元の要素を戻ってくる間に可視化しておく（透明→不透明で自然に見える）
          el.classList.remove('temp-invisible');
          el.style.opacity = '0';
          if (el._returnOpacityAnim) {
            el._returnOpacityAnim.cancel();
            delete el._returnOpacityAnim;
          }
          // duration と同じ長さで漸次表示させる（停留時間も考慮して持続させる）
          el._returnOpacityAnim = el.animate([
            { opacity: 0 }, { opacity: 1 }
          ], { duration: duration + endHold, easing: 'linear', fill: 'forwards' });

          // 右から入るフレームを生成（左へ移動）
          const framesReturn = [];
          for (let s = 0; s <= sampleCount; s++) {
            const t2 = s / sampleCount;
            const leftPos2 = startRight + (targetLeft - startRight) * t2;
            const vertical2 = -Math.sin(Math.PI * bounceCount * t2) * baseAmp;
            const topPos2 = rect.top + rect.height / 2 + vertical2;
            framesReturn.push({ offset: t2, left: leftPos2 + 'px', top: topPos2 + 'px', transform: 'translate(-50%, -50%)' });
          }
          // 最後はターゲット位置にぴったり合わせる
          framesReturn.push({ offset: 1, left: targetLeft + 'px', top: (rect.top + rect.height / 2) + 'px', transform: 'translate(-50%, -50%)' });

          const returnAnim = returnClone.animate(framesReturn, { duration, easing: 'linear' });

          returnAnim.onfinish = () => {
            // 一瞬止めてから削除して元に戻す
            setTimeout(() => {
              returnClone.remove();
              // 元の要素をフェードインで復帰
              // フェードインアニメが走っていればキャンセルして最終状態を維持
              if (el._returnOpacityAnim) {
                try { el._returnOpacityAnim.cancel(); } catch (e) {}
                delete el._returnOpacityAnim;
              }
              // 万一 opacity が unset だった場合に備え、確実に見えるようにしておく
              el.style.opacity = '1';

              el.classList.remove('fade-in');
              void el.offsetWidth;
              el.classList.add('fade-in');

              const onAnimEnd = () => {
                el.classList.remove('fade-in');
                // フェードインが終わったらインライン opacity を解除して通常状態に戻す
                el.style.opacity = '';
                el.style.width = '';
                el.style.height = '';
                el.style.boxSizing = '';
                el.style.display = '';
                el.removeEventListener('animationend', onAnimEnd);
              };
              el.addEventListener('animationend', onAnimEnd);
              delete el._bounceTimeout;
            }, endHold);
          };
        }, endHold);
      };

      // 小さなハイライト
      bouncing.classList.add('bouncing-hit');
      setTimeout(() => bouncing.classList.remove('bouncing-hit'), 360);

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

      // 要素のサイズを固定してレイアウトずれを防止
      el.style.width = rect.width + 'px';
      el.style.height = rect.height + 'px';
      el.style.boxSizing = 'border-box';
      el.style.display = el.style.display || 'inline-block';

      // 元の文字を消す（表示は消えるがレイアウトは維持される）
      el.style.opacity = '0';

      // テキストをオフスクリーン canvas に描画してピクセル単位で断片を生成（文字自体が崩れるように）
      const canvas = document.createElement('canvas');
      const canvasW = Math.max(2, Math.round(rect.width));
      const canvasH = Math.max(2, Math.round(rect.height));
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = baseColor;
      const cs = window.getComputedStyle(el);
      ctx.textBaseline = 'top';
      ctx.font = cs.font || `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      ctx.fillText(el.textContent, 0, 0);

      const img = ctx.getImageData(0, 0, canvasW, canvasH).data;
      const step = 4; // サンプリング解像度（小さいほど断片が多い）
      let maxDelay = 0;

      for (let yy = 0; yy < canvasH; yy += step) {
        for (let xx = 0; xx < canvasW; xx += step) {
          const idx = (yy * canvasW + xx) * 4;
          // アルファ値で描画されている部分だけ断片化
          if (img[idx + 3] > 128) {
            const p = document.createElement('span');
            p.className = 'collapse-particle';
            const size = Math.max(2, Math.floor(step * (0.7 + Math.random() * 0.6)));
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.background = baseColor;
            if (Math.random() < 0.35) p.classList.add('collapse-blur');

            const startX = rect.left + xx;
            const startY = rect.top + yy;
            p.style.left = startX + 'px';
            p.style.top = startY + 'px';
            p.style.opacity = '1';

            document.body.appendChild(p);

            // 下に落ちる目標位置
            const endY = window.innerHeight + 120 + Math.random() * 500;
            const endX = startX + (Math.random() - 0.5) * 220;
            const rotate = (Math.random() - 0.5) * 720;
            const duration = 900 + Math.random() * 1100;
            // 上→下の伝播に合わせた遅延
            const delay = (yy / canvasH) * 800 + Math.random() * 160;
            if (delay + duration > maxDelay) maxDelay = delay + duration;

            const anim = p.animate([
              { left: startX + 'px', top: startY + 'px', transform: 'translate(-50%, -50%) rotate(0deg) scale(1)', opacity: 1 },
              { left: endX + 'px', top: endY + 'px', transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(0.8)`, opacity: 0 }
            ], { duration, easing: 'cubic-bezier(0.2,0.8,0.2,1)', delay });

            anim.onfinish = () => p.remove();
          }
        }
      }

      // 元の文字は、すべてのアニメーションが終わったあとに少し待ってフェードイン
      el._collapseTimeout = setTimeout(() => {
        el.classList.remove('fade-in');
        void el.offsetWidth;
        el.classList.add('fade-in');
        const onAnimEnd = () => { 
          el.classList.remove('fade-in'); 
          el.style.opacity = ''; 
          // 撤回したインライン幅・高さ等を解除
          el.style.width = '';
          el.style.height = '';
          el.style.boxSizing = '';
          el.style.display = '';
          el.removeEventListener('animationend', onAnimEnd); 
        };
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