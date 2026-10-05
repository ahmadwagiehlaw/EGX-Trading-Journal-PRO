import re
p='src/components/ActiveTrades.tsx'
s=open(p,encoding='utf-8').read()
moji=re.compile(r'[\u0637\u0638][\u0080-\u00ff\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u0192\u02c6\u02dc\u2013-\u203a\u20ac\u2122\u0600-\u06ff]')
out=[];fixed=0;bad=[]
for i,line in enumerate(s.split('\n')):
    if moji.search(line):
        # convert each maximal run: from first non-ascii char to last non-ascii char
        def conv(m):
            t=m.group(0)
            try:
                return t.encode('cp1256').decode('utf-8')
            except Exception:
                return None
        pat=re.compile(r'[^\x00-\x7f]+(?:[\x20-\x7e]{1,3}[^\x00-\x7f]+)*')
        res=[];last=0;ok=True
        for m in pat.finditer(line):
            c=conv(m)
            if c is None:
                # try shrinking: split by spaces
                parts=re.split(r'(\s+)',m.group(0));cc=''
                for pt in parts:
                    try: cc+=pt.encode('cp1256').decode('utf-8')
                    except Exception: cc+=pt; ok=False
                c=cc
            res.append(line[last:m.start()]);res.append(c);last=m.end()
        res.append(line[last:])
        new=''.join(res)
        if ok: fixed+=1
        else: bad.append(i+1)
        line=new
    out.append(line)
open(p,'w',encoding='utf-8',newline='').write('\n'.join(out))
print('fixed lines',fixed,'partial',bad)
