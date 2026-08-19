const COLUMN_HEADERS = ['Full Prescribing Information', 'Description', 'Access'];
const NO_RESULTS_MESSAGE = 'No results found. Please modify your search criteria and try again.';

function buildColumnHeaders() {
  const header = document.createElement('div');
  header.className = 'search-results-headers';
  COLUMN_HEADERS.forEach((label) => {
    const cell = document.createElement('div');
    cell.className = 'search-results-header-cell';
    cell.textContent = label;
    header.append(cell);
  });
  return header;
}

function buildResultRow(row) {
  const cells = [...row.children];
  const item = document.createElement('div');
  item.className = 'search-results-row';
  cells.forEach((cell) => {
    const col = document.createElement('div');
    col.className = 'search-results-cell';
    col.append(...cell.childNodes);
    item.append(col);
  });
  return item;
}

function buildNoResults() {
  const empty = document.createElement('div');
  empty.className = 'search-results-empty';
  const p = document.createElement('p');
  p.textContent = NO_RESULTS_MESSAGE;
  empty.append(p);
  return empty;
}

export default function decorate(block) {
  const rows = [...block.children];

  // Extract custom heading if the first row has a single column
  let headingText = 'Results:';
  let resultRows = rows;
  if (rows[0] && rows[0].children.length === 1) {
    headingText = rows[0].textContent.trim() || headingText;
    resultRows = rows.slice(1);
  }

  // Read URL parameters
  const params = new URLSearchParams(window.location.search);
  const selectedProduct = params.get('product') || '';
  const selectedCategory = params.get('category') || '';
  const selectedKeyword = params.get('keyword') || params.get('q') || '';

  // Filter rows based on query params
  const filteredRows = resultRows.filter((row) => {
    const text = row.textContent.toLowerCase();
    const matchProd = !selectedProduct || text.includes(selectedProduct.toLowerCase());
    const matchCat = !selectedCategory || text.includes(selectedCategory.toLowerCase());
    const matchKw = !selectedKeyword || text.includes(selectedKeyword.toLowerCase());
    return matchProd && matchCat && matchKw;
  });

  block.textContent = '';

  const section = document.createElement('div');
  section.className = 'search-results-section';

  const count = filteredRows.length;
  const heading = document.createElement('h2');
  heading.className = 'search-results-count';
  heading.textContent = `${count} ${headingText.replace(/^\d+\s*/, '')}`.trim();
  section.append(heading);

  const list = document.createElement('div');
  list.className = 'search-results-list';

  if (count === 0) {
    list.append(buildNoResults());
  } else {
    list.append(buildColumnHeaders());
    filteredRows.forEach((row) => list.append(buildResultRow(row)));
  }

  section.append(list);
  block.append(section);
}