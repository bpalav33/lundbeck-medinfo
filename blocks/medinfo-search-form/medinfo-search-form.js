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
      const rawVal = opt.value.trim();
      const match = rawVal.match(/\(([^)]+)\)/);
      const extracted = match && match[1].trim() ? match[1].trim() : rawVal;
      const firstWord = extracted.split(/[-\s]/)[0];

      return (
        extracted.toLowerCase() === paramProduct.toLowerCase() ||
        firstWord.toLowerCase() === paramProduct.toLowerCase() ||
        rawVal.toLowerCase().includes(paramProduct.toLowerCase())
      );
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

  // 4. Validation helper with dynamic error message injection
  const setFieldError = (element, isError, message = '') => {
    if (!element) return;
    const wrapper = element.closest('.field-wrapper');
    if (!wrapper) return;

    wrapper.classList.toggle('has-error', isError);
    element.setAttribute('aria-invalid', isError ? 'true' : 'false');

    let errorElement = wrapper.querySelector('.field-error-msg');

    if (isError) {
      if (!errorElement) {
        errorElement = document.createElement('span');
        errorElement.className = 'field-error-msg';
        errorElement.setAttribute('role', 'alert');
        wrapper.appendChild(errorElement);
      }
      errorElement.textContent = message;
    } else if (errorElement) {
      errorElement.remove();
    }
  };

  // Clear errors dynamically when the user selects a valid option
  productSelect?.addEventListener('change', () => {
    if (productSelect.value.trim()) {
      setFieldError(productSelect, false);
    }
  });

  categorySelect?.addEventListener('change', () => {
    if (categorySelect.value.trim()) {
      setFieldError(categorySelect, false);
    }
  });

  // 5. Handle submission
  const handleSearch = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const rawProductValue = productSelect?.value?.trim() || '';
    const match = rawProductValue.match(/\(([^)]+)\)/);

    // 1. Get the inside of the parentheses or fallback to raw
    const extracted = (match && match[1].trim()) ? match[1].trim() : rawProductValue;

    // 2. Take only the part before '-' or whitespace
    const firstWord = extracted.split(/[-\s]/)[0];

    // 3. Capitalize the first letter
    const productValue = firstWord 
      ? firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase() 
      : '';
    const categoryValue = categorySelect?.value?.trim() || '';
    const trimmedKeyword = keywordInput?.value?.trim() || '';

    const isProductMissing = !productValue;
    const isCategoryMissing = !categoryValue;

    setFieldError(
      productSelect, 
      isProductMissing, 
      '* Product selection is required'
    );
    setFieldError(
      categorySelect, 
      isCategoryMissing, 
      '* Category selection is required'
    );

    if (isProductMissing || isCategoryMissing) return;

    // Read authored action or fallback
    const formAction = form.dataset.action 
      || form.getAttribute('data-action') 
      || form.getAttribute('action') 
      || '/us/en/hcp/search-results';

    const targetPath = new URL(formAction, window.location.origin).pathname;
    const resultsUrl = new URL(targetPath, window.location.origin);
    
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