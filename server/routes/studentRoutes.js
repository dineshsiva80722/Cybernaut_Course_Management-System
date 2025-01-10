import express from 'express';
import Student from '../models/Student.js';
import Batch from '../models/Batch.js';
import Course from '../models/Course.js';
import Month from '../models/Month.js';
import Year from '../models/Year.js';
import mongoose from 'mongoose';

const router = express.Router();

// Function to generate collection name
const generateCollectionName = (course, year, month, batch) => {
  // Normalize and clean the input
  const cleanStr = (str) => str.toString().toLowerCase()
    .replace(/\s+/g, '')    // Remove all whitespaces
    .replace(/[^a-z0-9]/g, ''); // Remove non-alphanumeric characters

  const cleanCourse = cleanStr(course);
  const cleanYear = cleanStr(year);
  const cleanMonth = cleanStr(month);
  const cleanBatch = cleanStr(batch);

  return `${cleanCourse}_${cleanYear}_${cleanMonth}_${cleanBatch}_stu-details`;
};

// Dynamic model creation function
const createDynamicModel = (collectionName) => {
  // Check if model already exists
  if (mongoose.models[collectionName]) {
    return mongoose.models[collectionName];
  }

  const dynamicSchema = new mongoose.Schema({
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    year: {
      type: String,
      required: true
    },
    month: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Month',
      required: true
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true
    },
    additionalDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }, {
    timestamps: true,
    collection: collectionName
  });

  // Ensure unique student in the collection
  dynamicSchema.index({ student: 1 }, { unique: true });

  return mongoose.model(collectionName, dynamicSchema);
};

// Simplified students route
router.get('/students', async (req, res) => {
  try {
    const { 
      course = 'networking', 
      year = '2025', 
      month = 'January', 
      batch = 'Batch 1' 
    } = req.query;

    console.log('Received Student Query Parameters:', { course, year, month, batch });

    // Use the main Students collection with flexible querying
    const students = await Student.find({
      course: { $regex: new RegExp(course, 'i') },
      year: { $regex: new RegExp(year, 'i') },
      month: { $regex: new RegExp(month, 'i') },
      batch: { $regex: new RegExp(batch, 'i') }
    });

    console.log('Found Students:', students.length);

    if (students.length === 0) {
      return res.status(404).json({ 
        message: 'No students found matching the criteria', 
        query: { course, year, month, batch } 
      });
    }

    res.json({ 
      students: students.map(student => ({
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        college: student.college,
        department: student.department,
        contactNumber: student.contactNumber,
        fees: student.fees,
        address: student.address,
        course: student.course,
        month: student.month,
        batch: student.batch,
        year: student.year
      })),
      count: students.length 
    });
  } catch (error) {
    console.error('Error in Students Route:', error);
    res.status(500).json({ 
      message: 'Server error fetching students', 
      error: error.message 
    });
  }
});

// Simplified add student route
router.post('/students/add', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      college = '',
      department = '',
      contactNumber = '', 
      fees = 0,
      address = '',
      course = 'networking', 
      year = '2025', 
      month = 'January', 
      batch = 'Batch 1' 
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        missingFields: [
          ...(!firstName ? ['firstName'] : []),
          ...(!lastName ? ['lastName'] : []),
          ...(!email ? ['email'] : [])
        ]
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ email: email.toLowerCase() });
    if (existingStudent) {
      return res.status(409).json({ 
        message: `Student with email ${email} already exists`,
        studentId: existingStudent._id
      });
    }

    // Create new student
    const newStudent = new Student({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      college: college.trim(),
      department: department.trim(),
      contactNumber: contactNumber ? contactNumber.trim() : '',
      fees: parseFloat(fees) || 0,
      address: address.trim(),
      course: course.trim(),
      year: year.trim(),
      month: month.trim(),
      batch: batch.trim()
    });

    await newStudent.save();

    res.status(201).json({
      message: 'Student added successfully',
      student: {
        _id: newStudent._id,
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        email: newStudent.email,
        college: newStudent.college,
        department: newStudent.department,
        contactNumber: newStudent.contactNumber,
        fees: newStudent.fees,
        address: newStudent.address,
        course: newStudent.course,
        month: newStudent.month,
        batch: newStudent.batch,
        year: newStudent.year
      }
    });
  } catch (error) {
    console.error('Error Adding Student:', error);
    res.status(500).json({ 
      message: 'Server error adding student', 
      error: error.message 
    });
  }
});

