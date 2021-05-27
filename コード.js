const SHEET_NAME = 'アイキャッチ画像';
const SPREAD_SHEET = SpreadsheetApp.getActiveSpreadsheet();
function initFunction() {
  const sheet = new Sheet(SHEET_NAME);
  const header = [['画像URL', 'アイキャッチタイトル', 'アイキャッチURL']];
  sheet.setValues(header);
  const folderId = DriveApp.createFolder('アイキャッチ画像').getId();
  PropertiesService.getDocumentProperties().setProperty('folderId', folderId);
  ScriptApp.newTrigger("onOpen").forSpreadsheet(SPREAD_SHEET).onOpen().create();//起動時にonOpen関数を実行するトリガーを設置する
}
/**
 * SSにメニューを表示
 */
function onOpen() {
  
  const myMenu = [
    { name: 'アイキャッチ画像生成', functionName: 'openSidebar_' }
  ];
  SPREAD_SHEET.addMenu('自動化ツール', myMenu); //メニューを追加
}

function openSidebar_() {
  const htmlOutput = HtmlService.createTemplateFromFile('index').evaluate().setTitle('ゼロから使える/ZeroScript');
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

/**
 * スプレッドシート上の未生成アイキャッチ画像データを返す
 */
function getAlldata() {
  const [header, ...v] = new Sheet(SHEET_NAME).getDataRangeValues();
  if (!v) return [];
  const allData = v.reduce((array, x, i) => {
    if (x[2]) return array;//すでにあれば
    const row = i + 2;//sheetのIndex（starting1）
    const imageUrl = x[0];
    const title = x[1];
    return [ ...array, {row, imageUrl, title} ];
  }, []);
  console.log(allData);
  return JSON.stringify(allData);
}
/**
 * share用Urlからidに変換する
 */
function replaceUrl2id_ (url) {
  const start = url.indexOf('/d/') + 3;
  const end = url.indexOf('/view?usp=sharing');
  return url.substring(start, end);
  // return "https://drive.google.com/uc?id=" +  id;
}
function encode({row, imageUrl, title}){
  const id = replaceUrl2id_(imageUrl);
  var f = DriveApp.getFileById(id);//画像
  var b = f.getBlob();
  var imageEncode = 'data:image/jpeg;base64,' +Utilities.base64Encode(b.getBytes());
  return {row, imageEncode, title};
//  console.log(text);
}
/**
 * @param {blob}
 */
function saveEyeCatchImg2Folder(data) {
  const folderId = PropertiesService.getDocumentProperties().getProperty('folderId');
  const folder = DriveApp.getFolderById(folderId);
  const { fileName, imageType, row } = data;
  const base64 = data["base64"].replace('data:image/png;base64,', '');
  const decoded = Utilities.base64Decode(base64);
  const blob = Utilities.newBlob(decoded, imageType, fileName);
  const url = folder.createFile(blob).getUrl();
  const column = 3;
  new Sheet(SHEET_NAME).setValue(url, row, column);
  return fileName;
}


class Sheet {
  constructor(sheetName) {
    const SS = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = SS.getSheetByName(sheetName);
    if (!sheet) sheet = SS.insertSheet().setName(sheetName);
    this.sheet = sheet;
  }
  /**
   * @return {Array[]}
   */
  getDataRangeValues() {
    return this.sheet.getDataRange().getValues();
  }
  /**
   * @param {Array[]} values
   */
  setValues(values) {
    const row = 1;
    const column = 1;
    const rowNums = values.length;
    const numColumns = values[0].length;
    this.sheet.getRange(row, column, rowNums, numColumns).setValues(values);
  }

  /**
   * @param {string || number} value
   * @param {number} row
   * @param {number} column
   */
  setValue(value, row, column) {
    this.sheet.getRange(row, column).setValue(value);
  }
}