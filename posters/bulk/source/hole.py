import sys,numpy as np
from PIL import Image,ImageFilter
from scipy import ndimage
p=sys.argv[1]; im=np.array(Image.open(p)).astype(float)
rgb=im[...,:3]; a=im[...,3]
mx=rgb.max(-1); mn=rgb.min(-1)
bgl=(mn>float(sys.argv[2]))&((mx-mn)<25)
bgl=ndimage.binary_opening(bgl,iterations=2)
lab,n=ndimage.label(bgl); H,W=a.shape
for k in range(1,n+1):
    m=lab==k; ys,xs=np.where(m)
    if m.sum()>0.01*H*W and ys.min()>0 and xs.min()>0 and ys.max()<H-1 and xs.max()<W-1:
        print('hole',k,m.sum()); a[ndimage.binary_dilation(m,iterations=2)]=0
am=Image.fromarray(a.astype('uint8')).filter(ImageFilter.GaussianBlur(1))
out=Image.fromarray(im[...,:3].astype('uint8')); out.putalpha(am); out.save(p)
