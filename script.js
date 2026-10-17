const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');

const closeMenu = () => {
  siteNav?.classList.remove('is-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
};

menuToggle?.addEventListener('click', () => {
  const isOpen = siteNav?.classList.toggle('is-open') ?? false;
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

siteNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && siteNav?.classList.contains('is-open')) {
    closeMenu();
    menuToggle?.focus();
  }
});

document.addEventListener('click', (event) => {
  if (!siteNav?.contains(event.target) && !menuToggle?.contains(event.target)) {
    closeMenu();
  }
});

const filterButtons = document.querySelectorAll('[data-filter]');
const productCards = document.querySelectorAll('.product-card');
const collectionStatus = document.querySelector('#collection-status');

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => {
      item.classList.toggle('is-active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    let visibleCount = 0;
    productCards.forEach((card) => {
      const isVisible = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('is-hidden', !isVisible);
      if (isVisible) visibleCount += 1;
    });
    if (collectionStatus) {
      collectionStatus.textContent = filter === 'all'
        ? `Showing all ${visibleCount} sarees.`
        : `Showing ${visibleCount} ${filter} sarees.`;
    }
  });
});
