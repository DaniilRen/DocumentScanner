from abc import ABC, abstractmethod
from docx import Document
import fitz
import re
import inspect
from collections import namedtuple
import pymorphy2

if not hasattr(inspect, 'getargspec'):
    ArgSpec = namedtuple('ArgSpec', 'args varargs keywords defaults')
    def getargspec(func):
        spec = inspect.getfullargspec(func)
        return ArgSpec(spec.args, spec.varargs, spec.varkw, spec.defaults)
    inspect.getargspec = getargspec

class Scanner(ABC):
    def __init__(self):
        self.morph = pymorphy2.MorphAnalyzer()
    
    @abstractmethod
    def process_data(self) -> dict:
        pass

    def get_word_forms(self, keyword: str) -> list:
        keyword = keyword.strip().lower()
        forms = set([keyword])
        
        try:
            for parsed in self.morph.parse(keyword):
                forms.add(parsed.normal_form)
                
                if hasattr(parsed, 'lexeme'):
                    for form in parsed.lexeme:
                        forms.add(form.word.lower())
                        
                cases = ['nomn', 'gent', 'datv', 'accs', 'ablt', 'loct', 'voct']
                numbers = ['sing', 'plur']
                
                for case in cases:
                    for number in numbers:
                        try:
                            form = parsed.inflect({case, number})
                            if form:
                                forms.add(form.word.lower())
                        except:
                            pass
        except:
            pass
        
        return list(forms)

    def word_search_like_word(self, text: str, keyword: str) -> bool:
        lower_text = text.lower()
        keyword_lower = keyword.lower()
        
        if keyword_lower in lower_text:
            return True
        
        forms = self.get_word_forms(keyword)
        words = re.findall(r'\b[a-яё]{2,}\b', lower_text)
        
        for word in words:
            if word in forms:
                return True
        
        return False

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
                if self.word_search_like_word(text, keyword):
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
                if self.word_search_like_word(text, keyword):
                    para = f"Page {page_num + 1}: {text}"
                    if para not in results[keyword]:
                        results[keyword].append(para)
        
        doc.close()
        return results
