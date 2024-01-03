const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const File = require("../models/file");
const { v4: uuidv4 } = require("uuid");

let storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

let upload = multer({
  storage: storage,
  limits: {
    fileSize: 1000000 * 100,
  },
}).single("myFile");

router.post("/", (req, res) => {
  //store file
  upload(req, res, async (err) => {
    //validate request
    if (!req.file) {
      console.log("No file received");
      return res.json({ error: "All fields are required" });
    }
    if (err) {
      console.log(err);
      return res.status(500).send({ error: err.message });
    }
    //store in DB
    const file = new File({
      filename: req.file.filename,
      uuid: uuidv4(),
      path: req.file.path,
      size: req.file.size,
    });
    const response = await file.save();
    return res.json({
      file: `http://localhost:3000/files/${response.uuid}`,
    });
  });

  //send response link
});

module.exports = router;
