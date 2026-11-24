import sys, numpy as np, cv2
cut = cv2.cvtColor(cv2.imread('real/cut.png', cv2.IMREAD_UNCHANGED), cv2.COLOR_BGRA2RGBA).astype(np.float32)
mask = cv2.imread('real/mask.png', 0)
H, W = mask.shape
F = cut[..., :3].copy(); A = cut[..., 3] / 255.0

# 1) buracos dentro do corpo (brilho dos olhos) ficam opacos
solid = (A > 0.5).astype(np.uint8)
ff = solid.copy(); m2 = np.zeros((H + 2, W + 2), np.uint8)
cv2.floodFill(ff, m2, (0, 0), 2)
holes = (ff == 0)
A[holes] = 1.0
# a cor original nesses buracos (o brilho branco), sem tirar o roxo
src = cv2.cvtColor(cv2.imread('real/clean2.png'), cv2.COLOR_BGR2RGB).astype(np.float32)
F[holes] = src[holes]

# 3) pontinhas do pelo: a cor do pelo vizinho, mantendo o brilho (tira o rosado/roxo)
solidm = ((A > 0.92) & ~holes).astype(np.uint8)
smallF = cv2.resize(F.clip(0, 255).astype(np.uint8), (W // 4, H // 4), interpolation=cv2.INTER_AREA)
smallM = cv2.resize(((1 - solidm) * 255).astype(np.uint8), (W // 4, H // 4), interpolation=cv2.INTER_NEAREST)
fillF = cv2.resize(cv2.inpaint(smallF, smallM, 8, cv2.INPAINT_TELEA), (W, H), interpolation=cv2.INTER_LINEAR).astype(np.float32)
lum = lambda x: 0.3 * x[..., 0] + 0.59 * x[..., 1] + 0.11 * x[..., 2]
L = lum(F); Lf = np.maximum(lum(fillF), 1)
chroma_ok = fillF * (L / Lf)[..., None]
t = np.clip((A - 0.6) / 0.35, 0, 1)[..., None]
edge = (~holes)[..., None] & (A < 0.97)[..., None]
F = np.where(edge, F * t + chroma_ok * (1 - t), F)

# 4) barriga sem o rosado da faixa (correção suave, só onde o tom é rosado; o laranja fica)
bm = cv2.GaussianBlur(cv2.dilate(mask, np.ones((25, 25), np.uint8)).astype(np.float32) / 255, (0, 0), 14)
bm[:860] = 0
R_, G_, B_ = F[..., 0], F[..., 1], F[..., 2]
w = np.clip((B_ - G_ + 8) / 16, 0, 1) * bm
G2 = G_ + w * np.maximum(0, B_ - G_ + 6)
B2 = B_ - w * np.maximum(0, B_ - G2 + 4) * 0.6
F = np.dstack([R_, G2, B2])

out = np.dstack([F, A * 255]).clip(0, 255).astype(np.uint8)
cv2.imwrite('real/cut2.png', cv2.cvtColor(out, cv2.COLOR_RGBA2BGRA))
