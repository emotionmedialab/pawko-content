import sys,glob,os
from PIL import Image
d,out,per=sys.argv[1],sys.argv[2],int(sys.argv[3]) if len(sys.argv)>3 else 40
os.makedirs(out,exist_ok=True)
fs=sorted(glob.glob(d+"/f*.jpg"))
for k in range(0,len(fs),per):
    ch=fs[k:k+per]; cols=10; rows=(len(ch)+cols-1)//cols
    sh=Image.new("RGB",(216*cols,384*rows))
    for i,f in enumerate(ch): sh.paste(Image.open(f).resize((216,384)),((i%cols)*216,(i//cols)*384))
    sh.save(f"{out}/s{k//per+1}.jpg",quality=85)
print(len(fs))
