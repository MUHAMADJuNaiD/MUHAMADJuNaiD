"""Rebuild HTML for the approved bulk configs (same palettes/layouts) using HD cut-outs."""
import json, os, sys
BUILD, CUTHD = sys.argv[1], sys.argv[2]
sys.argv = [sys.argv[0], BUILD, CUTHD]
sys.path.insert(0, os.path.dirname(__file__))
import gen3, bulk_palettes  # noqa
gen3.OUT = f"{BUILD}/htmlhd"
for c in json.load(open(f"{BUILD}/posters_bulk.json")):
    os.makedirs(os.path.dirname(f"{gen3.OUT}/{c['slug']}.html"), exist_ok=True)
    gen3.build(c)
print("rebuilt")
