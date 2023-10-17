import express, {CookieOptions} from 'express'
import {sign} from 'jsonwebtoken';
import { Preference, User,  UserNotFoundError, UserPasswordMisMatchError, getUser, setPreference, validateUser } from '../db/users'
import {body, validationResult} from "express-validator"
import {Route} from '.'

const SESSION_TIMEOUT = 24*60*60*1000 // 1 day

const signInValidation = [
  body('email').isEmail(),
  body('password').isLength({min: 4}),
]

const profile: Route = {
  path: '/profile',
  handlers: [
    {
      isUserProtected: true,
      method: 'get',
      handlerFunc: async (req: express.Request<{userId: string}, {}, {}>, res: express.Response) => {
        console.log(req.user)
        const ok = await getUser(req.user.email)
        return res.send(ok)
      }
    },
    {
      isUserProtected: true,
      method: 'patch',
      handlerFunc: async (req: express.Request<{userId: string}, {}, {preference: Preference}>, res: express.Response) => {
        const ok = await setPreference(req.user.email ,req.body.preference)
        return res.status(201).send(ok)
      }
    }
  ]
}

const signIn: Route = {
  path: '/signin',
  handlers: [
    {
      isUserProtected: false,
      validations: signInValidation,
      method: "post",
      handlerFunc: async (req: express.Request<{}, {}, User>, res: express.Response) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          return res.status(403).send({
            errors: errors.array()
          })
        }

        try {
          await validateUser(req.body)
        } catch (e: any) {
          if (e instanceof UserNotFoundError || e instanceof UserPasswordMisMatchError) {
            res.status(e.statusCode).send({
              errors: [
                {
                  'msg': e.message,
                }
              ]
            })
            return
          }
          throw e
        }
        const token = sign({email: req.body.email}, process.env.JWT_SECRET as string, {expiresIn: '30m'})
        let cookieOptions: CookieOptions = {expires: new Date(Date.now() + SESSION_TIMEOUT), httpOnly: true}
        if (process.env.NODE_ENV !== 'local') {
          console.log('setting cookie for prod')
          cookieOptions = {
            ...cookieOptions,
            sameSite: "none",
            secure: true
          }
        }
        res.cookie('token', token, cookieOptions)
        res.send({
          msg: "Signed in",
        })
      },
    }
  ],
}

const signout: Route = {
  path: '/signout',
  handlers: [
    {
      isUserProtected: true,
      method: 'post',
      handlerFunc(_, res: express.Response) {
        let cookieOptions: CookieOptions = {expires: new Date(), httpOnly: true}
        if (process.env.NODE_ENV !== 'local') {
          console.log('removing cookie for prod')
          cookieOptions = {
            ...cookieOptions,
            sameSite: "none",
            secure: true
          }
        }
        res.cookie('token', '', cookieOptions)
        res.status(201).send()
      }
    }
  ]
}

export = [signIn, profile, signout]
