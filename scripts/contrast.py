#!/usr/bin/env python3
# Checks the token pairs used by src/styles/global.css against WCAG AA.
# Run `python3 scripts/contrast.py`; every line must say OK.
# Part of the oida.foundation website, MPL-2.0.

def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=lum(a),lum(b); hi,lo=max(la,lb),min(la,lb); return (hi+0.05)/(lo+0.05)
pairs = [
 # light scheme
 ('ink on paper','#1b1611','#faf6ee',4.5),
 ('ink-2 on paper','#5b5248','#faf6ee',4.5),
 ('ink-2 on paper-2','#5b5248','#f1ebdf',4.5),
 ('accent (deep flame) on paper','#b43a0e','#faf6ee',4.5),
 ('accent on paper-2','#b43a0e','#f1ebdf',4.5),
 ('brand flame vs paper (button edge, 3:1)','#c2410c','#faf6ee',3),
 ('white on flame button','#ffffff','#c2410c',4.5),
 ('white on flame-deep','#ffffff','#b43a0e',4.5),
 # mint band
 ('mint-ink on mint','#0f2a1f','#b9f0d3',4.5),
 ('mint-ink2 on mint','#2d5a46','#b9f0d3',4.5),
 ('mint-ink2 on beam','#2d5a46','#8fe3bc',4.5),
 ('mint-ink on beam','#0f2a1f','#8fe3bc',4.5),
 ('flame on mint (small num)','#b43a0e','#b9f0d3',4.5),
 ('flame on beam (large text only)','#b43a0e','#8fe3bc',3),
 # night band
 ('night-ink on night','#f4f1ff','#1e2a6e',4.5),
 ('night-ink2 on night','#c9c4e6','#1e2a6e',4.5),
 ('ember on night (small)','#f5b640','#1e2a6e',4.5),
 ('ember on violet','#f5b640','#4b2f8c',4.5),
 ('night-ink on violet','#f4f1ff','#4b2f8c',4.5),
 ('night-ink2 on violet','#c9c4e6','#4b2f8c',4.5),
 ('night on ember button','#1e2a6e','#f5b640',4.5),
 # coal band
 ('coal-ink on coal','#f2ede4','#141110',4.5),
 ('coal-ink2 on coal','#a89f93','#141110',4.5),
 ('orange on coal (small)','#f0862b','#141110',4.5),
 ('ember on coal','#f5b640','#141110',4.5),
 # dark scheme
 ('d ink on d paper','#ebe5da','#141110',4.5),
 ('d ink-2 on d paper','#a89f93','#141110',4.5),
 ('d accent on d paper','#f0862b','#141110',4.5),
 ('d ink on d paper-2','#ebe5da','#1e1a17',4.5),
 ('d ink-2 on d paper-2','#a89f93','#1e1a17',4.5),
 ('coal on flame-2 button (dark)','#141110','#f0862b',4.5),
 ('dark: mint-ink on dark mint','#dff7ea','#16352a',4.5),
 ('dark: mint-ink-2 on dark mint','#a9d8c0','#16352a',4.5),
 ('dark: ember on dark mint','#f5b640','#16352a',4.5),
 ('dark: night-ink-2 on dark night','#c9c4e6','#171f52',4.5),
 ('dark: ember on dark violet','#f5b640','#3a2470',4.5),
 ('coal-ink-2 on coal-2 (pkg card)','#a89f93','#1e1a17',4.5),
 ('ember on coal-2','#f5b640','#1e1a17',4.5),
 ('focus accent vs paper','#b43a0e','#faf6ee',3),
 ('focus mint-ink vs mint','#0f2a1f','#b9f0d3',3),
 ('focus ember vs night','#f5b640','#1e2a6e',3),
 ('focus coal-accent vs coal','#f0862b','#141110',3),
]
import sys
bad=0
for n,a,b,t in pairs:
    r=cr(a,b); ok=r>=t; bad+=not ok
    print(f"{'OK ' if ok else 'BAD'} {r:5.2f} (need {t})  {n}  {a} on {b}")
sys.exit(1 if bad else 0)
