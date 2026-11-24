from PIL import Image, ImageDraw, ImageFilter
import numpy as np
src=np.array(Image.open('real/src.png').convert('RGB')).astype(float); c=np.array(Image.open('real/clean.png').convert('RGB')).astype(float)
H,W,_=src.shape; cx=624.0
mir=np.zeros_like(src)
for x in range(W):
    xm=int(round(2*cx-x))
    if 0<=xm<W: mir[:,x]=src[:,xm]
m=Image.new('L',(W,H),0); d=ImageDraw.Draw(m)
d.ellipse((505-108,258-106,505+108,258+106),fill=255); d.ellipse((448-56,192-52,448+56,192+52),fill=255)
mf=np.array(m.filter(ImageFilter.GaussianBlur(10))).astype(float)[...,None]/255
Image.fromarray((c*(1-mf)+mir*mf).clip(0,255).astype('uint8')).save('real/clean2.png')
