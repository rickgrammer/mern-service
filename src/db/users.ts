import {compare, hash} from "bcrypt"
import {Schema, model} from "mongoose"

const SALT_OR_ROUNDS = Number.parseInt(process.env.SALT_ROUNDS || '10')

export class HttpError extends Error {
  public statusCode: number
  constructor(msg: string, statusCode: number) {
    super(msg)
    this.name = this.constructor.name
    this.statusCode = statusCode
    Error.captureStackTrace(this, this.constructor)
  }
}

export class UserNotFoundError extends HttpError {
  constructor(msg?: string) {
    super(msg || 'User not found', 404)
  }
}
export class UserPasswordMisMatchError extends HttpError {
  constructor(msg?: string) {
    super(msg || 'User/Password incorrect', 401)
  }
}

export enum Preference {
  green = "green",
  blue = "blue" ,
  red = "red" ,
  yellow = "yellow",
  grey = "grey",
}

export interface User {
  email: string
  password: string
  preference: Preference
}

export type SignInPayload = Pick<User, "email" | "password">

export const UserSchema = new Schema<User>({
  email: {type: String, required: true, unique: true},
  password: {type: String, required: true},
  preference: {type: String, enum: Preference}
})

export const UserModel = model('User', UserSchema)

export const createUser = async (userPayload: User) => {
  userPayload.password = await hash(userPayload.password, SALT_OR_ROUNDS)
  return UserModel.create(userPayload)
}

export const validateUser = async (signInPayload: SignInPayload) => {
  const user = await UserModel.findOne({email: signInPayload.email}).lean()
  if (!user) throw new UserNotFoundError()
  const isValid = await compare(signInPayload.password, user.password)
  if (!isValid) throw new UserPasswordMisMatchError()
  return isValid
}

export const setPreference = async (email: string, preference: Preference) => {
  return UserModel.updateOne({email}, {$set: {preference: preference}})
}

export const getUser = async (email: string) => {
  return UserModel.findOne({email}, {password: 0})
}
