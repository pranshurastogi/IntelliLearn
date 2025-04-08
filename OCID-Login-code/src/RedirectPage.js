import React from 'react';
import { LoginCallBack } from '@opencampus/ocid-connect-js';

function loginSuccess() {
  // Redirect or perform any action after successful login.
  window.location.href = '/';
}

function loginError(error) {
  console.error('Login error:', error);
}

const RedirectPage = () => {
  return (
    <LoginCallBack 
      errorCallback={loginError} 
      successCallback={loginSuccess} 
    />
  );
};

export default RedirectPage;
