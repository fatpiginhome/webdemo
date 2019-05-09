const wm = require('image-watermark');
const fs = require('fs');

wm.embedWatermark("../pdf/5812048940279895.pdf", {'text' : 'samplemark'});