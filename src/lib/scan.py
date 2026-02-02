from abc import ABC, abstractmethod
from docx import Document
import fitz
import re

class Scanner(ABC):
	@abstractmethod
	def process_data(self) -> dict:
		pass


class DocxScanner(Scanner):
	def __init__(self, src: str, keywords: tuple):
		self.src = src
		self.keywords = keywords


	def process_data(self) -> dict:
		doc = Document(self.src)
		results = {kw: [] for kw in self.keywords}

		for para in doc.paragraphs:
				text = para.text.strip()
				if not text:
					continue
				
				for keyword in self.keywords:
					if re.search(r'\b' + re.escape(keyword.lower()) + r'\b', text.lower()):
						if text not in results[keyword]:
								results[keyword].append(text)

		return results


class PDFScanner(Scanner):
	def __init__(self, src: str, keywords: tuple):
		self.src = src
		self.keywords = keywords


	def process_data(self) -> dict:
		doc = fitz.open(self.src)
		results = {kw: [] for kw in self.keywords}
		
		for page_num in range(len(doc)):
			page = doc[page_num]
			text = page.get_text().strip()
			if not text:
				continue
			
			for keyword in self.keywords:
				if re.search(r'\b' + re.escape(keyword.lower()) + r'\b', text.lower()):
					para = text
					if para not in results[keyword]:
						results[keyword].append(f"{para}")
		
		doc.close()
		return results
