import sendRequest from "./api";
import { login } from "./auth";


export async function createUser(name, email, password) {
    const response = await sendRequest('/user/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      }, false);

      if (response) {
        await login(email, password);
      }

      return response;
}


export async function getCurrentUser() {
  return await sendRequest('/user/');
}


export async function updateUser(name) {
  return await sendRequest(`/user/?name=${encodeURIComponent(name)}`, {
    method: 'PATCH',
  });
}


export async function requestUserVerification() {
  return await sendRequest('/user/request-verification', {
    method: 'POST',
  });
}


export async function verifyUser(code) {
  return await sendRequest(`/user/verify?code=${encodeURIComponent(code)}`, {
    method: 'POST',
  });
}


export async function requestPasswordReset() {
  return await sendRequest('/user/request-password-reset', {
    method: 'POST',
  });
}


export async function resetPassword(code, newPassword) {
  return await sendRequest(
    `/user/reset-password?code=${encodeURIComponent(code)}&new_password=${encodeURIComponent(newPassword)}`,
    {
      method: 'POST',
    }
  );
}


export async function deleteUser() {
  return await sendRequest('/user/', { method: 'DELETE' });
}