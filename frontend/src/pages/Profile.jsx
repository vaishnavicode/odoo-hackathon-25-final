import React from 'react';
import { useAuth } from '../App.jsx';
import '../styles/Profile.css';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="profile-container">
      <h1>My Profile</h1>
      {user && (
        <div className="profile-info">
          <p><strong>Name:</strong> {user.user_name}</p>
          <p><strong>Email:</strong> {user.user_email}</p>
        </div>
      )}
    </div>
  );
};

export default Profile;
