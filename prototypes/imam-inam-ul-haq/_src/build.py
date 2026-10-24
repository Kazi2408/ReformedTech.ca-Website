#!/usr/bin/env python3
"""Inline shared CSS/JS/partials into each concept template, producing four
self-contained HTML files in the parent folder. Also runs static link checks.

Usage:  python3 prototypes/imam-inam-ul-haq/_src/build.py
"""
import pathlib
import re
import sys

SRC = pathlib.Path(__file__).resolve().parent
OUT = SRC.parent

CONCEPTS = [
    "concept-a-midnight-aurora",
    "concept-b-emerald-geometry",
    "concept-c-desert-dusk",
    "concept-d-gilded-noir",
]


def read(name):
    return (SRC / name).read_text(encoding="utf-8")


def build(name):
    html = read(f"{name}.src.html")
    html = re.sub(r"<!--@include ([\w-]+)@-->",
                  lambda m: read(f"partials/{m.group(1)}.html"), html)
    html = html.replace("/*@BASE_CSS@*/", read("base.css"))
    html = html.replace("<!--@DATA@-->", "<script>\n" + read("data.js") + "</script>")
    html = html.replace("<!--@CORE@-->", "<script>\n" + read("core.js") + "</script>")
    leftovers = re.findall(r"<!--@[^@]*@-->|/\*@[^@]*@\*/", html)
    if leftovers:
        sys.exit(f"{name}: unresolved placeholders {leftovers}")
    return html


def check(name, html):
    problems = []
    ids = re.findall(r'\sid="([^"]+)"', html)
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        problems.append(f"duplicate ids: {sorted(dupes)}")
    idset = set(ids)
    for target in re.findall(r'href="#([^"]*)"', html):
        if target not in idset:
            problems.append(f'href="#{target}" has no matching id')
    for ref in re.findall(r'aria-(?:controls|labelledby|describedby)="([^"]+)"', html):
        for r in ref.split():
            if r not in idset and not r.startswith("pm-"):
                problems.append(f"aria reference to missing id: {r}")
    if re.search(r'href="https?://', html.replace("https://fonts.googleapis.com", "").replace("https://fonts.gstatic.com", "")):
        problems.append("external link found")
    if re.search(r"\son[a-z]+=\"", html):
        problems.append("inline event handler found")
    if len(re.findall(r"<h1[\s>]", html)) != 1:
        problems.append("page must have exactly one h1")
    modal_keys = set(re.findall(r"^    (\w+): \{ kind:", read("data.js"), re.M))
    for key in re.findall(r'data-modal="([\w-]+)"', html):
        if key not in modal_keys:
            problems.append(f"data-modal key not defined: {key}")
    return problems


def main():
    failed = False
    for name in CONCEPTS:
        if not (SRC / f"{name}.src.html").exists():
            print(f"{name}: source missing, skipped")
            failed = True
            continue
        html = build(name)
        (OUT / f"{name}.html").write_text(html, encoding="utf-8")
        problems = check(name, html)
        status = "ok" if not problems else "PROBLEMS"
        print(f"{name}.html  {len(html) // 1024} KB  {status}")
        for p in problems:
            print("   -", p)
        failed = failed or bool(problems)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
