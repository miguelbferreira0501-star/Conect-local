import sys, numpy as np, cv2
src, out = sys.argv[1], sys.argv[2]
img = cv2.cvtColor(cv2.imread(src), cv2.COLOR_BGR2RGB).astype(np.float32)
H, W, _ = img.shape
r, g, b = img[..., 0], img[..., 1], img[..., 2]
p = b - (r + g) / 2  # "quanto é roxo"
# fundo certo: bem roxo
bg = (b - r > 70) & (b - g > 110)
# modelo do fundo (degradê): média ponderada dos pixels de fundo, preenchendo por baixo do bicho
k = 61
wsum = cv2.GaussianBlur(bg.astype(np.float32), (0, 0), 40)
B = np.stack([cv2.GaussianBlur(img[..., c] * bg, (0, 0), 40) for c in range(3)], -1) / np.maximum(wsum[..., None], 1e-3)
pB = B[..., 2] - (B[..., 0] + B[..., 1]) / 2
# cor do pelo nas bordas: espalha para fora a "roxidão" do pelo certo (alpha 1)
fg = p < 15
pF = p.copy(); pF[~fg] = 0
pF8 = np.clip(pF + 128, 0, 255).astype(np.uint8)
holes = (~fg).astype(np.uint8) * 255
small = cv2.resize(pF8, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
smask = cv2.resize(holes, (W // 4, H // 4), interpolation=cv2.INTER_NEAREST)
filled = cv2.inpaint(small, smask, 6, cv2.INPAINT_TELEA)
pFf = cv2.resize(filled, (W, H), interpolation=cv2.INTER_LINEAR).astype(np.float32) - 128
pFf = np.where(fg, p, pFf)
pFf = np.minimum(pFf, 10)
alpha = (pB - p) / np.maximum(pB - pFf, 1)
alpha = np.clip(alpha, 0, 1)
# limpa o fundo e o chão (sombra roxa embaixo dos pés)
alpha[alpha < 0.06] = 0
alpha = np.clip((alpha - 0.06) / 0.94, 0, 1)
# cor do pelo sem o reflexo roxo: F = (C - (1-a) B) / a
a3 = alpha[..., None]
F = (img - (1 - a3) * B) / np.maximum(a3, 0.05)
# nas pontinhas bem transparentes, usa a cor do pelo vizinho (sem roxo)
F = np.clip(F, 0, 255)
Fs = F.copy()
solid = (alpha > 0.85).astype(np.uint8)
smallF = cv2.resize(F.astype(np.uint8), (W // 4, H // 4), interpolation=cv2.INTER_AREA)
smallM = cv2.resize(((1 - solid) * 255).astype(np.uint8), (W // 4, H // 4), interpolation=cv2.INTER_NEAREST)
fillF = cv2.inpaint(smallF, smallM, 6, cv2.INPAINT_TELEA)
fillF = cv2.resize(fillF, (W, H), interpolation=cv2.INTER_LINEAR).astype(np.float32)
t = np.clip((alpha - 0.2) / 0.6, 0, 1)[..., None]
F = F * t + fillF * (1 - t)
# tira roxo que sobrar: limita o azul ao nível do pelo vizinho
F[..., 2] = np.minimum(F[..., 2], np.maximum(fillF[..., 2], F[..., 0]) + 8)
rgba = np.dstack([F, alpha * 255]).clip(0, 255).astype(np.uint8)
cv2.imwrite(out, cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
ys, xs = np.where(alpha > 0.02)
print('bbox', xs.min(), ys.min(), xs.max(), ys.max())
