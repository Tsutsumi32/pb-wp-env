/************************************************************
 * 日付変換(microCMS))
 ************************************************************/
/**
 * 受け取る日付のフォーマット変換
 * @param {string|Date} date - microCMSから受け取る日付文字列またはDateオブジェクト
 * @returns {string} YYYY.M.D形式の日付文字列
 */
export const changeDate = (date) => {
  date = new Date(date);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${year}.${month}.${day}`;
};
