import io
import os
import tempfile
import unittest
from contextlib import redirect_stdout

from wordcount.cli import count, main


class CountTest(unittest.TestCase):
    def test_count(self):
        self.assertEqual(count("one two\nthree\n"), {"lines": 2, "words": 3, "chars": 14})

    def test_plain_output(self):
        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
            f.write("hello world\n")
        try:
            out = io.StringIO()
            with redirect_stdout(out):
                self.assertEqual(main([f.name]), 0)
            self.assertEqual(out.getvalue(), f"1 2 12 {f.name}\n")
        finally:
            os.unlink(f.name)


if __name__ == "__main__":
    unittest.main()
