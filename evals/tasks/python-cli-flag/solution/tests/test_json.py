import io
import json
import os
import tempfile
import unittest
from contextlib import redirect_stdout

from wordcount.cli import main


class JsonFlagTest(unittest.TestCase):
    def test_json_flag(self):
        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
            f.write("hello world\n")
        try:
            out = io.StringIO()
            with redirect_stdout(out):
                self.assertEqual(main(["--json", f.name]), 0)
            self.assertEqual(json.loads(out.getvalue()), {"lines": 1, "words": 2, "chars": 12})
        finally:
            os.unlink(f.name)


if __name__ == "__main__":
    unittest.main()
