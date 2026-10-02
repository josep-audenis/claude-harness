import argparse
import sys


def count(text):
    return {"lines": len(text.splitlines()), "words": len(text.split()), "chars": len(text)}


def main(argv=None):
    parser = argparse.ArgumentParser(prog="wordcount", description="Count lines, words and characters.")
    parser.add_argument("file", help="path to a UTF-8 text file")
    args = parser.parse_args(argv)

    with open(args.file, encoding="utf-8") as f:
        counts = count(f.read())

    sys.stdout.write(f"{counts['lines']} {counts['words']} {counts['chars']} {args.file}\n")
    return 0
