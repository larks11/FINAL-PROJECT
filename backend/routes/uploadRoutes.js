import express from 'express';
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const filetypes = /jpe?g|png|webp/;
  const mimetypes = /image\/jpe?g|image\/png|image\/webp/;

  const extname = filetypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = mimetypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Images only!'), false);
  }
}

const upload = multer({ storage, fileFilter });

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded' });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'cellcom',
          transformation: [{ width: 800, quality: 'auto' }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    res.status(200).send({
      message: 'Image uploaded successfully',
      image: result.secure_url,
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

export default router;