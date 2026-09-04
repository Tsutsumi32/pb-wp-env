/************************************************************
 * バリデーション
 * - data-feature="formValidator" がフォーム。data-form-validator-form でフォーム種別（例: contact）
 * - 送信ボタンに data-action="formValidator.submit" を付与しフォームルートに delegate
 * - 初回は送信時のみ検証。送信でエラーが出た項目は focusout または（同意チェック等）checkbox / radio / file の change で再検証し、修正済みなら解除
 * - data-form-validator-validate / data-form-validator-input / data-form-validator-err 等で項目とエラー表示を紐付け
 * - 通常フォーム（externalService）で送信時ローディングを出す場合は、送信ボタンに data-form-validator-loading を付与
 * - フォーム分岐は formBranchToggle と併用し、非表示枝に data-form-validator-inactive="true" を付与すると検証から除外される
 ************************************************************/

import { DATA_ATTR, STATE_CLASSES } from '../constans/global.js';
import { delegate } from '../utils/delegate.js';

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化。DATA_ATTR.FEATURE は global.js）
// ---------------------------------------------------------------------------
/** 機能名（data-feature の値）。data 属性の値はキャメルケース */
const FEATURE_NAME = 'formValidator';
const FEATURE_ATTR_NAME = 'form-validator';
const FEATURE_DATA_PREFIX = `data-${FEATURE_ATTR_NAME}`;

/** 送信ボタンのイベント委譲トリガー */
const ACTION_SUBMIT = 'formValidator.submit';
/** 確認画面から入力画面へ戻るトリガー */
const ACTION_BACK_TO_INPUT = 'formValidator.backToInput';
/** 確認画面からの送信トリガー */
const ACTION_CONFIRM_SUBMIT = 'formValidator.confirmSubmit';
/** 選択済みファイルの削除トリガー */
const ACTION_REMOVE_FILE = 'formValidator.removeFile';

/** フォーム種別を識別（例: contact / download） */
const ATTR_FORM_TYPE = `${FEATURE_DATA_PREFIX}-form`;
/** 送信実行に使うボタン/要素を識別 */
const ATTR_SUBMIT = `${FEATURE_DATA_PREFIX}-submit`;
/** 送信時にローディング表示する送信ボタンを識別（通常フォーム向け。CF7 は常時表示） */
const ATTR_SHOW_LOADING = `${FEATURE_DATA_PREFIX}-loading`;
/** 項目ごとに実行するバリデーション種別を指定 */
const ATTR_VALIDATE = `${FEATURE_DATA_PREFIX}-validate`;
/** 入力項目のキー（エラー表示・確認画面マッピング用） */
const ATTR_INPUT = `${FEATURE_DATA_PREFIX}-input`;
/** エラーメッセージ文言に使う項目ラベル */
const ATTR_LABEL = `${FEATURE_DATA_PREFIX}-label`;
/** 最大文字数の上限値を指定 */
const ATTR_MAX = `${FEATURE_DATA_PREFIX}-max`;
/** ファイルサイズ上限（MB）を指定 */
const ATTR_MAX_SIZE = `${FEATURE_DATA_PREFIX}-max-size`;
/** 項目キーに対応するエラー表示先を指定 */
const ATTR_ERR = `${FEATURE_DATA_PREFIX}-err`;
/** 住所等の関連入力グループのキー（同じ値の複数項目を1つの表示先にまとめる） */
const ATTR_ERR_GROUP = `${FEATURE_DATA_PREFIX}-err-group`;
/** グループ集約エラーの表示先を指定（値は ATTR_ERR_GROUP と同じキー） */
const ATTR_ERR_GROUP_AREA = `${FEATURE_DATA_PREFIX}-err-group-area`;
/** 確認画面側の表示先キーを指定(WP) */
const ATTR_CONFIRM = `${FEATURE_DATA_PREFIX}-confirm`;
/** 入力画面/確認画面などの表示ブロック種別を指定(WP) */
const ATTR_PAGE = `${FEATURE_DATA_PREFIX}-page`;
/** CF7サーバーエラーの表示領域を識別 */
const ATTR_SERVER_ERROR = `${FEATURE_DATA_PREFIX}-server-error`;
/** 送信中ローディング表示要素を識別（フォーム機能外の共通 data 属性） */
const ATTR_LOADING = 'data-loading';
const ATTR_FILE_UI_BOUND = `${FEATURE_DATA_PREFIX}-file-ui-bound`;
const ATTR_FILE_WRAPPER = `${FEATURE_DATA_PREFIX}-file-wrapper`;
/** 選択済みファイル表示ブロック */
const ATTR_FILE_SELECTED = `${FEATURE_DATA_PREFIX}-file-selected`;
/** 選択済みファイル名の表示先 */
const ATTR_FILE_NAME = `${FEATURE_DATA_PREFIX}-file-name`;
/** ファイル選択済み時にラッパーへ付与する状態 class */
const CLASS_UPLOADED = 'is_uploaded';
/** 祖先に付与すると、その配下の検証項目を除外する（お問い合わせ種別などのフォーム分岐用） */
const ATTR_INACTIVE = `${FEATURE_DATA_PREFIX}-inactive`;

/** フォーム種別（例: contact）複数フォームがある場合の対応として、選択できるようにする。フォームの親 */
const FORM_CONTACT = 'contact';
const SELECTOR_FORM_CONTACT = `[${DATA_ATTR.FEATURE}="${FEATURE_NAME}"][${ATTR_FORM_TYPE}="${FORM_CONTACT}"]`;

const SELECTOR_FORM_SUBMIT = `[${ATTR_SUBMIT}]`;
const SELECTOR_VALIDATE = `[${ATTR_VALIDATE}]`;
const SELECTOR_LOADING = `#loading, [${ATTR_LOADING}]`;

/** ローディング表示後に送信を実行するまでの待ち時間（ms）。描画反映のための猶予 */
const SUBMIT_LOADING_DELAY_MS = 1000;

const DEFAULT_ERROR_CLASS = 'is_error';

/**
 * 検証対象外（非表示ブランチ）かどうか
 * @param {Element|null} item
 * @returns {boolean}
 */
const isValidatorItemInactive = (item) => {
  if (!(item instanceof Element)) return true;
  return Boolean(item.closest(`[${ATTR_INACTIVE}="true"]`));
};

let activeFormContext = null;
let isGlobalActionBound = false;
const enterKeyBoundForms = new WeakSet();

/** 送信バリデーション失敗後、blur で再検証する input キー（フォーム単位） */
const blurWatchKeysByForm = new WeakMap();
/** focusout / file・checkbox・radio の change で再検証を束ねたフォーム */
const fieldBlurRevalidateBound = new WeakSet();

// ---------------------------------------------------------------------------
// エントリーポイント（共通）
// ---------------------------------------------------------------------------
/**
 * フォーム送信処理
 * @param {Event} event - フォーム送信イベント
 * @param {Object} options - オプション設定
 * @param {Boolean} options.useRecaptcha - reCAPTCHAチェックを行うかどうか
 * @param {String} options.siteKey - reCAPTCHAのサイトキー
 * @param {String} options.action - reCAPTCHAのアクション
 * @param {String} options.formSelector - フォームのセレクタ
 * @param {String} options.submitBtnSelector - 送信ボタンのセレクタ
 * @returns {Promise<void>}
 */
