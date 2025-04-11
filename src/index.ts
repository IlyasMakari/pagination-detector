import { parse, HTMLElement } from 'node-html-parser';

export interface PaginationLink {
  url: string;
  text: string;
  page_number: number;
  element: HTMLElement;
}

export interface PaginationResult {
  pages: PaginationLink[];
  url_template: string;
  current_page: number;
}

export function detectStaticPagination(html: string, currentUrl: string): PaginationResult[] {
  const base = new URL(currentUrl);
  const root = parse(html);
  const anchors = root.querySelectorAll('a');

  type Candidate = {
    template: string;
    url: string;
    text: string;
    pageNum: number;
    element: HTMLElement;
  };

  const candidateGroups = new Map<string, Candidate[]>();

  for (const a of anchors) {
    const hrefRaw = a.getAttribute('href');
    if (!hrefRaw) continue;

    let absoluteHref: string;
    try {
      absoluteHref = new URL(hrefRaw, base).toString();
    } catch {
      continue;
    }

    const text = a.innerText.trim();
    if (!text || !/\d+/.test(text)) continue;

    const regex = /\d+/g;
    const matches = [...absoluteHref.matchAll(regex)];

    for (const match of matches) {
      const number = match[0];
      const index = match.index!;
      const prefix = absoluteHref.slice(0, index);
      const suffix = absoluteHref.slice(index + number.length);

      const template = `${prefix}{page}${suffix}`;
      const pageNum = parseInt(number);
      if (isNaN(pageNum)) continue;

      const candidate: Candidate = {
        template,
        url: absoluteHref,
        text,
        pageNum,
        element: a as HTMLElement,
      };

      if (!candidateGroups.has(template)) {
        candidateGroups.set(template, []);
      }

      candidateGroups.get(template)!.push(candidate);
    }
  }

  const results: PaginationResult[] = [];

  for (const [template, group] of candidateGroups.entries()) {
    const uniquePages = new Set(group.map((c) => c.pageNum));
    if (uniquePages.size < 2) continue;

    const seen = new Set<string>();
    const pages: PaginationLink[] = [];

    for (const { url, text, pageNum, element } of group) {
      if (!seen.has(url)) {
        pages.push({ url, text, page_number: pageNum, element });
        seen.add(url);
      }
    }

    // Derive current_page from URL using template
    const regexStr = template
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
      .replace('\\{page\\}', '(\\d+)');
    const urlRegex = new RegExp(`^${regexStr}$`);
    const match = currentUrl.match(urlRegex);

    let current_page = 1;
    if (match) {
      const extracted = parseInt(match[1], 10);
      if (!isNaN(extracted)) {
        current_page = extracted;
      }
    }

    const result: PaginationResult = {
      url_template: template,
      current_page,
      pages,
    };

    // ✅ Filter logic

    const passesStructureCheck = pages.some(p => {
      let el: HTMLElement | null = p.element;
      while (el) {
        const id = el.getAttribute('id')?.toLowerCase() || '';
        const classList = el.getAttribute('class')?.toLowerCase() || '';
        if (id.includes('pagination') || classList.includes('pagination')) return true;
        el = el.parentNode as HTMLElement;
      }
      return false;
    });

    const passesTextMatch = pages.some(p => p.text.trim() === p.page_number.toString());

    if (passesStructureCheck || passesTextMatch) {
      results.push(result);
    }
  }

  return results;
}
