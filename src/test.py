from lib.scan import DocxScanner, PDFScanner
import os


path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'static', 'assets', 'test.docx'))
keywords = ('flux', 'circuit', 'node')

scanner = DocxScanner(src=path, keywords=keywords)
result = scanner.process_data()

print(result)

scanner = PDFScanner(src=path, keywords=keywords)
result = scanner.process_data()

print(result)