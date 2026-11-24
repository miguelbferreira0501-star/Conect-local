import sys, numpy as np, cv2
src, out = sys.argv[1], sys.argv[2]
img = cv2.cvtColor(cv2.imread(src), cv2.COLOR_BGR2RGB).astype(np.float32)
H, W, _ = img.shape
r, g, b = img[..., 0], img[..., 1], img[..., 2]
p = b - (r + g) / 2
bg = (b - r > 70) & (b - g > 110)
wsum = cv2.GaussianBlur(bg.astype(np.float32), (0, 0), 40)
B = np.stack([cv2.GaussianBlur(img[..., c] * bg, (0, 0), 40) for c in range(3)], -1) / np.maximum(wsum[..., None], 1e-3)
pB = B[..., 2] - (B[..., 0] + B[..., 1]) / 2
fg = p < 15
pF = p.copy(); pF[~fg] = 0
pF8 = np.clip(pF + 128, 0, 255).astype(np.uint8)
holes = (~fg).astype(np.uint8) * 255
small = cv2.resize(pF8, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
smask = cv2.resize(holes, (W // 4, H // 4), interpolation=cv2.INTER_NEAREST)
filled = cv2.inpaint(small, smask, 6, cv2.INPAINT_TELEA)
pFf = cv2.resize(filled, (W, H), interpolation=cv2.INTER_LINEAR).astype(np.float32) - 128
pFf = np.where(fg, p, np.minimum(pFf, 10))
alpha = np.clip((pB - p) / np.maximum(pB - pFf, 1), 0, 1)
alpha[alpha < 0.06] = 0
alpha = np.clip((alpha - 0.06) / 0.94, 0, 1)
a3 = alpha[..., None]
F = np.clip((img - (1 - a3) * B) / np.maximum(a3, 0.05), 0, 255)
solid = (alpha > 0.88).astype(np.uint8)
smallF = cv2.resize(F.astype(np.uint8), (W // 4, H // 4), interpolation=cv2.INTER_AREA)
smallM = cv2.resize(((1 - solid) * 255).astype(np.uint8), (W // 4, H // 4), interpolation=cv2.INTER_NEAREST)
fillF = cv2.resize(cv2.inpaint(smallF, smallM, 6, cv2.INPAINT_TELEA), (W, H), interpolation=cv2.INTER_LINEAR).astype(np.float32)
lum = lambda x: 0.3 * x[..., 0] + 0.59 * x[..., 1] + 0.11 * x[..., 2]
chroma = fillF * (lum(F) / np.maximum(lum(fillF), 1))[..., None]
t = np.clip((alpha - 0.55) / 0.4, 0, 1)[..., None]
F = F * t + chroma * (1 - t)
# buracos internos (brilhos brancos) opacos
ff = (alpha > 0.5).astype(np.uint8); m2 = np.zeros((H + 2, W + 2), np.uint8)
cv2.floodFill(ff, m2, (0, 0), 2)
holes_in = ff == 0
alpha[holes_in] = 1; F[holes_in] = img[holes_in]
rgba = np.dstack([F, alpha * 255]).clip(0, 255).astype(np.uint8)
cv2.imwrite(out, cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
ys, xs = np.where(alpha > 0.05); print('bbox', xs.min(), ys.min(), xs.max(), ys.max())