// Delete student route
router.delete('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the student
    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({ 
        message: 'Student not found',
        studentId: id
      });
    }

    res.status(200).json({
      message: 'Student deleted successfully',
      student: {
        _id: deletedStudent._id,
        firstName: deletedStudent.firstName,
        email: deletedStudent.email
      }
    });
  } catch (error) {
    console.error('Error Deleting Student:', error);
    res.status(500).json({ 
      message: 'Server error deleting student', 
      error: error.message 
    });
  }
});

// Add student to dynamic collection
router.post('/students/add-to-dynamic-collection', async (req, res) => {
  try {
    const { 
      studentId, 
      course, 
      year, 
      month, 
      batch,
      additionalDetails = {} 
    } = req.body;

    // Validate input
    if (!studentId || !course || !year || !month || !batch) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        requiredFields: ['studentId', 'course', 'year', 'month', 'batch']
      });
    }

    // Find references with more flexible matching
    const courseRef = await Course.findOne({ 
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(course) ? course : null },
        { name: course },
        { course: course }
      ]
    });

    const monthRef = await Month.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(month) ? month : null },
        { name: month }
      ]
    });

    const batchRef = await Batch.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(batch) ? batch : null },
        { name: batch }
      ]
    });

    const studentRef = await Student.findById(studentId);

    // Validate references
    if (!courseRef || !monthRef || !batchRef || !studentRef) {
      return res.status(404).json({ 
        message: 'One or more references not found',
        details: {
          courseFound: !!courseRef,
          monthFound: !!monthRef,
          batchFound: !!batchRef,
          studentFound: !!studentRef
        }
      });
    }

    // Generate dynamic collection name
    const collectionName = generateCollectionName(
      courseRef.name, 
      year, 
      monthRef.name, 
      batchRef.name
    );

    // Create or get dynamic model
    const DynamicModel = createDynamicModel(collectionName);

    // Check if student already exists in this specific collection
    const existingEntry = await DynamicModel.findOne({ 
      student: studentRef._id,
      course: courseRef._id,
      year,
      month: monthRef._id,
      batch: batchRef._id
    });

    if (existingEntry) {
      console.warn('Student already exists in this specific collection');
      return res.status(400).json({ 
        message: 'Student already exists in this specific collection',
        existingEntry 
      });
    }

    // Create new entry in dynamic collection with full details
    const newEntry = new DynamicModel({
      student: studentRef._id,
      course: courseRef._id,
      year,
      month: monthRef._id,
      batch: batchRef._id,
      additionalDetails: {
        ...additionalDetails,
        uniqueIdentifier: `${studentRef._id}-${courseRef._id}-${year}-${monthRef._id}-${batchRef._id}`
      }
    });

    await newEntry.save();

    console.log('Successfully added student to dynamic collection', {
      studentName: `${studentRef.firstName} ${studentRef.lastName}`,
      course: courseRef.name,
      year,
      month: monthRef.name,
      batch: batchRef.name
    });

    res.status(201).json({
      message: 'Student added to dynamic collection successfully',
      collectionName,
      entry: {
        studentName: `${studentRef.firstName} ${studentRef.lastName}`,
        course: courseRef.name,
        year,
        month: monthRef.name,
        batch: batchRef.name
      }
    });
  } catch (error) {
    console.error('Error adding student to dynamic collection:', error);
    res.status(500).json({ 
      message: 'Error adding student to dynamic collection', 
      error: error.message 
    });
  }
});

// Get students for a specific batch
router.get('/batches/:batchId/students', async (req, res) => {
  try {
    const { batchId } = req.params;

    // Validate batchId
    if (!batchId) {
      return res.status(400).json({ message: 'Batch ID is required' });
    }

    // Find students for the batch with populated batch details
    const students = await Student.find({ batch: batchId })
      .populate({
        path: 'batch',
        populate: [
          { path: 'month', select: 'name year' }
        ]
      });

    res.json(students);
  } catch (err) {
    console.error('Error in /api/batches/:batchId/students route:', err);
    res.status(500).json({ 
      message: 'Error fetching students', 
      error: err.message 
    });
  }
});

// Check if student with email exists
router.get('/students/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const existingStudent = await Student.findOne({ email: email.toString().toLowerCase().trim() });
    
    res.json({ exists: !!existingStudent });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ message: 'Error checking email', error: error.message });
  }
});