export const handleFormSubmit = async (event, options = {}) => {
  const {
    formSelector = SELECTOR_FORM_CONTACT,
    submitBtnSelector = SELECTOR_FORM_SUBMIT,
    useRecaptcha = false,
    platform = 'wordpressCf7',
  } = options;

  const form = document.querySelector(formSelector);
  const submitBtn = document.querySelector(submitBtnSelector);

  // バリデーションエラーがあるかどうか
  let validate_check = false;

  const validationRoot = form ?? document;
  const validationResult = runFormValidation({
    ...options,
    validationRoot,
    restrictKeys: null,
    skipScroll: false,
  });
  validate_check = validationResult.hasError;

  if (form) {
    if (validationResult.hasError) {
      const validateSelector = options.validateSelector ?? SELECTOR_VALIDATE;
      const expanded = expandFailedKeysWithErrGroupSiblings(
        validationRoot,
        validationResult.failedKeys,
        validateSelector
      );
      blurWatchKeysByForm.set(form, expanded);
    } else {
      blurWatchKeysByForm.delete(form);
    }
  }

  // バリデーション結果に応じて処理を分岐
  if (!validate_check && form) {
    if (platform === 'externalService') {
      await handleValidationSuccessForExternalService(form, submitBtn, useRecaptcha);
    } else {
      await handleValidationSuccessForWordPressCf7(form, submitBtn);
    }
  } else {
    handleValidationErrorForWordPressCf7();
  }
};

/**
 * バリデーション　必須項目
 * @param {String|Boolean|File|null} val - 入力値
 * @param {String} subject - メッセージに付与するラベル
 * @param {String} message - メッセージの語尾（デフォルト: "入力してください。"）
 * @returns {String|false} エラー文字列、エラーがない場合はfalse
 */
const validateRequire = (val, subject = '', message = '入力してください。') => {
  let result = false;
  if (subject) {
    subject += 'を';
  }
  if (typeof val === 'string' && !val.trim()) {
    result = `${subject}${message}`;
  } else if (!val) {
    result = `${subject}${message}`;
  }
  return result;
};

/**
 * バリデーション　メールアドレス
 * @param {String} val - 入力値
 * @returns {String|false} エラー文字列、エラーがない場合はfalse
 */
const validateEMail = (val) => {
  let result = false;
  const emailPattern = /^[a-zA-Z0-9_.+-]+@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/;
  if (val.trim()) {
    if (!emailPattern.test(val)) {
      result = '有効なメールアドレスを入力してください。';
    }
  }
  return result;
};

/**
 * バリデーション　電話番号
 * @param {String} val - 入力値
 * @returns {String|false} エラー文字列、エラーがない場合はfalse
 */
const validateTel = (val) => {
  let result = false;
  const telPattern = /^(\d{2,4}-?\d{2,4}-?\d{4})$/;
  if (val.trim()) {
    if (!telPattern.test(val)) {
      result = '正しい形式の番号を入力してください。';
    }
  }
  return result;
};

/**
 * バリデーション　カタカナ
 * @param {String} val - 入力値
 * @returns {String|false} エラー文字列、エラーがない場合はfalse
 */
const validateKatakana = (val) => {
  let result = false;
  const telPattern = /^[ァ-ヶー　]+$/;
  if (val.trim()) {
    if (!telPattern.test(val)) {
      result = '全角カタカナで入力してください。';
    }
  }
  return result;
};

/**
 * バリデーション　ひらがな
 * @param {String} val - 入力値
 * @returns {String|false} エラー文字列、エラーがない場合はfalse
 */
const validateHiragana = (val) => {
  let result = false;
  const hiraPattern = /^[ぁ-んー　]+$/;
  if (val.trim()) {
    if (!hiraPattern.test(val)) {
      result = '全角ひらがなで入力してください。';
    }
  }
  return result;
};

/**
 * バリデーション　必須チェックボックス
 * @param {Boolean} val - チェックボックスの状態
 * @returns {String|false} エラー文字列、エラーがない場合はfalse
 */
const validateRequireCheck = (val) => {
  let result = false;
  if (!val) {
    result = '個人情報の取り扱いについて同意が必要です。';
  }
  return result;
};

/**
 * バリデーション　文字数上限
 * @param {String} val - 入力値
 * @param {Number} max - 文字数上限（デフォルト: 80）
 * @param {String} subject - メッセージに付与するラベル
 * @returns {String|false} エラー文字列、エラーがない場合はfalse
 */
const validateMaxLength = (val, max = 80, subject = '') => {
  let result = false;
  if (subject) {
    subject += 'は';
  }
  if (val.trim().length > max) {
    result = `${subject}${max}文字以下で入力してください。`;
  }
  return result;
};

/**
 * バリデーション　ファイル種別
 * @param {File|null} val - ファイルオブジェクト
 * @param {Number} maxSizeMb - 最大容量（MB）
 * @returns {String|false} エラー文字列、エラーがない場合はfalse
 */
const validateFile = (val, maxSizeMb) => {
  let result = false;
  if (val) {
    // ファイル名
    const fileName = val.name;
    // サイズ
    const fileSize = val.size;
    // ファイル上限サイズ
    const maxSizeBytes = maxSizeMb * 1024 * 1024;
    // 許可する拡張子
    const allowedExtensions = ['pdf', 'png', 'jpeg', 'jpg', 'xlsx', 'xls', 'docx', 'doc'];
    // 拡張子を取得（小文字化）
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    if (fileExtension && !allowedExtensions.includes(fileExtension)) {
      result = 'pdf・png・jpeg・Excelファイル・Wordファイルのいずれかを選択してください。';
    } else if (fileSize > maxSizeBytes) {
      result = `${maxSizeMb}MB以下のファイルをアップロードしてください。`;
    }
  }
  return result;
};

/**
 * バリデーション　郵便番号
 * @param {String} val - 入力値
 * @returns {String|false} エラー文字列、エラーがない場合はfalse
 */
const validateZip = (val) => {
  let result = false;
  const zipPattern = /^\d{3}-?\d{4}$/;
  if (val.trim()) {
    if (!zipPattern.test(val)) {
      result = '正しい郵便番号を入力してください。';
    }
  }
  return result;
};

/**
 * バリデーション　パスワード
 * 半角英字・数字をそれぞれ1文字以上含む8文字以上32文字以下
 * @param {String} val - 入力値
 * @returns {String|false} エラー文字列、エラーがない場合はfalse
 */
const validatePassword = (val) => {
  let result = false;
  const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,32}$/;
  if (val.trim()) {
    if (!passwordPattern.test(val)) {
      result = 'パスワードは半角英字・数字を含む8〜32文字で入力してください。';
    }
  }
  return result;
};

/**
 * バリデーション　半角数字（桁数上限）
 * @param {String} val - 入力値
 * @param {Number} maxDigits - 桁数上限
 * @param {String} subject - メッセージに付与するラベル
 * @returns {String|false} エラー文字列、エラーがない場合はfalse
 */
