import { z } from 'zod';

// Phone validation schema for Brazilian phone numbers
export const phoneSchema = z.string()
  .transform(val => val.replace(/\D/g, ''))
  .refine(val => val.length === 10 || val.length === 11, {
    message: 'Telefone deve ter 10 ou 11 dígitos'
  });

// Optional phone schema
export const optionalPhoneSchema = z.string()
  .transform(val => val ? val.replace(/\D/g, '') : '')
  .refine(val => !val || val.length === 10 || val.length === 11, {
    message: 'Telefone deve ter 10 ou 11 dígitos'
  })
  .optional()
  .nullable();

// Email validation
export const emailSchema = z.string()
  .email({ message: 'Email inválido' })
  .max(255, { message: 'Email muito longo' });

export const optionalEmailSchema = z.string()
  .email({ message: 'Email inválido' })
  .max(255, { message: 'Email muito longo' })
  .optional()
  .nullable()
  .or(z.literal(''));

// Appointment validation schema
export const appointmentSchema = z.object({
  client_name: z.string()
    .min(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
    .max(100, { message: 'Nome muito longo' })
    .transform(val => val.trim()),
  client_whatsapp: optionalPhoneSchema,
  client_id: z.string().uuid().optional().nullable(),
  service_id: z.string().uuid().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data inválida' }),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'Horário inválido' }),
  status: z.string().max(50).optional(),
  notes: z.string().max(1000).optional().nullable(),
  confirmed_at: z.string().optional().nullable(),
});

// Service validation schema
export const serviceSchema = z.object({
  name: z.string()
    .min(1, { message: 'Nome é obrigatório' })
    .max(200, { message: 'Nome muito longo' })
    .transform(val => val.trim()),
  description: z.string().max(1000, { message: 'Descrição muito longa' }).optional().nullable(),
  price: z.number()
    .min(0, { message: 'Preço não pode ser negativo' })
    .max(999999, { message: 'Preço muito alto' }),
  duration: z.number()
    .int({ message: 'Duração deve ser um número inteiro' })
    .min(5, { message: 'Duração mínima é 5 minutos' })
    .max(480, { message: 'Duração máxima é 8 horas' }),
  status: z.string().max(50).optional(),
});

// Client validation schema
export const clientSchema = z.object({
  name: z.string()
    .min(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
    .max(100, { message: 'Nome muito longo' })
    .transform(val => val.trim()),
  whatsapp: optionalPhoneSchema,
  email: optionalEmailSchema,
  notes: z.string().max(500, { message: 'Notas muito longas' }).optional().nullable(),
});

// Profile validation schema
export const profileSchema = z.object({
  business_name: z.string().max(200).optional().nullable(),
  owner_name: z.string().max(100).optional().nullable(),
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  whatsapp: optionalPhoneSchema,
  instagram: z.string().max(100).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  logo_url: z.string().url().max(500).optional().nullable().or(z.literal('')),
  slug: z.string()
    .max(100)
    .regex(/^[a-z0-9-]*$/, { message: 'Slug deve conter apenas letras minúsculas, números e hífens' })
    .optional()
    .nullable(),
});

// Public booking validation schema
export const publicBookingSchema = z.object({
  client_name: z.string()
    .min(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
    .max(100, { message: 'Nome muito longo' })
    .transform(val => val.trim()),
  client_whatsapp: phoneSchema,
  service_id: z.string().uuid({ message: 'Serviço inválido' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data inválida' }),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'Horário inválido' }),
  user_id: z.string().uuid({ message: 'Usuário inválido' }),
});

// Type exports for use in components
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type PublicBookingInput = z.infer<typeof publicBookingSchema>;

// Validation helper function
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // Return the first error message - Zod 4.x uses result.error.issues
  const issues = result.error.issues || [];
  const firstError = issues[0];
  return { success: false, error: firstError?.message || 'Dados inválidos' };
}
