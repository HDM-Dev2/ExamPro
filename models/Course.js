const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  courseCode: {
    type: String,
    required: true,
    trim: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  examType: {
    type: String,
    enum: ['assignment_cat_exam', 'cat_exam', 'exam_only', 'custom'],
    default: 'assignment_cat_exam'
  },
  weights: {
    assignment: { type: Number, default: 10 },
    cat: { type: Number, default: 20 },
    exam: { type: Number, default: 70 }
  },
  units: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      default: '',
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  manualStudents: [{
    studentName: {
      type: String,
      required: true,
      trim: true
    },
    admissionNumber: {
      type: String,
      default: '',
      trim: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Course', courseSchema);