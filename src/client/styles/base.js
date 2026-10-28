/**
 * 基础层：宿主 token 映射、排版、按钮/标签/输入/提示等基础控件。
 * 只使用宿主 --dsw-alias-* / --dsw-specific-* / --dsw-radius-* / --ds-transition-duration 变量，
 * 不写死浅色或深色。所有选择器以 .la- 前缀限定在插件面板内。
 */

export const BASE_CSS = `
.la-root{
  --la-bg:var(--dsw-alias-bg-base);
  --la-surface:var(--dsw-alias-bg-layer-1);
  --la-surface-2:var(--dsw-alias-bg-layer-2);
  --la-overlay:var(--dsw-alias-bg-overlay);
  --la-sidebar:var(--dsw-specific-sidebar-fill,var(--dsw-alias-bg-layer-1));
  --la-line:var(--dsw-alias-border-l1);
  --la-line-2:var(--dsw-alias-border-l2);
  --la-ink:var(--dsw-alias-label-primary);
  --la-ink-2:var(--dsw-alias-label-secondary);
  --la-brand:var(--dsw-alias-brand-primary);
  --la-danger:var(--dsw-alias-state-error-primary);
  --la-warn:var(--dsw-alias-state-warn-primary);
  --la-ok:var(--dsw-alias-state-success-primary);
  --la-idle:var(--dsw-alias-state-idle-primary);
  --la-radius-xs:var(--dsw-radius-xs,3px);
  --la-radius-sm:var(--dsw-radius-sm,6px);
  --la-radius-md:var(--dsw-radius-md,8px);
  --la-radius-lg:var(--dsw-radius-lg,12px);
  --la-radius-xl:var(--dsw-radius-xl,16px);
  --la-motion:var(--ds-transition-duration,150ms);
  --la-measure:640px;
  position:relative;
  display:flex;
  flex-direction:column;
  height:100%;
  min-height:0;
  overflow:hidden;
  background:var(--la-bg);
  color:var(--la-ink);
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei","Segoe UI","Noto Sans SC",sans-serif;
  font-size:14px;
  line-height:1.6;
  text-align:left;
  -webkit-font-smoothing:antialiased;
}
.la-root *,.la-root *::before,.la-root *::after{box-sizing:border-box}
.la-root button,.la-root input,.la-root select,.la-root textarea{font-family:inherit}
.la-root ::selection{background:var(--la-surface-2);color:var(--la-ink)}
.la-root :focus-visible{outline:2px solid var(--la-brand);outline-offset:2px;border-radius:2px}
.la-root h1,.la-root h2,.la-root h3,.la-root h4,.la-root p,.la-root ul,.la-root ol,.la-root dl,.la-root dd{margin:0}
.la-root ul,.la-root ol{padding:0;list-style:none}
.la-muted{color:var(--la-ink-2)}
.la-inlineerror{color:var(--la-danger);font-size:12.5px;line-height:1.5}
.la-hintwarn{color:var(--la-warn);font-size:12.5px;line-height:1.5}
.la-okText{color:var(--la-ok);font-size:13px}
.la-warnText{color:var(--la-warn)}
.la-pre{
  background:var(--la-bg);border:1px solid var(--la-line);border-radius:var(--la-radius-sm);
  padding:10px 12px;font-family:ui-monospace,Consolas,"Cascadia Mono",monospace;font-size:12px;
  line-height:1.6;white-space:pre-wrap;word-break:break-word;max-height:240px;overflow:auto;color:var(--la-ink-2)
}
.la-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.la-time{font-size:12px;color:var(--la-ink-2);white-space:nowrap}
.la-metaline{font-size:12px;color:var(--la-ink-2)}
.la-prose{max-width:var(--la-measure);font-size:16px;line-height:1.7}
.la-prose p+p{margin-top:10px}
.la-link{color:var(--la-brand);text-decoration:underline;text-underline-offset:2px;word-break:break-all}
.la-linkbtn{
  background:none;border:0;padding:0;color:var(--la-ink-2);font-size:12.5px;cursor:pointer;
  text-decoration:underline;text-underline-offset:2px;min-height:28px
}
.la-linkbtn:hover{color:var(--la-ink)}

/* 按钮 */
.la-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  min-height:40px;padding:6px 14px;border-radius:var(--la-radius-sm);
  border:1px solid transparent;font-size:14px;line-height:1.2;cursor:pointer;white-space:nowrap;
  transition:background-color var(--la-motion) ease,border-color var(--la-motion) ease,color var(--la-motion) ease;
  color:var(--la-ink);background:transparent
}
.la-btn:disabled{opacity:.55;cursor:not-allowed}
.la-btn--block{width:100%}
.la-btn--sm{min-height:32px;padding:4px 10px;font-size:13px;gap:4px}
.la-btn--primary{background:var(--la-brand);border-color:var(--la-brand);color:var(--la-bg)}
.la-btn--primary:hover:not(:disabled){filter:brightness(1.05)}
.la-btn--secondary{background:var(--la-surface-2);border-color:var(--la-line);color:var(--la-ink)}
.la-btn--secondary:hover:not(:disabled){background:var(--la-surface)}
.la-btn--ghost{background:transparent;border-color:transparent;color:var(--la-ink-2)}
.la-btn--ghost:hover:not(:disabled){background:var(--la-surface-2);color:var(--la-ink)}
.la-btn--danger{background:var(--la-danger);border-color:var(--la-danger);color:var(--la-bg)}
.la-btn__label{display:inline-flex;align-items:center;gap:4px}
.la-iconbtn{
  display:inline-flex;align-items:center;justify-content:center;flex:none;
  width:40px;height:40px;border-radius:var(--la-radius-sm);
  border:1px solid transparent;background:transparent;color:var(--la-ink-2);cursor:pointer;
  transition:background-color var(--la-motion) ease,color var(--la-motion) ease
}
.la-iconbtn:hover:not(:disabled){background:var(--la-surface-2);color:var(--la-ink)}
.la-iconbtn:disabled{opacity:.5;cursor:not-allowed}
.la-iconbtn--sm{width:28px;height:28px;border-radius:var(--la-radius-xs)}
.la-spinner{
  display:inline-block;width:14px;height:14px;border-radius:50%;
  border:2px solid currentColor;border-right-color:transparent;
  animation:la-spin .8s linear infinite
}
@keyframes la-spin{to{transform:rotate(360deg)}}

/* 标签 */
.la-tag{
  display:inline-flex;align-items:center;gap:4px;flex:none;
  font-size:12px;line-height:1.5;padding:1px 8px;border-radius:999px;
  border:1px solid var(--la-line-2);color:var(--la-ink-2);background:transparent;white-space:nowrap
}
.la-tag--accent{border-color:var(--la-brand);color:var(--la-brand)}
.la-tag--warn{border-color:var(--la-warn);color:var(--la-warn)}
.la-tag--ok{border-color:var(--la-ok);color:var(--la-ok)}
.la-tag--danger{border-color:var(--la-danger);color:var(--la-danger)}
.la-count{
  display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;
  border-radius:999px;background:var(--la-surface-2);color:var(--la-ink-2);font-size:12px
}
.la-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--la-idle);flex:none}
.la-dot--ok{background:var(--la-ok)}
.la-dot--warn{background:var(--la-warn)}
.la-dot--danger{background:var(--la-danger)}
.la-dot--idle{background:var(--la-idle)}
.la-fieldlabel{
  display:block;font-size:12px;line-height:1.6;color:var(--la-ink-2);
  letter-spacing:.02em;margin-bottom:4px
}
.la-fieldlabel__optional{color:var(--la-ink-2);opacity:1;font-weight:400}
.la-field{display:block;margin-bottom:12px}
.la-field:last-child{margin-bottom:0}
.la-select{
  min-height:36px;padding:5px 28px 5px 10px;border-radius:var(--la-radius-sm);
  border:1px solid var(--la-line);background:var(--la-bg);color:var(--la-ink);font-size:13.5px;
  max-width:100%;appearance:none;
  background-image:linear-gradient(45deg,transparent 50%,var(--la-ink-2) 50%),linear-gradient(135deg,var(--la-ink-2) 50%,transparent 50%);
  background-position:calc(100% - 14px) calc(50% + 1px),calc(100% - 9px) calc(50% + 1px);
  background-size:5px 5px,5px 5px;background-repeat:no-repeat
}
.la-select option{background:var(--la-bg);color:var(--la-ink)}
.la-select--sm{min-height:32px;font-size:12.5px}
.la-input{
  width:100%;min-height:38px;padding:7px 10px;border-radius:var(--la-radius-sm);
  border:1px solid var(--la-line);background:var(--la-bg);color:var(--la-ink);font-size:14px
}
.la-input--sm{min-height:32px;font-size:13px}
.la-input::placeholder,.la-textarea::placeholder{color:var(--la-ink-2)}
.la-textarea{
  width:100%;min-height:72px;padding:8px 10px;border-radius:var(--la-radius-sm);
  border:1px solid var(--la-line);background:var(--la-bg);color:var(--la-ink);font-size:14px;line-height:1.65;
  resize:vertical
}
.la-select:focus,.la-input:focus,.la-textarea:focus{outline:2px solid var(--la-brand);outline-offset:0;border-color:transparent}
.la-notice{
  display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:var(--la-radius-sm);
  border:1px solid var(--la-line);background:var(--la-surface);font-size:13px;line-height:1.55;color:var(--la-ink)
}
.la-notice--error{border-color:var(--la-danger)}
.la-notice--error>.la-icon{color:var(--la-danger)}
.la-notice--warn{border-color:var(--la-warn)}
.la-notice--warn>.la-icon{color:var(--la-warn)}
.la-notice--info>.la-icon{color:var(--la-ink-2)}
.la-notice__body{flex:1;min-width:0}
.la-empty{
  display:flex;flex-direction:column;align-items:flex-start;gap:8px;
  padding:20px;border:1px dashed var(--la-line-2);border-radius:var(--la-radius-md);color:var(--la-ink-2)
}
.la-empty .la-icon{color:var(--la-ink-2)}
.la-empty__title{font-size:14px;color:var(--la-ink)}
.la-empty__hint{font-size:13px;line-height:1.6}
.la-collapsible{border-top:1px solid var(--la-line);padding-top:2px;margin-top:12px}
.la-collapsible__head{
  display:flex;align-items:center;gap:8px;width:100%;padding:8px 0;min-height:36px;
  background:none;border:0;color:var(--la-ink);font-size:13.5px;cursor:pointer;text-align:left
}
.la-collapsible__head:hover{color:var(--la-brand)}
.la-collapsible__chevron{color:var(--la-ink-2);font-size:12px;width:12px;flex:none}
.la-collapsible__title{font-weight:500}
.la-collapsible__meta{margin-left:auto;font-size:12px;color:var(--la-ink-2)}
.la-collapsible__body{padding:2px 0 8px}
.la-seg{
  display:inline-flex;align-items:center;gap:2px;padding:2px;border-radius:var(--la-radius-sm);
  background:var(--la-surface-2);border:1px solid var(--la-line)
}
.la-seg__item{
  min-height:30px;padding:3px 10px;border:0;border-radius:var(--la-radius-xs);
  background:transparent;color:var(--la-ink-2);font-size:13px;cursor:pointer;white-space:nowrap
}
.la-seg__item:hover:not(:disabled){color:var(--la-ink)}
.la-seg__item.is-active{background:var(--la-bg);color:var(--la-ink);border:1px solid var(--la-line);padding:2px 9px}
.la-seg__item:disabled{opacity:.45;cursor:not-allowed}
.la-divider{border:0;border-top:1px solid var(--la-line);margin:12px 0}
.la-chips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0}
.la-chip{
  display:inline-flex;align-items:center;gap:4px;min-height:32px;padding:4px 12px;
  border-radius:999px;border:1px solid var(--la-line-2);background:transparent;color:var(--la-ink-2);
  font-size:13px;cursor:pointer;transition:border-color var(--la-motion) ease,color var(--la-motion) ease
}
.la-chip:hover{border-color:var(--la-brand);color:var(--la-ink)}
.la-chip.is-on{border-color:var(--la-brand);color:var(--la-brand);background:transparent}
.la-check{display:flex;align-items:center;gap:8px;min-height:36px;font-size:13px;color:var(--la-ink)}
.la-check input{width:16px;height:16px;accent-color:var(--la-brand)}
.la-radio{display:flex;align-items:center;gap:8px;font-size:13px;min-height:32px;cursor:pointer}
.la-radio input{accent-color:var(--la-brand)}
.la-bars{display:flex;flex-direction:column;gap:10px;margin:8px 0}
.la-bar{display:flex;flex-direction:column;gap:4px}
.la-bar__label{font-size:12.5px;color:var(--la-ink-2)}
.la-bar__track{height:12px;border-radius:999px;background:var(--la-surface-2);overflow:hidden}
.la-bar__fill{display:block;height:100%;background:var(--la-brand);transition:width var(--la-motion) ease}
.la-bar__fill--hidden{background:var(--la-ink-2)}
.la-slider{display:flex;flex-direction:column;gap:6px;margin:10px 0}
.la-slider__label{font-size:13px;color:var(--la-ink-2);font-variant-numeric:tabular-nums}
.la-slider input[type="range"]{width:100%;accent-color:var(--la-brand);min-height:28px}
@media (prefers-reduced-motion: reduce){
  .la-root *,.la-root *::before,.la-root *::after{animation-duration:0.001ms !important;transition-duration:0.001ms !important}
}
`
