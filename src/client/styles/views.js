/**
 * 视图层：领域卡片、问题尺度图谱/档案、三种视角、学习伙伴、证据尺度、任务草案、资料弹层。
 */

export const VIEWS_CSS = `
/* 通用尺度容器 */
.la-scale{display:flex;flex-direction:column;height:100%;min-height:0;overflow:auto;padding:18px 22px 24px}
.la-scalehead{margin-bottom:14px;max-width:860px}
.la-scalehead__title{font-size:20px;font-weight:600;line-height:1.35}
.la-scalehead__hint{margin-top:4px;font-size:13px;color:var(--la-ink-2);line-height:1.7}
.la-sectionhead{display:flex;align-items:flex-start;gap:12px;justify-content:space-between;margin-bottom:10px}
.la-sectionhead__text{min-width:0}
.la-sectionhead__title{font-size:15px;font-weight:600}
.la-sectionhead__hint{font-size:12.5px;color:var(--la-ink-2);margin-top:2px}

/* 领域尺度 */
.la-domaingrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px;max-width:1280px}
.la-domaincard{
  display:flex;flex-direction:column;gap:8px;text-align:left;padding:16px;min-height:190px;
  border:1px solid var(--la-line);border-radius:var(--la-radius-md);background:var(--la-surface);
  color:var(--la-ink);cursor:pointer;transition:border-color var(--la-motion) ease,background-color var(--la-motion) ease
}
.la-domaincard:hover{border-color:var(--la-brand);background:var(--la-surface-2)}
.la-domaincard.is-recommended{border-color:var(--la-brand);box-shadow:inset 0 0 0 1px var(--la-brand)}
.la-domaincard__top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.la-domaincard__index{font-size:12px;color:var(--la-ink-2);font-variant-numeric:tabular-nums;letter-spacing:.08em}
.la-domaincard__title{font-size:17px;font-weight:600;line-height:1.35}
.la-domaincard__row{display:flex;flex-direction:column;gap:1px}
.la-domaincard__label{font-size:12px;color:var(--la-ink-2);letter-spacing:.04em}
.la-domaincard__question{font-size:13.5px;line-height:1.55}
.la-domaincard__capability{font-size:12.5px;line-height:1.55;color:var(--la-ink-2)}
.la-domaincard__foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;color:var(--la-ink-2)}
.la-domaincard__entry{display:flex;align-items:center;gap:4px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* 问题尺度 */
.la-scale--subject{padding:0;overflow:hidden;display:flex;flex-direction:column;height:100%;min-height:0}
.la-subjecthead{
  display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;
  padding:12px 18px;border-bottom:1px solid var(--la-line);flex:none
}
.la-subjecthead__title{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0}
.la-subjecthead__group{font-size:12px;color:var(--la-ink-2);letter-spacing:.04em}
.la-subjecthead__name{font-size:17px;font-weight:600;line-height:1.3}
.la-subjecthead__relation{display:flex;align-items:center;gap:6px}
.la-subjecthead__tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.la-subjecthead__neighbors{font-size:12px;color:var(--la-ink-2)}
.la-subjectmain{flex:1;min-height:260px;display:flex;position:relative;overflow:hidden}
.la-subjectmain.is-list{overflow:auto;display:block}
.la-canvaswrap{position:relative;flex:1;min-height:0;min-width:0;overflow:auto}
.la-readpane{border-top:1px solid var(--la-line);overflow:auto;padding:16px 20px 24px;max-height:46%;flex:none;background:var(--la-bg)}
.is-projection-history .la-readpane,.is-projection-practice .la-readpane{max-height:30%}
.la-practice__more{font-size:12px;padding:2px 4px}
.la-scale--subject.is-narrow .la-readpane,
.is-narrow .la-readpane{max-height:none;flex:1;border-top:0}
.la-subjectmain.is-narrow{flex:1}

/* 图谱画布 */
.la-canvas{position:relative;width:100%;height:100%;min-height:340px;overflow:hidden}
.la-canvas__svg{position:absolute;inset:0;display:block}
.la-canvas__arrow{fill:var(--la-ink-2)}
.la-canvas__hint{position:absolute;left:16px;bottom:10px;font-size:12px;max-width:70%}
.la-canvas__empty{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(420px,80%);
  padding:16px;border:1px dashed var(--la-line-2);border-radius:var(--la-radius-md);background:var(--la-surface)
}
.la-edge{fill:none;stroke:var(--la-line-2);stroke-width:1.5;transition:stroke var(--la-motion) ease,stroke-width var(--la-motion) ease}
.la-edge.is-selected{stroke:var(--la-brand);stroke-width:2.5}
.la-edge__hit{fill:none;stroke:transparent;stroke-width:20;cursor:pointer;pointer-events:stroke}
.la-edgegroup:hover .la-edge{stroke:var(--la-ink-2)}
.la-edgegroup.is-selected .la-edge{stroke:var(--la-brand)}
.la-zone__label{fill:var(--la-ink-2);font-size:12px;letter-spacing:.04em}
.la-gnode{
  position:absolute;display:flex;flex-direction:column;justify-content:center;gap:2px;
  padding:8px 12px;border:1px solid var(--la-line);border-radius:var(--la-radius-md);
  background:var(--la-surface);color:var(--la-ink);cursor:pointer;text-align:left;
  transition:border-color var(--la-motion) ease,background-color var(--la-motion) ease;
  box-shadow:0 1px 2px rgba(0,0,0,.06)
}
.la-gnode:hover{border-color:var(--la-brand);background:var(--la-surface-2)}
.la-gnode--center{border-color:var(--la-brand);border-width:2px;background:var(--la-surface-2);box-shadow:0 4px 14px rgba(0,0,0,.08)}
.la-gnode.is-selected{border-color:var(--la-brand)}
.la-gnode__top{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--la-ink-2);line-height:1.3}
.la-gnode__kind{color:var(--la-ink-2)}
.la-gnode__era{font-variant-numeric:tabular-nums}
.la-gnode__count{
  margin-left:auto;min-width:16px;height:16px;border-radius:999px;background:var(--la-surface-2);
  display:inline-flex;align-items:center;justify-content:center;font-size:12px;color:var(--la-ink-2)
}
.la-gnode__title{font-size:15px;font-weight:500;line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.la-gnode--center .la-gnode__title{font-size:16px;font-weight:600}
.la-gnode__def{font-size:12px;line-height:1.45;color:var(--la-ink-2);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.la-relchip{
  position:absolute;display:inline-flex;align-items:center;gap:5px;min-height:28px;padding:2px 9px;
  border:1px solid var(--la-line-2);border-radius:999px;background:var(--la-bg);color:var(--la-ink-2);
  font-size:12px;cursor:pointer;white-space:nowrap;z-index:2;
  transition:border-color var(--la-motion) ease,color var(--la-motion) ease
}
.la-relchip:hover{border-color:var(--la-brand);color:var(--la-ink)}
.la-relchip.is-selected{border-color:var(--la-brand);color:var(--la-brand);background:var(--la-bg);font-weight:500}
.la-relchip__arrow{color:var(--la-ink-2);font-size:12px}
.la-relchip.is-selected .la-relchip__arrow{color:var(--la-brand)}

/* 列表视图 */
.la-listview{display:flex;flex-direction:column;height:100%;min-height:0;padding:12px 16px 16px;gap:10px}
.la-listview__filter{display:flex;align-items:center;gap:8px;flex:none}
.la-listview__filter .la-icon{color:var(--la-ink-2)}
.la-listview__columns{display:grid;grid-template-columns:1fr 1fr;gap:16px;flex:1;min-height:0;overflow:auto}
.la-listview__column{display:flex;flex-direction:column;min-height:0;gap:8px}
.la-listview__title{font-size:13px;color:var(--la-ink-2);font-weight:600;letter-spacing:.04em;flex:none}
.la-listview__list{display:flex;flex-direction:column;gap:4px;overflow:auto;min-height:0}
.la-listrow{
  display:flex;align-items:flex-start;gap:10px;width:100%;padding:9px 10px;min-height:48px;
  border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface);
  color:var(--la-ink);cursor:pointer;text-align:left
}
.la-listrow:hover{border-color:var(--la-brand)}
.la-listrow.is-current{border-color:var(--la-brand);box-shadow:inset 2px 0 0 var(--la-brand)}
.la-listrow.is-selected{border-color:var(--la-brand);background:var(--la-surface-2)}
.la-listrow__main{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.la-listrow__title{font-size:14px;line-height:1.4}
.la-listrow__sub{font-size:12px;color:var(--la-ink-2);line-height:1.45;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.la-listrow__side{display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex:none}
.la-listrow__kind,.la-listrow__era{font-size:12px;color:var(--la-ink-2);white-space:nowrap}

/* 历史视角 */
.la-projection{display:flex;flex-direction:column;gap:12px;padding:18px 22px 24px;height:100%;min-height:0;overflow:auto;flex:1 1 auto;width:100%;min-width:0}
.la-projection__head{max-width:var(--la-measure)}
.la-projection__title{font-size:17px;font-weight:600;line-height:1.4}
.la-projection__hint{margin-top:4px;font-size:12.5px;color:var(--la-ink-2);line-height:1.6}
.la-projection__foot{font-size:12px;color:var(--la-ink-2);line-height:1.6;max-width:var(--la-measure)}
.la-timeline{display:flex;flex-direction:column;gap:16px;max-width:900px}
.la-timeline__list{display:flex;flex-direction:column;gap:2px;border-left:2px solid var(--la-line);margin-left:6px;padding-left:0}
.la-timeline__item{display:flex;align-items:flex-start;gap:12px;position:relative;padding:6px 0 6px 16px}
.la-timeline__item::before{
  content:"";position:absolute;left:-7px;top:14px;width:10px;height:10px;border-radius:50%;
  background:var(--la-bg);border:2px solid var(--la-brand)
}
.la-timeline__year{flex:none;width:92px;font-size:13px;font-variant-numeric:tabular-nums;color:var(--la-ink-2);padding-top:6px}
.la-timeline__node{
  display:flex;flex-direction:column;gap:2px;flex:1;min-width:0;padding:6px 10px;text-align:left;
  border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface);
  color:var(--la-ink);cursor:pointer;min-height:44px
}
.la-timeline__node:hover{border-color:var(--la-brand)}
.la-timeline__nodetitle{font-size:14px}
.la-timeline__nodemeta{font-size:12px;color:var(--la-ink-2);line-height:1.5}
.la-works{display:flex;flex-direction:column;gap:6px}
.la-works__title{font-size:13px;color:var(--la-ink-2);font-weight:600;letter-spacing:.04em}
.la-works__list{display:flex;flex-wrap:wrap;gap:6px}
.la-works__item{
  display:flex;align-items:baseline;gap:8px;padding:6px 10px;min-height:36px;
  border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:transparent;
  color:var(--la-ink);cursor:pointer;font-size:13px;text-align:left
}
.la-works__item:hover{border-color:var(--la-brand)}
.la-works__year{font-size:12px;color:var(--la-ink-2);font-variant-numeric:tabular-nums}
.la-works__node{font-size:12px;color:var(--la-ink-2)}
.la-unknownband{
  display:flex;flex-direction:column;gap:8px;padding:12px;border:1px dashed var(--la-line-2);
  border-radius:var(--la-radius-md);background:var(--la-surface)
}
.la-unknownband__head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px}
.la-unknownband__list{display:flex;flex-wrap:wrap;gap:6px}
.la-unknownband__node{
  display:flex;align-items:center;gap:6px;padding:6px 10px;min-height:36px;border:1px solid var(--la-line);
  border-radius:999px;background:transparent;color:var(--la-ink);font-size:13px;cursor:pointer
}
.la-unknownband__node:hover{border-color:var(--la-brand)}
.la-gaplist{display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:var(--la-ink-2);line-height:1.6;max-width:var(--la-measure)}
.la-gaplist__item{color:var(--la-warn)}
.la-gaplist__path{display:block}

/* 实践视角 */
.la-practice{display:grid;grid-template-columns:repeat(auto-fit,minmax(178px,1fr));gap:10px;align-items:start}
.la-practice__stage{
  display:flex;flex-direction:column;gap:6px;min-height:120px;padding:10px;
  border:1px solid var(--la-line);border-radius:var(--la-radius-md);background:var(--la-surface)
}
.la-practice__stagetitle{font-size:13px;font-weight:600;color:var(--la-ink-2);letter-spacing:.04em;display:flex;align-items:center;gap:6px}
.la-practice__stageindex{
  display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;flex:none;
  border-radius:50%;border:1px solid var(--la-line-2);font-size:12px;color:var(--la-ink-2);font-weight:400
}
.la-practice__nodes{display:flex;flex-direction:column;gap:4px}
.la-practice__node{
  display:flex;flex-direction:column;gap:1px;padding:6px 8px;border:1px solid var(--la-line);
  border-radius:var(--la-radius-sm);background:var(--la-bg);color:var(--la-ink);cursor:pointer;text-align:left;min-height:40px
}
.la-practice__node:hover{border-color:var(--la-brand)}
.la-practice__node.is-current{border-color:var(--la-brand);box-shadow:inset 2px 0 0 var(--la-brand)}
.la-practice__nodetitle{font-size:13px;line-height:1.35}
.la-practice__nodemeta{font-size:12px;color:var(--la-ink-2)}
.la-practice__empty{color:var(--la-ink-2);font-size:13px}
.la-practice__unmapped{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12.5px;color:var(--la-ink-2)}

/* 节点档案 */
.la-dossier{max-width:var(--la-measure);display:flex;flex-direction:column;gap:12px}
.la-dossier__head{display:flex;flex-direction:column;gap:6px}
.la-dossier__kicker{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px;color:var(--la-ink-2)}
.la-dossier__title{font-size:22px;font-weight:600;line-height:1.3}
.la-dossier__lead{font-size:16px;line-height:1.7;padding-left:12px;border-left:2px solid var(--la-brand)}
.la-dossier__actions{display:flex;gap:8px;flex-wrap:wrap}
.la-dossier__fields{display:flex;flex-direction:column;gap:14px}
.la-dossier__label{font-size:12px;color:var(--la-ink-2);font-weight:600;letter-spacing:.04em;margin-bottom:4px}
.la-dossier__text{font-size:16px;line-height:1.7}
.la-dossier__field{display:flex;flex-direction:column}
.la-dossier__note{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--la-ink-2);margin-top:4px;flex-wrap:wrap}
.la-dossier__claims{display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--la-line);padding-top:12px}

/* 主张与来源 */
.la-claims{display:flex;flex-direction:column;gap:10px}
.la-claim{padding:10px 12px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface)}
.la-claim__head{display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap}
.la-claim__text{font-size:14px;line-height:1.65}
.la-sourcelist{display:flex;flex-direction:column;gap:4px;margin-top:6px}
.la-sourcerow{
  display:flex;align-items:center;gap:8px;width:100%;padding:5px 8px;min-height:36px;
  border:1px solid transparent;border-radius:var(--la-radius-xs);background:transparent;color:var(--la-ink);
  font-size:12.5px;cursor:pointer;text-align:left
}
.la-sourcerow:hover{border-color:var(--la-line);background:var(--la-surface-2)}
.la-sourcerow__main{display:flex;flex-direction:column;gap:0;min-width:0;flex:1}
.la-sourcerow__title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.la-sourcerow__meta{font-size:12px;color:var(--la-ink-2)}
.la-relationlist{display:flex;flex-direction:column;gap:4px}
.la-relationlist__item{
  display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;min-height:44px;
  border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface);
  color:var(--la-ink);cursor:pointer;text-align:left;font-size:13px
}
.la-relationlist__item:hover{border-color:var(--la-brand)}
.la-relationlist__route{white-space:nowrap}
.la-relationlist__claim{flex:1;min-width:0;color:var(--la-ink-2);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* 学习伙伴 */
.la-partner{
  display:flex;flex-direction:column;min-width:0;min-height:0;height:100%;
  border-left:1px solid var(--la-line);background:var(--la-sidebar)
}
.la-partner__head{display:flex;align-items:flex-start;gap:8px;padding:12px 14px 8px;border-bottom:1px solid var(--la-line);flex:none}
.la-partner__subject{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.la-partner__subjectrow{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.la-partner__subjectname{font-size:15px;font-weight:600;line-height:1.4;overflow:hidden;text-overflow:ellipsis}
.la-partner__sources{font-size:12px;color:var(--la-ink-2)}
.la-partner__model{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--la-ink-2);flex-wrap:wrap}
.la-partner__body{display:flex;flex-direction:column;flex:1;min-height:0}
.la-partner__inspector{max-height:46%;overflow:auto;border-bottom:1px solid var(--la-line);padding:10px 14px 12px;flex:none}
.la-partner__tabs{display:flex;gap:2px;padding:6px 8px 0;border-bottom:1px solid var(--la-line);flex:none}
.la-partnertab{
  display:inline-flex;align-items:center;gap:6px;padding:6px 10px;min-height:36px;
  border:0;border-bottom:2px solid transparent;background:transparent;color:var(--la-ink-2);
  font-size:13px;cursor:pointer
}
.la-partnertab:hover{color:var(--la-ink)}
.la-partnertab.is-active{color:var(--la-ink);border-bottom-color:var(--la-brand)}
.la-partnertab__count{
  min-width:16px;height:16px;border-radius:999px;background:var(--la-surface-2);color:var(--la-ink-2);
  display:inline-flex;align-items:center;justify-content:center;font-size:12px;padding:0 4px
}
.la-partner__panel{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}

/* 关系详情 */
.la-inspector{display:flex;flex-direction:column;gap:8px;min-width:0}
.la-inspector__head{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12px;color:var(--la-ink-2)}
.la-inspector__grow{flex:1}
.la-inspector__route{font-size:14px;font-weight:600;line-height:1.4}
.la-inspector__block{display:flex;flex-direction:column;gap:2px}
.la-inspector__text{font-size:13.5px;line-height:1.65}
.la-inspector__actions{display:flex;gap:8px;flex-wrap:wrap}
.la-inspector__savedat{font-size:12px}
.la-annotation{display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--la-line);padding-top:8px}
.la-annotation__row{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;flex-wrap:wrap}
.la-notekind{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--la-ink-2)}
.la-notekind__label{white-space:nowrap}
.la-evidence{display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--la-line);padding-top:8px}
.la-evidence__list{display:flex;flex-direction:column;gap:6px}
.la-evidence__item{padding:8px 10px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface)}
.la-evidence__text{font-size:13px;line-height:1.6;white-space:pre-wrap}
.la-evidence__meta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px;font-size:12px}

/* 对话 */
.la-chat{display:flex;flex-direction:column;height:100%;min-height:0;padding:8px 12px 10px;gap:8px}
.la-chat__list{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:10px;padding-right:2px}
.la-chat__empty{font-size:13px;color:var(--la-ink-2);line-height:1.7;padding:8px 2px}
.la-msg{display:flex;flex-direction:column;gap:4px;padding:8px 10px;border-radius:var(--la-radius-md);border:1px solid var(--la-line);background:var(--la-surface)}
.la-msg--user{background:var(--la-surface-2)}
.la-msg.is-streaming{border-style:dashed}
.la-msg.is-error{border-color:var(--la-danger)}
.la-msg__head{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12px;color:var(--la-ink-2)}
.la-msg__role{font-weight:600;color:var(--la-ink)}
.la-msg__text{font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word}
.la-msg__error{display:flex;flex-direction:column;gap:6px;padding:6px 8px;border-left:2px solid var(--la-danger);font-size:12.5px;color:var(--la-danger);line-height:1.55}
.la-msg__actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:2px}
.la-chat__composer{display:flex;flex-direction:column;gap:6px;flex:none;border-top:1px solid var(--la-line);padding-top:8px}
.la-chat__input{min-height:64px}
.la-chat__actions{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.la-chat__hint{font-size:12px;flex:1;min-width:110px}
.la-chat__footnote{font-size:12px;color:var(--la-ink-2);line-height:1.5}

/* 笔记 */
.la-notes{display:flex;flex-direction:column;gap:10px;height:100%;min-height:0;overflow:auto;padding:8px 12px 12px}
.la-notecomposer{display:flex;flex-direction:column;gap:6px;flex:none}
.la-notecomposer__field{display:flex;flex-direction:column}
.la-notecomposer__row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.la-notelist{display:flex;flex-direction:column;gap:8px}
.la-note{padding:10px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface)}
.la-note.is-archived{border-style:dashed;background:transparent}
.la-note__head{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.la-note__grow{flex:1}
.la-note__meta{display:flex;align-items:center;gap:6px;margin-top:2px;font-size:12px;color:var(--la-ink-2);flex-wrap:wrap}
.la-note__warning{font-size:12px;color:var(--la-warn);line-height:1.5;margin-top:4px}
.la-note__text{margin-top:6px;font-size:13.5px;line-height:1.7;white-space:pre-wrap;word-break:break-word}
.la-note__editor{display:flex;flex-direction:column;gap:6px;margin-top:6px}
.la-note__actions{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:6px}
.la-inlineactions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.la-archived{margin-top:8px}
.la-archived__summary{cursor:pointer;font-size:12.5px;color:var(--la-ink-2);padding:4px 0;min-height:32px}
.la-archived .la-note{margin-top:6px}

/* 证据尺度 */
.la-scale--evidence{padding:16px 18px 24px;overflow:auto}
.la-evidencegrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:start;max-width:1320px}
.la-evpanel{
  display:flex;flex-direction:column;gap:8px;min-width:0;padding:14px;border:1px solid var(--la-line);
  border-radius:var(--la-radius-md);background:var(--la-surface)
}
.la-evpanel--experiments{grid-column:1 / -1}
.la-evsection{display:flex;flex-direction:column;gap:8px;min-width:0;padding:14px;border:1px solid var(--la-line);border-radius:var(--la-radius-md);background:var(--la-surface)}
.la-evpanel .la-evsection,.la-evpanel .la-notes{padding:0;border:0;background:transparent}
.la-evsection__head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.la-evsection__title{font-size:14px;font-weight:600}
.la-evpanel .la-evsection__hint,.la-evsection__hint{font-size:12px;color:var(--la-ink-2);line-height:1.6}
.la-nexttest{
  display:flex;align-items:flex-start;gap:10px;padding:12px 14px;margin-bottom:12px;
  border:1px solid var(--la-warn);border-radius:var(--la-radius-md);background:var(--la-surface);max-width:1320px
}
.la-nexttest .la-icon{color:var(--la-warn);margin-top:2px}
.la-nexttest__body{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.la-nexttest__label{font-size:12px;letter-spacing:.04em;color:var(--la-warn)}
.la-nexttest__text{font-size:14px;line-height:1.6}
.la-formcard{display:flex;flex-direction:column;gap:2px;padding:12px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-bg)}
.la-formcard__actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px}

/* 实验卡片 */
.la-expcard{border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-bg);overflow:hidden}
.la-expcard__head{
  display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;min-height:48px;border:0;
  background:transparent;color:var(--la-ink);cursor:pointer;text-align:left
}
.la-expcard__head:hover{background:var(--la-surface-2)}
.la-expcard__chevron{color:var(--la-ink-2);font-size:12px;width:12px;flex:none}
.la-expcard__titles{display:flex;flex-direction:column;gap:1px;flex:1;min-width:0}
.la-expcard__title{font-size:14px;font-weight:500}
.la-expcard__subtitle{font-size:12px;color:var(--la-ink-2)}
.la-expcard__body{display:flex;flex-direction:column;gap:10px;padding:4px 12px 12px;border-top:1px solid var(--la-line)}
.la-expcard__question{font-size:13.5px;line-height:1.6;padding-top:8px}
.la-expcard__note{font-size:12px;line-height:1.6}
.la-exp{display:flex;flex-direction:column;gap:8px}
.la-exp__control{display:flex;flex-direction:column;gap:2px}
.la-exp__formula{font-size:12px;line-height:1.6}
.la-exp__actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.la-prediction{display:flex;flex-direction:column;gap:4px}
.la-expresult{display:flex;flex-direction:column;gap:8px;padding:10px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface)}
.la-expresult__verdict{display:flex;flex-direction:column;gap:2px}
.la-expresult__label{font-size:16px;font-weight:600}
.la-expresult__label.verdict-oscillating,.la-expresult__label.verdict-oscillating-below,.la-expresult__label.verdict-diverging{color:var(--la-danger)}
.la-expresult__label.verdict-converged,.la-expresult__label.verdict-overshoot-settled{color:var(--la-ok)}
.la-expresult__label.verdict-drift{color:var(--la-warn)}
.la-expresult__match{font-size:12.5px;line-height:1.5}
.la-expresult__match.is-match{color:var(--la-ok)}
.la-expresult__match.is-miss{color:var(--la-warn)}
.la-expresult__criterion{font-size:12.5px;line-height:1.6;color:var(--la-ink-2)}
.la-expresult__meta{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px;color:var(--la-ink-2);font-variant-numeric:tabular-nums}
.la-expresult__actions{display:flex;gap:8px;flex-wrap:wrap}
.la-expresult__allgreen{font-size:14px;font-weight:600}
.la-expresult__allgreen.is-green{color:var(--la-ok)}
.la-expresult__allgreen.is-red{color:var(--la-danger)}
.la-metrics{display:flex;flex-wrap:wrap;gap:6px 16px}
.la-metrics__item{display:flex;flex-direction:column;gap:0;min-width:70px}
.la-metrics__item dt{font-size:12px;color:var(--la-ink-2)}
.la-metrics__item dd{font-size:13px;font-variant-numeric:tabular-nums}
.la-trace{margin:0;display:flex;flex-direction:column;gap:4px}
.la-trace__svg{width:100%;height:auto;background:var(--la-bg);border:1px solid var(--la-line);border-radius:var(--la-radius-xs)}
.la-trace__axis{stroke:var(--la-line-2);stroke-width:1}
.la-trace__target{stroke:var(--la-warn);stroke-width:1;stroke-dasharray:3 4}
.la-trace__line{fill:none;stroke:var(--la-brand);stroke-width:1.8}
.la-trace__label{fill:var(--la-ink-2);font-size:12px}
.la-trace__caption{font-size:12px}
.la-checks{display:flex;flex-direction:column;gap:2px}
.la-case__item,.la-caselist__item{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--la-line);flex-wrap:wrap}
.la-caselist{display:flex;flex-direction:column;gap:0}
.la-caselist__label{min-width:160px;font-size:13px}
.la-caselist__detail{font-size:12px;color:var(--la-ink-2);flex-basis:100%;padding-left:4px}
.la-caselist__item.is-fail .la-caselist__detail{color:var(--la-danger)}
.la-runlist{display:flex;flex-direction:column;gap:4px}
.la-runlist__item{
  display:flex;align-items:baseline;gap:4px 12px;flex-wrap:wrap;padding:6px 8px;border:1px solid var(--la-line);
  border-radius:var(--la-radius-xs);font-size:12px;color:var(--la-ink-2);background:var(--la-bg)
}
.la-runlist__verdict{font-size:12.5px;color:var(--la-ink)}
.la-runlist__params,.la-runlist__model{font-family:ui-monospace,Consolas,monospace}
.la-runlist__criterion{flex-basis:100%}

/* 预测 / 研究问题 */
.la-predlist,.la-invlist{display:flex;flex-direction:column;gap:8px}
.la-pred,.la-inv{display:flex;flex-direction:column;gap:4px;padding:10px 12px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-bg)}
.la-pred.is-open{border-left:2px solid var(--la-warn)}
.la-inv.is-active{border-left:2px solid var(--la-brand)}
.la-pred__head,.la-inv__head{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.la-pred__grow,.la-inv__grow{flex:1}
.la-pred__text{font-size:14px;line-height:1.6}
.la-pred__resolveby{font-size:12px;color:var(--la-ink-2);line-height:1.55}
.la-pred__investigation,.la-pred__run{font-size:12px}
.la-pred__resolved{font-size:12px;color:var(--la-ok)}
.la-pred__note{font-size:12.5px;line-height:1.6;color:var(--la-ink-2)}
.la-pred__actions{display:flex;flex-direction:column;gap:6px;margin-top:4px}
.la-pred__form,.la-inv__form{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px;border:1px solid var(--la-line);border-radius:var(--la-radius-xs);background:var(--la-surface)}
.la-pred__form .la-input,.la-inv__form .la-input{flex:1;min-width:140px}
.la-inv__title{font-size:14px;font-weight:600;min-width:0;flex:1}
.la-inv__claim,.la-inv__counter,.la-inv__next{font-size:13px;line-height:1.65}
.la-inv__next{color:var(--la-ink)}
.la-inv__meta{font-size:12px}
.la-inv__actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}

/* 任务草案 */
.la-tasklist{display:flex;flex-direction:column;gap:6px}
.la-tasklist__open{
  display:flex;align-items:flex-start;gap:10px;width:100%;padding:9px 10px;min-height:48px;
  border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-bg);
  color:var(--la-ink);cursor:pointer;text-align:left
}
.la-tasklist__open:hover{border-color:var(--la-brand)}
.la-tasklist__main{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.la-tasklist__title{font-size:14px}
.la-tasklist__sub{font-size:12px;color:var(--la-ink-2);line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.la-tasklist__side{display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex:none;font-size:12px}
.la-taskeditor{display:flex;flex-direction:column;gap:12px;padding:16px 18px 24px;height:100%;min-height:0;overflow:auto}
.la-taskeditor__head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.la-taskeditor__title{font-size:18px;font-weight:600}
.la-taskeditor__notsent{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--la-ink-2);line-height:1.5}
.la-taskeditor__actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.la-taskstart{display:flex;flex-direction:column;gap:10px;max-width:var(--la-measure)}
.la-taskstart__title{font-size:17px;font-weight:600}
.la-taskstart__actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.la-taskform{display:flex;flex-direction:column;gap:12px;max-width:1180px}
.la-taskcolumns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;align-items:start}
.la-taskcol{display:flex;flex-direction:column;gap:6px;padding:12px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface);min-width:0}
.la-taskcol__title{font-size:13px;font-weight:600;color:var(--la-ink)}
.la-taskcol .la-textarea{min-height:120px}
.la-taskitem{display:flex;flex-direction:column;gap:4px;position:relative;padding-right:30px}
.la-taskitem .la-iconbtn{position:absolute;right:0;top:4px}
.la-taskblock{display:flex;flex-direction:column;gap:6px;padding:12px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface);min-width:0}
.la-taskmeta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:start}
.la-taskevidence{display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:var(--la-ink-2)}
.la-taskevidence li{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid var(--la-line)}
.la-taskform__actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-top:4px}
.la-tasksaved{display:flex;flex-direction:column;gap:14px;max-width:1180px}
.la-tasksaved__block{display:flex;flex-direction:column;gap:2px}
.la-tasksaved__text{font-size:15px;line-height:1.7;white-space:pre-wrap}
.la-tasksaved__list{display:flex;flex-direction:column;gap:4px;font-size:13.5px;line-height:1.6}
.la-taskversions{display:flex;align-items:center;gap:6px;font-size:12px}
.la-taskcompare{display:flex;flex-direction:column;gap:8px;padding:12px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface)}
.la-taskcompare__cols{display:grid;grid-template-columns:120px minmax(0,1fr) minmax(0,1fr);gap:8px;font-size:13px}
.la-taskcompare__row{display:contents}
.la-taskcompare__label{color:var(--la-ink-2);font-size:12px;padding-top:2px}
.la-taskcompare__cell{min-width:0;line-height:1.6}
.la-taskcompare__row.is-changed .la-taskcompare__cell{color:var(--la-warn)}
.la-taskcompare__cols>.la-muted{font-size:12px}

/* 资料与备份 */
.la-resources{display:flex;flex-direction:column;gap:14px}
.la-resblock{display:flex;flex-direction:column;gap:8px;padding:12px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface)}
.la-resrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.la-respath{display:flex;align-items:center;gap:8px;min-width:0}
.la-respath .la-icon{color:var(--la-ink-2);flex:none}
.la-respath__text{
  flex:1;min-width:0;padding:6px 8px;border:1px solid var(--la-line);border-radius:var(--la-radius-xs);
  background:var(--la-bg);font-family:ui-monospace,Consolas,monospace;font-size:12px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap
}
.la-respreview__line{font-size:13px}
.la-respreview__errors,.la-respreview__conflicts{display:flex;flex-direction:column;gap:4px}
.la-reslist{display:flex;flex-direction:column;gap:3px;font-size:12.5px;color:var(--la-ink-2);max-height:180px;overflow:auto}
.la-resmodes{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.la-migration{display:flex;flex-direction:column;gap:8px}
.la-migration__list{display:flex;flex-wrap:wrap;gap:4px 18px;font-size:12.5px}
.la-migration__row{display:flex;gap:8px}
.la-migration__row dt{color:var(--la-ink-2)}
.la-migration__row dd{color:var(--la-ink)}

/* 继续研究 */
.la-continue{display:flex;flex-direction:column;gap:14px}
.la-continue__block{display:flex;flex-direction:column;gap:6px}
.la-continue__row{
  display:flex;align-items:flex-start;gap:10px;width:100%;padding:9px 10px;min-height:48px;
  border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-bg);
  color:var(--la-ink);cursor:pointer;text-align:left
}
.la-continue__row:hover{border-color:var(--la-brand)}
.la-continue__row .la-icon{color:var(--la-ink-2);margin-top:2px}
.la-continue__main{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;font-size:13.5px}
.la-continue__title{font-size:14px;line-height:1.45}

/* 来源详情 / 回执 */
.la-sourcedetail{display:flex;flex-direction:column;gap:8px}
.la-sourcedetail__row{display:grid;grid-template-columns:96px minmax(0,1fr);gap:10px;font-size:13px;line-height:1.6}
.la-sourcedetail__row dt{color:var(--la-ink-2);font-size:12px}
.la-sourcedetail__row dd{word-break:break-word}
.la-receipts{display:flex;flex-direction:column;gap:14px}
.la-receipts__block{display:flex;flex-direction:column;gap:6px}
.la-receipts__list{display:flex;flex-direction:column;gap:6px}
.la-receipt{display:flex;align-items:flex-start;gap:8px;padding:7px 9px;border:1px solid var(--la-line);border-radius:var(--la-radius-xs);font-size:12.5px;line-height:1.55;flex-wrap:wrap}
.la-receipt__kind{flex:none;font-weight:600;color:var(--la-ink-2)}
.la-receipt--ok .la-receipt__kind{color:var(--la-ok)}
.la-receipt--error .la-receipt__kind,.la-receipt--error .la-receipt__text{color:var(--la-danger)}
.la-receipt--error{border-color:var(--la-danger)}
.la-receipt--warn{border-color:var(--la-warn)}
.la-receipt__text{flex:1;min-width:0;word-break:break-word}
.la-receipt__code{font-family:ui-monospace,Consolas,monospace;color:var(--la-ink-2);font-size:12px}
.la-receipt__time{font-size:12px;color:var(--la-ink-2)}

@media (max-width:1180px){
  .la-evidencegrid{grid-template-columns:minmax(0,1fr)}
  .la-listview__columns{grid-template-columns:minmax(0,1fr)}
  .la-taskcolumns{grid-template-columns:minmax(0,1fr)}
  .la-taskmeta{grid-template-columns:minmax(0,1fr)}
}
@media (max-width:919px){
  .la-scale{padding:14px 12px 20px}
  .la-scale--subject{padding:0}
  .la-scale--evidence{padding:12px 10px 18px}
  .la-projection{padding:14px 12px 20px}
  .la-practice{grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}
  .la-timeline__year{width:68px;font-size:12px}
  .la-domaingrid{grid-template-columns:minmax(0,1fr)}
  .la-subjecthead{padding:10px 12px}
  .la-readpane{padding:12px 12px 20px}
  .la-partner{border-left:0}
  .la-dossier__title{font-size:19px}
  .la-taskeditor{padding:12px 10px 20px}
  .la-taskcompare__cols{grid-template-columns:80px minmax(0,1fr) minmax(0,1fr)}
  .la-overlay{padding:8px}
}
`
