import { Strategy as LocalStrategy } from 'passport-local'
import * as bcrypt from 'bcrypt'

export async function passportInit(passport, getUserByEmail, getUserById) {
    async function authenticateUser(email, password, done) {
        const user = getUserByEmail(email)

        if (!user) return done(null, false, { message: 'No user with that email '})

        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user)

            } else {
                return done(null, false, { message: 'Password incorrect'})

            }

        } catch {

        }
    }

    passport.use(new LocalStrategy(
        {usernameField: "email"}, 
        authenticateUser
    ))

    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((id, done) => done(null, getUserById(id)))
}