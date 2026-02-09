// Custom Product Grid JavaScript
class CustomProductGrid {
  constructor() {
    this.modal = document.getElementById('custom-product-modal');
    this.quickViewButtons = document.querySelectorAll('.custom-product-card__quick-view');
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Quick view buttons
    this.quickViewButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const productHandle = e.currentTarget.dataset.productHandle;
        this.showProductModal(productHandle);
      });
    });

    // Close modal
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal || e.target.classList.contains('custom-product-modal__close')) {
        this.hideProductModal();
      }
    });

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.style.display === 'flex') {
        this.hideProductModal();
      }
    });
  }

  async showProductModal(productHandle) {
    try {
      // Show loading state
      this.modal.innerHTML = `
        <div class="custom-product-modal__content">
          <button class="custom-product-modal__close">&times;</button>
          <div class="loading">Loading...</div>
        </div>
      `;
      this.modal.style.display = 'flex';

      // Fetch product data
      const response = await fetch(`/products/${productHandle}.js`);
      const product = await response.json();

      // Render product in modal
      this.renderProductModal(product);
    } catch (error) {
      console.error('Error loading product:', error);
      this.modal.innerHTML = `
        <div class="custom-product-modal__content">
          <button class="custom-product-modal__close">&times;</button>
          <div class="error">Error loading product</div>
        </div>
      `;
    }
  }

  renderProductModal(product) {
    const variantOptions = product.options.map(option => {
      return `
        <div class="variant-option">
          <label>${option.name}</label>
          <select class="variant-select" data-option-index="${option.position - 1}">
            ${option.values.map(value => `<option value="${value}">${value}</option>`).join('')}
          </select>
        </div>
      `;
    }).join('');

    this.modal.innerHTML = `
      <div class="custom-product-modal__content">
        <button class="custom-product-modal__close">&times;</button>
        
        <div class="modal-product-image">
          <img src="${product.featured_image}" alt="${product.title}">
        </div>
        
        <div class="modal-product-info">
          <h2 class="modal-product-title">${product.title}</h2>
          <p class="modal-product-price">${this.formatPrice(product.price)}</p>
          <div class="modal-product-description">${product.description}</div>
          
          <form class="modal-product-form" data-product-id="${product.id}">
            ${variantOptions}
            
            <div class="quantity-selector">
              <button type="button" class="quantity-minus">-</button>
              <input type="number" name="quantity" value="1" min="1" class="quantity-input">
              <button type="button" class="quantity-plus">+</button>
            </div>
            
            <button type="submit" class="add-to-cart-btn">Add to Cart</button>
          </form>
        </div>
      </div>
    `;

    // Setup variant selection
    this.setupVariantSelection(product);
    
    // Setup quantity selector
    this.setupQuantitySelector();
    
    // Setup add to cart
    this.setupAddToCart(product);
  }

  setupVariantSelection(product) {
    const variantSelects = this.modal.querySelectorAll('.variant-select');
    const variants = product.variants;

    variantSelects.forEach(select => {
      select.addEventListener('change', () => {
        // Find selected variant based on selected options
        const selectedOptions = Array.from(variantSelects).map(s => s.value);
        const selectedVariant = variants.find(variant => {
          return variant.options.every((option, index) => option === selectedOptions[index]);
        });

        if (selectedVariant) {
          // Update price if variant has different price
          const priceElement = this.modal.querySelector('.modal-product-price');
          priceElement.textContent = this.formatPrice(selectedVariant.price);
          
          // Update form with selected variant
          const form = this.modal.querySelector('.modal-product-form');
          form.dataset.variantId = selectedVariant.id;
        }
      });
    });

    // Set initial variant
    const initialVariant = variants[0];
    const form = this.modal.querySelector('.modal-product-form');
    form.dataset.variantId = initialVariant.id;
  }

  setupQuantitySelector() {
    const quantityInput = this.modal.querySelector('.quantity-input');
    const minusBtn = this.modal.querySelector('.quantity-minus');
    const plusBtn = this.modal.querySelector('.quantity-plus');

    minusBtn.addEventListener('click', () => {
      const currentValue = parseInt(quantityInput.value);
      if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
      }
    });

    plusBtn.addEventListener('click', () => {
      const currentValue = parseInt(quantityInput.value);
      quantityInput.value = currentValue + 1;
    });
  }

  setupAddToCart(product) {
    const form = this.modal.querySelector('.modal-product-form');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const variantId = form.dataset.variantId;
      const quantity = form.querySelector('.quantity-input').value;
      
      // Check if this is Black + Medium variant
      const selectedOptions = Array.from(form.querySelectorAll('.variant-select')).map(s => s.value);
      const isBlackMedium = selectedOptions.includes('Black') && selectedOptions.includes('Medium');
      
      try {
        // Add main product to cart
        await this.addToCart(variantId, quantity);
        
        // If Black + Medium, also add Soft Winter Jacket
        if (isBlackMedium) {
          await this.addSoftWinterJacket();
        }
        
        // Show success message
        this.showSuccessMessage();
        
        // Close modal after delay
        setTimeout(() => {
          this.hideProductModal();
        }, 1500);
        
      } catch (error) {
        console.error('Error adding to cart:', error);
        this.showErrorMessage();
      }
    });
  }

  async addToCart(variantId, quantity) {
    const data = {
      items: [{
        id: parseInt(variantId),
        quantity: parseInt(quantity)
      }]
    };

    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to add to cart');
    }

    return await response.json();
  }

  async addSoftWinterJacket() {
    // First, we need to find the Soft Winter Jacket product
    const response = await fetch('/products/soft-winter-jacket.js');
    const product = await response.json();
    
    if (product.variants && product.variants.length > 0) {
      const variantId = product.variants[0].id;
      await this.addToCart(variantId, 1);
    }
  }

  showSuccessMessage() {
    // Create and show success message
    const message = document.createElement('div');
    message.className = 'cart-success-message';
    message.textContent = 'Product added to cart successfully!';
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 1001;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(message);
    
    // Remove after 3 seconds
    setTimeout(() => {
      message.remove();
    }, 3000);
  }

  showErrorMessage() {
    // Similar to showSuccessMessage but for errors
  }

  hideProductModal() {
    this.modal.style.display = 'none';
  }

  formatPrice(price) {
    // Format price with currency symbol
    return Shopify.formatMoney(price, window.money_format);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.custom-product-grid')) {
    new CustomProductGrid();
  }
});