const validateNumber = (val, maxDigits = 4, subject = '') => {
  let result = false;
  if (!val.trim()) {
    return result;
  }
  const pattern = new RegExp(`^\\d{1,${maxDigits}}$`);
  if (!pattern.test(val.trim())) {
    if (subject) {
      result = `${subject}は${maxDigits}桁以内の半角数字で入力してください。`;
    } else {
      result = `${maxDigits}桁以内の半角数字で入力してください。`;
    }
  }
  return result;
};

/**
 * バリデーション　生年月日（年・月・日の整合性）
 * @param {String} y - 年
 * @param {String} m - 月
 * @param {String} d - 日
 * @returns {String|false} エラー文字列、エラーがない場合はfalse
 */
const validateBirthDate = (y, m, d) => {
  if (!y.trim() || !m.trim() || !d.trim()) {
    return false;
  }
  if (!/^\d{4}$/.test(y) || !/^\d{1,2}$/.test(m) || !/^\d{1,2}$/.test(d)) {
    return '生年月日の形式が正しくありません。';
  }
  const year = Number.parseInt(y, 10);
  const month = Number.parseInt(m, 10);
  const day = Number.parseInt(d, 10);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return '生年月日が正しくありません。';
  }
  return false;
};

// ---------------------------------------------------------------------------
// 共通処理（プラットフォーム非依存）
// ---------------------------------------------------------------------------
/**
 * data-form-validator-input を付与した要素の中にある input の value を取得する
 * @param {Element} item - data-form-validator-input が付与された要素
 * @returns {String|Boolean|File|null} 入力値
 */
const getInputValue = (item) => {
  let this_value = '';
  if (item.getAttribute(ATTR_VALIDATE) === 'requireCheck') {
    const checkbox = item.querySelector('input[type="checkbox"]');
    this_value = checkbox ? checkbox.checked : false;
  } else if (item.querySelector('textArea')) {
    const textarea = item.querySelector('textArea');
    this_value = textarea ? textarea.value : '';
  } else if (item.querySelector('input[type="radio"]')) {
    const target = item.querySelector('input[type="radio"]:checked');
    if (target) {
      this_value = target.value;
    }
  } else if (item.querySelector('input[type="checkbox"]')) {
    const checked = item.querySelectorAll('input[type="checkbox"]:checked');
    if (checked.length) {
      this_value = Array.from(checked)
        .map((el) => (el instanceof HTMLInputElement ? el.value : ''))
        .filter(Boolean)
        .join('、');
    }
  } else if (item.querySelector('select')) {
    const select = item.querySelector('select');
    this_value = select ? select.value : '';
  } else if (item.querySelector('input[type="file"]')) {
    const fileInput = item.querySelector('input[type="file"]');
    if (fileInput && fileInput.files && fileInput.files[0]) {
      this_value = fileInput.files[0];
    }
  } else if (item.querySelector('input')) {
    const input = item.querySelector('input');
    this_value = input ? input.value : '';
  }
  return this_value;
};

/**
 * エラーになった項目に、同一 err-group 内の兄弟キーも含めて blur 監視用に展開する
 * @param {ParentNode} root
 * @param {Set<string>} failedKeys
 * @param {string} validateSelector
 * @returns {Set<string>}
 */
const expandFailedKeysWithErrGroupSiblings = (root, failedKeys, validateSelector) => {
  const expanded = new Set(failedKeys);
  const items = Array.from(root.querySelectorAll(validateSelector));
  const groupIds = new Set();
  expanded.forEach((k) => {
    const item = items.find((i) => i.getAttribute(ATTR_INPUT) === k && !isValidatorItemInactive(i));
    const g = item?.getAttribute(ATTR_ERR_GROUP);
    if (g) groupIds.add(g);
  });
  groupIds.forEach((g) => {
    items.forEach((item) => {
      if (item.getAttribute(ATTR_ERR_GROUP) === g && !isValidatorItemInactive(item)) {
        const ik = item.getAttribute(ATTR_INPUT);
        if (ik) expanded.add(ik);
      }
    });
  });
  return expanded;
};

/**
 * バリデーション実施（全項目または restrictKeys 指定の部分のみ）
 * @param {Object} options - オプション設定
 * @param {String} options.validateSelector - バリデーション対象のセレクタ
 * @param {String} options.errorClass - エラークラス名
 * @param {String} options.headerSelector - ヘッダーのセレクタ
 * @param {Number} options.scrollOffset - スクロールオフセット
 * @param {ParentNode} [options.validationRoot] - 検索スコープ（省略時は document）
 * @param {Set<string>|null} [options.restrictKeys] - 指定時は該当キーのみ DOM 更新（null で全項目）
 * @param {boolean} [options.skipScroll] - true のときエラー位置へスクロールしない
 * @returns {{ hasError: boolean, failedKeys: Set<string> }}
 */
