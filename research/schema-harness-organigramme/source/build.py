# Inline the fonts and diagram.js into one standalone HTML file.
import base64, pathlib, sys
here = pathlib.Path(__file__).resolve().parent
repo = here.parents[2]
nm = repo / 'node_modules'
fonts = [
    ('Space Mono', 400, nm / '@fontsource/space-mono/files/space-mono-latin-400-normal.woff2'),
    ('Space Mono', 700, nm / '@fontsource/space-mono/files/space-mono-latin-700-normal.woff2'),
    ('Archivo Variable', '100 900', nm / '@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2'),
]
css = ''
for fam, w, p in fonts:
    b = base64.b64encode(p.read_bytes()).decode()
    css += f"@font-face{{font-family:'{fam}';font-weight:{w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,{b}) format('woff2');}}\n"
diagram = (repo / 'design/claude-design/Pierrick Blog/assets/diagram.js').read_text()
src = (here / 'variantes.src.html').read_text()
out = src.replace('/*FONTS*/', css).replace('/*DIAGRAMJS*/', diagram)
(here.parent / 'variantes.html').write_text(out)
print('ok', len(out))
