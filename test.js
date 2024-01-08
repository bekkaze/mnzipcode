const mnzipcode = require('./index.js')

console.log(mnzipcode.matchingByZipcode(11000));
console.log(mnzipcode.filter({mnname: 'Дархан-Уул'}));
console.log(mnzipcode.isReal(11000));
console.log(mnzipcode.similarTo(8501));