const runFormValidation = (options = {}) => {
  const {
    validateSelector = SELECTOR_VALIDATE,
    errorClass = 'is_error',
    headerSelector = 'header',
    scrollOffset = 160,
    validationRoot = document,
    restrictKeys = null,
    skipScroll = false,
  } = options;
  const root = validationRoot;
  /** バリデーションエラーがあるかどうか判定する */
  let validateStatus = false;
  /** エラーが残っている input キー（メール確認不一致時は email / email-confirm を含む） */
  const failedKeys = new Set();
  const isPartial = restrictKeys instanceof Set && restrictKeys.size > 0;

  // 実施するバリデーションの種類 data-form-validator-validate に該当の文字列をセットする
  // (inputの親タグに付与する(CF7対応のため))
  /** 必須チェック */
  const requireValidate = 'require';
  /** メール形式 */
  const emailValidate = 'email';
  /** 電話番号形式 */
  const telValidate = 'tel';
  /** 最大文字列数 */
  const maxLengthValidate = 'maxLength';
  /** チェックボックス必須 */
  const requireCheckBox = 'requireCheck';
  /** ファイルチェック */
  const fileValidate = 'file';
  /** 郵便番号 */
  const zipValidate = 'zip';
  /** パスワード */
  const passwordValidate = 'password';
  /** 半角数字 */
  const numberValidate = 'number';
  /** カタカナ */
  const katakanaValidate = 'katakana';
  /** カタカナ */
  const hiraganaValidate = 'hiragana';

  /** エラー格納配列 */
  const err = [];
  /** 最初のエラー位置を格納する変数 */
  let scrollPosition = 0;
  /** グループ集約エラー格納（key: グループ名, value: エラーメッセージ配列） */
  const groupErrors = new Map();

  /**
   * バリデーションの種類を、項目ごとに管理するオブジェクト
   * キー名: data-form-validator-input 値 フィールド: data-form-validator-validate を分割した配列
   */
  const validateOptions = {};
  /** data-form-validator-validate がある要素 */
  const validateItem = root.querySelectorAll(validateSelector);

  // data-form-validator-validate / data-form-validator-input の値を取得し、配列に格納する
  validateItem.forEach((item) => {
    if (isValidatorItemInactive(item)) return;
    const validateAttribute = item.getAttribute(ATTR_VALIDATE);
    const inputAttribute = item.getAttribute(ATTR_INPUT);
    if (validateAttribute && inputAttribute) {
      // data-form-validator-validate に設定した種別を配列にする
      const validateArray = validateAttribute.split(' ');
      // 上記配列を、バリデーションの種類を管理する配列にpush
      validateOptions[inputAttribute] = validateArray;
    }
  });

  /** 部分検証時に DOM を更新する err-group 一覧 */
  const affectedErrGroups = new Set();
  if (isPartial) {
    restrictKeys.forEach((k) => {
      const ti = Array.from(validateItem).find(
        (item) => item.getAttribute(ATTR_INPUT) === k && !isValidatorItemInactive(item)
      );
      const g = ti?.getAttribute(ATTR_ERR_GROUP);
      if (g) affectedErrGroups.add(g);
    });
  }

  // バリデーション処理(1つ1つの入力欄でループ)
  Object.keys(validateOptions).forEach((key) => {
    if (isPartial && !restrictKeys.has(key)) return;
    // エラー配列を初期化
    err.length = 0;
    // 該当項目の入力値
    let value = '';
    // data-form-validator-input の値(key)に該当する要素を取得
    const targetItemArray = Array.from(validateItem).filter(
      (item) => item.getAttribute(ATTR_INPUT) === key && !isValidatorItemInactive(item)
    );
    const targetItem = targetItemArray[0];
    if (!targetItem) return;
    // inputのタイプによって、値を取得する
    if (targetItem) {
      value = getInputValue(targetItem);
    }

    // 該当の項目のラベル（data-form-validator-label）
    let targetItemLabel = targetItem?.getAttribute(ATTR_LABEL) || '';
    // 該当要素の、data-form-validator-validate の数分、バリデーション実施
    validateOptions[key].forEach((validate) => {
      // 本項目にエラーがあるか
      let isError = false;
      // エラー結果
      let result = false;
      if (validate === requireValidate) {
        if (
          targetItem?.querySelector('select') ||
          targetItem?.querySelector('input[type="radio"]') ||
          targetItem?.querySelector('input[type="checkbox"]')
        ) {
          result = validateRequire(value, targetItemLabel, '選択してください。');
        } else {
          result = validateRequire(value, targetItemLabel);
        }
        if (result) {
          isError = true;
        }
      } else if (validate === emailValidate) {
        result = validateEMail(value);
        if (result) {
          isError = true;
        }
      } else if (validate === telValidate) {
        result = validateTel(value);
        if (result) {
          isError = true;
        }
      } else if (validate === katakanaValidate) {
        result = validateKatakana(value);
        if (result) {
          isError = true;
        }
      } else if (validate === hiraganaValidate) {
        result = validateHiragana(value);
        if (result) {
          isError = true;
        }
      } else if (validate === maxLengthValidate) {
        // 最大文字数を取得する（data-form-validator-max に最大文字数をセット）
        const max = targetItem?.getAttribute(ATTR_MAX);
        result = validateMaxLength(value, max ? parseInt(max) : 80, targetItemLabel);
        if (result) {
          isError = true;
        }
      } else if (validate === requireCheckBox) {
        result = validateRequireCheck(value);

        if (result) {
          isError = true;
        }
      } else if (validate === fileValidate) {
        const maxSizeMb = targetItem?.getAttribute(ATTR_MAX_SIZE);
        result = validateFile(value, maxSizeMb ? parseInt(maxSizeMb) : 10);
        if (result) {
          isError = true;
        }
      } else if (validate === zipValidate) {
        result = validateZip(value);
        if (result) {
          isError = true;
        }
      } else if (validate === passwordValidate) {
        result = validatePassword(value);
        if (result) {
          isError = true;
        }
      } else if (validate === numberValidate) {
        const maxDigits = targetItem?.getAttribute(ATTR_MAX);
        result = validateNumber(value, maxDigits ? parseInt(maxDigits, 10) : 4, targetItemLabel);
        if (result) {
          isError = true;
        }
      }
      if (isError && result) {
        err.push('※' + result);
      }
    });

    if (err.length > 0) {
      failedKeys.add(key);
    }

    // 該当のエラー表示エリア
    const targetValidateArea = root.querySelector(`[${ATTR_ERR}="${key}"]`);
    if (targetValidateArea) {
      if (err.length > 0) {
        // エラー表示(最初のエラー)
        targetValidateArea.innerText = err[0];
        // エラークラス付与
        if (targetValidateArea.parentElement) {
          targetValidateArea.parentElement.classList.add(errorClass);
        }
        // バリデーションフラグtrue
        validateStatus = true;
        if (!skipScroll && !scrollPosition) {
          // 初めてのエラー位置を設定
          const header = document.querySelector(headerSelector);
          if (header) {
            scrollPosition =
              targetValidateArea.getBoundingClientRect().top +
              window.scrollY -
              header.offsetHeight -
              scrollOffset;
            window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
          }
        }
      } else {
        // エラーが消えた場合、エラー非表示
        targetValidateArea.innerText = '';
        // エラークラスは付与時に parent に付けているため、両方から外す
        targetValidateArea.classList.remove(errorClass);
        if (targetValidateArea.parentElement) {
          targetValidateArea.parentElement.classList.remove(errorClass);
        }
      }
    }

    // グループ集約: 項目に data-form-validator-err-group が付いている場合、
    // 末尾の集約エリアにもエラーを追記する。個別表示先を持たない場合は
    // targetItem 自体に is_error を付与して入力欄の赤枠を維持する。
    const groupKey = targetItem?.getAttribute(ATTR_ERR_GROUP);
    if (groupKey) {
      if (err.length > 0) {
        if (!groupErrors.has(groupKey)) groupErrors.set(groupKey, []);
        groupErrors.get(groupKey).push(...err);
        targetItem.classList.add(errorClass);
        validateStatus = true;
        if (!skipScroll && !scrollPosition && !targetValidateArea) {
          const header = document.querySelector(headerSelector);
          if (header) {
            scrollPosition =
              targetItem.getBoundingClientRect().top +
              window.scrollY -
              header.offsetHeight -
              scrollOffset;
            window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
          }
        }
      } else {
        targetItem?.classList.remove(errorClass);
      }
    }
  });

  const BIRTH_DATE_GROUP = 'recruit-dob';
  const BIRTH_FIELD_KEYS = ['recruit-birth-y', 'recruit-birth-m', 'recruit-birth-d'];
  const shouldRunBirthDateCheck =
    !isPartial || BIRTH_FIELD_KEYS.some((key) => restrictKeys.has(key));
  if (shouldRunBirthDateCheck) {
    const birthYItem = root.querySelector(`[${ATTR_INPUT}="recruit-birth-y"]`);
    const birthMItem = root.querySelector(`[${ATTR_INPUT}="recruit-birth-m"]`);
    const birthDItem = root.querySelector(`[${ATTR_INPUT}="recruit-birth-d"]`);
    if (birthYItem && birthMItem && birthDItem) {
      const birthY = String(getInputValue(birthYItem)).trim();
      const birthM = String(getInputValue(birthMItem)).trim();
      const birthD = String(getInputValue(birthDItem)).trim();
      const birthDateError = validateBirthDate(birthY, birthM, birthD);
      if (birthDateError) {
        const message = `※${birthDateError}`;
        if (!groupErrors.has(BIRTH_DATE_GROUP)) {
          groupErrors.set(BIRTH_DATE_GROUP, []);
        }
        groupErrors.get(BIRTH_DATE_GROUP).push(message);
        BIRTH_FIELD_KEYS.forEach((key) => failedKeys.add(key));
        validateStatus = true;
        [birthYItem, birthMItem, birthDItem].forEach((item) => {
          if (!isValidatorItemInactive(item)) {
            item.classList.add(errorClass);
          }
        });
        if (!skipScroll && !scrollPosition) {
          const header = document.querySelector(headerSelector);
          const birthGroupArea = root.querySelector(
            `[${ATTR_ERR_GROUP_AREA}="${BIRTH_DATE_GROUP}"]`
          );
          const scrollTarget = birthGroupArea ?? birthYItem;
          if (header && scrollTarget) {
            scrollPosition =
              scrollTarget.getBoundingClientRect().top +
              window.scrollY -
              header.offsetHeight -
              scrollOffset;
            window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
          }
        }
      }
    }
  }

  // グループ集約エリアへ描画（バリデーションループ完了後にまとめて反映）
  const groupAreas = root.querySelectorAll(`[${ATTR_ERR_GROUP_AREA}]`);
  groupAreas.forEach((area) => {
    const groupKey = area.getAttribute(ATTR_ERR_GROUP_AREA);
    if (isPartial && (!groupKey || !affectedErrGroups.has(groupKey))) return;

    const messages = groupKey ? groupErrors.get(groupKey) : null;
    if (messages && messages.length > 0) {
      const uniqueMessages = [...new Set(messages)];
      const listItems = uniqueMessages.map((message) => `<li>${message}</li>`).join('');
      area.innerHTML = `<ul class="bl_form_sendValidateErrorList">${listItems}</ul>`;
    } else {
      area.innerHTML = '';
    }
  });

  // メールアドレス（確認）: メールアドレスと一致（形式エラーがない場合のみ）
  const emailItem = root.querySelector(`[${ATTR_INPUT}="email"]`);
  const emailConfirmItem = root.querySelector(`[${ATTR_INPUT}="email-confirm"]`);
  const emailConfirmErr = root.querySelector(`[${ATTR_ERR}="email-confirm"]`);
  const runEmailConfirmBlock =
    !isPartial || restrictKeys.has('email') || restrictKeys.has('email-confirm');
  if (runEmailConfirmBlock && emailItem && emailConfirmItem && emailConfirmErr) {
    const rawEmail = getInputValue(emailItem);
    const rawConfirm = getInputValue(emailConfirmItem);
    const emailStr = typeof rawEmail === 'string' ? rawEmail.trim() : '';
    const confirmStr = typeof rawConfirm === 'string' ? rawConfirm.trim() : '';
    const emailFormatError = validateEMail(emailStr);
    const confirmFormatError = validateEMail(confirmStr);
    const mismatch =
      !emailFormatError && !confirmFormatError && emailStr && confirmStr && emailStr !== confirmStr;

    if (mismatch) {
      emailConfirmErr.innerText = '※メールアドレスが一致しません。';
      if (emailConfirmErr.parentElement) {
        emailConfirmErr.parentElement.classList.add(errorClass);
      }
      validateStatus = true;
      failedKeys.add('email');
      failedKeys.add('email-confirm');
      if (!skipScroll && !scrollPosition) {
        const header = document.querySelector(headerSelector);
        if (header) {
          const top =
            emailConfirmErr.getBoundingClientRect().top +
            window.scrollY -
            header.offsetHeight -
            scrollOffset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    } else {
      emailConfirmErr.innerText = '';
      if (emailConfirmErr.parentElement) {
        emailConfirmErr.parentElement.classList.remove(errorClass);
      }
    }
  }

  return { hasError: validateStatus, failedKeys };
};

// ---------------------------------------------------------------------------
// WordPress (CF7) 固有処理
// - 確認画面への切替
// - 確認画面からの戻る
// - CF7イベント（wpcf7invalid / wpcf7spam / wpcf7mailfailed）連携
// ---------------------------------------------------------------------------
/** スパム判定時にユーザーへ表示する文言（「スパム」は出さない） */
const CF7_SPAM_FAILURE_MESSAGE = '送信できませんでした。しばらく時間をおいて再度お試しください。';
const ATTR_CF7_EVENTS_BOUND = 'data-form-validator-cf7-events-bound';

/** 直近の CF7 失敗ハンドル時刻（二重発火防止） */
let cf7FailureHandledAt = 0;
/**
 * 入力値の配列反映（確認画面）
 * @param {HTMLElement} form
 * @returns {void}
 */
const applyValuesToConfirmPage = (form) => {
  const inputItems = form.querySelectorAll(`[${ATTR_INPUT}]`);
  inputItems.forEach((item) => {
    let value = getInputValue(item);
    const key = item.getAttribute(ATTR_INPUT);
    const target = document.querySelector(`[${ATTR_CONFIRM}="${key}"]`);
    if (!target) return;

    if (value && typeof value === 'object' && 'name' in value) {
      value = value.name || '';
    }
    if (typeof value === 'boolean') {
      value = value ? '同意する' : '';
    }
    target.innerText = typeof value === 'string' ? value : String(value ?? '');
  });
};

/**
 * 確認画面の枝分け行を、入力中の種別（inquiry-type）に合わせて表示切替
 * @param {HTMLElement} form
 * @param {HTMLElement|null} confirmPage
 * @returns {void}
 */
const syncConfirmPageBranches = (form, confirmPage) => {
  if (!(confirmPage instanceof HTMLElement)) return;

  const inquiryItem = form.querySelector(`[${ATTR_INPUT}="inquiry-type"]`);
  const current =
    inquiryItem instanceof HTMLElement ? String(getInputValue(inquiryItem) ?? '').trim() : '';

  confirmPage.querySelectorAll('[data-form-branch]').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const tokens = (node.getAttribute('data-form-branch') || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (tokens.length === 0) return;
    node.hidden = !tokens.includes(current);
  });
};

/**
 * 確認画面へ切り替え
 * @param {Object} context
 * @returns {void}
 */
const switchToConfirmPage = (context) => {
  const { inputPage, confirmPage, header, scrollOffset } = context;
  if (!confirmPage || !inputPage) return;

  inputPage.style.display = 'none';
  confirmPage.style.display = 'block';
  const top =
    confirmPage.getBoundingClientRect().top +
    window.scrollY -
    (header?.offsetHeight || 0) -
    scrollOffset;
  window.scrollTo({ top });
};

/**
 * 入力画面へ戻す
 * @returns {void}
 */
const switchBackToInputPage = () => {
  if (!activeFormContext) return;
  const { inputPage, confirmPage, header, scrollOffset, confirmSubmitBtn } = activeFormContext;
  if (confirmPage) confirmPage.style.display = 'none';
  if (inputPage) {
    inputPage.style.display = 'block';
    const top =
      inputPage.getBoundingClientRect().top +
      window.scrollY -
      (header?.offsetHeight || 0) -
      scrollOffset;
    window.scrollTo({ top });
  }
  if (confirmSubmitBtn) {
    confirmSubmitBtn.style.pointerEvents = 'auto';
  }
};

/**
 * ローディング要素を取得
 * @returns {HTMLElement|null}
 */
const getLoadingElement = () => {
  const target = document.querySelector(SELECTOR_LOADING);
  return target instanceof HTMLElement ? target : null;
};

/**
 * ローディング表示切り替え（is_active クラスで CSS 側が制御）
 * @param {boolean} isVisible
 * @returns {void}
 */
const toggleLoading = (isVisible) => {
  const loading = getLoadingElement();
  if (!loading) return;
  loading.classList.toggle(STATE_CLASSES.ACTIVE, isVisible);
  loading.setAttribute('aria-busy', isVisible ? 'true' : 'false');
};

/**
 * 送信ボタンにローディング起動属性があるか
 * @param {Element|null} submitBtn
 * @returns {boolean}
 */
const shouldShowLoadingOnSubmit = (submitBtn) =>
  submitBtn instanceof HTMLElement && submitBtn.hasAttribute(ATTR_SHOW_LOADING);

/**
 * ローディング表示後にコールバックを実行（描画反映のための遅延付き）
 * @param {() => void} onReady
 * @returns {void}
 */
const runAfterLoadingShown = (onReady) => {
  toggleLoading(true);
  window.setTimeout(onReady, SUBMIT_LOADING_DELAY_MS);
};

/**
 * サーバーエラー領域を初期メッセージに戻す
 * @param {HTMLElement|null} serverError
 * @returns {void}
 */
const resetServerErrorMessage = (serverError) => {
  if (!(serverError instanceof HTMLElement)) return;
  const defaultMessage = serverError.dataset.defaultMessage || serverError.innerHTML;
  if (!serverError.dataset.defaultMessage) {
    serverError.dataset.defaultMessage = defaultMessage;
  }
  serverError.innerHTML = defaultMessage;
};

/**
 * CF7の invalid_fields からエラーメッセージ配列を抽出
 * @param {Event} event
 * @returns {string[]}
 */
const extractCf7InvalidMessages = (event) => {
  const detail = event && typeof event === 'object' ? event.detail : null;
  const apiResponse = detail && typeof detail === 'object' ? detail.apiResponse : null;
  const invalidFields =
    apiResponse && Array.isArray(apiResponse.invalid_fields) ? apiResponse.invalid_fields : [];

  return invalidFields
    .map((field) => (field && typeof field.message === 'string' ? field.message.trim() : ''))
    .filter(Boolean);
};

/**
 * サーバーエラー領域へエラー内容を描画
 * @param {HTMLElement|null} serverError
 * @param {string[]} messages
 * @param {{ appendToDefault?: boolean }} [options]
 * @returns {void}
 */
const renderServerErrorMessages = (serverError, messages, options = {}) => {
  const { appendToDefault = true } = options;
  if (!(serverError instanceof HTMLElement)) return;
  if (!Array.isArray(messages) || messages.length === 0) {
    resetServerErrorMessage(serverError);
    return;
  }

  if (!appendToDefault) {
    serverError.innerHTML = messages.join('<br>');
    return;
  }

  resetServerErrorMessage(serverError);
  const listItems = messages.map((message) => `<li>${message}</li>`).join('');
  serverError.innerHTML += `<ul class="bl_form_sendValidateErrorList">${listItems}</ul>`;
};

/**
 * CF7 の form 要素を取得（data-feature ルートは bl_form 内側のため closest が必要）
 * @param {HTMLElement|null} root
 * @returns {HTMLFormElement|null}
 */
const resolveCf7FormElement = (root) => {
  if (!(root instanceof HTMLElement)) return null;
  if (root instanceof HTMLFormElement) return root;
  const form = root.closest('form');
  return form instanceof HTMLFormElement ? form : null;
};

/**
 * CF7イベントからフォームルート（bl_form）を取得
 * @param {Event} event
 * @returns {HTMLElement|null}
 */
const getFormRootFromEvent = (event) => {
  if (activeFormContext?.form instanceof HTMLElement) {
    return activeFormContext.form;
  }
  if (event.target instanceof HTMLElement) {
    const cf7Form = event.target.closest('form');
    if (cf7Form instanceof HTMLFormElement) {
      const formRoot = cf7Form.querySelector(`[${DATA_ATTR.FEATURE}="${FEATURE_NAME}"]`);
      return formRoot instanceof HTMLElement ? formRoot : cf7Form;
    }
  }
  return null;
};

/**
 * CF7送信失敗時: ローディング解除・入力画面へ戻す・エラー表示
 * @param {Event} event
 * @param {string[]} [messages]
 * @param {{ appendToDefault?: boolean }} [options]
 * @returns {void}
 */
const handleCf7FormSubmissionFailure = (event, messages = [], options = {}) => {
  const now = Date.now();
  if (now - cf7FailureHandledAt < 300) return;
  cf7FailureHandledAt = now;

  toggleLoading(false);
  switchBackToInputPage();

  const formRoot = getFormRootFromEvent(event);
  const serverError = formRoot?.querySelector(`[${ATTR_SERVER_ERROR}]`) || null;
  if (serverError instanceof HTMLElement) {
    renderServerErrorMessages(serverError, messages, options);
    serverError.style.display = 'block';
  }
};

/**
 * CF7 のスパム判定を処理
 * @param {Event} event
 * @returns {void}
 */
const handleCf7SpamDetected = (event) => {
  handleCf7FormSubmissionFailure(event, [CF7_SPAM_FAILURE_MESSAGE], {
    appendToDefault: false,
  });
};

/**
 * CF7 送信完了（wpcf7submit）を処理
 * @param {Event} event
 * @returns {void}
 */
const handleCf7SubmitCompleted = (event) => {
  const status = event.detail?.apiResponse?.status;
  if (status === 'spam') {
    handleCf7FormSubmissionFailure(event, [CF7_SPAM_FAILURE_MESSAGE], {
      appendToDefault: false,
    });
    return;
  }
  if (status === 'mail_sent' || status === 'mail_failed') {
    toggleLoading(false);
  }
};

/**
 * CF7 form 要素へレスポンスイベントを紐付け（document より form 直下が確実）
 * @param {HTMLElement} formRoot
 * @returns {void}
 */
const bindCf7FormResponseEvents = (formRoot) => {
  const cf7Form = resolveCf7FormElement(formRoot);
  if (!cf7Form || cf7Form.getAttribute(ATTR_CF7_EVENTS_BOUND) === 'true') return;
  cf7Form.setAttribute(ATTR_CF7_EVENTS_BOUND, 'true');

  cf7Form.addEventListener('wpcf7spam', handleCf7SpamDetected);
  cf7Form.addEventListener('wpcf7invalid', (event) => {
    handleCf7FormSubmissionFailure(event, extractCf7InvalidMessages(event));
  });
  cf7Form.addEventListener('wpcf7submit', handleCf7SubmitCompleted);
  cf7Form.addEventListener('wpcf7mailfailed', () => {
    toggleLoading(false);
  });
};

/**
 * CF7本来の送信ボタンを実行
 * @param {HTMLElement} formRoot
 * @param {HTMLButtonElement|null} submitBtn
 * @returns {void}
 */
const submitWordPressCf7Form = (formRoot, submitBtn = null) => {
  const cf7Form = resolveCf7FormElement(formRoot);
  const searchRoot = cf7Form || formRoot;
  const target =
    submitBtn ||
    searchRoot.querySelector('input.wpcf7-submit, input[type="submit"], button[type="submit"]');
  if (target instanceof HTMLElement) {
    // 参照元実装と同様に、ローディング表示後に少し遅らせて送信
    runAfterLoadingShown(() => {
      target.click();
    });
    return;
  }
  if (cf7Form instanceof HTMLFormElement) {
    toggleLoading(true);
    cf7Form.submit();
  }
};

/**
 * WordPress(CF7) バリデーション成功時処理
 * @param {HTMLFormElement} form
 * @param {HTMLButtonElement|null} submitBtn
 * @returns {Promise<void>}
 */
const handleValidationSuccessForWordPressCf7 = async (form, submitBtn) => {
  // WordPress(CF7) 向けの「入力画面 <-> 確認画面」切替に必要な参照を保持
  // （外部フォーム連携ではこのコンテキストは不要）
  const inputPage = form.closest(`[${ATTR_PAGE}="input"]`) || form;
  const confirmPage = document.querySelector(`[${ATTR_PAGE}="confirm"]`);
  const header = document.querySelector('header');
  const confirmSubmitBtn = confirmPage?.querySelector(
    `[${DATA_ATTR.ACTION}="${ACTION_CONFIRM_SUBMIT}"]`
  );
  activeFormContext = {
    form,
    submitBtn,
    inputPage,
    confirmPage,
    header,
    scrollOffset: 20,
    confirmSubmitBtn,
  };

  const serverError = form.querySelector(`[${ATTR_SERVER_ERROR}]`);
  if (serverError instanceof HTMLElement) {
    // 一度表示されたサーバーエラーは、再試行時に初期化してから確認画面へ進める
    serverError.style.display = 'none';
    resetServerErrorMessage(serverError);
  }

  if (!confirmPage) {
    // 確認画面を持たないWPフォームは通常のCF7送信フローへフォールバック
    submitWordPressCf7Form(form, submitBtn);
    return;
  }

  applyValuesToConfirmPage(form);
  syncConfirmPageBranches(form, confirmPage);
  switchToConfirmPage(activeFormContext);
};

// ---------------------------------------------------------------------------
// 外部フォームサービス固有処理
// - SSGForm 等の外部送信ハンドラ連携
// ---------------------------------------------------------------------------
/**
 * 外部サービス連携時の送信処理
 * @param {HTMLFormElement} form
 * @param {HTMLButtonElement|null} submitBtn
 * @param {Boolean} useRecaptcha
 * @returns {Promise<void>}
 */
const handleValidationSuccessForExternalService = async (form, submitBtn, useRecaptcha) => {
  const showLoading = shouldShowLoadingOnSubmit(submitBtn);

  if (window.FormSubmitHandler?.submitForm) {
    if (showLoading) toggleLoading(true);
    await window.FormSubmitHandler.submitForm(form, submitBtn, useRecaptcha);
    return;
  }

  if (showLoading) {
    runAfterLoadingShown(() => {
      form.submit();
    });
    return;
  }

  form.submit();
};

/**
 * WordPress(CF7) バリデーションエラー時の処理
 * @returns {void}
 */
const handleValidationErrorForWordPressCf7 = () => {
  console.error('Validation Error !');
};

/**
 * WordPress(CF7) 固有のグローバルアクションを束ねる
 * - 戻る/送信ボタン（確認画面）の data-action
 * - CF7メール送信失敗時の遷移
 */
const bindGlobalActions = () => {
  if (isGlobalActionBound) return;
  isGlobalActionBound = true;

  delegate(document, 'click', {
    [ACTION_BACK_TO_INPUT]: (event) => {
      event.preventDefault();
      switchBackToInputPage();
    },
    [ACTION_CONFIRM_SUBMIT]: (event, actionEl) => {
      event.preventDefault();
      if (!activeFormContext?.form) return;
      if (actionEl instanceof HTMLElement) {
        // 連打防止（CF7イベントで失敗時に再度 auto に戻す）
        actionEl.style.pointerEvents = 'none';
        activeFormContext.confirmSubmitBtn = actionEl;
      }
      submitWordPressCf7Form(activeFormContext.form, activeFormContext.submitBtn);
    },
  });

  // WordPress(CF7) のメール送信失敗時は汎用エラーページ（page-error.php / slug: error）へ遷移
  // msg は Message::ERROR_MSG_KEY_CONTACT_MAIL_FAILED と一致させる（未指定だとトップへリダイレクトされる）
  document.addEventListener('wpcf7mailfailed', () => {
    toggleLoading(false);
    const path = window.location.pathname.replace(/\/+$/, '');
    const errorPath = path.replace(/[^/]+$/, 'error');
    const errorUrl = new URL(`${errorPath}/`, window.location.origin);
    errorUrl.searchParams.set('msg', 'contact_mail_failed');
    window.location.href = errorUrl.toString();
  });
};

/**
 * Enterキーでの意図しない送信を防止し、次入力へフォーカス移動
 * - data-feature="formValidator" 内のみ適用
 * - textarea では Enter を許可
 * @param {HTMLElement} form
 * @returns {void}
 */
const bindEnterKeyControl = (form) => {
  if (!(form instanceof HTMLElement) || enterKeyBoundForms.has(form)) return;

  const getNavigableFields = () =>
    Array.from(form.querySelectorAll('input, textarea')).filter((el) => {
      if (!(el instanceof HTMLElement)) return false;
      if (el instanceof HTMLInputElement && el.type === 'hidden') return false;
      return !el.hasAttribute('disabled');
    });

  form.addEventListener('keydown', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (event.key !== 'Enter' || event.isComposing) return;
    if (target.tagName === 'TEXTAREA') return;
    if (!form.contains(target)) return;

    const inputs = getNavigableFields();
    const currentIndex = inputs.indexOf(target);
    if (currentIndex < 0) return;

    // Enterでのネイティブ送信を防止し、可能な場合は次項目へ移動
    event.preventDefault();
    const nextField = inputs[currentIndex + 1];
    if (nextField instanceof HTMLElement) {
      nextField.focus();
    }
  });

  enterKeyBoundForms.add(form);
};

