// Some JavaScript to load the image and show the form. There is no actual backend functionality. This is just the UI
const form = document.querySelector('#img-form');
const imgInput = document.querySelector('#input-img');
const imgPreview = document.querySelector('#img-preview');
const outPutPath = document.querySelector('#output-path');
const filename = document.querySelector('#filename');
const heightInput = document.querySelector('#height');
const widthInput = document.querySelector('#width');

function loadImage(e) {
  const file = e.target.files[0];

  if (!isFileImage(file)) {
    alertError('Please select an image file');
    return;
  }

  // Get original dimensions
  const image = new Image();
  image.src = URL.createObjectURL(file);
  imgPreview.src = image.src;
  imgPreview.width = 100;
  image.onload = function () {
    widthInput.value = this.width;
    heightInput.value = this.height;
  }

  form.style.display = 'block';
  filename.innerHTML = file.name;
  outPutPath.innerHTML = path.join(os.homedir(), 'image-resizer')
}

function sendImage(e) {
  e.preventDefault()

  const width = widthInput.value;
  const height = heightInput.value;
  const imgPath = imgInput.files[0].path;

  if (!imgInput.files[0]) {
    alertError('Please upload an image')
    return
  }

  if (width === '' || height === '') {
    alertError('Please fill in a height and width')
    return
  }

  // Send to main using ipcRenderer
  ipcRenderer.send('image:resize', {
    imgPath,
    width,
    height
  })
}

// Catch the image done event
ipcRenderer.on('image:done', (e) => {
  alertSuccess(`Image resized to ${widthInput.value} x ${heightInput.value}`)
})

function isFileImage(file) {
  const acceptedImageTypes = ['image/gif', 'image/jpeg', 'image/png'];
  return file && acceptedImageTypes.includes(file['type'])
}

function alertError(message) {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: { background: 'red', color: 'white', textAlign: 'center' }
  })
}


function alertSuccess(message) {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: { background: 'green', color: 'white', textAlign: 'center' }
  })
}

imgInput.addEventListener('change', loadImage);
form.addEventListener('submit', sendImage)