// Update student by email
router.put('/students/update-by-email', async (req, res) => {
  try {
    const { email, ...updateData } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required for update' });
    }

    const updatedStudent = await Student.findOneAndUpdate(
      { email: email.toLowerCase().trim() }, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ 
      message: 'Student updated successfully', 
      student: updatedStudent 
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ 
      message: 'Error updating student', 
      error: error.message 
    });
  }
});

// Retrieve students from dynamic collection
router.get('/students', async (req, res) => {
  try {
    const { 
      course, 
      year, 
      month, 
      batch 
    } = req.query;

    console.log('Received Dynamic Collection Query:', {
      course,
      year,
      month,
      batch
    });

    // Validate input
    if (!course || !year || !month || !batch) {
      return res.status(400).json({ 
        message: 'Missing required query parameters',
        requiredParams: ['course', 'year', 'month', 'batch']
      });
    }

    // Find course reference
    const courseRef = await Course.findOne({ 
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(course) ? course : null },
        { name: course },
        { course: course }
      ]
    });

    if (!courseRef) {
      console.error('Course not found:', {
        searchTerm: course,
        availableCourses: await Course.find({}, 'name course')
      });
      return res.status(404).json({ 
        message: 'Course not found', 
        searchedValue: course,
        availableCourses: await Course.find({}, 'name course')
      });
    }

    // Find year reference
    const yearRef = await Year.findOne({ 
      $or: [
        { year: year },
        { name: year }
      ],
      course: courseRef._id
    });

    if (!yearRef) {
      console.error('Year not found:', {
        searchTerm: year,
        courseId: courseRef._id,
        availableYears: await Year.find({ course: courseRef._id }, 'year')
      });
      return res.status(404).json({ 
        message: 'Year not found', 
        searchedValue: year,
        courseId: courseRef._id,
        availableYears: await Year.find({ course: courseRef._id }, 'year')
      });
    }

    // Find month reference
    const monthRef = await Month.findOne({
      name: month,
      course: courseRef._id,
      year: yearRef._id
    });

    if (!monthRef) {
      console.error('Month not found:', {
        name: month,
        courseId: courseRef._id,
        yearId: yearRef._id
      });
      
      // Log available months for debugging
      const availableMonths = await Month.find({
        course: courseRef._id,
        year: yearRef._id
      }).populate('course', 'name').populate('year', 'year');

      console.error('Available Months:', availableMonths.map(m => ({
        name: m.name,
        course: m.course?.name,
        year: m.year?.year
      })));

      return res.status(404).json({ 
        message: 'Month not found', 
        searchedValue: month,
        courseId: courseRef._id,
        yearId: yearRef._id,
        availableMonths: availableMonths.map(m => ({
          name: m.name,
          course: m.course?.name,
          year: m.year?.year
        }))
      });
    }

    // Find batch reference
    const batchRef = await Batch.findOne({
      name: batch,
      course: courseRef._id,
      year: year,
      month: monthRef._id
    });

    if (!batchRef) {
      console.error('Batch not found:', {
        name: batch,
        courseId: courseRef._id,
        year,
        monthId: monthRef._id
      });
      return res.status(404).json({ 
        message: 'Batch not found', 
        searchedValue: batch,
        courseId: courseRef._id,
        year,
        monthId: monthRef._id
      });
    }

    // Generate dynamic collection name
    const collectionName = generateCollectionName(
      courseRef.name, 
      year, 
      monthRef.name, 
      batchRef.name
    );

    console.log('Generated Collection Name:', collectionName);

    // Create or get dynamic model
    const DynamicModel = createDynamicModel(collectionName);

    // Fetch students from the dynamic collection and populate student details
    const studentsInCollection = await DynamicModel.find({
      course: courseRef._id,
      year,
      month: monthRef._id,
      batch: batchRef._id
    }).populate({
      path: 'student',
      select: 'firstName lastName email contactNumber' // Select specific fields
    });

    console.log('Students in Collection:', {
      count: studentsInCollection.length,
      details: studentsInCollection.map(entry => ({
        studentId: entry.student._id,
        firstName: entry.student.firstName,
        lastName: entry.student.lastName
      }))
    });

    // Transform the results to include full student details
    const students = studentsInCollection.map(entry => ({
      studentId: entry.student._id,
      name: `${entry.student.firstName} ${entry.student.lastName}`,
      email: entry.student.email,
      course: courseRef.name,
      batch: batchRef.name,
      year: entry.year,
      month: monthRef.name
    }));

    console.log('Transformed Students:', students);

    res.status(200).json({
      message: 'Students retrieved successfully',
      students,
      collectionName
    });
  } catch (error) {
    console.error('Detailed Error in Dynamic Collection Route:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Send a detailed error response
    res.status(500).json({ 
      message: 'Error retrieving students from dynamic collection', 
      error: {
        message: error.message,
        name: error.name,
        // Only include stack trace in development
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    });
  }
});

