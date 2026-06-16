// Script untuk menghasilkan icon placeholder menggunakan Canvas
// Jalankan: node scripts/create-icon.js
// Output: resources/icon.ico (via jimp atau sharp jika tersedia)
// Untuk saat ini, icon placeholder dibuat sebagai PNG 256x256

const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

const size = 256
const canvas = createCanvas(size, size)
const ctx = canvas.getContext('2d')

// Background
const gradient = ctx.createLinearGradient(0, 0, size, size)
gradient.addColorStop(0, '#4f5de8')
gradient.addColorStop(1, '#2dd4bf')
ctx.fillStyle = gradient
ctx.roundRect(0, 0, size, size, 48)
ctx.fill()

// Bot icon
ctx.fillStyle = 'white'
ctx.font = 'bold 120px sans-serif'
ctx.textAlign = 'center'
ctx.textBaseline = 'middle'
ctx.fillText('🤖', size / 2, size / 2)

const dir = path.join(__dirname, '..', 'resources')
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const buffer = canvas.toBuffer('image/png')
fs.writeFileSync(path.join(dir, 'icon.png'), buffer)
console.log('Icon placeholder created at resources/icon.png')
