const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

module.exports = {
  plugins: [
    autoprefixer({
      overrideBrowserslist: ['> 1%', 'last 2 versions', 'ie >= 11']
    }),
    cssnano({
      preset: [
        'default',
        {
          // lvh/vw や CSS 変数を含む calc() はブラウザに任せる
          calc: false,
        },
      ],
    }),
  ]
};