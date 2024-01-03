const router = require("express").Router();
const File = require("../models/file");

router.get("/:uuid", async (req, res) => {
  try {
    const file = await File.findOne({ uuid: req.params.uuid });

    if (!file) {
      return res.status(404).json({ error: "Link has been expired." });
    }

    const { filename, size, createdAt } = file;

    // Separate download link for the file
    const downloadLink = `${process.env.APP_BASE_URL}/files/download/${file.uuid}`;

    // Send file details along with the response
    res.json({
      filename,
      size,
      createdAt,
      downloadLink,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Separate route for file download
router.get("/download/:uuid", async (req, res) => {
  try {
    const file = await File.findOne({ uuid: req.params.uuid });

    if (!file) {
      return res.status(404).json({ error: "File not found." });
    }

    const filePath = `${__dirname}/../${file.path}`;
    res.download(filePath, file.filename);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