// Retrieve students for a specific course, year, batch, and month
router.get('/students/list', async (req, res) => {
  try {
    const { 
      course, 
      year, 
      month, 
      batch 
    } = req.query;

    console.log('Received Student List Query:', {
      course,
      year,
      month,
      batch
    });

    // Validate input
    if (!course || !year || !month || !batch) {
      return res.status(400).json({ 
        message: 'Missing required query parameters',
        requiredParams: ['course', 'year', 'month', 'batch']
      });
    }

    // Find course reference
    const courseRef = await Course.findOne({ 
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(course) ? course : null },
        { name: course },
        { course: course }
      ]
    });

    if (!courseRef) {
      console.error('Course not found:', {
        searchTerm: course,
        availableCourses: await Course.find({}, 'name course')
      });
      return res.status(404).json({ 
        message: 'Course not found', 
        searchedValue: course,
        availableCourses: await Course.find({}, 'name course')
      });
    }

    // Find year reference
    const yearRef = await Year.findOne({ 
      $or: [
        { year: year },
        { name: year }
      ],
      course: courseRef._id
    });

    if (!yearRef) {
      console.error('Year not found:', {
        searchTerm: year,
        courseId: courseRef._id,
        availableYears: await Year.find({ course: courseRef._id }, 'year')
      });
      return res.status(404).json({ 
        message: 'Year not found', 
        searchedValue: year,
        courseId: courseRef._id,
        availableYears: await Year.find({ course: courseRef._id }, 'year')
      });
    }

    // Find month reference
    const monthRef = await Month.findOne({
      name: month,
      course: courseRef._id,
      year: yearRef._id
    });

    if (!monthRef) {
      console.error('Month not found:', {
        name: month,
        courseId: courseRef._id,
        yearId: yearRef._id
      });
      
      // Log available months for debugging
      const availableMonths = await Month.find({
        course: courseRef._id,
        year: yearRef._id
      }).populate('course', 'name').populate('year', 'year');

      console.error('Available Months:', availableMonths.map(m => ({
        name: m.name,
        course: m.course?.name,
        year: m.year?.year
      })));

      return res.status(404).json({ 
        message: 'Month not found', 
        searchedValue: month,
        courseId: courseRef._id,
        yearId: yearRef._id,
        availableMonths: availableMonths.map(m => ({
          name: m.name,
          course: m.course?.name,
          year: m.year?.year
        }))
      });
    }

    // Find batch reference
    const batchRef = await Batch.findOne({
      name: batch,
      course: courseRef._id,
      year: year,
      month: monthRef._id
    });

    if (!batchRef) {
      console.error('Batch not found:', {
        name: batch,
        courseId: courseRef._id,
        year,
        monthId: monthRef._id
      });
      return res.status(404).json({ 
        message: 'Batch not found', 
        searchedValue: batch,
        courseId: courseRef._id,
        year,
        monthId: monthRef._id
      });
    }

    // Generate dynamic collection name
    const collectionName = generateCollectionName(
      courseRef.name, 
      year, 
      monthRef.name, 
      batchRef.name
    );

    console.log('Generated Collection Name:', collectionName);

    // Create or get dynamic model
    const DynamicModel = createDynamicModel(collectionName);

    // Fetch students from the dynamic collection and populate student details
    const studentsInCollection = await DynamicModel.find({
      course: courseRef._id,
      year,
      month: monthRef._id,
      batch: batchRef._id
    }).populate('student');

    console.log('Students in Collection:', {
      count: studentsInCollection.length,
      details: studentsInCollection.map(entry => ({
        studentId: entry.student._id,
        firstName: entry.student.firstName,
        lastName: entry.student.lastName
      }))
    });

    // Transform the results to include full student details
    const students = studentsInCollection.map(entry => ({
      ...entry.student.toObject(),
      dynamicCollectionId: entry._id,
      course: courseRef.name,
      batch: batchRef.name,
      year: entry.year,
      month: monthRef.name
    }));

    console.log('Transformed Students:', students);

    res.status(200).json({
      message: 'Students retrieved successfully',
      students,
      collectionName
    });
  } catch (error) {
    console.error('Detailed Error in Student List Route:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Send a detailed error response
    res.status(500).json({ 
      message: 'Error retrieving students', 
      error: {
        message: error.message,
        name: error.name,
        // Only include stack trace in development
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    });
  }
});