/**
 * ファイル入力UI（選択ファイル名表示・削除）を初期化
 * @param {HTMLElement} form
 * @returns {void}
 */
const initFileInputUi = (form) => {
  if (!(form instanceof HTMLElement)) return;

  const fileItems = form.querySelectorAll(`[${ATTR_INPUT}]`);
  fileItems.forEach((item, index) => {
    if (!(item instanceof HTMLElement)) return;
    if (isValidatorItemInactive(item)) return;
    const fileInput = item.querySelector('input[type="file"]');
    if (!(fileInput instanceof HTMLInputElement)) return;
    if (fileInput.getAttribute(ATTR_FILE_UI_BOUND) === 'true') return;

    if (!fileInput.id) {
      fileInput.id = `formFileInput${index + 1}`;
    }

    const fileWrapper = item.querySelector(`[${ATTR_FILE_WRAPPER}]`);
    const selected = item.querySelector(`[${ATTR_FILE_SELECTED}]`);
    const fileName = item.querySelector(`[${ATTR_FILE_NAME}]`);
    const removeBtn = item.querySelector(`[${DATA_ATTR.ACTION}="${ACTION_REMOVE_FILE}"]`);

    /**
     * 選択済みファイル表示を同期
     * @returns {void}
     */
    const updateFileUi = () => {
      const selectedFile = fileInput.files && fileInput.files[0];
      const hasFile = Boolean(selectedFile);
      if (fileName instanceof HTMLElement) {
        fileName.textContent = hasFile ? selectedFile.name : '';
      }
      if (selected instanceof HTMLElement) {
        selected.hidden = !hasFile;
      }
      if (fileWrapper instanceof HTMLElement) {
        fileWrapper.classList.toggle(CLASS_UPLOADED, hasFile);
      }
    };

    fileInput.addEventListener('change', updateFileUi);
    if (removeBtn instanceof HTMLElement) {
      removeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        fileInput.value = '';
        fileInput.dispatchEvent(new Event('input', { bubbles: true }));
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        updateFileUi();
      });
    }

    fileInput.setAttribute(ATTR_FILE_UI_BOUND, 'true');
    updateFileUi();
  });
};

