/************************************************************
 * ナビゲーション要素（header/footer）の読み込み処理
 * - include/ディレクトリからheader/footerを読み込んで埋め込む
 * data-class=""の値をクラスについか可能
 * data-type=""の値で読み込むファイルを変更可能
 * header => id="include-header"
 * footer => id="include-footer"
 ************************************************************/

/**
 * header/footerを読み込んで埋め込む
 */
export async function loadIncludes() {
  /** 読み込みパス */
  const path = '/include/';

  // headerの読み込み
  const headerElement = document.getElementById('include-header');
  if (headerElement) {
    try {
      const dataType = headerElement.getAttribute('data-type');
      const dataClass = headerElement.getAttribute('data-class');
      const fileName = dataType ? `header-${dataType}.html` : 'header.html';
      const response = await fetch(`${path}${fileName}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${fileName}: ${response.status}`);
      }
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const header = doc.querySelector('header');
      if (header) {
        // data-class属性があればクラスを追加
        if (dataClass) {
          const classes = dataClass.split(' ').filter((cls) => cls.trim());
          if (classes.length > 0) {
            header.classList.add(...classes);
          }
        }
        // 元のタグを置き換え
        headerElement.replaceWith(header);
      }
    } catch (error) {
      console.error('Header loading error:', error);
    }
  }

  // footerの読み込み
  const footerElement = document.getElementById('include-footer');
  if (footerElement) {
    try {
      const dataType = footerElement.getAttribute('data-type');
      const dataClass = footerElement.getAttribute('data-class');
      const fileName = dataType ? `footer-${dataType}.html` : 'footer.html';
      const response = await fetch(`${path}${fileName}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${fileName}: ${response.status}`);
      }
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const footer = doc.querySelector('footer');
      if (footer) {
        // data-class属性があればクラスを追加
        if (dataClass) {
          const classes = dataClass.split(' ').filter((cls) => cls.trim());
          if (classes.length > 0) {
            footer.classList.add(...classes);
          }
        }
        // 元のタグを置き換え
        footerElement.replaceWith(footer);
      }
    } catch (error) {
      console.error('Footer loading error:', error);
    }
  }
}
