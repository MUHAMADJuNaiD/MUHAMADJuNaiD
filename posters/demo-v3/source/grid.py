import sys
from PIL import Image,ImageDraw,ImageFont
out,order=sys.argv[1],sys.argv[2].split(',')
tw,th,g=405,540,4  # 3:4 profile-grid crop
rows=(len(order)+2)//3
m=Image.new('RGB',(3*tw+2*g,rows*th+(rows-1)*g),'white')
for i,s in enumerate(order):
    im=Image.open(f"{sys.argv[3]}/{s}.png").convert('RGB')
    cw=int(1350*3/4); x0=(1080-cw)//2
    im=im.crop((x0,0,x0+cw,1350)).resize((tw,th),Image.LANCZOS)
    m.paste(im,((i%3)*(tw+g),(i//3)*(th+g)))
m.save(out,quality=90)
