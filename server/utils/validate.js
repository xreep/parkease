const { z } = require('zod')

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  ),
  phone: z.string().min(10).max(15).optional().or(z.literal('')),
  role: z.enum(['USER', 'OWNER']).default('USER')
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

const parkingSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(50),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  totalSlots: z.number().int().min(1).max(1000),
  supportedVehicleTypes: z.array(z.enum(['TWO_WHEELER', 'FOUR_WHEELER'])).min(1).optional(),
  vehicleTypes: z.array(z.enum(['TWO_WHEELER', 'FOUR_WHEELER'])).min(1).optional(),
  hourlyPrice: z.number().min(0).max(10000),
  dailyPrice: z.number().min(0).max(100000).nullable().optional(),
  monthlyPrice: z.number().min(0).max(1000000).nullable().optional(),
  autoApproveBookings: z.boolean().default(true)
}).passthrough().superRefine((data, ctx) => {
  const types = data.supportedVehicleTypes || data.vehicleTypes || []
  if (types.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At least one vehicle type is required', path: ['vehicleTypes'] })
  }
})

const bookingSchema = z.object({
  parkingListingId: z.string().min(1),
  vehicleId: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  vehicleType: z.enum(['TWO_WHEELER', 'FOUR_WHEELER'])
})

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body)
    next()
  } catch (error) {
    const issues = error.issues || error.errors || []
    return res.status(400).json({
      message: 'Validation error',
      errors: issues.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    })
  }
}

module.exports = { registerSchema, loginSchema, parkingSchema, bookingSchema, validate }
