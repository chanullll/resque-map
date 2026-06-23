"use client";

// මෙම 'export' වචනය අනිවාර්යයෙන්ම තිබිය යුතුයි
export const CardSkeleton = () => (
  <div className="p-5 rounded-[2rem] border-2 border-slate-50 bg-white shadow-sm space-y-4 w-full">
    <div className="flex justify-between items-center">
      <div className="w-16 h-4 bg-slate-100 rounded-lg animate-pulse"></div>
      <div className="w-12 h-4 bg-slate-100 rounded-lg animate-pulse"></div>
    </div>
    <div className="w-full h-4 bg-slate-100 rounded-lg animate-pulse"></div>
    <div className="w-3/4 h-4 bg-slate-100 rounded-lg animate-pulse"></div>
    <div className="pt-4 border-t border-slate-50 flex justify-between">
      <div className="w-20 h-3 bg-slate-100 rounded-lg animate-pulse"></div>
      <div className="w-4 h-4 bg-slate-100 rounded-full animate-pulse"></div>
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6 w-full">
    <div className="w-32 h-3 bg-slate-100 rounded-full mx-auto animate-pulse"></div>
    <div className="w-40 h-40 bg-slate-50 rounded-full mx-auto animate-pulse flex items-center justify-center">
      <div className="w-24 h-24 bg-white rounded-full"></div>
    </div>
    <div className="grid grid-cols-2 gap-4 mt-4">
      <div className="h-8 bg-slate-50 rounded-xl animate-pulse"></div>
      <div className="h-8 bg-slate-50 rounded-xl animate-pulse"></div>
    </div>
  </div>
);