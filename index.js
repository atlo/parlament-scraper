const fetch = require('node-fetch')
const cheerio = require('cheerio')
const slugify = require('slugify')
const fs = require('fs')
const request = require('request')

fetch('http://www.parlament.hu/aktiv-kepviseloi-nevsor')
  .then(response => response.text())
  .then(html => {
    const $ = cheerio.load(html)
    const images = []

    $('.table tr').each(function (index, element) {
      const name = $(this).find('td:nth-of-type(2)').text()
      const url = $(this).find('td:nth-of-type(2) a').attr('href')
      const party = $(this).find('td:last-of-type').text()
      const imageName = slugify(`${party}_${name}`, {replacement: '_', lower: true, remove: /[.]/g})

      images.push({url, name: imageName})
    })

    return images
  })
  .then(images => Promise.all(images.map(getImageUrl)))
  .then(images => Promise.all(images.map(download)))
  .then(console.log)
  .catch(console.log)

function getImageUrl (image) {
  console.log(image.url)
  return fetch(image.url)
    .then(res => res.text())
    .then(html => {
      const $ = cheerio.load(html)
      const imageUrl = $('.kepviselo-foto').attr('src')

      return {url: imageUrl, name: image.name}
    })
    .catch(error => {
      console.log(image)
      console.log(error.message)
    })
}

function download (image) {
  return new Promise (function (resolve, reject) {
    request.head(image.url, function (err, res, body) {
      request(image.url)
        .pipe(fs.createWriteStream(`${image.name}.jpg`))
        .on('close', resolve)
        .on('error', reject)
    })
  })
}