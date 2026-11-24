import sys, numpy as np, cv2
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
ymax = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0  # fração da altura (abaixo disso não é pelo)
im = np.array(Image.open(src).convert('RGBA')).astype(np.float32)
rgb = im[..., :3].astype(np.uint8); a = im[..., 3] / 255
hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(np.float32)
h, s, v = hsv[..., 0] * 2, hsv[..., 1] / 255, hsv[..., 2] / 255
hue = np.clip(1.25 - np.abs(h - 27) / 22, 0, 1)  # laranja/caramelo ~30°
w = hue * np.clip((s - 0.1) / 0.22, 0, 1) * np.clip((v - 0.22) / 0.3, 0, 1) * a
H = w.shape[0]
if ymax < 1:
    yy = np.arange(H)[:, None] / H
    w *= np.clip((ymax - yy) / 0.02, 0, 1)
for e in (sys.argv[4:] if len(sys.argv) > 4 else []):
    cx, cy, rx, ry = [float(x) for x in e.split(',')]
    yy, xx = np.mgrid[0:H, 0:w.shape[1]]
    w[((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 < 1] = 0
w = cv2.GaussianBlur(w, (0, 0), 1.2)
outa = np.zeros((*w.shape, 4), np.uint8); outa[..., :3] = 255; outa[..., 3] = np.clip(w * 255, 0, 255)
Image.fromarray(outa).save(out, quality=80, method=6)
