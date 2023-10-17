import express from 'express'
import {checkSchema, ValidationChain} from 'express-validator'
import auth from './auth'

export type HttpMethod = "get" | "put" | "post" | "patch" | "delete" | "head"

export interface Handler<Params=any, ResBody=any, ReqBody=any, ReqQuery=any> {
  method: HttpMethod
  isAdminProtected?: boolean
  isUserProtected?: boolean
  validations?: ReturnType<typeof checkSchema> | ValidationChain[]
  handlerFunc: (req: express.Request<Params, ReqBody, ResBody, ReqQuery>, res: express.Response) => void
}

export interface Route {
  path: string
  handlers: Handler[]
}

function bindRoutes(app: express.Express) {
  for (const entity of [
    auth,
  ]) {
    entity.forEach((route: Route) => {
      route.handlers.forEach((handler: Handler) => {
        if (handler.isUserProtected) {
          app[handler.method](route.path, (req: express.Request, res:express.Response, next: express.NextFunction) => {
            if (req.isLoggedIn || req.method.toLowerCase() !== handler.method) {
              return next()
            } 
            res.status(403).send({errors: [{msg: 'User is not authenticated'}]})
          })
        }
        // bind route middleware
        if (handler.validations) {
          if ((handler.validations as ReturnType<typeof checkSchema>).run) {
            app[handler.method](route.path, handler.validations, handler.handlerFunc)
          } else {
            app[handler.method](route.path, ...handler.validations, handler.handlerFunc)
          }
        } else {
          app[handler.method](route.path, handler.handlerFunc)
        }
        console.log(`binding ${route.path} - ${handler.method.toUpperCase()}`)
      })
    })
  }
}
export default bindRoutes
