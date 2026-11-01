import sys,glob,os
from PIL import Image,ImageDraw
root,out=sys.argv[1],sys.argv[2]
fs=sorted([f for f in glob.glob(root+'/**/*.*',recursive=True) if f.endswith(('.png','.jpg')) and '/overview/' not in f])
cols,rows,tw,th=6,4,260,325
per=cols*rows
for s in range(0,len(fs),per):
    ch=fs[s:s+per]; m=Image.new('RGB',(cols*tw,rows*(th+16)),'white'); d=ImageDraw.Draw(m)
    for k,f in enumerate(ch):
        im=Image.open(f).convert('RGB').resize((tw-4,th-4),Image.BILINEAR)
        x=(k%cols)*tw;y=(k//cols)*(th+16); m.paste(im,(x+2,y+2)); d.text((x+3,y+th+1),os.path.relpath(f,root)[:44],fill='black')
    m.save(f'{out}/q{s//per:02d}.jpg',quality=82)
print(len(fs))
