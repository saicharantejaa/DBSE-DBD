// ============================================================
// Learning Platform — MongoDB Schemas (Mongoose)
// db/mongo-schemas.js
// ============================================================

const mongoose = require('mongoose');

// ============================================================
// course_assets
// Stores rich/flexible metadata for course media files
// (actual files live in blob storage; metadata lives here)
// ============================================================

const courseAssetSchema = new mongoose.Schema(
  {
    courseId: {
      type: Number,
      required: true,
      index: true,
      // References Postgres courses.id
    },
    moduleId: {
      type: Number,
      required: false,
      index: true,
      // References Postgres modules.id (optional for course-level resources)
    },
    type: {
      type: String,
      enum: ['video', 'pdf', 'slide', 'note', 'reference'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: false,
      default: '',
      // Public URL of the asset (CDN / blob storage / external MOOC)
    },
    tags: {
      type: [String],
      default: [],
      // e.g. ["database", "normalization", "lecture-3"]
    },
    uploadedBy: {
      type: Number,
      required: false,
      default: 1,
      // References Postgres users.id (instructor)
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Flexible field — examples:
      //   video: { durationSeconds: 1830, resolution: "1080p", codec: "h264" }
      //   pdf:   { pageCount: 24, fileSizeMb: 3.2 }
      //   slide: { slideCount: 42, software: "Google Slides" }
    },
  },
  {
    collection: 'course_assets',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

// Compound index for fetching all assets for a module
courseAssetSchema.index({ courseId: 1, moduleId: 1 });

const CourseAsset = mongoose.model('CourseAsset', courseAssetSchema);

// ============================================================
// doubt_attachments
// Optional files (screenshots, photos) attached by a student
// to provide visual context for their doubt
// ============================================================

const doubtAttachmentSchema = new mongoose.Schema(
  {
    doubtId: {
      type: Number,
      required: true,
      index: true,
      // References Postgres doubts.id
    },
    fileUrl: {
      type: String,
      required: true,
      // Public URL of the uploaded attachment
    },
    fileType: {
      type: String,
      required: true,
      // MIME type, e.g. "image/png", "image/jpeg", "application/pdf"
    },
  },
  {
    collection: 'doubt_attachments',
    timestamps: { createdAt: 'uploadedAt', updatedAt: false },
  }
);

const DoubtAttachment = mongoose.model('DoubtAttachment', doubtAttachmentSchema);

// ============================================================
// Exports
// ============================================================

module.exports = { CourseAsset, DoubtAttachment };
