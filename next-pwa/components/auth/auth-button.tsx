import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';


export function AuthButton() {
const { userLoggedIn, logout } = useUser();
const [isLoggedIn, setIsLoggedIn] = useState(false);


    useEffect(() => {
        const checkLoggedIn = async () => {
          const loggedIn = await userLoggedIn();
          setIsLoggedIn(loggedIn);
        };
        checkLoggedIn();
      }, []);

      
  return (
    <>
      {isLoggedIn ? (
        <Button onClick={() => logout()}>
          Logout
        </Button>
      ) : (
        <>
          <Button variant="simple" as={Link} href="/login">
            Login
          </Button>
          <Button as={Link} href="/signup">
            Sign Up
          </Button>
        </>
      )}
    </>
  );
};

