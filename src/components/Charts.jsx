import React from "react";
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { formatJalaliDate, toFarsiDigits } from "@/lib/jalali";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#a855f7"];

function ChartCard({ title, children, action = null, testId }) {
    return (
        <div className="surface-elev p-5" data-testid={testId}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-[var(--ink-900)] flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-gradient-to-b from-[var(--brand-500)] to-[var(--brand-700)]" />
                    {title}
                </h3>
                {action}
            </div>
            {children}
        </div>
    );
}

const tooltipStyle = {
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(15, 23, 42, 0.08)",
    borderRadius: "12px",
    fontSize: "12px",
    padding: "10px 14px",
    boxShadow: "0 10px 30px -10px rgba(11, 16, 32, 0.18)",
    fontWeight: 600,
};

const labelFormatter = (label) => formatJalaliDate(label, { monthName: true });
const valueFormatter = (v) => toFarsiDigits(v);

export function LineSeriesCard({ title, data, color = "#6366f1", testId }) {
    return (
        <ChartCard title={title} testId={testId}>
            <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`grad-line-${title}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 600 }}
                        tickFormatter={(d) => formatJalaliDate(d).slice(-5)}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: "#9aa3b8", fontWeight: 600 }}
                        tickFormatter={valueFormatter}
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} labelFormatter={labelFormatter} formatter={valueFormatter} cursor={{ stroke: color, strokeOpacity: 0.15, strokeWidth: 8 }} />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: color, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: color, stroke: "#fff", strokeWidth: 3 }}
                        fill={`url(#grad-line-${title})`}
                    />
                </LineChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}

export function BarSeriesCard({ title, data, color = "#f59e0b", testId }) {
    return (
        <ChartCard title={title} testId={testId}>
            <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`grad-bar-${title}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={1} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.45} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 600 }}
                        tickFormatter={(d) => formatJalaliDate(d).slice(-5)}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: "#9aa3b8", fontWeight: 600 }}
                        tickFormatter={valueFormatter}
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} labelFormatter={labelFormatter} formatter={valueFormatter} cursor={{ fill: color, fillOpacity: 0.06 }} />
                    <Bar dataKey="value" fill={`url(#grad-bar-${title})`} radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}

export function PieDistCard({ title, data, testId }) {
    const total = data.reduce((s, d) => s + (d.value || 0), 0);
    return (
        <ChartCard title={title} testId={testId}>
            {total === 0 ? (
                <div className="h-[240px] grid place-items-center text-sm text-[var(--ink-300)]">داده‌ای موجود نیست</div>
            ) : (
                <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                        <Pie data={data} dataKey="value" nameKey="name" innerRadius={56} outerRadius={88} paddingAngle={3} stroke="#ffffff" strokeWidth={3}>
                            {data.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={valueFormatter} />
                        <Legend wrapperStyle={{ fontSize: "12px", fontWeight: 600 }} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </ChartCard>
    );
}
