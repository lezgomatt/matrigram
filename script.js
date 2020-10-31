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

function filter(canvas, matrix) {
  var width = canvas.width;
  var height = canvas.height;
  var context = canvas.getContext('2d');

  var oldPixels = context.getImageData(0, 0, width, height).data;
  var result = context.createImageData(width, height);
  var newPixels = result.data;

  // matrix is assumed to be square
  var size = matrix[0].length;
  var half = (size-1)/2;

  for(var y = 0; y < height; y++)
  for(var x = 0; x < width; x++) {
    var i1 = 4 * (width * y + x);
    var r = 0, g = 0, b = 0, a = 0;
    for(var j = 0; j < size; j++)
    for(var i = 0; i < size; i++) {
      var m = x - half + i;
      var n = y - half + j;
      if(m < 0) m = 0;
      else if(m >= width) m = width-1;
      if(n < 0) n = 0;
      else if(n >= height) n = height-1;
      var i2 = 4 * (width * n + m);
      var multiplier = matrix[i][j];
      r += multiplier * oldPixels[i2];
      g += multiplier * oldPixels[i2+1];
      b += multiplier * oldPixels[i2+2];
      a += multiplier * oldPixels[i2+3];
    }
    newPixels[i1]   = r;
    newPixels[i1+1] = g;
    newPixels[i1+2] = b;
    newPixels[i1+3] = a;
  }

  return result;
}

/****************************************
  GLOBALS                           [GB]
 ****************************************/

var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var original = null;
var empty = true;
var inputs = [];
for(var i = 0; i < 9; i++) {
  inputs[i] = document.getElementById("_"+i);
}

/****************************************
  APPLY & RESET                     [AR]
 ****************************************/

function apply() {
  if(empty) {
    alert('Please place an image first!');
    return;
  }
  var matrix = buildMatrix();
  if(matrix) {
    context.putImageData(filter(canvas, matrix), 0, 0);
  } else {
    alert('Invalid values entered. Please make sure the sum is not zero.');
  }
}

function buildMatrix() {
  var sum = 0;
  var matrix = [];
  for(var i = 0; i < 3; i++) {
    matrix[i] = [];
    for(var j = 0; j < 3; j++) {
      sum += matrix[i][j] = parseFloat(inputs[i*3+j].value);
    }
  }
  if(sum === 0 || !isFinite(sum)) {
    return;
  }
  // normalizing
  for(var i = 0; i < 3; i++)
  for(var j = 0; j < 3; j++) {
    matrix[i][j] /= sum;
  }
  return matrix;
}

function reset() {
  if(empty) {
    alert('Please place an image first!');
    return;
  }
  context.putImageData(original, 0, 0);
}


/****************************************
  DRAG & DROP                       [DD]
 ****************************************/

var conent = document.getElementById('content');
content.ondragenter = content.ondragover = stopDefault;
content.ondrop = function(event) {
  stopDefault(event);
  if(event.dataTransfer.files.length > 1) {
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

var picker = document.getElementById('picker');
picker.onclick = function() { fBrowse.click(); };

var fBrowse = document.createElement('input');
fBrowse.type = 'file';
fBrowse.accept = 'image/*';
fBrowse.onchange = function(event) {
  var file = event.target.files[0];
  loadImage(file);
}


/****************************************
  IMAGE LOADING                     [IL]
 ****************************************/

function loadImage(file) {
  if(file.type.match(/image\/(bmp|gif|jpeg|png)/)) {
    fReader.readAsDataURL(file);
  } else {
    alert('This file type is not supported.');
  }
}

var img = new Image();
var fReader = new FileReader();
fReader.onload = function (event) {
  img.src = event.target.result;
  img.onload = function() {
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    original = context.getImageData(0, 0, canvas.width, canvas.height);
    document.getElementById('dropzone').style.display = 'none';
    empty = false;
  };
};

/****************************************
  FILTER SELECTION                  [FS]
 ****************************************/

var selection = document.getElementById('selection');

selection.onchange = function() {
  if(selection.selectedIndex === selection.length - 1) {
    return;
  }
  var values = selection.options[selection.selectedIndex].value.split(",");
  inputs.forEach(function(input, i) {
   input.value = values[i];
  });
}

inputs.forEach(function(input) {
  input.onchange = function() {
    selection.selectedIndex = selection.length - 1;
  };
});

function addFilter(name, matrix) {
 var flattened = matrix.reduce(function(a, b) { return a.concat(b);} );
 selection.options.add(new Option(name, flattened.join(",")), selection.length-1);
}

/****************************************
  FILTERS                           [FT]
 ****************************************/

addFilter('Blur',
  [ [0, 1, 0] ,
    [1, 1, 1] ,
    [0, 1, 0] ]
);

addFilter('Sharpen',
  [ [-0.5, -1, -0.5] ,
    [  -1,  7,   -1] ,
    [-0.5, -1, -0.5] ]
);

addFilter('Edge Dection',
  [ [ 0, -1,  0] ,
    [-1,  5, -1] ,
    [ 0, -1,  0] ]
);

addFilter('Surprise',
  [ [0.5,  1, 0.5] ,
    [  1, -5,   1] ,
    [0.5,  1, 0.5] ]
);

selection.selectedIndex = 0;
