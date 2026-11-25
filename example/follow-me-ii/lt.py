import json,sys,urllib.parse,subprocess
# usage: py lt.py out.png  (edit the poses below)
H=[0.1,0.95,0.6]
poses=[]
for w,slack in [({'stand':1},1),({'sit':1},1),({'stand':1},0)]:
    for cam in ([0.1,0.3,1.5],[1.1,0.5,0.9],[-1.0,0.5,-0.9],[1.0,0.45,0.0]):
        poses.append(dict(w=w,slack=slack,hand=H,cam=cam,at=[0.05,0.25,0.05],col='#e03a3a' if slack==0 else '#3a7ec0'))
h=urllib.parse.quote(json.dumps(poses))
subprocess.run(['node','snap.mjs','leashtest.html?cols=4&ch=420#'+h,sys.argv[1],'1800','1260'])
