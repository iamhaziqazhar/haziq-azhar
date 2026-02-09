// ========================================
// Product Modal & Cart Functionality
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  
  // Close modal when overlay is clicked
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', closeModal);
  });
  
  // Close modal when X button is clicked
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', function() {
      this.closest('.product-modal').classList.remove('active');
    });
  });
  
  // Variant selection - Color buttons
  document.querySelectorAll('.variant-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const group = this.closest('.variant-group');
      group.querySelectorAll('.variant-btn').forEach(b => {
        b.classList.remove('active');
      });
      this.classList.add('active');
    });
  });
  
  // Add to Cart functionality
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', addToCart);
  });
});

/**
 * Close product modal
 */
function closeModal(e) {
  if (e && e.target !== this) return;
  document.querySelectorAll('.product-modal.active').forEach(modal => {
    modal.classList.remove('active');
  });
}

/**
 * Add product to cart with variant selection
 * Special logic: If Color=Black AND Size=Medium, auto-add "Soft Winter Jacket"
 */
function addToCart(e) {
  e.preventDefault();
  
  const btn = e.target;
  const productId = btn.dataset.productId;
  const productTitle = btn.dataset.productTitle;
  const modal = btn.closest('.product-modal');
  
  // Get selected variants
  const variantForm = modal.querySelector(`#variant-form-${productId}`);
  const selectedVariants = {};
  let isValid = true;
  
  if (variantForm) {
    // Get color selection (from buttons)
    const colorBtn = variantForm.querySelector('.variant-btn.active');
    if (colorBtn) {
      selectedVariants['color'] = colorBtn.dataset.optionValue;
    }
    
    // Get size selection (from dropdown)
    const sizeSelect = variantForm.querySelector('[data-option-name="Size"]');
    if (sizeSelect && sizeSelect.value) {
      selectedVariants['size'] = sizeSelect.value;
    } else if (sizeSelect) {
      isValid = false;
      alert('Please select a size');
      return;
    }
  }
  
  if (!isValid) return;
  
  // Fetch product data for variant ID
  fetch(`/products/${productTitle.toLowerCase().replace(/\s+/g, '-')}.json`)
    .then(response => response.json())
    .then(data => {
      const variantId = findVariantId(data.product, selectedVariants);
      
      if (variantId) {
        // Add main product to cart
        addItemToCart(variantId, 1);
        
        // SPECIAL LOGIC: If Color=Black AND Size=Medium, auto-add "Soft Winter Jacket"
        if (selectedVariants['color']?.toLowerCase() === 'black' && 
            selectedVariants['size']?.toLowerCase() === 'medium') {
          
          // Find and add "Soft Winter Jacket"
          fetch('/products.json?limit=250')
            .then(res => res.json())
            .then(productsData => {
              const softJacket = productsData.products.find(p => 
                p.title.toLowerCase().includes('soft winter jacket')
              );
              
              if (softJacket && softJacket.variants.length > 0) {
                addItemToCart(softJacket.variants[0].id, 1);
              }
            })
            .catch(err => console.error('Error adding bonus product:', err));
        }
        
        // Close modal
        modal.classList.remove('active');
        
        // Show success message
        showSuccessMessage('Product added to cart!');
      }
    })
    .catch(err => {
      console.error('Error adding to cart:', err);
      alert('Error adding product to cart');
    });
}

/**
 * Find variant ID based on selected options
 */
function findVariantId(product, selectedVariants) {
  return product.variants.find(variant => {
    // Match Color
    const colorMatch = variant.option1 && 
      variant.option1.toLowerCase() === (selectedVariants['color']?.toLowerCase() || '');
    
    // Match Size  
    const sizeMatch = variant.option2 && 
      variant.option2.toLowerCase() === (selectedVariants['size']?.toLowerCase() || '');
    
    return colorMatch && sizeMatch;
  })?.id;
}

/**
 * Add item to cart via Shopify Cart API
 */
function addItemToCart(variantId, quantity) {
  fetch('/cart/add.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          id: variantId,
          quantity: quantity
        }
      ]
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Item added to cart:', data);
  })
  .catch(err => {
    console.error('Cart error:', err);
  });
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
  const notification = document.createElement('div');
  notification.className = 'cart-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 15px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 2000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}