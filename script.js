/****************************************
  M A T R I G R A M

  TABLE OF CONTENTS:
    Globals ....................... [GB]
    Apply & Reset ................. [AR]
    Drag & Drop ................... [DD]
    File Picker ................... [FP]
    Image Loading ................. [IL]
    Filter Selection  ............. [FS]
    Filters ....................... [FT]

 ****************************************/

function runFilter(canvas, matrix) {
  var width = canvas.width;
  var height = canvas.height;
  var context = canvas.getContext('2d');

  var oldPixels = context.getImageData(0, 0, width, height).data;
  var result = context.createImageData(width, height);
  var newPixels = result.data;

  // matrix is assumed to be square
  var size = matrix[0].length;
  var half = (size - 1) / 2;

  for (var baseY = 0; baseY < height; baseY++) {
    for (var baseX = 0; baseX < width; baseX++) {
      var i = 4 * (width * baseY + baseX);
      var r = 0, g = 0, b = 0, a = 0;

      for (var col = 0; col < size; col++) {
        for (var row = 0; row < size; row++) {
          var x = clamp(baseX - half + row, 0, width - 1);
          var y = clamp(baseY - half + col, 0, height - 1);

          var j = 4 * (width * y + x);
          var multiplier = matrix[row][col];
          r += multiplier * oldPixels[j];
          g += multiplier * oldPixels[j + 1];
          b += multiplier * oldPixels[j + 2];
          a += multiplier * oldPixels[j + 3];
        }
      }

      newPixels[i] = r;
      newPixels[i + 1] = g;
      newPixels[i + 2] = b;
      newPixels[i + 3] = a;
    }
  }

  return result;
}

function clamp(val, min, max) {
  if (val < min) {
    return min;
  }

  if (val > max) {
    return max;
  }

  return val;
}

/****************************************
  GLOBALS                           [GB]
 ****************************************/

var canvas = document.getElementById('preview-canvas');
var context = canvas.getContext('2d');
var originalImage = null;

var inputs = [];
for (var i = 0; i < 9; i++) {
  let r = Math.floor(i / 3) + 1;
  let c = i % 3 + 1;
  inputs[i] = document.getElementById(`r${r}c${c}`);
}

/****************************************
  APPLY & RESET                     [AR]
 ****************************************/

function applyFilter() {
  if (originalImage == null) {
    alert('Please place an image first!');
    return;
  }

  var matrix = buildMatrix();
  if (matrix == null) {
    alert('Invalid values entered. Please make sure the sum is not zero.');
  }

  context.putImageData(runFilter(canvas, matrix), 0, 0);
}

function buildMatrix() {
  var matrix = [];
  var sum = 0;

  for (var i = 0; i < 3; i++) {
    matrix[i] = [];
    for (var j = 0; j < 3; j++) {
      matrix[i][j] = parseFloat(inputs[i * 3 + j].value);
      sum += matrix[i][j];
    }
  }

  if (sum === 0 || !isFinite(sum)) {
    return null;
  }

  // normalize
  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      matrix[i][j] /= sum;
    }
  }

  return matrix;
}

function resetImage() {
  if (originalImage == null) {
    return;
  }

  context.putImageData(originalImage, 0, 0);
}

/****************************************
  DRAG & DROP                       [DD]
 ****************************************/

var main = document.querySelector('.main');
main.ondragenter = main.ondragover = stopDefault;
main.ondrop = function (event) {
  stopDefault(event);
  if (event.dataTransfer.files.length > 1) {
    alert('One file at a time please!');
    return;
  }

  var file = event.dataTransfer.files[0];
  loadImage(file);
};

function stopDefault(event) {
  event.stopPropagation();
  event.preventDefault();
}

/****************************************
  FILE PICKER                       [FP]
 ****************************************/

var picker = document.getElementById('image-picker');
picker.onclick = function () { fBrowse.click(); };

var fBrowse = document.createElement('input');
fBrowse.type = 'file';
fBrowse.accept = 'image/*';
fBrowse.onchange = function (event) {
  var file = event.target.files[0];
  loadImage(file);
}

/****************************************
  IMAGE LOADING                     [IL]
 ****************************************/

function loadImage(file) {
  if (file.type.match(/image\/(bmp|gif|jpeg|png)/)) {
    fReader.readAsDataURL(file);
  } else {
    alert('This file type is not supported.');
  }
}

var fReader = new FileReader();
fReader.onload = function (event) {
  var img = new Image();
  img.src = event.target.result;
  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    originalImage = context.getImageData(0, 0, canvas.width, canvas.height);
    document.getElementById('dropzone').style.display = 'none';
    canvas.style.display = '';
  };
};

/****************************************
  FILTER SELECTION                  [FS]
 ****************************************/

var selection = document.getElementById('selection');
selection.onchange = function () {
  if (selection.selectedIndex === selection.length - 1) {
    return;
  }

  var values = JSON.parse(selection.options[selection.selectedIndex].value);
  inputs.forEach(function (input, i) { input.value = values[i]; });
};

inputs.forEach(function (input) {
  input.onchange = function () { selection.selectedIndex = selection.length - 1; };
});

function addFilter(name, matrix) {
  var flattened = matrix.reduce(function (a, b) { return a.concat(b); });
  selection.options.add(new Option(name, JSON.stringify(flattened)), selection.length - 1);
}

/****************************************
  FILTERS                           [FT]
 ****************************************/

addFilter('Blur', [
  [0, 1, 0],
  [1, 1, 1],
  [0, 1, 0]
]);

addFilter('Sharpen', [
  [-0.5, -1, -0.5],
  [-1, 7, -1],
  [-0.5, -1, -0.5]
]);

addFilter('Edge Dection', [
  [0, -1, 0],
  [-1, 5, -1],
  [0, -1, 0]
]);

addFilter('Surprise', [
  [0.5, 1, 0.5],
  [1, -5, 1],
  [0.5, 1, 0.5]
]);

selection.selectedIndex = 0;
