export default async function decorate(block) {
  // 1. Let default AEM form module build the DOM
  try {
    const module = await import('../form/form.js');
    if (typeof module.default === 'function') {
      await module.default(block);
    }
  } catch (error) {
    console.error('Failed to load form block:', error);
    return;
  }

  // 2. Query form elements
  const form = block.querySelector('form');
  if (!form) return;

  const productSelect = block.querySelector('.med-search-product-select select');
  const categorySelect = block.querySelector('.med-search-category-select select');
  const keywordInput = block.querySelector('.med-search-keyword input');
  const searchBtn = block.querySelector(
    '.med-search-btn input[type="button"], .med-search-btn input[type="submit"], .med-search-btn button'
  );

  // 3. Pre-fill form values from current URL params (if on results page)
  const currentParams = new URLSearchParams(window.location.search);
  const paramProduct = currentParams.get('product') || '';
  const paramCategory = currentParams.get('category') || '';
  const paramKeyword = currentParams.get('keyword') || currentParams.get('q') || '';

  if (productSelect && paramProduct) {
    const matchingOption = [...productSelect.options].find((opt) => {
      const match = opt.value.match(/\(([^)]+)\)/);
      const extracted = match && match[1].trim() ? match[1].trim() : opt.value.trim();
      return extracted.toLowerCase() === paramProduct.toLowerCase();
    });
    if (matchingOption) productSelect.value = matchingOption.value;
  }

  if (categorySelect && paramCategory) {
    const matchingOption = [...categorySelect.options].find(
      (opt) => opt.value.trim().toLowerCase() === paramCategory.toLowerCase()
    );
    if (matchingOption) categorySelect.value = matchingOption.value;
  }

  if (keywordInput && paramKeyword) {
    keywordInput.value = paramKeyword;
  }

  // 4. Validation helper
  const setFieldError = (element, isError) => {
    if (!element) return;
    const wrapper = element.closest('.field-wrapper');
    if (wrapper) {
      wrapper.classList.toggle('has-error', isError);
    }
    element.setAttribute('aria-invalid', isError ? 'true' : 'false');
  };

  productSelect?.addEventListener('change', () => setFieldError(productSelect, false));
  categorySelect?.addEventListener('change', () => setFieldError(categorySelect, false));

  // 5. Handle submission
  const handleSearch = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const rawProductValue = productSelect?.value?.trim() || '';
    const match = rawProductValue.match(/\(([^)]+)\)/);
    const productValue = (match && match[1].trim()) ? match[1].trim() : rawProductValue;
    const categoryValue = categorySelect?.value?.trim() || '';
    const trimmedKeyword = keywordInput?.value?.trim() || '';

    const isProductMissing = !productValue;
    const isCategoryMissing = !categoryValue;

    setFieldError(productSelect, isProductMissing);
    setFieldError(categorySelect, isCategoryMissing);

    if (isProductMissing || isCategoryMissing) return;

    const resultsUrl = new URL('/us/en/hcp/search-results', window.location.origin);
    resultsUrl.searchParams.set('product', productValue);
    resultsUrl.searchParams.set('category', categoryValue);

    if (trimmedKeyword) {
      resultsUrl.searchParams.set('keyword', trimmedKeyword);
    }

    window.location.href = `${resultsUrl.pathname}${resultsUrl.search}`;
  };

  searchBtn?.addEventListener('click', handleSearch);
  form.addEventListener('submit', handleSearch);
}