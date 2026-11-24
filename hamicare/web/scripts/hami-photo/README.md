# Hami realista a partir da foto

Como as imagens de `src/assets/hami/` foram feitas a partir da foto de referência (fundo roxo):

1. `prep.py`: acha a faixa rosa e a flor, refaz o contorno da barriga e gera a máscara.
2. `lama2.py`: apaga a faixa e a flor com o LaMa (`simple-lama-inpainting`, modelo `big-lama.pt`).
3. `mirror.py`: refaz o alto da cabeça onde estava a flor espelhando o outro lado.
4. `key.py`: recorta o fundo roxo calculando a transparência de cada fiozinho de pelo e tira o reflexo roxo.
5. `fix.py`: fecha o brilho dos olhos e limpa a cor nas pontinhas do pelo.

Depois, a versão sem rosto (para as outras expressões) foi feita apagando olhos e boca com o LaMa, e a máscara do pelo
laranja (`hami-pelo.webp`) serve para trocar a cor da pelagem.

## Fotos de situações (dormindo e banho)

- `hami-dormindo.webp`: a foto dele dormindo de barriguinha; a faixa, a flor e os "Zzz" foram apagados com o LaMa
  (os "z" voltam animados no app) e o alto da cabeça foi refeito com fios de pelo da própria foto.
- `hami-banho.webp`: a foto da tina de espuma (patinho, toalha e bolhas). `key2.py` recorta o roxo e deixa as bolhas
  semitransparentes de verdade.
- `furmask.py <foto> <saida> [limite_y] [cx,cy,rx,ry ...]`: faz a máscara do pelo caramelo (`*-pelo.webp`) para trocar a
  cor da pelagem; `limite_y` corta abaixo de uma altura (a tina) e as elipses tiram partes amarelas (patinho, miolo da flor).