/**
 * スパム対策: フォーム表示時刻を hidden にセット
 * @param {HTMLElement} form
 * @returns {void}
 */
const initSpamProtectionTime = (form) => {
  const timeField = form.querySelector('input[name="uds-form-time"]');
  if (timeField instanceof HTMLInputElement) {
    timeField.value = String(Math.floor(Date.now() / 1000));
  }
};

/**
 * バリデーションエラー後、監視対象の項目だけ focusout（および file / checkbox / radio の change）で再バリデーションする
 * @param {HTMLFormElement} form
 * @param {Object} [runOptions] - runFormValidation に渡す既定値（validateSelector 等）
 * @returns {void}
 */
const bindFieldBlurRevalidate = (form, runOptions = {}) => {
  if (!(form instanceof HTMLElement) || fieldBlurRevalidateBound.has(form)) return;
  fieldBlurRevalidateBound.add(form);

  const getBlurCommonOptions = () => ({
    validateSelector: runOptions.validateSelector ?? SELECTOR_VALIDATE,
    errorClass: runOptions.errorClass ?? 'is_error',
    headerSelector: runOptions.headerSelector ?? 'header',
    scrollOffset: runOptions.scrollOffset ?? 160,
    validationRoot: form,
  });

  const resolveKeysToRevalidate = (inputKey) => {
    const { validateSelector } = getBlurCommonOptions();
    const keys = new Set([inputKey]);
    const items = Array.from(form.querySelectorAll(validateSelector));
    const item = items.find(
      (el) => el.getAttribute(ATTR_INPUT) === inputKey && !isValidatorItemInactive(el)
    );
    const gk = item?.getAttribute(ATTR_ERR_GROUP);
    if (gk) {
      items.forEach((el) => {
        if (el.getAttribute(ATTR_ERR_GROUP) === gk && !isValidatorItemInactive(el)) {
          const ik = el.getAttribute(ATTR_INPUT);
          if (ik) keys.add(ik);
        }
      });
    }
    if (inputKey === 'email' || inputKey === 'email-confirm') {
      keys.add('email');
      keys.add('email-confirm');
    }
    return keys;
  };

  const syncWatchAfterPartial = (keysValidated, result) => {
    const watch = blurWatchKeysByForm.get(form);
    if (!watch) return;
    keysValidated.forEach((k) => {
      if (!result.failedKeys.has(k)) watch.delete(k);
    });
    result.failedKeys.forEach((k) => watch.add(k));
    if (watch.size === 0) blurWatchKeysByForm.delete(form);
    else blurWatchKeysByForm.set(form, watch);
  };

  const onMaybeRevalidate = (event) => {
    const t = event.target;
    if (!(t instanceof HTMLElement)) return;
    const watch = blurWatchKeysByForm.get(form);
    if (!watch || watch.size === 0) return;
    const item = t.closest(`[${ATTR_INPUT}]`);
    if (!(item instanceof HTMLElement) || !form.contains(item)) return;
    if (isValidatorItemInactive(item)) return;
    const key = item.getAttribute(ATTR_INPUT);
    if (!key || !watch.has(key)) return;

    const keysToValidate = resolveKeysToRevalidate(key);
    const result = runFormValidation({
      ...getBlurCommonOptions(),
      restrictKeys: keysToValidate,
      skipScroll: true,
    });
    syncWatchAfterPartial(keysToValidate, result);
  };

  form.addEventListener('focusout', onMaybeRevalidate);
  form.addEventListener('change', (event) => {
    const t = event.target;
    if (!(t instanceof HTMLInputElement)) return;
    if (t.type === 'file' || t.type === 'checkbox' || t.type === 'radio') {
      onMaybeRevalidate(event);
    }
  });
};

