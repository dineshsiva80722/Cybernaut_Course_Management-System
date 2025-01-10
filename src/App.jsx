import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import StudentList from './Components/StudentList';

const App = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newCourse, setNewCourse] = useState({ name: '', description: '' });

  const fetchCourses = async () => {
    try {
      console.log('Attempting to fetch courses...');
      const response = await axios.get('http://localhost:5000/api/courses', {
        timeout: 10000 // 10 seconds timeout
      });
      console.log('Fetched courses:', response.data);
      
      // Add extra logging for each course
      response.data.forEach(course => {
        console.log('Individual Course:', {
          _id: course._id,
          name: course.name,
          course: course.course,
          description: course.description
        });
      });
      
      setCourses(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching courses:', err);
      if (err.response) {
        setError(`Server error: ${err.response.data.message || 'Unknown server error'}`);
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError(`Error: ${err.message}`);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/courses/add', newCourse);
      setCourses([...courses, response.data.course]);
      setNewCourse({ name: '', description: '' });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      console.log('Attempting to delete course with ID:', courseId);
      const response = await axios.delete(`http://localhost:5000/api/courses/delete/${courseId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Delete response:', response.data);
      
      // Update courses state by filtering out the deleted course
      setCourses(prevCourses => prevCourses.filter(course => course._id !== courseId));
      
      setError(null);
    } catch (err) {
      console.error('Delete course error:', err);
      
      // More detailed error handling
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(`Delete failed: ${err.response.data.message || 'Unknown error'}`);
        console.error('Server error details:', err.response.data);
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server. Check your network connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Error: ${err.message}`);
      }
    }
  };

  if (loading) return (
    <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <h2>Loading courses...</h2>
    </Container>
  );

  return (
    <Container className="py-4 card">
      <h1 className="text-center card-header my-2 mb-3">Course Details</h1>
      
      {/* Add Course Form */}
      <Form style={{ width: '500px' }} onSubmit={handleAddCourse} className=" p-2 mx-auto justify-content-center mb-4">
        <Row>
          <Col md={5}>
            <Form.Control 
              type="text" 
              placeholder="Course Name" 
              name="name"
              value={newCourse.name}
              onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
              required 
            />
          </Col>
          <Col md={5}>
            <Form.Control 
              type="text" 
              placeholder="Course Description" 
              value={newCourse.description}
              onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
              required 
            />
          </Col>
          <Col md={2}>
            <Button variant="primary" type="submit" className="w-100">
              Add
            </Button>
          </Col>
        </Row>
      </Form>

      {/* Error Display */}
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {/* Course List */}
      <h2 className="mb-3">Courses</h2>
      {courses.length === 0 ? (
        <p className="text-center">No courses available</p>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {courses.map((course) => (
            <Col key={course._id} md={4} className="mb-4">
              <Card>
                <Card.Body>
                 <div className="d-flex justify-content-between">
                  {(() => {
                    console.log('Rendering Course:', {
                      _id: course._id,
                      name: course.name,
                      course: course.course,
                      description: course.description
                    });
                    return (
                      <Card.Title>
                        {course.name}
                      </Card.Title>
                    );
                  })()}
                  <Button 
                    variant="danger" 
                    onClick={() => handleDeleteCourse(course._id)}
                    className=""
                  >
                    Delete
                  </Button>
                  </div>
                  <Card.Text>{course.description}</Card.Text>
                  <Button onClick={() => navigate('/Mainpannel', { state: { course } })}>
                    view
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    
    </Container>
  );
};

export default App;