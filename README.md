# mnzipcode

mnzipcode is a simple library for querying Mongolian zip codes.

### Installation 
```
# npm i mnzipcode
```

# Example Usage:
```js
const mnzipcode = require('./index.js')

console.log(mnzipcode.matchingByZipcode(11000));

{
  stat: 'capital',
  mnname: 'Улаанбаатар',
  name: 'Ulaanbaatar',
  year_established: 1942,
  area: 4704.4,
  population: 1539810,
  density: 327,
  zipcode: '11000'
}


console.log(mnzipcode.filter({mnname: 'Дархан-Уул'}));

[
  {
    stat: 'province',
    mnname: 'Дархан-Уул',
    name: 'Darkhan-Uul',
    year_established: 1994,
    area: 3275,
    population: 107018,
    density: 33,
    zipcode: '45000',
    capital: 'Darkhan',
    capitalmn: 'Дархан'
  },
  { mnname: 'Дархан-Уул', zipcode: '81041' },
  { mnname: 'Дархан-Уул', zipcode: '81063' }
]

console.log(mnzipcode.isReal(11000));

true


console.log(mnzipcode.similarTo(8501));

[
  { mnname: 'Зүүнхангай', zipcode: '85010' },
  { mnname: 'Даланбулаг', zipcode: '85011' },
  { mnname: 'Хайрхан', zipcode: '85013' },
  { mnname: 'Жаргалант', zipcode: '85015' },
  { mnname: 'Баянгол', zipcode: '85017' }
]
```