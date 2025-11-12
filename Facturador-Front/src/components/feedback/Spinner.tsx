import React from 'react';

const Spinner = () => (
  <div className="fixed inset-0 flex justify-center items-center bg-white bg-opacity-50 z-50">
    <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-blueQ rounded-full animate-spin"></div>
  </div>
);

export default Spinner;
