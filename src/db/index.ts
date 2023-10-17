import {connect, disconnect } from "mongoose";

export async function connectDatabase() {
  await connect(process.env.DB_URI as string, {dbName: 'sapiens'})
}

export async function disconnectDatabase() {
  await disconnect()
}
