import React from 'react';
import { useOCAuth } from '@opencampus/ocid-connect-js';

const LoginButton = () => {
  const { ocAuth } = useOCAuth();

  const handleLogin = async () => {
    try {
      await ocAuth.signInWithRedirect({ state: 'opencampus' });
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return <button onClick={handleLogin}>Login with OCID</button>;
};

export default LoginButton;