// Debugging route to inspect references
router.get('/debug-references', async (req, res) => {
  try {
    const { course, year, month, batch } = req.query;

    console.log('Debug References Input:', { course, year, month, batch });

    // Find ALL courses to help with debugging
    const allCourses = await Course.find({});
    console.log('All Available Courses:', allCourses.map(c => ({
      id: c._id,
      name: c.name,
      course: c.course
    })));

    // Find course reference with more flexible matching
    const courseRef = await Course.findOne({ 
      $or: [
        { name: course },
        { course: course },
        { name: { $regex: new RegExp(course, 'i') } },
        { course: { $regex: new RegExp(course, 'i') } }
      ]
    });

    if (!courseRef) {
      return res.status(404).json({ 
        message: 'Course not found',
        searchedValue: course,
        availableCourses: allCourses.map(c => ({
          name: c.name,
          course: c.course,
          id: c._id
        }))
      });
    }

    console.log('Found Course:', {
      id: courseRef._id,
      name: courseRef.name,
      course: courseRef.course
    });

    // Find ALL years for this course
    const allYearsForCourse = await Year.find({ course: courseRef._id });
    console.log('All Years for Course:', allYearsForCourse.map(y => ({
      id: y._id,
      year: y.year
    })));

    // Find year reference
    const yearRef = await Year.findOne({ 
      $or: [
        { year: year },
        { name: year }
      ],
      course: courseRef._id
    });

    if (!yearRef) {
      return res.status(404).json({ 
        message: 'Year not found',
        searchedValue: year,
        courseId: courseRef._id,
        availableYears: allYearsForCourse.map(y => ({
          id: y._id,
          year: y.year
        }))
      });
    }

    console.log('Found Year:', {
      id: yearRef._id,
      year: yearRef.year
    });

    // Find ALL months for this course and year
    const allMonthsForCourseYear = await Month.find({
      course: courseRef._id,
      year: yearRef._id
    });
    console.log('All Months for Course and Year:', allMonthsForCourseYear.map(m => ({
      id: m._id,
      name: m.name
    })));

    // Find month reference
    const monthRef = await Month.findOne({
      name: month,
      course: courseRef._id,
      year: yearRef._id
    });

    if (!monthRef) {
      return res.status(404).json({ 
        message: 'Month not found',
        searchedValue: month,
        courseId: courseRef._id,
        yearId: yearRef._id,
        availableMonths: allMonthsForCourseYear.map(m => ({
          id: m._id,
          name: m.name
        }))
      });
    }

    console.log('Found Month:', {
      id: monthRef._id,
      name: monthRef.name
    });

    // Find ALL batches for this course, year, and month
    const allBatchesForCourseYearMonth = await Batch.find({
      course: courseRef._id,
      year: yearRef._id,
      month: monthRef._id
    });
    console.log('All Batches for Course, Year, and Month:', allBatchesForCourseYearMonth.map(b => ({
      id: b._id,
      name: b.name
    })));

    // Find batch reference
    const batchRef = await Batch.findOne({
      name: batch,
      course: courseRef._id,
      year: yearRef._id,
      month: monthRef._id
    });

    if (!batchRef) {
      return res.status(404).json({ 
        message: 'Batch not found',
        searchedValue: batch,
        courseId: courseRef._id,
        yearId: yearRef._id,
        monthId: monthRef._id,
        availableBatches: allBatchesForCourseYearMonth.map(b => ({
          id: b._id,
          name: b.name
        }))
      });
    }

    console.log('Found Batch:', {
      id: batchRef._id,
      name: batchRef.name
    });

    // If all references are found, return them
    res.json({
      course: {
        id: courseRef._id,
        name: courseRef.name,
        course: courseRef.course
      },
      year: {
        id: yearRef._id,
        year: yearRef.year
      },
      month: {
        id: monthRef._id,
        name: monthRef.name
      },
      batch: {
        id: batchRef._id,
        name: batchRef.name
      }
    });
  } catch (error) {
    console.error('Debug References Error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

export default router;
