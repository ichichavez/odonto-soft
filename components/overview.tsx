"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

const data = [
  {
    name: "1",
    total: 400,
    citas: 3,
  },
  {
    name: "2",
    total: 300,
    citas: 2,
  },
  {
    name: "3",
    total: 200,
    citas: 1,
  },
  {
    name: "4",
    total: 450,
    citas: 4,
  },
  {
    name: "5",
    total: 500,
    citas: 5,
  },
  {
    name: "6",
    total: 350,
    citas: 3,
  },
  {
    name: "7",
    total: 200,
    citas: 2,
  },
  {
    name: "8",
    total: 400,
    citas: 4,
  },
  {
    name: "9",
    total: 300,
    citas: 3,
  },
  {
    name: "10",
    total: 450,
    citas: 4,
  },
  {
    name: "11",
    total: 500,
    citas: 5,
  },
  {
    name: "12",
    total: 350,
    citas: 3,
  },
  {
    name: "13",
    total: 200,
    citas: 2,
  },
  {
    name: "14",
    total: 400,
    citas: 4,
  },
  {
    name: "15",
    total: 300,
    citas: 3,
  },
  {
    name: "16",
    total: 450,
    citas: 4,
  },
  {
    name: "17",
    total: 500,
    citas: 5,
  },
  {
    name: "18",
    total: 350,
    citas: 3,
  },
  {
    name: "19",
    total: 200,
    citas: 2,
  },
  {
    name: "20",
    total: 400,
    citas: 4,
  },
  {
    name: "21",
    total: 300,
    citas: 3,
  },
  {
    name: "22",
    total: 450,
    citas: 4,
  },
  {
    name: "23",
    total: 500,
    citas: 5,
  },
  {
    name: "24",
    total: 350,
    citas: 3,
  },
  {
    name: "25",
    total: 200,
    citas: 2,
  },
  {
    name: "26",
    total: 400,
    citas: 4,
  },
  {
    name: "27",
    total: 300,
    citas: 3,
  },
  {
    name: "28",
    total: 450,
    citas: 4,
  },
  {
    name: "29",
    total: 500,
    citas: 5,
  },
  {
    name: "30",
    total: 350,
    citas: 3,
  },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
