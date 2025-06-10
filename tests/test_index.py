import os
import re
import unittest

class TestIndexHtml(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        repo_root = os.path.dirname(os.path.dirname(__file__))
        index_path = os.path.join(repo_root, 'index.html')
        with open(index_path, 'r', encoding='utf-8') as f:
            cls.content = f.read()

    def test_meta_charset(self):
        self.assertIn('<meta charset="UTF-8">', self.content)

    def test_title_contains_domain(self):
        match = re.search(r'<title>(.*?)</title>', self.content, re.IGNORECASE | re.DOTALL)
        self.assertIsNotNone(match, 'Title tag not found')
        title = match.group(1)
        self.assertIn('rabidbytes.com', title)

if __name__ == '__main__':
    unittest.main()
