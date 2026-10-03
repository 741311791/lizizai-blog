#!/usr/bin/env python3
"""
朱雀 AI 检测·自然段细粒度版：逐段调用 EdgeOne zhuque-text API，段级 label 与置信度。

用法：
  EDGEOONE_API_KEY=xxx python3 zhuque_check.py <markdown 文件> [--json]
分块：按自然段（空行分隔），过短段落（<60 字）并入下一段，避免碎片调用。
输出：每段（label/置信度/预览）+ 全文加权 AI+疑似占比
退出码：0 = 占比 ≤ 10%；1 = 超阈值；2 = API 失败
"""
import json
import os
import re
import subprocess
import sys
import time

GATEWAY = "https://ai-gateway.edgeone.link/v1/providers/zhuque-text/classify"
THRESHOLD = 0.10
MIN_PARA = 60          # 短于此的段并入下一段
LABEL_NAME = {0: '人工', 1: 'AI', 2: '疑似'}


def clean_md(path):
    t = open(path).read()
    t = re.sub(r'```[\s\S]*?```', '', t)
    t = re.sub(r'^<!--.*?-->$', '', t, flags=re.M)
    t = re.sub(r'^\|.*$', '', t, flags=re.M)
    t = re.sub(r'^#{1,6}\s?', '', t, flags=re.M)
    t = re.sub(r'[*>`]', '', t)
    return t.strip()


def split_paras(text):
    """自然段切分 + 短段合并；返回段列表。"""
    raw = [p.strip() for p in text.split('\n\n') if p.strip()]
    out, buf = [], ''
    for p in raw:
        buf = p if not buf else buf + '\n' + p
        if len(buf) >= MIN_PARA:
            out.append(buf); buf = ''
    if buf:
        out.append(buf)
    return out


def call_zhuque(text):
    r = subprocess.run(['curl', '-s', '--max-time', '40', '-x', 'http://127.0.0.1:7897', '-X', 'POST', GATEWAY,
                        '-H', f"Authorization: Bearer {os.environ['EDGEOONE_API_KEY']}",
                        '-H', 'Content-Type: application/json',
                        '-d', json.dumps({'text': text, 'is_merge': True})],
                       capture_output=True, text=True)
    d = json.loads(r.stdout)
    if d.get('status') != 'success':
        raise RuntimeError(d.get('msg', str(d)[:120]))
    return d


def check(path, as_json=False, sleep=1.5):
    paras = split_paras(clean_md(path))
    results, total_ai, total_len = [], 0.0, 0
    for i, p in enumerate(paras):
        d = call_zhuque(p)
        ratio = d.get('labels_ratio', {})
        ai = float(ratio.get('1', 0)) + float(ratio.get('2', 0))
        seg_label = d.get('segment_labels', [{}])[0].get('label', '?')
        results.append({'para': i, 'chars': len(p), 'ai': ai, 'conf': d.get('softmax_confidence'),
                        'label': seg_label, 'text': p})
        total_ai += ai * len(p); total_len += len(p)
        time.sleep(sleep)
    overall = total_ai / total_len if total_len else 0
    return {'overall': overall, 'paras': results}


def main():
    path = sys.argv[1]
    r = check(path)
    if '--json' in sys.argv:
        print(json.dumps(r, ensure_ascii=False, indent=1))
    else:
        for p in r['paras']:
            print(f"段{p['para']+1}: {p['chars']}字 [{LABEL_NAME.get(p['label'], p['label'])} conf={p['conf']}] AI占比={p['ai']:.0%} | {re.sub(chr(10),' ',p['text'])[:36]}…")
        verdict = '✓ 通过' if r['overall'] <= THRESHOLD else '✗ 超线，需迭代'
        print(f"\n═══ 全文加权 AI+疑似占比：{r['overall']:.2%}（验收线 {THRESHOLD:.0%}）{verdict}═══")
    sys.exit(0 if r['overall'] <= THRESHOLD else 1)


if __name__ == '__main__':
    try:
        main()
    except KeyError:
        print('缺 EDGEOONE_API_KEY'); sys.exit(2)
    except Exception as e:
        print(f'API 失败: {e}'); sys.exit(2)
