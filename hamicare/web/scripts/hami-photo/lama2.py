import os, sys
from PIL import Image
os.environ['LAMA_MODEL'] = os.path.abspath('models/big-lama.pt')
from simple_lama_inpainting import SimpleLama
im = Image.open(sys.argv[1]).convert('RGB'); m = Image.open(sys.argv[2]).convert('L')
res = SimpleLama()(im, m).crop((0, 0, im.width, im.height))
res.save(sys.argv[3]); print('ok')
