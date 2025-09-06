import { Outlet, Link, useLocation } from 'react-router-dom';

const AuthLayout = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className='min-h-screen flex flex-col justify-center items-center space-y-6'>

      <img
        src='https://lm-opt-bucket.s3.amazonaws.com/wordmark.png'
        alt='wordmark'
  
      />

      <div className='w-full max-w-md px-8 py-10 bg-white rounded-lg border flex flex-col space-y-6 items-center animate-fadeIn'>
        <div className='w-full max-w-sm mx-auto'>
          <Outlet />
        </div>
        <div className='text-center'>
          {isLoginPage ? (
            <div>
              <span className='text-gray-500'>Don&apos;t have an account?</span>{' '}
              <Link to='/register' className=' font-bold'>
                Register here.
              </Link>
            </div>
          ) : (
            <div>
              <span className='text-gray-500'>Already have an account?</span>{' '}
              <Link to='/login' className=' font-bold'>
                Login here.
              </Link>
            </div>
          )}
        </div>
      </div>
     
    </div>
  );
};

export default AuthLayout;
