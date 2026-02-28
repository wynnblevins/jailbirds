const multer = require('multer');

const storage = multer.diskStorage({
  filename: (req: any, file: any, cb: any) => {
    cb(null, file.originalname)
  }
});

const upload = multer({storage: storage});

module.exports = upload;