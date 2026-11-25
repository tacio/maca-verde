#!/usr/bin/env bash
# Rasterize lesson SVGs onto the app's light and dark surfaces and build one labelled
# contact sheet: art/out/prev/sheet.png. Usage: art/preview.sh [name-prefix…]
set -euo pipefail
cd "$(dirname "$0")/out"
rm -rf prev && mkdir prev
prefixes=("${@:-}")
files=()
for p in "${prefixes[@]}"; do for f in "$p"*.svg; do [ -e "$f" ] && files+=("$f"); done; done
[ ${#files[@]} -gt 0 ] || { echo "no SVGs match" >&2; exit 1; }
for f in $(printf '%s\n' "${files[@]}" | sort -u); do
  n="${f%.svg}"
  sed 's/currentColor/#1a1c19/g' "$f" > prev/tmp.svg
  inkscape prev/tmp.svg --export-type=png --export-background='#ffffff' --export-background-opacity=1 \
    --export-width=800 --export-filename="prev/$n.png" >/dev/null 2>&1
done
sed 's/currentColor/#eceee9/g' "${files[0]}" > prev/tmp.svg
inkscape prev/tmp.svg --export-type=png --export-background='#181b18' --export-background-opacity=1 \
  --export-width=800 --export-filename="prev/zz-dark-check.png" >/dev/null 2>&1
rm prev/tmp.svg
montage -label '%t' -pointsize 18 prev/*.png -tile 3x -geometry 520x390+4+4 -background '#999' prev/sheet.png
echo "art/out/prev/sheet.png ($(ls prev/*.png | grep -vc sheet.png) pictures; last = the first one on dark)"
