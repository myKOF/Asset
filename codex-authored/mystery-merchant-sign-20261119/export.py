"""Run from the game root: export.py SOURCE_PNG MATERIAL_LIBRARY_ROOT."""
import sys,json,hashlib,shutil
from pathlib import Path
from PIL import Image
source=Path(sys.argv[1]);library=Path(sys.argv[2]);package=library/'codex-authored/mystery-merchant-sign-20261119'
package.mkdir(parents=True,exist_ok=True)
if source.resolve() != (package/'source.png').resolve():
    shutil.copyfile(source,package/'source.png')
im=Image.open(source).convert('RGBA')
assert im.getchannel('A').getextrema()==(0,255)
size=(768,round(im.height*768/im.width))
im.resize(size,Image.Resampling.LANCZOS).save(package/'mystery-merchant-sign.webp','WEBP',lossless=True,method=6)
out=Image.open(package/'mystery-merchant-sign.webp')
assert out.getchannel('A').getextrema()==(0,255)
files=[{'source':name,'sha256':hashlib.sha256((package/name).read_bytes()).hexdigest()} for name in ['source.png','mystery-merchant-sign.webp']]
manifest={'generator':'Codex built-in imagegen','license':'Original generated artwork for this project; user-approved natural broken-board revision. No external copyrighted image material.','approval':'2026-11-19 user: OK，就這個，接上吧','description':'Unframed organically broken wooden sign with two plain wooden support pegs; text and button remain dynamic UI overlays.','originalSize':list(im.size),'exportSize':list(out.size),'files':files,'gameExport':'images/ui/mystery-merchant-sign.webp'}
(package/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
shutil.copyfile(package/'mystery-merchant-sign.webp',Path('images/ui/mystery-merchant-sign.webp'))
print(json.dumps(manifest,ensure_ascii=False))
