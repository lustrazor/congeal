'use client'
import React from 'react'
import Header from '@/components/Header'

export default function DemoPage() {
  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="relative">
            <div className="absolute inset-0 bg-[url('/images/dropshadow2-light.png')] dark:bg-[url('/images/dropshadow2-dark.png')] 
              bg-top bg-repeat-x pointer-events-none" 
            />
            <div className="relative w-full max-w-4xl mx-auto p-6 space-y-8">
              
              {/* Basic Container Example */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Basic Container</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  This is a basic container with standard padding and rounded corners.
                </p>
                <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm text-gray-900 dark:text-gray-100">
                  {`<div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">`}
                </pre>
              </div>

              {/* Form Elements */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Form Elements</h2>
                <div className="space-y-4">
                  {/* Text Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Text Input
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 
                        bg-white dark:bg-gray-900
                        border border-gray-300 dark:border-gray-700 
                        text-gray-900 dark:text-gray-100
                        placeholder-gray-500 dark:placeholder-gray-400
                        rounded-md 
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500"
                      placeholder="Enter text..."
                    />
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Toggle Switch</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Example toggle with label
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`
                        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full 
                        border-2 border-transparent transition-colors duration-200 ease-in-out 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        dark:focus:ring-offset-gray-800
                        bg-gray-200 dark:bg-gray-700
                      `}
                    >
                      <span className={`
                        pointer-events-none inline-block h-5 w-5 transform rounded-full 
                        bg-white dark:bg-gray-200 shadow ring-0 
                        transition duration-200 ease-in-out translate-x-0
                      `} />
                    </button>
                  </div>

                  {/* Button Styles */}
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 
                      bg-blue-500 hover:bg-blue-600 
                      text-white 
                      rounded-md 
                      transition-colors duration-200"
                    >
                      Primary Button
                    </button>
                    <button className="w-full px-4 py-2 
                      bg-gray-100 hover:bg-gray-200 
                      dark:bg-gray-700 dark:hover:bg-gray-600 
                      text-gray-700 dark:text-gray-300 
                      rounded-md 
                      transition-colors duration-200"
                    >
                      Secondary Button
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Layout Example */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Grid Layout</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-gray-900 dark:text-gray-100">Column 1</div>
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-gray-900 dark:text-gray-100">Column 2</div>
                </div>
              </div>

              {/* Card with Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Card with Actions</h2>
                <div className="group relative bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Card Title</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Card description or content</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Code Structure */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Page Structure</h2>
                <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto dark:text-gray-100">
{`export default function Page() {
  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="relative">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-[url('/images/dropshadow2-light.png')] 
              dark:bg-[url('/images/dropshadow2-dark.png')] 
              bg-top bg-repeat-x pointer-events-none" 
            />
            {/* Content Container */}
            <div className="relative w-full max-w-4xl mx-auto p-6 space-y-8">
              {/* Content Cards */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}`}
                </pre>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 