from pathlib import Path
p = Path('app.js')
text = p.read_text(encoding='utf-8', errors='replace').splitlines()
for i in range(840, 870):
    print(f'{i+1}: {repr(text[i])}')
