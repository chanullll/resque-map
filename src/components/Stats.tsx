"use client";
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function Stats({ requests }: { requests: any[] }) {
  const typeData = [
    { name: 'Medical', value: requests.filter(r => r.emergency_type === 'Medical').length },
    { name: 'Food', value: requests.filter(r => r.emergency_type === 'Food').length },
    { name: 'Rescue', value: requests.filter(r => r.emergency_type === 'Rescue').length },
  ].filter(item => item.value > 0);

  const statusData = [
    { name: 'Pending', value: requests.filter(r => r.status === 'pending').length },
    { name: 'Helping', value: requests.filter(r => r.status === 'helping').length },
  ];

  const COLORS = ['#f43f5e', '#10b981', '#f59e0b', '#3b82f6'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 text-center">Emergency Distribution</h3>
        <div className="h-64 w-full text-xs font-bold">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={typeData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                {typeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '20px', border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Response Status</h3>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="900" />
              <Bar dataKey="value" fill="#0f172a" radius={[10, 10, 10, 10]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}