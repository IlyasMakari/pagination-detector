# Pagination Detector

A lightweight TypeScript library for detecting pagination systems in static HTML documents. Useful for detecting paginated listings in scrapers and agentic workflows that need to crawl paginated content reliably.
 


## 📥 Installation

```bash
npm install pagination-detector
```


## 📖 Functions

## `detectStaticPagination(html: string, currentUrl: string): PaginationResult[]`

Detects pagination structures in a static HTML page. Returns an array of detected pagination systems found in the page.

### 🧾 Input

| Name        | Type     | Description                                      |
|-------------|----------|--------------------------------------------------|
| `html`      | `string` | The raw HTML source of the page.                |
| `currentUrl`| `string` | The full URL of the current page. Must be valid.|

### 📦 Returns

An array of `PaginationResult` objects:

```ts
interface PaginationResult {
  url_template: string;
  current_page: number;
  pages: PaginationLink[];
}

interface PaginationLink {
  url: string;
  text: string;
  page_number: number;
  element: HTMLElement; // From node-html-parser
}
```

---

### 📘 Example Output

Input: HTML from `https://example.com/articles?page=1`

```json
[
  {
    "url_template": "https://example.com/articles?page={page}",
    "current_page": 1,
    "pages": [
      {
        "url": "https://example.com/articles?page=2",
        "text": "2",
        "page_number": 2,
        "element": "<a href=\"/articles?page=2\" class=\"pagination-link\">2</a>"
      },
      {
        "url": "https://example.com/articles?page=3",
        "text": "3",
        "page_number": 3,
        "element": "<a href=\"/articles?page=3\" class=\"pagination-link\">3</a>"
      },
      {
        "url": "https://example.com/articles?page=4",
        "text": "4",
        "page_number": 4,
        "element": "<a href=\"/articles?page=4\" class=\"pagination-link\">4</a>"
      }
    ]
  }
]
```



## 📄 License

MIT
