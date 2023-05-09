import { Strategy as LocalStrategy } from 'passport-local'
import * as bcrypt from 'bcrypt'
import * as db from './database.js'

export async function passportInit(passport, getUserByEmail, getUserById) {
    async function authenticateUser(email, password, done) {
        const user = await db.getUserByEmail(email)

        if (!user) return done(null, false, { message: `No user found with email "${email}"`})

        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user)

            } else {
                return done(null, false, { message: 'Incorrect password'})
            }

        } catch {

        }
    }

    passport.use(
        new LocalStrategy(
            { usernameField: "email" }, 
            authenticateUser
        )
    )

    passport.serializeUser((user, done) => done(null, user.user_id))
    passport.deserializeUser(async (id, done) => done(null, await db.getUserById(id)))
}