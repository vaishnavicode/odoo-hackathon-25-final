import React from 'react';
import '../styles/Contact.css';

const Contact = () => {
  return (
    <div className="contact-container">
      <h1>Contact Us</h1>
      <p>Get in touch with us for any questions or support.</p>
      <div className="contact-info">
        <p><strong>Email:</strong> support@rentalmanagement.com</p>
        <p><strong>Phone:</strong> +1 (555) 123-4567</p>
        <p><strong>Address:</strong> 123 Rental Street, City, State 12345</p>
      </div>
    </div>
  );
};

export default Contact;
