import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/authContext';

function Home() {
  const { customer } = useAuth();


  if (!customer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }



  return (
    <div name="home-component" className="min-h-screen bg-gray-50">
      <Navbar />


      <main className="max-w-4xl mx-auto mt-10 px-4">
        

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">

            <header className="mb-6 border-b border-gray-100 pb-4">
              <h1 className="text-3xl font-bold text-gray-900">Welcome to ShopCart!</h1>
              <p className="text-gray-500 mt-1">Your one-stop destination for seamless shopping.</p>
            </header>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Customer Profile</h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-medium text-gray-600">Customer Name:</span>
                  <span className="text-gray-900 font-semibold">{customer?.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-medium text-gray-600">Email:</span>
                  <span className="text-gray-900 font-semibold">{customer?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Phone Number:</span>
                  <span className="text-gray-900 font-semibold">{customer?.phone}</span>
                </div>
              </div>
            </section>
          </div>
        
      </main>
    </div>
  );
}

export default Home;