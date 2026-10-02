#!/usr/bin/env python3
"""
deai-loop 检测脚本：中文文章 AI 痕迹统计检测（段落级定位）

三层信号中的「统计层」，零成本可复现：
  1. 段落句长 CV（变异系数）——句长过于均匀是强 AI 信号
     方法参考 humanize-mba-text-skill（MIT）的 AI_artifact_detection 思路
  2. 禁语扫描——高频 AI 腔词汇
  3. 排版异常——加粗强调（AI 爱给数字/标签加粗）

用法：
  python3 detect.py <markdown 文件> [--json]
输出：
  markdown 报告（默认）或 JSON（--json），含疑似段落定位与理由
退出码：0 = 干净；1 = 有疑似项
"""
import re
import sys
import json
import statistics

# ── 配置 ──────────────────────────────────────────────
BAN_WORDS = [
    '这意味着', '值得注意的是', '不难发现', '综上所述', '先说结论',
    '先摆两个数字', '先把链路摆一下', '先交代一个事实', '这期的要点',
    '总而言之', '让我们', '毋庸置疑', '众所周知', '不难看出', '由此可见',
]
UNIFORM_CV = 0.30          # 段落句长 CV 低于此值 → Uniform（句长过于均匀）
MIN_SENTENCES = 3          # 段落句子数少于此值不做 CV（样本太少无意义）
MIN_PARA_CHARS = 40        # 段落 CJK 字符少于此值跳过（太短不检）


def split_paragraphs(md: str):
    """提取正文段落：跳过代码块、表格、标题、列表、HTML 注释。"""
    lines = md.split('\n')
    paras, buf, in_code = [], [], False
    for line in lines:
        s = line.strip()
        if s.startswith('```'):
            in_code = not in_code
            continue
        if in_code:
            continue
        if not s or s.startswith(('#', '|', '>', '<!--', '- ', '* ', '1.', '2.', '3.', '4.', '5.')):
            if buf:
                paras.append('\n'.join(buf))
                buf = []
            continue
        buf.append(s)
    if buf:
        paras.append('\n'.join(buf))
    return paras


def cjk_len(text: str) -> int:
    """CJK 字符计数（中文按字，英文按词——英文单词数并入）。"""
    cjk = len(re.findall(r'[一-鿿]', text))
    en = len(re.findall(r'[a-zA-Z0-9]+', text))
    return cjk + en


def split_sentences(para: str):
    """中文分句：按 。！？；切分，保留非空句。"""
    parts = re.split(r'(?<=[。！？；])', para.replace('\n', ''))
    return [p for p in parts if p.strip()]


def analyze(md: str):
    paras = split_paragraphs(md)
    findings = []   # {para_idx, 类型, 摘录, 理由, 建议}
    cvs = []

    for i, para in enumerate(paras):
        chars = cjk_len(para)
        if chars < MIN_PARA_CHARS:
            continue

        # 1. 句长 CV
        sents = split_sentences(para)
        lens = [cjk_len(s) for s in sents]
        if len(lens) >= MIN_SENTENCES and statistics.mean(lens) > 0:
            cv = statistics.stdev(lens) / statistics.mean(lens)
            cvs.append((i, cv))
            if cv < UNIFORM_CV:
                findings.append({
                    'para': i, 'type': '句长均匀(CV=%.2f)' % cv,
                    'excerpt': para[:50] + ('…' if len(para) > 50 else ''),
                    'reason': f'段落内 {len(lens)} 句的句长变异系数仅 {cv:.2f}（< {UNIFORM_CV}），句长过于均匀是典型 AI 信号',
                    'advice': '长短句悬殊化：把关键结论压成短句独立成句，过程叙述允许长句',
                })

        # 2. 禁语（记录但不区分引用——引用判断留给终审）
        for w in BAN_WORDS:
            if w in para:
                pos = para.index(w)
                findings.append({
                    'para': i, 'type': f'禁语[{w}]',
                    'excerpt': para[max(0, pos-20):pos+len(w)+20],
                    'reason': '高频 AI 腔表述（若是引用原话/讨论该词本身，终审时豁免）',
                    'advice': '改直陈或删除衔接词',
                })

        # 3. 加粗
        bolds = re.findall(r'\*\*([^*\n]+)\*\*', para)
        for b in bolds:
            if re.search(r'\d', b) or len(b) <= 12:
                findings.append({
                    'para': i, 'type': '数字/短语加粗',
                    'excerpt': f'**{b}**',
                    'reason': '给数字或短标签加粗是生成模型的强调习惯',
                    'advice': '去掉加粗，靠句子本身承载重点',
                })

    # 全文级：段落均匀度
    para_chars = [cjk_len(p) for p in paras if cjk_len(p) >= MIN_PARA_CHARS]
    doc_cv = statistics.stdev(para_chars) / statistics.mean(para_chars) if len(para_chars) >= 4 and statistics.mean(para_chars) > 0 else None

    report = {
        'doc_stats': {
            'paragraphs': len(paras),
            'uniform_paras': sum(1 for _, c in cvs if c < UNIFORM_CV),
            'cv_analyzed': len(cvs),
            'avg_para_cv': round(statistics.mean([c for _, c in cvs]), 3) if cvs else None,
            'doc_para_cv': round(doc_cv, 3) if doc_cv else None,
            'findings': len(findings),
        },
        'findings': findings,
    }
    if report['doc_stats']['doc_para_cv'] is not None and report['doc_stats']['doc_para_cv'] < 0.5:
        report['findings'].append({
            'para': -1, 'type': '全文段落均匀',
            'excerpt': f"全文段落字数 CV={report['doc_stats']['doc_para_cv']}",
            'reason': '各段落长度过于接近（CV<0.5），真人文档段落长短悬殊是常态',
            'advice': '允许关键单句独立成段，允许长叙述大段不拆',
        })
        report['doc_stats']['findings'] = len(report['findings'])
    return report


def to_markdown(r):
    d = r['doc_stats']
    lines = [
        '# AI 痕迹检测报告', '',
        f"- 正文段落：{d['paragraphs']}（可分析 {d['cv_analyzed']}）",
        f"- 句长均匀段落（CV<{UNIFORM_CV}）：{d['uniform_paras']}",
        f"- 段落平均句长 CV：{d['avg_para_cv']}",
        f"- 全文段落字数 CV：{d['doc_para_cv']}",
        f"- 疑似项总数：{d['findings']}", '', '## 疑似清单', '',
    ]
    for f in r['findings']:
        loc = '全文' if f['para'] < 0 else f'第 {f["para"]} 段'
        lines += [f"### [{f['type']}] {loc}", f"> {f['excerpt']}", '', f"- 理由：{f['reason']}", f"- 建议：{f['advice']}", '']
    return '\n'.join(lines)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(2)
    md = open(sys.argv[1]).read()
    r = analyze(md)
    if '--json' in sys.argv:
        print(json.dumps(r, ensure_ascii=False, indent=1))
    else:
        print(to_markdown(r))
    sys.exit(1 if r['doc_stats']['findings'] else 0)
