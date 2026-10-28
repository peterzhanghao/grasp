/**
 * 外壳层：状态页、顶栏与搜索、单元目录、三栏主体、状态条、窄屏分段、弹层。
 */

export const SHELL_CSS = `
/* 起始/错误状态页 */
.la-root--state{align-items:center;justify-content:center;padding:32px}
.la-statepane{
  display:flex;flex-direction:column;align-items:flex-start;gap:10px;max-width:560px;
  padding:24px;border:1px solid var(--la-line);border-radius:var(--la-radius-lg);background:var(--la-surface)
}
.la-statepane .la-icon{color:var(--la-ink-2)}
.la-statepane__title{font-size:18px;font-weight:600}
.la-statepane__message{font-size:14px;color:var(--la-danger)}
.la-statepane__hint{font-size:13px;line-height:1.7}

/* 顶栏 */
.la-topbar{
  display:flex;align-items:center;gap:14px;flex-wrap:wrap;row-gap:8px;
  padding:10px 16px;border-bottom:1px solid var(--la-line);background:var(--la-bg);flex:none;z-index:3
}
.la-brand{display:flex;flex-direction:column;min-width:0;margin-right:2px}
.la-brand__name{font-size:18px;font-weight:600;letter-spacing:.08em;line-height:1.2}
.la-brand__sub{font-size:12px;color:var(--la-ink-2);white-space:nowrap}
.la-topbar__cluster{display:flex;align-items:center;gap:6px}
.la-topbar__label{font-size:12px;color:var(--la-ink-2);white-space:nowrap}
.la-topbar__spacer{flex:1;display:flex;justify-content:flex-end;min-width:160px}
.la-topbar__actions{display:flex;align-items:center;gap:4px}
.la-topbar__menu{display:none}

/* 搜索 */
.la-search{position:relative;display:flex;align-items:center;width:min(320px,100%)}
.la-search__icon{position:absolute;left:10px;color:var(--la-ink-2);pointer-events:none}
.la-search__input{
  width:100%;min-height:36px;padding:6px 10px 6px 34px;border-radius:var(--la-radius-sm);
  border:1px solid var(--la-line);background:var(--la-surface);color:var(--la-ink);font-size:13.5px
}
.la-search__input:focus{outline:2px solid var(--la-brand);outline-offset:0}
.la-search__popover{
  position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:30;
  background:var(--la-overlay);border:1px solid var(--la-line);border-radius:var(--la-radius-md);
  box-shadow:0 12px 32px rgba(0,0,0,.18);overflow:hidden
}
.la-search__list{max-height:340px;overflow:auto}
.la-search__result{
  display:flex;align-items:flex-start;gap:8px;width:100%;padding:8px 10px;border:0;background:transparent;
  color:var(--la-ink);cursor:pointer;text-align:left;min-height:44px
}
.la-search__result:hover,.la-search__result.is-active{background:var(--la-surface-2)}
.la-search__result-main{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.la-search__result-main>span:first-child{font-size:13.5px}
.la-search__result-sub{font-size:12px;color:var(--la-ink-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.la-search__result-kind{font-size:12px;color:var(--la-ink-2);border:1px solid var(--la-line-2);border-radius:999px;padding:0 6px;white-space:nowrap;margin-top:2px}
.la-search__empty{padding:12px;font-size:13px;color:var(--la-ink-2)}
.la-search__hint{padding:6px 10px;font-size:12px;color:var(--la-ink-2);border-top:1px solid var(--la-line)}

/* 单元目录 */
.la-dir{
  display:flex;flex-direction:column;min-height:0;height:100%;
  background:var(--la-sidebar);border-right:1px solid var(--la-line);overflow:hidden;z-index:12
}
.la-dir__head{display:flex;align-items:center;justify-content:space-between;padding:10px 10px 6px 14px}
.la-dir__title{font-size:13px;font-weight:600;color:var(--la-ink-2);letter-spacing:.04em}
.la-dir__overview{
  display:flex;align-items:center;gap:8px;margin:2px 8px 8px;padding:8px 10px;min-height:40px;
  border:1px solid transparent;border-radius:var(--la-radius-sm);background:transparent;
  color:var(--la-ink-2);font-size:13.5px;cursor:pointer;text-align:left
}
.la-dir__overview:hover{background:var(--la-surface-2);color:var(--la-ink)}
.la-dir__overview.is-active{border-color:var(--la-brand);color:var(--la-brand)}
.la-dir__list{flex:1;min-height:0;overflow:auto;padding:0 8px 8px;display:flex;flex-direction:column;gap:2px}
.la-dir__item{
  display:flex;align-items:flex-start;gap:8px;width:100%;padding:8px 10px;min-height:48px;
  border:1px solid transparent;border-radius:var(--la-radius-sm);background:transparent;
  color:var(--la-ink);cursor:pointer;text-align:left
}
.la-dir__item:hover{background:var(--la-surface-2)}
.la-dir__item.is-active{background:var(--la-surface);border-color:var(--la-line);box-shadow:inset 2px 0 0 var(--la-brand)}
.la-dir__index{font-size:12px;color:var(--la-ink-2);font-variant-numeric:tabular-nums;padding-top:3px;flex:none}
.la-dir__text{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1}
.la-dir__name{font-size:13.5px;line-height:1.4}
.la-dir__question{font-size:12px;color:var(--la-ink-2);line-height:1.45}
.la-dir__meta{font-size:12px;color:var(--la-ink-2);line-height:1.5}
.la-dir__foot{padding:8px 14px;border-top:1px solid var(--la-line);font-size:12px;color:var(--la-ink-2)}
.la-dir__footline{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* 三栏主体 */
.la-body{
  position:relative;flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr);overflow:hidden
}
.la-body.has-dir{grid-template-columns:216px minmax(0,1fr)}
.la-body.has-right{grid-template-columns:minmax(0,1fr) var(--la-right-width,352px)}
.la-body.has-dir.has-right{grid-template-columns:216px minmax(0,1fr) var(--la-right-width,352px)}
.la-mainpane{display:flex;flex-direction:column;min-width:0;min-height:0;overflow:hidden;position:relative}
.la-splitter{
  position:absolute;top:0;bottom:0;right:var(--la-right-width,352px);width:7px;z-index:8;
  display:flex;justify-content:center;cursor:col-resize
}
.la-splitter__handle{width:3px;height:100%;border-radius:2px;background:transparent}
.la-splitter:hover .la-splitter__handle,.la-splitter__handle:focus-visible{background:var(--la-brand)}
.la-backdrop{display:none}

/* 横幅 */
.la-banner{padding:8px 16px;border-bottom:1px solid var(--la-line);flex:none}

/* 状态条 */
.la-statusbar{
  display:flex;align-items:center;gap:14px;flex:none;min-height:40px;padding:4px 12px;
  border-top:1px solid var(--la-line);font-size:12px;color:var(--la-ink-2);background:var(--la-bg)
}
.la-statusbar__path{
  display:flex;align-items:center;gap:6px;min-height:32px;max-width:32%;padding:4px 8px;
  border:0;border-radius:var(--la-radius-xs);background:transparent;color:var(--la-ink-2);cursor:pointer;font-size:12px
}
.la-statusbar__path:hover{background:var(--la-surface-2);color:var(--la-ink)}
.la-statusbar__pathtext{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:ui-monospace,Consolas,monospace}
.la-statusbar__model{display:flex;align-items:center;gap:6px;white-space:nowrap;max-width:28%;overflow:hidden}
.la-statusbar__model>span:nth-child(2){overflow:hidden;text-overflow:ellipsis}
.la-statusbar__alert{max-width:28%}
.la-statusbar__alert .la-notice{min-height:28px;padding:3px 8px;font-size:12px;background:transparent}
.la-statusbar__receipt{
  display:flex;align-items:center;gap:6px;flex:1;min-width:120px;min-height:32px;padding:4px 8px;
  border:1px solid transparent;border-radius:var(--la-radius-xs);background:transparent;color:var(--la-ink-2);
  font-size:12px;cursor:pointer;text-align:left
}
.la-statusbar__receipt:hover{background:var(--la-surface-2)}
.la-statusbar__receipt.is-ok{color:var(--la-ok)}
.la-statusbar__receipt.is-error{color:var(--la-danger)}
.la-statusbar__receipttext{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.la-statusbar__code{opacity:1;font-family:ui-monospace,Consolas,monospace}
.la-statusbar__receiptcount{
  flex:none;min-width:18px;height:18px;border-radius:999px;background:var(--la-surface-2);
  color:var(--la-ink-2);display:inline-flex;align-items:center;justify-content:center;font-size:12px
}
.la-statusbar__right{display:flex;align-items:center;gap:4px;flex:none}
.la-statusbar__notices{
  display:flex;align-items:center;gap:4px;border:0;background:var(--la-surface-2);color:var(--la-ink-2);
  border-radius:999px;padding:2px 8px;font-size:12px;cursor:pointer;min-height:26px
}
.la-statusbar__notices:hover{color:var(--la-ink)}
.la-statusbar__refreshing{color:var(--la-ink-2)}

/* 窄屏分段 */
.la-mobilestage{
  display:none;flex:none;gap:4px;padding:6px;border-top:1px solid var(--la-line);background:var(--la-bg)
}
.la-mobilestage__item{
  flex:1;min-height:40px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);
  background:transparent;color:var(--la-ink-2);font-size:13px;cursor:pointer
}
.la-mobilestage__item.is-active{background:var(--la-brand);border-color:var(--la-brand);color:var(--la-bg)}

/* 弹层 */
.la-overlay{
  position:absolute;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:20px;
  background:var(--la-overlay);background:color-mix(in srgb,var(--la-bg) 74%,transparent)
}
.la-dialog{
  display:flex;flex-direction:column;width:min(680px,100%);max-height:calc(100% - 8px);
  border:1px solid var(--la-line);border-radius:var(--la-radius-lg);background:var(--la-overlay);
  box-shadow:0 24px 64px rgba(0,0,0,.28);overflow:hidden
}
.la-dialog--sm{width:min(440px,100%)}
.la-dialog--lg{width:min(860px,100%)}
.la-dialog__head{
  display:flex;align-items:flex-start;gap:12px;padding:16px 16px 10px;border-bottom:1px solid var(--la-line)
}
.la-dialog__heading{flex:1;min-width:0}
.la-dialog__title{font-size:17px;font-weight:600;line-height:1.35}
.la-dialog__desc{margin-top:4px;font-size:12.5px;color:var(--la-ink-2);line-height:1.6}
.la-dialog__body{padding:16px;overflow:auto;min-height:0;font-size:14px;line-height:1.7}
.la-dialog__foot{padding:10px 16px;border-top:1px solid var(--la-line);background:var(--la-surface)}
.la-dialog__actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}
.la-confirm__text{font-size:14px;line-height:1.7}
.la-confirm .la-confirm__text{margin-bottom:0}

@media (max-width:1180px){
  .la-brand__sub{display:none}
  .la-topbar__cluster--view .la-topbar__label{display:none}
  .la-statusbar__path{max-width:26%}
}
@media (max-width:919px){
  .la-body{display:block;overflow:auto}
  .la-mainpane{height:100%;min-height:0}
  .la-body.is-chatstage .la-mainpane{height:100%}
  .la-dir{
    position:absolute;left:0;top:0;bottom:0;width:min(300px,86%);height:auto;border-right:1px solid var(--la-line-2);
    box-shadow:0 12px 40px rgba(0,0,0,.24)
  }
  .la-backdrop{display:block;position:absolute;inset:0;z-index:10;background:var(--la-overlay);background:color-mix(in srgb,var(--la-bg) 60%,transparent)}
  .la-topbar{padding:8px 12px;gap:10px}
  .la-topbar__label{display:none}
  .la-topbar__spacer{order:5;flex-basis:100%;min-width:0}
  .la-search{width:100%}
  .la-topbar__menu{display:inline-flex}
  .la-mobilestage{display:flex}
  .la-splitter{display:none}
  .la-statusbar{flex-wrap:wrap;row-gap:2px;min-height:36px;padding:2px 8px;gap:8px}
  .la-statusbar__path{max-width:60%}
  .la-statusbar__model{max-width:40%}
  .la-statusbar__alert{display:none}
  .la-statusbar__receipt{order:5;flex-basis:100%}
}
`
