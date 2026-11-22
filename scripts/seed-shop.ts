import { getPayload } from 'payload'
import config from '@payload-config'
import { seedDemoShop } from '../src/lib/demoShop'

const payload = await getPayload({ config })
console.log(await seedDemoShop(payload))
process.exit(0)