/**
 * 送信直前の blur 再検証ウォッチを解除する（フォーム分岐切替で古いキーが残るのを防ぐ）
 * @param {HTMLElement|null} form
 * @returns {void}
 */
const clearBlurWatchForForm = (form) => {
  if (form instanceof HTMLElement) blurWatchKeysByForm.delete(form);
};

/**
 * 指定ルート配下のバリデーションエラー表示を消去する
 * @param {HTMLElement|null} root
 * @param {string} [errorClass]
 * @returns {void}
 */
const clearValidationMessagesInSubtree = (root, errorClass = DEFAULT_ERROR_CLASS) => {
  if (!(root instanceof HTMLElement)) return;
  root.querySelectorAll(`[${ATTR_ERR}]`).forEach((area) => {
    if (!(area instanceof HTMLElement)) return;
    area.textContent = '';
    area.classList.remove(errorClass);
    const p = area.parentElement;
    if (p) p.classList.remove(errorClass);
  });
  root.querySelectorAll(`[${ATTR_VALIDATE}]`).forEach((el) => {
    if (el instanceof HTMLElement) el.classList.remove(errorClass);
  });
  root.querySelectorAll(`[${ATTR_ERR_GROUP_AREA}]`).forEach((area) => {
    if (area instanceof HTMLElement) area.innerHTML = '';
  });
};

// ---------------------------------------------------------------------------
// 初期化（共通）
// ---------------------------------------------------------------------------
/**
 * 初期化（送信ボタンにクリックリスナーを登録）
 * @param {{ formSelector?: string, submitBtnSelector?: string, useRecaptcha?: boolean }} [options]
 */
const init = (options = {}) => {
  const formSelector = options.formSelector ?? SELECTOR_FORM_CONTACT;
  const submitBtnSelector = options.submitBtnSelector ?? SELECTOR_FORM_SUBMIT;
  const useRecaptcha = options.useRecaptcha ?? false;
  const platform = options.platform ?? 'wordpressCf7';

  const form = document.querySelector(formSelector);
  if (!form) return;
  bindGlobalActions();
  bindCf7FormResponseEvents(form);
  bindEnterKeyControl(form);
  initFileInputUi(form);
  initSpamProtectionTime(form);
  bindFieldBlurRevalidate(form, options);

  delegate(form, 'click', {
    [ACTION_SUBMIT]: (event) => {
      event.preventDefault();
      handleFormSubmit(event, { formSelector, submitBtnSelector, useRecaptcha, platform });
    },
  });
};

export const formValidator = { init, clearBlurWatchForForm, clearValidationMessagesInSubtree };
