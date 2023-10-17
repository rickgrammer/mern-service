import dotenv from 'dotenv'
import {Preference, createUser} from './src/db/users'
import {connectDatabase, disconnectDatabase} from './src/db'
dotenv.config()

const testUsers = [
  {
    email: 'ashfaq@example.com',
    password: 'test',
    preference: Preference.blue
  },
  {
    email: 'test@example.com',
    password: 'test',
    preference: Preference.green
  },
]

async function seedTestUsers() {

  await connectDatabase()
  await Promise.all(testUsers.map(userPayload => createUser(userPayload)))
  await disconnectDatabase()
}

seedTestUsers()
  .then(() => {console.log('Seeded all test users.')})
  
