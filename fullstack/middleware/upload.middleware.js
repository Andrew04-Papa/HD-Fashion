import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/"))
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`)
  },
})

// Check file type
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|webp/
  const mimetype = filetypes.test(file.mimetype)
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

  if (mimetype && extname) {
    return cb(null, true)
  }
  cb(new Error("Only image files are allowed!"))
}

// Initialize upload
export const upload = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB
  fileFilter,
})

