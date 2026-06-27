const QQ_IN_APP_TOKEN_PATTERN = /(?:^|[\s;])QQ\/[\d.]+/i
const MOBILE_QQ_PLATFORM_PATTERN = /\bV1_(?:AND|IPH)_SQ/i
const WECHAT_PATTERN = /\bMicroMessenger\//i

export function isQQInAppBrowser(userAgent = ''): boolean {
  if (!userAgent || WECHAT_PATTERN.test(userAgent)) return false

  return QQ_IN_APP_TOKEN_PATTERN.test(userAgent) || MOBILE_QQ_PLATFORM_PATTERN.test(userAgent)
}

export function renderUnsupportedBrowserNotice(): void {
  document.title = '不受支持的浏览器'
  document.documentElement.lang = 'zh-CN'
  document.body.innerHTML = `
    <main class="unsupported-browser">
      <section class="unsupported-browser__panel" aria-labelledby="unsupported-browser-title">
        <p class="unsupported-browser__eyebrow">Unsupported Browser</p>
        <h1 id="unsupported-browser-title">您正在尝试使用不受支持的浏览器访问该网站</h1>
        <p>请复制网址，改用Chrome、Safari、Firefox等浏览器访问该网站</p>
      </section>
    </main>
  `

  const style = document.createElement('style')
  style.textContent = `
    * {
      box-sizing: border-box;
    }

    html,
    body {
      min-height: 100%;
      margin: 0;
    }

    body {
      color: #2f2330;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at 20% 20%, rgba(255, 133, 161, 0.22), transparent 32rem),
        linear-gradient(135deg, #fff7fa 0%, #f3fbff 100%);
    }

    .unsupported-browser {
      display: grid;
      min-height: 100vh;
      padding: 24px;
      place-items: center;
    }

    .unsupported-browser__panel {
      width: min(100%, 560px);
      padding: clamp(28px, 7vw, 48px);
      border: 1px solid rgba(255, 133, 161, 0.34);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.86);
      box-shadow: 0 24px 70px rgba(89, 61, 72, 0.16);
    }

    .unsupported-browser__eyebrow {
      margin: 0 0 14px;
      color: #d65a85;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .unsupported-browser h1 {
      margin: 0;
      color: #1f1820;
      font-size: clamp(28px, 7vw, 42px);
      line-height: 1.18;
      font-weight: 800;
      letter-spacing: 0;
    }

    .unsupported-browser p:last-child {
      margin: 18px 0 0;
      color: #5d4b58;
      font-size: clamp(16px, 4vw, 20px);
      line-height: 1.7;
    }
  `
  document.head.append(style)
}
