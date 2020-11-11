const multer = require("multer");

const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "images");
  },
  filename: (req, file, callback) => {
    let noExtensionName = file.originalname.split(".");
    noExtensionName.pop(); //retire l'extension
    noExtensionName = noExtensionName.join("");
    const name = noExtensionName.replace(/ /g, "_"); // Remplace les espaces par _
    const extension = MIME_TYPES[file.mimetype];
    callback(null, Date.now() + name + "." + extension);
  },
});

module.exports = multer({ storage }).single("image");
