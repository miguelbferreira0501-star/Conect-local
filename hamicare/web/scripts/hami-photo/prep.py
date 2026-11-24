import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
img = cv2.cvtColor(cv2.imread('real/src.png'), cv2.COLOR_BGR2RGB).astype(np.float32)
H, W, _ = img.shape
r, g, b = img[..., 0], img[..., 1], img[..., 2]
yy, xx = np.mgrid[0:H, 0:W]
bgm = (b - r > 70) & (b - g > 110)
wsum = cv2.GaussianBlur(bgm.astype(np.float32), (0, 0), 40)
B = np.stack([cv2.GaussianBlur(img[..., c] * bgm, (0, 0), 40) for c in range(3)], -1) / np.maximum(wsum[..., None], 1e-3)
band = ((r - g) > 40) & ((b - g) > 8) & (r > 180) & (yy > 900) & (yy < 1110) & (xx > 240) & (xx < 980)
rows = np.where(band.any(axis=1))[0]
bt, bb = int(rows.min()), int(rows.max())
print('faixa', bt, bb)
body = ~bgm
def side_pts(y_from, y_to, side):
    ys, xs = [], []
    for y in range(y_from, y_to):
        xr = np.where(body[y, 150:1100])[0]
        if len(xr) < 10: continue
        xs.append(150 + (xr.min() if side == 0 else xr.max())); ys.append(y)
    return ys, xs
fit = {}
for side in (0, 1):
    ya, xa = side_pts(bt - 70, bt - 4, side)
    yb, xb = side_pts(bb + 6, bb + 50, side)
    c = np.polyfit(np.array(ya + yb, float), np.array(xa + xb, float), 2)
    fit[side] = c
    print(side, 'acima', xa[:3], xa[-3:], 'abaixo', xb[:3], xb[-3:])
out = img.copy()
inside = np.zeros((H, W), bool)
for y in range(bt - 4, bb + 6):
    xl = np.polyval(fit[0], y); xr = np.polyval(fit[1], y)
    inside[y, int(xl):int(xr) + 1] = True
    # fora do contorno: fundo roxo
    out[y, :max(0, int(xl) - 1)] = B[y, :max(0, int(xl) - 1)]
    out[y, int(xr) + 2:] = B[y, int(xr) + 2:]
# máscara para o LaMa: a faixa (só do lado de dentro do contorno)
m = cv2.dilate((band & inside).astype(np.uint8) * 255, np.ones((19, 19), np.uint8))
m = (m > 0) & inside
mask = Image.fromarray((m * 255).astype('uint8'))
d = ImageDraw.Draw(mask)
d.ellipse((505 - 100, 258 - 98, 505 + 100, 258 + 98), fill=255)
d.ellipse((448 - 46, 192 - 42, 448 + 46, 192 + 42), fill=255)
mask.save('real/mask.png')
Image.fromarray(out.clip(0, 255).astype('uint8')).save('real/prep.png')
