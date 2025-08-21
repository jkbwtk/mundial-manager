#!/usr/bin/fontforge

import fontforge
import os
import pathlib

root_dir = pathlib.Path(__file__).parent.parent.absolute()

fonts_dir = root_dir.joinpath("resources/fonts")
fonts_out_dir = root_dir.joinpath("src/assets/fonts")

fonts = filter(lambda path: path.endswith(".woff2") or path.endswith('.ttf'), os.listdir(fonts_dir))

ranges = [
    ["a", "z"],
    ["A", "Z"],
    ["0", "9"],
]

for font in fonts:
    file = fontforge.open(str(fonts_dir.joinpath(font)))
    file.generate(str(fonts_out_dir.joinpath(font).with_suffix(".woff2")))

    # simple_font = fontforge.font()

    # for range in ranges:
    #     file.selection.select(("ranges", None), range[0], range[1])
    #     simple_font.selection.select(("ranges", None), range[0], range[1])

    #     file.copy()
    #     simple_font.paste()

    # simple_font.fontname = file.fontname

    # simple_font.generate(str(fonts_out_dir.joinpath(font).with_suffix(".woff2")))
