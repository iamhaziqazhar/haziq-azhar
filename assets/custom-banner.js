// Custom Banner JavaScript for button animations
class CustomBanner {
  constructor() {
    this.bannerButtons = document.querySelectorAll('.custom-banner__button');
    this.init();
  }

  init() {
    this.setupButtonAnimations();
  }

  setupButtonAnimations() {
    this.bannerButtons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-3px)';
        button.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = 'none';
      });
    });
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.custom-banner')) {
    new CustomBanner();
  }
});