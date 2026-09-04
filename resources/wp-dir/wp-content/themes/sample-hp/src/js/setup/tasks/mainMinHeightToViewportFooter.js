/************************************************************
 * main の min-height を viewport 高さ - footer 高さ に合わせる
 ************************************************************/

/**
 * main の min-height を（viewport 高さ - footer 高さ）に合わせ、resize で追従する
 */
export function initMainMinHeightToViewportFooter() {
  const main = document.querySelector('main');
  const footer = document.querySelector('footer');
  if (!main || !footer) {
    return;
  }

  const setMainMinHeight = () => {
    const viewportHeight = window.innerHeight;
    const footerHeight = footer.offsetHeight;
    main.style.minHeight = `${viewportHeight - footerHeight}px`;
  };

  setMainMinHeight();
  window.addEventListener('resize', setMainMinHeight);
}
