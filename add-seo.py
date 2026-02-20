#!/usr/bin/env python3
"""
check-seo.py — Check which page files have <Helmet> SEO tags and which don't.
Run from your project root: python3 check-seo.py
"""

import os

def main():
    root = os.getcwd()
    src_path = os.path.join(root, "src")

    if not os.path.isdir(src_path):
        print("ERROR: Could not find src/ directory. Run from your project root.")
        return

    has_helmet = []
    no_helmet = []

    for dirpath, _, files in os.walk(src_path):
        for filename in files:
            if not filename.endswith(".jsx") and not filename.endswith(".tsx"):
                continue
            filepath = os.path.join(dirpath, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            rel_path = os.path.relpath(filepath, root)
            if "<Helmet>" in content:
                has_helmet.append(rel_path)
            else:
                no_helmet.append(rel_path)

    print(f"\n{'═' * 55}")
    print(f"  ✅  FILES WITH <Helmet>  ({len(has_helmet)})")
    print(f"{'═' * 55}")
    for f in sorted(has_helmet):
        print(f"  ✅  {f}")

    print(f"\n{'═' * 55}")
    print(f"  ❌  FILES WITHOUT <Helmet>  ({len(no_helmet)})")
    print(f"{'═' * 55}")
    for f in sorted(no_helmet):
        print(f"  ❌  {f}")

    total = len(has_helmet) + len(no_helmet)
    pct = round(len(has_helmet) / total * 100) if total else 0
    print(f"\n  📊 Coverage: {len(has_helmet)}/{total} files ({pct}%)\n")

if __name__ == "__main__":
    main()