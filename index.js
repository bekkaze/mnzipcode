const fs = require('fs');
const path = require('path');

let __author__ = 'bekkaze';
let __email__ = 'bekkaze7@gmail.com';
let __package__ = 'mnzipcode';

let VALID_ZIPCODE_LENGTH = 5;

let DATA_JSON_PATH = path.join(path.dirname(path.resolve(__filename)), 'data.json');
let DATA;

try{
  let rawData = fs.readFileSync(DATA_JSON_PATH, 'utf8');
  DATA = JSON.parse(rawData);
} catch (err) {
  console.error("Error reading or parsing data file", err);
}

function matchingByZipcode(zipcode, data = DATA['zipcode']) {
  for (let item of data) {
    if (item['zipcode'] === String(zipcode)) {
      if ('sub_items' in item) {
        let filteredDict = Object.assign({}, item);
        delete filteredDict['sub_items'];
        return filteredDict;
      } else {
        return item;
      }
    }

    if ('sub_items' in item) {
      let returnData = matchingByZipcode(zipcode, item['sub_items']);
      if (returnData) {
        return returnData;
      }
    }
  }
  return null;
}

function similarTo(zipcode, data = DATA['zipcode']) {
  let similarData = [];
  for (let item of data) {
    if (String(item['zipcode']).startsWith(String(zipcode))) {
      if ('sub_items' in item) {
        let filteredDict = Object.assign({}, item);
        delete filteredDict['sub_items'];
        similarData.push(filteredDict);
      } else {
        similarData.push(item);
      }
    }

    if ('sub_items' in item) {
      let returnData = similarTo(zipcode, item['sub_items']);
      if (returnData) {
        similarData.push(...returnData);
      }
    }
  }
  return similarData;
}

function filter(filterValues = {}, data = DATA['zipcode']) {
  let filteredData = [];
  for (let item of data) {
  if (Object.keys(filterValues).every((key) => item[key] && item[key].toLowerCase() === filterValues[key].toLowerCase())) {
    let filteredItem = Object.assign({}, item);
    delete filteredItem['sub_items'];
    filteredData.push(filteredItem);
  }

  if ('sub_items' in item) {
    let returnData = filter(filterValues, item['sub_items']);
    if (returnData) {
      filteredData.push(...returnData);
    }
  }
  }
  return filteredData;
}
 

function isReal(zipcode) {
  return !!matchingByZipcode(zipcode);
}

module.exports = {
  __author__,
  __email__,
  __package__,
  VALID_ZIPCODE_LENGTH,
  DATA_JSON_PATH,
  DATA,
  matchingByZipcode,
  similarTo,
  filter,
  isReal
};
