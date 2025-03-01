"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  getCurrentUser,
  updateUser as updateUserRequest,
  requestUserVerification as requestUserVerificationRequest,
  verifyUser as verifyUserRequest,
  requestPasswordReset as requestPasswordResetRequest,
  resetPassword as resetPasswordRequest,
  deleteUser as deleteUserRequest
} from '../api/user';
import { userLoggedIn as userLoggedInRequest, logout as logoutRequest, login as loginRequest } from '../api/auth';
import { createUser as createUserRequest } from '../api/user';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const userLoggedIn = userLoggedInRequest;
  const login = loginRequest;

  const refreshUser = async () => {
    // Clearing user state before refreshing:
    setUser(null);

    // If the user is not logged in, we have nothing to refresh:
    if (!(await userLoggedIn())) return;

    // Obtaining up-to-date data for the user:
    const response = await getCurrentUser();
    if (response?.id) setUser(response);
    return response;
  };

  const logout = () => {
    setUser(null);
    logoutRequest();
  };

  const createUser = async (name, email, password) => {
    let result = await createUserRequest(name, email, password);
    if (result) {
      await refreshUser();
    }
    return result;
  };

  const updateUser = async (name) => {
    const updated_user = await updateUserRequest(name);
    if (updated_user && updated_user.id) {
        setUser(updated_user);
      }
      return updated_user;
  };


  const requestUserVerification = async () => {
    await requestUserVerificationRequest();
  };

 
  const verifyUser = async (code) => {
    const verified_user = await verifyUserRequest(code);
    if (verified_user && verified_user.id) {
      setUser(verified_user);
    }
    return verified_user;
  };


  const requestPasswordReset = async () => {
    await requestPasswordResetRequest();
  };


  const resetPassword = async (code, newPassword) => {
      await resetPasswordRequest(code, newPassword);
  };

  
  const deleteUser = async () => {
    await deleteUserRequest();
    setUser(null);
  };

  // On initial mount, attempting to load user data if logged in:
  useEffect(() => {
    refreshUser();
  }, []);

  const value = {
    user,
    userLoggedIn,
    refreshUser,
    login,
    logout,
    createUser,
    updateUser,
    requestUserVerification,
    verifyUser,
    requestPasswordReset,
    resetPassword,
    deleteUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;


export const useUser = () => {
  return useContext(UserContext);
};
