import sys
dy=sys.argv[1]
p='web/story.js'; s=open(p).read()
import re
s=re.sub(r"const DYF = .*\n","",s)
s=s.replace("export const dog3At = (f) => {","const DYF = "+dy+";\nexport const dog3At = (f) => {",1) if "const DYF" not in s else s
open(p,'w').write(s)
