from typing import List, Dict, Any
from duckduckgo_search import DDGS
import json

class WebSearchAgent:
    def __init__(self) -> None:
        pass

    def search(self, question: str, max_results: int = 4) -> List[Dict[str, Any]]:
        snippets = []
        try:
            # Using DDGS as a context manager is recommended
            with DDGS() as ddgs:
                results = ddgs.text(keywords=question, max_results=max_results)
                if results:
                    for r in results:
                        snippets.append({
                            "text": f"Title: {r['title']}\nSnippet: {r['body']}",
                            "metadata": {"source": r['href'], "type": "web"}
                        })
        except Exception as e:
            print(f"Web search error: {e}")
            import traceback
            traceback.print_exc()
            return []
        
        return snippets
