import sys,os
from PIL import Image
from rembg import remove,new_session
idx=dict(l.rstrip('\n').split('\t') for l in open(sys.argv[1]))
out=sys.argv[2]; ids=sys.argv[3].split(',')
sess=new_session('isnet-general-use')
for i in ids:
    im=Image.open(idx[i]).convert('RGB')
    print(i,im.size,flush=True)
    r=remove(im,session=sess,alpha_matting=True,alpha_matting_foreground_threshold=240,alpha_matting_background_threshold=15,alpha_matting_erode_size=8)
    bb=r.getchannel('A').point(lambda a:255 if a>20 else 0).getbbox()
    r.crop(bb).save(f"{out}/{i}.png")
